import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

/**
 * POST /api/accounts/[id]/increment - Increment usage counters
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const accountId = parseInt(id)
    if (isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account ID" }, { status: 400 })
    }

    const body = await request.json()
    const { type } = body

    if (type !== "view" && type !== "copy") {
      return NextResponse.json(
        { error: "Invalid type. Must be 'view' or 'copy'" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Verify account exists and user has access
    const account = db
      .prepare(
        `SELECT * FROM accounts
         WHERE id = ? AND (visibility = 'team' OR created_by = ?)`
      )
      .get(accountId, user.username) as any

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Increment the appropriate counter
    const column = type === "view" ? "view_count" : "copy_count"
    db.prepare(
      `UPDATE accounts SET ${column} = COALESCE(${column}, 0) + 1 WHERE id = ?`
    ).run(accountId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Failed to increment counter:", error)
    return NextResponse.json(
      { error: error.message || "Failed to increment counter" },
      { status: 500 }
    )
  }
}
