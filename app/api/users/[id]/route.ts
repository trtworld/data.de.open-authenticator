import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { logAudit } from "@/lib/audit"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const db = getDb()

    const user = db.prepare("SELECT username FROM users WHERE id = ?").get(id) as any
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.username === "admin") {
      return NextResponse.json(
        { error: "Cannot delete admin user" },
        { status: 403 }
      )
    }

    db.prepare("DELETE FROM users WHERE id = ?").run(id)

    logAudit({
      username: admin.username,
      action: "users:delete",
      resource: user.username
    }, request)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message === "Forbidden: Admin access required" ? 403 : 401 }
    )
  }
}
