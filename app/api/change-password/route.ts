import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { logAudit } from "@/lib/audit"
import bcrypt from "bcrypt"

/**
 * POST /api/change-password - Change own password
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Verify current password
    const dbUser = db.prepare("SELECT password_hash FROM users WHERE username = ?").get(user.username) as any
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isValid = await bcrypt.compare(currentPassword, dbUser.password_hash)
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      )
    }

    // Hash and update new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)
    db.prepare("UPDATE users SET password_hash = ?, updated_at = unixepoch() WHERE username = ?")
      .run(newPasswordHash, user.username)

    logAudit({
      username: user.username,
      action: "password:change",
      details: "User changed their password"
    }, request)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: 401 }
    )
  }
}
