import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireAdmin } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { generateApiKey } from "@/lib/api-auth"
import { logAudit } from "@/lib/audit"
import { z } from "zod"

const createApiKeySchema = z.object({
  name: z.string().min(1),
  expires_in_days: z.number().min(1).max(365).optional(),
})

// GET /api/api-keys - List user's API keys
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Only admin users can have API keys
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admin users can manage API keys" },
        { status: 403 }
      )
    }

    const db = getDb()

    const apiKeys = db
      .prepare(
        `SELECT
          ak.id,
          ak.api_key,
          ak.name,
          ak.created_at,
          ak.last_used_at,
          ak.expires_at,
          ak.is_active
        FROM api_keys ak
        WHERE ak.user_id = (SELECT id FROM users WHERE username = ?)
        ORDER BY ak.created_at DESC`
      )
      .all(user.username) as any[]

    return NextResponse.json({ apiKeys })
  } catch (error: any) {
    console.error("Get API keys error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    )
  }
}

// POST /api/api-keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Only admin users can create API keys
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admin users can create API keys" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, expires_in_days } = createApiKeySchema.parse(body)

    const db = getDb()

    // Get user ID
    const userRecord = db
      .prepare("SELECT id FROM users WHERE username = ?")
      .get(user.username) as any

    if (!userRecord) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Generate API key
    const apiKey = generateApiKey()

    // Calculate expiration if provided
    let expiresAt: number | null = null
    if (expires_in_days) {
      expiresAt = Math.floor(Date.now() / 1000) + expires_in_days * 24 * 60 * 60
    }

    // Insert API key
    const result = db
      .prepare(
        `INSERT INTO api_keys (user_id, api_key, name, expires_at)
         VALUES (?, ?, ?, ?)`
      )
      .run(userRecord.id, apiKey, name, expiresAt)

    // Log API key creation
    logAudit({
      username: user.username,
      action: "api_key_created",
      resource: `api_key_${result.lastInsertRowid}`,
      details: `Created API key: ${name}${expiresAt ? ` (expires in ${expires_in_days} days)` : " (no expiration)"}`,
    }, request)

    return NextResponse.json({
      apiKey: {
        id: result.lastInsertRowid,
        api_key: apiKey,
        name: name,
        created_at: Math.floor(Date.now() / 1000),
        expires_at: expiresAt,
        is_active: 1,
      },
    })
  } catch (error: any) {
    console.error("Create API key error:", error)

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    )
  }
}
