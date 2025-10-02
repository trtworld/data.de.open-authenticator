import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { z } from "zod"

const patchAccountSchema = z.object({
  visibility: z.enum(["team", "private"]),
})

// PATCH /api/accounts/[id] - Update account visibility
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const accountId = parseInt(id)

    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: "Invalid account ID" },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate request body
    const { visibility } = patchAccountSchema.parse(body)

    const db = getDb()

    // Check if account exists and get ownership
    const account = db
      .prepare("SELECT id, label, issuer, visibility, created_by FROM accounts WHERE id = ?")
      .get(accountId) as any

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Check authorization: owner or admin
    const canModify = user.role === "admin" || account.created_by === user.username

    if (!canModify) {
      return NextResponse.json(
        { error: "Forbidden: You can only modify your own accounts" },
        { status: 403 }
      )
    }

    // Update visibility
    db.prepare("UPDATE accounts SET visibility = ?, updated_at = unixepoch() WHERE id = ?").run(
      visibility,
      accountId
    )

    return NextResponse.json({
      account: {
        id: account.id,
        label: account.label,
        issuer: account.issuer,
        visibility,
        created_by: account.created_by,
      },
    })
  } catch (error: any) {
    console.error("Update account visibility error:", error)

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid visibility value", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    )
  }
}

// DELETE /api/accounts/[id] - Delete account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const accountId = parseInt(id)

    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: "Invalid account ID" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Check if account exists and get ownership
    const account = db
      .prepare("SELECT id, created_by FROM accounts WHERE id = ?")
      .get(accountId) as any

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Check authorization: owner or admin
    const canDelete = user.role === "admin" || account.created_by === user.username

    if (!canDelete) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own accounts" },
        { status: 403 }
      )
    }

    // Delete account
    db.prepare("DELETE FROM accounts WHERE id = ?").run(accountId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete account error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    )
  }
}
