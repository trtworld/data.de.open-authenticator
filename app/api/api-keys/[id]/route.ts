import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getDb } from "@/lib/db"

// DELETE /api/api-keys/[id] - Delete/revoke API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const keyId = parseInt(id)

    // Only admin users can manage API keys
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admin users can manage API keys" },
        { status: 403 }
      )
    }

    const db = getDb()

    // Check if API key exists and belongs to user
    const apiKey = db
      .prepare(
        `SELECT ak.id
         FROM api_keys ak
         JOIN users u ON ak.user_id = u.id
         WHERE ak.id = ? AND u.username = ?`
      )
      .get(keyId, user.username) as any

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not found or access denied" },
        { status: 404 }
      )
    }

    // Delete API key
    db.prepare("DELETE FROM api_keys WHERE id = ?").run(keyId)

    return NextResponse.json({ message: "API key deleted successfully" })
  } catch (error: any) {
    console.error("Delete API key error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    )
  }
}

// PATCH /api/api-keys/[id] - Toggle active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const keyId = parseInt(id)

    // Only admin users can manage API keys
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admin users can manage API keys" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { is_active } = body

    if (typeof is_active !== "number" || ![0, 1].includes(is_active)) {
      return NextResponse.json(
        { error: "Invalid is_active value. Must be 0 or 1" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Check if API key exists and belongs to user
    const apiKey = db
      .prepare(
        `SELECT ak.id
         FROM api_keys ak
         JOIN users u ON ak.user_id = u.id
         WHERE ak.id = ? AND u.username = ?`
      )
      .get(keyId, user.username) as any

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not found or access denied" },
        { status: 404 }
      )
    }

    // Update active status
    db.prepare("UPDATE api_keys SET is_active = ? WHERE id = ?").run(is_active, keyId)

    return NextResponse.json({
      message: is_active ? "API key activated" : "API key deactivated",
    })
  } catch (error: any) {
    console.error("Update API key error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    )
  }
}
