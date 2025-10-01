import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getDb } from "@/lib/db"

// DELETE /api/accounts/[id] - Delete account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)

    const { id } = await params
    const accountId = parseInt(id)

    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: "Invalid account ID" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Check if account exists
    const account = db
      .prepare("SELECT id FROM accounts WHERE id = ?")
      .get(accountId)

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      )
    }

    // Delete account
    db.prepare("DELETE FROM accounts WHERE id = ?").run(accountId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete account error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    )
  }
}
