import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { decryptSecret } from "@/lib/totp"
import { logAudit } from "@/lib/audit"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "change-this-encryption-key-in-production-32-chars-long"

/**
 * GET /api/accounts/[id]/qr
 * Get decrypted secret and OTPAuth URI for QR code generation
 * Admin only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can generate QR codes (security feature)
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only administrators can generate QR codes" },
        { status: 403 }
      )
    }

    const { id } = await params
    const accountId = parseInt(id)

    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: "Invalid account ID" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Get account
    const account = db
      .prepare(
        `SELECT id, label, issuer, secret, algorithm, digits, period, visibility, created_by
         FROM accounts
         WHERE id = ?`
      )
      .get(accountId) as any

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      )
    }

    // Check permissions (admins can access team accounts or their own private)
    const canAccess =
      account.visibility === "team" ||
      (account.visibility === "private" && account.created_by === user.username)

    if (!canAccess) {
      return NextResponse.json(
        { error: "You don't have permission to access this account" },
        { status: 403 }
      )
    }

    // Decrypt secret
    const decryptedSecret = decryptSecret(account.secret, ENCRYPTION_KEY)

    // Build OTPAuth URI
    // Format: otpauth://totp/Issuer:Label?secret=SECRET&issuer=Issuer&algorithm=SHA1&digits=6&period=30
    const issuer = account.issuer || "OttoTP"
    const label = account.label
    const algorithm = account.algorithm || "SHA1"
    const digits = account.digits || 6
    const period = account.period || 30

    const encodedLabel = encodeURIComponent(label)
    const encodedIssuer = encodeURIComponent(issuer)

    const otpauthUri = `otpauth://totp/${encodedIssuer}:${encodedLabel}?secret=${decryptedSecret}&issuer=${encodedIssuer}&algorithm=${algorithm}&digits=${digits}&period=${period}`

    // Log audit
    logAudit(
      {
        username: user.username,
        action: "qr_generated",
        resource: `account_${accountId}`,
        details: `Generated QR code for ${issuer}:${label}`,
      },
      request
    )

    return NextResponse.json({
      secret: decryptedSecret,
      otpauth_uri: otpauthUri,
      account: {
        id: account.id,
        label: account.label,
        issuer: account.issuer,
        algorithm: account.algorithm || "SHA1",
        digits: account.digits || 6,
        period: account.period || 30,
      },
    })
  } catch (error: any) {
    console.error("QR code generation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate QR code" },
      { status: 500 }
    )
  }
}
