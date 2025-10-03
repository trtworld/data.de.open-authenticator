import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireAdmin } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { generateTOTP, encryptSecret, decryptSecret, validateSecret, parseOtpAuthUrl } from "@/lib/totp"
import { logAudit } from "@/lib/audit"
import { detectIconFromIssuer } from "@/lib/db-migrations"
import { z } from "zod"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "change-this-encryption-key-in-production"

const addAccountSchema = z.object({
  label: z.string().min(1),
  secret: z.string().min(1),
  issuer: z.string().optional(),
  algorithm: z.enum(["SHA1", "SHA256", "SHA512"]).optional(),
  digits: z.number().min(6).max(8).optional(),
  period: z.number().min(15).max(60).optional(),
  visibility: z.enum(["team", "private"]).optional(),
})

// GET /api/accounts - List all accounts with current TOTP codes
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const issuer = searchParams.get("issuer") || ""

    const db = getDb()

    // Build WHERE clause based on user role and filters
    let whereClause = ""
    const params: any[] = []

    // Visibility filtering based on role
    // Both admin and user: All team accounts + own private accounts
    whereClause = "(visibility = 'team' OR created_by = ?)"
    params.push(user.username)

    // Add issuer filter
    if (issuer) {
      whereClause += " AND issuer LIKE ?"
      params.push(`%${issuer}%`)
    }

    // Add search filter (label OR issuer)
    if (search) {
      whereClause += " AND (label LIKE ? OR issuer LIKE ?)"
      params.push(`%${search}%`, `%${search}%`)
    }

    // Get user ID for favorites check
    const userRecord = db.prepare("SELECT id FROM users WHERE username = ?").get(user.username) as { id: number } | undefined
    const userId = userRecord?.id || 0

    const accounts = db
      .prepare(
        `SELECT
          a.id, a.label, a.issuer, a.secret, a.algorithm, a.digits, a.period,
          a.visibility, a.created_by, a.icon_identifier, a.category,
          a.view_count, a.copy_count,
          CASE WHEN f.user_id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
         FROM accounts a
         LEFT JOIN favorites f ON a.id = f.account_id AND f.user_id = ?
         WHERE ${whereClause}
         ORDER BY is_favorite DESC, a.created_at DESC`
      )
      .all(userId, ...params) as any[]

    // Generate current TOTP codes
    const accountsWithCodes = accounts.map((account) => {
      const decryptedSecret = decryptSecret(account.secret, ENCRYPTION_KEY)

      const totp = generateTOTP({
        secret: decryptedSecret,
        algorithm: account.algorithm,
        digits: account.digits,
        period: account.period,
      })

      return {
        id: account.id,
        label: account.label,
        issuer: account.issuer || "",
        code: totp.code,
        timeRemaining: totp.timeRemaining,
        algorithm: account.algorithm,
        digits: account.digits,
        period: account.period,
        visibility: account.visibility || "team",
        created_by: account.created_by,
        icon_identifier: account.icon_identifier,
        category: account.category,
        is_favorite: account.is_favorite === 1,
        view_count: account.view_count || 0,
        copy_count: account.copy_count || 0,
      }
    })

    return NextResponse.json({ accounts: accountsWithCodes })
  } catch (error: any) {
    console.error("Get accounts error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    )
  }
}

// POST /api/accounts - Add new account
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const body = await request.json()

    // Handle otpauth:// URL
    let accountData
    if (body.otpauthUrl) {
      const parsed = parseOtpAuthUrl(body.otpauthUrl)
      if (!parsed) {
        return NextResponse.json(
          { error: "Invalid otpauth URL" },
          { status: 400 }
        )
      }
      accountData = parsed
    } else {
      accountData = addAccountSchema.parse(body)
    }

    const { label, secret, issuer, algorithm, digits, period, visibility } = accountData

    // Validate secret format
    if (!validateSecret(secret)) {
      return NextResponse.json(
        { error: "Invalid secret format (must be base32)" },
        { status: 400 }
      )
    }

    // Only admin can create team accounts, user can only create private
    const finalVisibility = user.role === "user" ? "private" : (visibility || "team")

    // Encrypt secret
    const encryptedSecret = encryptSecret(secret, ENCRYPTION_KEY)

    // Auto-detect icon identifier from issuer
    const iconIdentifier = detectIconFromIssuer(issuer || null)

    // Insert into database
    const db = getDb()
    const result = db
      .prepare(
        `INSERT INTO accounts (label, issuer, secret, algorithm, digits, period, visibility, created_by, icon_identifier)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        label,
        issuer || null,
        encryptedSecret,
        algorithm || "SHA1",
        digits || 6,
        period || 30,
        finalVisibility,
        user.username,
        iconIdentifier
      )

    // Generate initial TOTP code
    const totp = generateTOTP({
      secret,
      algorithm: algorithm as any,
      digits,
      period,
    })

    // Log account creation
    logAudit({
      username: user.username,
      action: "account_created",
      resource: `account_${result.lastInsertRowid}`,
      details: `Created TOTP account: ${issuer ? issuer + ":" : ""}${label} (${finalVisibility})`,
    }, request)

    return NextResponse.json({
      account: {
        id: result.lastInsertRowid,
        label,
        issuer: issuer || "",
        code: totp.code,
        timeRemaining: totp.timeRemaining,
        algorithm: algorithm || "SHA1",
        digits: digits || 6,
        period: period || 30,
        visibility: finalVisibility,
        created_by: user.username,
        icon_identifier: iconIdentifier,
        is_favorite: false,
      },
    })
  } catch (error: any) {
    console.error("Add account error:", error)

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    )
  }
}
