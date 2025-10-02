import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    const cookieStore = await cookies()
    cookieStore.delete("session")

    // Log logout if user was authenticated
    if (user) {
      logAudit({
        username: user.username,
        action: "logout",
        resource: "auth",
        details: `User logged out`,
      }, request)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    // Even if there's an error, still delete the session
    const cookieStore = await cookies()
    cookieStore.delete("session")
    return NextResponse.json({ success: true })
  }
}
