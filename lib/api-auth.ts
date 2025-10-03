import { NextRequest } from "next/server"
import { getDb } from "@/lib/db"

export interface ApiUser {
  id: number
  username: string
  role: "admin" | "user"
}

/**
 * Verify API key and return user info
 * Only admin users can have API keys
 */
export async function verifyApiKey(apiKey: string): Promise<ApiUser | null> {
  const db = getDb()

  const result = db
    .prepare(
      `SELECT
        ak.id as key_id,
        ak.user_id,
        ak.expires_at,
        ak.is_active,
        u.id,
        u.username,
        u.role
      FROM api_keys ak
      JOIN users u ON ak.user_id = u.id
      WHERE ak.api_key = ? AND ak.is_active = 1 AND u.is_active = 1`
    )
    .get(apiKey) as any

  if (!result) {
    return null
  }

  // Check expiration
  if (result.expires_at && result.expires_at < Date.now() / 1000) {
    return null
  }

  // Only admin users can use API
  if (result.role !== "admin") {
    return null
  }

  // Update last_used_at
  db.prepare("UPDATE api_keys SET last_used_at = unixepoch() WHERE id = ?").run(
    result.key_id
  )

  return {
    id: result.id,
    username: result.username,
    role: result.role,
  }
}

/**
 * Middleware to require API authentication
 * Extracts Bearer token from Authorization header
 */
export async function requireApiAuth(request: NextRequest): Promise<ApiUser> {
  const authHeader = request.headers.get("Authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header")
  }

  const apiKey = authHeader.substring(7) // Remove "Bearer " prefix

  const user = await verifyApiKey(apiKey)

  if (!user) {
    throw new Error("Invalid or expired API key")
  }

  return user
}

/**
 * Generate a secure API key
 */
export function generateApiKey(): string {
  const crypto = require("crypto")
  // Format: otto_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (36 chars total)
  const randomBytes = crypto.randomBytes(16).toString("hex") // 32 chars
  return `otto_${randomBytes}`
}
