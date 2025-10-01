import { NextRequest, NextResponse } from "next/server"
import { authenticate, createSession } from "@/lib/auth"
import { cookies } from "next/headers"
import { z } from "zod"

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = loginSchema.parse(body)

    // Authenticate user
    const user = await authenticate(username, password)

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Create session token
    const token = await createSession(user)

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    })

    return NextResponse.json({
      user: {
        username: user.username,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    )
  }
}
