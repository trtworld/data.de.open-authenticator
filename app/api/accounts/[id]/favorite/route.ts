import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { logAudit } from "@/lib/audit"

/**
 * POST /api/accounts/[id]/favorite - Add account to favorites
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

    const db = getDb()

    // Get user ID from username
    const userRecord = db.prepare("SELECT id FROM users WHERE username = ?").get(user.username) as { id: number } | undefined
    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

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

    // Add favorite (ignore if already exists)
    try {
      db.prepare(
        "INSERT INTO favorites (user_id, account_id) VALUES (?, ?)"
      ).run(userRecord.id, accountId)

      // Log audit event
      logAudit(
        {
          username: user.username,
          action: "favorite_added",
          resource: `account_${accountId}`,
          details: `Favorited account: ${account.label}`,
        },
        request
      )
    } catch (error: any) {
      // Ignore duplicate key errors
      if (error.code !== "SQLITE_CONSTRAINT_PRIMARYKEY") {
        throw error
      }
    }

    return NextResponse.json({
      success: true,
      is_favorite: true,
    })
  } catch (error: any) {
    console.error("Failed to add favorite:", error)
    return NextResponse.json(
      { error: error.message || "Failed to add favorite" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/accounts/[id]/favorite - Remove account from favorites
 */
export async function DELETE(
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

    const db = getDb()

    // Get user ID from username
    const userRecord = db.prepare("SELECT id FROM users WHERE username = ?").get(user.username) as { id: number } | undefined
    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get account for logging
    const account = db
      .prepare("SELECT * FROM accounts WHERE id = ?")
      .get(accountId) as any

    // Remove favorite
    const result = db
      .prepare(
        "DELETE FROM favorites WHERE user_id = ? AND account_id = ?"
      )
      .run(userRecord.id, accountId)

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "Favorite not found" },
        { status: 404 }
      )
    }

    // Log audit event
    if (account) {
      logAudit(
        {
          username: user.username,
          action: "favorite_removed",
          resource: `account_${accountId}`,
          details: `Unfavorited account: ${account.label}`,
        },
        request
      )
    }

    return NextResponse.json({
      success: true,
      is_favorite: false,
    })
  } catch (error: any) {
    console.error("Failed to remove favorite:", error)
    return NextResponse.json(
      { error: error.message || "Failed to remove favorite" },
      { status: 500 }
    )
  }
}
