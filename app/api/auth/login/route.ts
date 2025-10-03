import { NextRequest, NextResponse } from "next/server"
import { authenticate, createSession } from "@/lib/auth"
import { cookies } from "next/headers"
import { logAudit } from "@/lib/audit"
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
      // Log failed login attempt
      logAudit({
        username: username,
        action: "login_failed",
        resource: "auth",
        details: `Failed login attempt for user: ${username}`,
      }, request)

      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Create session token
    const token = await createSession(user)

    // Set cookie
    const cookieStore = await cookies()
    // Only set secure if HTTPS is available (check via header or env var)
    const isHttps = request.headers.get("x-forwarded-proto") === "https" ||
                    process.env.HTTPS === "true"

    console.log("🍪 Setting session cookie:", { isHttps, secure: isHttps })

    cookieStore.set("session", token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    })

    console.log("✅ Cookie set successfully")

    // Log successful login
    logAudit({
      username: user.username,
      action: "login_success",
      resource: "auth",
      details: `User logged in successfully (role: ${user.role})`,
    }, request)

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
