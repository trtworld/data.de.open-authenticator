import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireAdmin } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { generateTOTP, encryptSecret, decryptSecret, validateSecret, parseOtpAuthUrl } from "@/lib/totp"
import { z } from "zod"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "change-this-encryption-key-in-production"

const addAccountSchema = z.object({
  label: z.string().min(1),
  secret: z.string().min(1),
  issuer: z.string().optional(),
  algorithm: z.enum(["SHA1", "SHA256", "SHA512"]).optional(),
  digits: z.number().min(6).max(8).optional(),
  period: z.number().min(15).max(60).optional(),
})

// GET /api/accounts - List all accounts with current TOTP codes
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    const db = getDb()
    const accounts = db
      .prepare(
        "SELECT id, label, issuer, secret, algorithm, digits, period FROM accounts ORDER BY created_at DESC"
      )
      .all() as any[]

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
    await requireAdmin(request)

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

    const { label, secret, issuer, algorithm, digits, period } = accountData

    // Validate secret format
    if (!validateSecret(secret)) {
      return NextResponse.json(
        { error: "Invalid secret format (must be base32)" },
        { status: 400 }
      )
    }

    // Encrypt secret
    const encryptedSecret = encryptSecret(secret, ENCRYPTION_KEY)

    // Insert into database
    const db = getDb()
    const result = db
      .prepare(
        `INSERT INTO accounts (label, issuer, secret, algorithm, digits, period)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        label,
        issuer || null,
        encryptedSecret,
        algorithm || "SHA1",
        digits || 6,
        period || 30
      )

    // Generate initial TOTP code
    const totp = generateTOTP({
      secret,
      algorithm: algorithm as any,
      digits,
      period,
    })

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
