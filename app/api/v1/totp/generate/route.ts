import { NextRequest, NextResponse } from "next/server"
import { requireApiAuth } from "@/lib/api-auth"
import { getDb } from "@/lib/db"
import { generateTOTP, decryptSecret } from "@/lib/totp"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "change-this-encryption-key-in-production"

/**
 * GET /api/v1/totp/generate
 *
 * Generate TOTP code for a specific account
 *
 * Query Parameters:
 * - account_id: Account ID (e.g., 123)
 * - account_code: Account code in format "issuer:label" (e.g., "google:user@example.com")
 *
 * Authentication: Bearer token (API key)
 *
 * Returns:
 * {
 *   "code": "123456",
 *   "timeRemaining": 25,
 *   "account": {
 *     "id": 123,
 *     "label": "user@example.com",
 *     "issuer": "Google"
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify API authentication
    const user = await requireApiAuth(request)

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get("account_id")
    const accountCode = searchParams.get("account_code")

    if (!accountId && !accountCode) {
      return NextResponse.json(
        { error: "Either account_id or account_code is required" },
        { status: 400 }
      )
    }

    const db = getDb()
    let account: any

    // Query by account_id or account_code
    if (accountId) {
      account = db
        .prepare(
          `SELECT id, label, issuer, secret, algorithm, digits, period, visibility, created_by
           FROM accounts
           WHERE id = ?`
        )
        .get(parseInt(accountId))
    } else if (accountCode) {
      // Parse account_code format: "issuer:label" or just "label"
      const parts = accountCode.split(":")
      let issuer: string | null = null
      let label: string

      if (parts.length === 2) {
        issuer = parts[0]
        label = parts[1]
      } else {
        label = accountCode
      }

      // Build query based on available parts (case-insensitive)
      if (issuer) {
        account = db
          .prepare(
            `SELECT id, label, issuer, secret, algorithm, digits, period, visibility, created_by
             FROM accounts
             WHERE LOWER(issuer) = LOWER(?) AND LOWER(label) = LOWER(?)`
          )
          .get(issuer, label)
      } else {
        account = db
          .prepare(
            `SELECT id, label, issuer, secret, algorithm, digits, period, visibility, created_by
             FROM accounts
             WHERE LOWER(label) = LOWER(?)`
          )
          .get(label)
      }
    }

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      )
    }

    // Check visibility permissions
    // Admin can access: team accounts + own private accounts
    const canAccess =
      account.visibility === "team" ||
      (account.visibility === "private" && account.created_by === user.username)

    if (!canAccess) {
      return NextResponse.json(
        { error: "Access denied: You don't have permission to access this account" },
        { status: 403 }
      )
    }

    // Decrypt secret and generate TOTP
    const decryptedSecret = decryptSecret(account.secret, ENCRYPTION_KEY)
    const totp = generateTOTP({
      secret: decryptedSecret,
      algorithm: account.algorithm,
      digits: account.digits,
      period: account.period,
    })

    return NextResponse.json({
      code: totp.code,
      timeRemaining: totp.timeRemaining,
      account: {
        id: account.id,
        label: account.label,
        issuer: account.issuer || "",
      },
    })
  } catch (error: any) {
    console.error("TOTP generate error:", error)

    if (error.message?.includes("Authorization") || error.message?.includes("API key")) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
