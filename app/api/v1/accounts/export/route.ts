import { NextRequest, NextResponse } from "next/server"
import { requireApiAuth } from "@/lib/api-auth"
import { getDb } from "@/lib/db"
import { decryptSecret } from "@/lib/totp"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "change-this-encryption-key-in-production"

/**
 * GET /api/v1/accounts/export
 *
 * Export accounts in various formats
 *
 * Query Parameters:
 * - format: json | csv | otpauth (default: json)
 * - filter: team | private | all (default: all)
 * - include_secrets: true | false (default: false) - Only for JSON/CSV formats
 *
 * Authentication: Bearer token (API key)
 *
 * Returns:
 * - JSON: Array of account objects
 * - CSV: CSV formatted data
 * - OTPAuth: Array of otpauth:// URLs
 */
export async function GET(request: NextRequest) {
  try {
    // Verify API authentication
    const user = await requireApiAuth(request)

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "json"
    const filter = searchParams.get("filter") || "all"
    const includeSecrets = searchParams.get("include_secrets") === "true"

    if (!["json", "csv", "otpauth"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Must be: json, csv, or otpauth" },
        { status: 400 }
      )
    }

    if (!["team", "private", "all"].includes(filter)) {
      return NextResponse.json(
        { error: "Invalid filter. Must be: team, private, or all" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Build WHERE clause based on filter
    let whereClause = "(visibility = 'team' OR created_by = ?)"
    const params: any[] = [user.username]

    if (filter === "team") {
      whereClause = "visibility = 'team'"
      params.length = 0
    } else if (filter === "private") {
      whereClause = "visibility = 'private' AND created_by = ?"
    }

    const accounts = db
      .prepare(
        `SELECT id, label, issuer, secret, algorithm, digits, period, visibility, created_by
         FROM accounts
         WHERE ${whereClause}
         ORDER BY created_at DESC`
      )
      .all(...params) as any[]

    // Format based on requested type
    if (format === "json") {
      const exportData = accounts.map((account) => {
        const data: any = {
          id: account.id,
          label: account.label,
          issuer: account.issuer || "",
          algorithm: account.algorithm,
          digits: account.digits,
          period: account.period,
          visibility: account.visibility,
          created_by: account.created_by,
        }

        if (includeSecrets) {
          data.secret = decryptSecret(account.secret, ENCRYPTION_KEY)
        }

        return data
      })

      return NextResponse.json({
        accounts: exportData,
        exported_at: new Date().toISOString(),
        total: exportData.length,
        format: "json",
        filter: filter,
      })
    } else if (format === "csv") {
      // CSV format
      const headers = includeSecrets
        ? ["id", "label", "issuer", "secret", "algorithm", "digits", "period", "visibility", "created_by"]
        : ["id", "label", "issuer", "algorithm", "digits", "period", "visibility", "created_by"]

      const csvRows = [headers.join(",")]

      accounts.forEach((account) => {
        const row = includeSecrets
          ? [
              account.id,
              `"${account.label}"`,
              `"${account.issuer || ""}"`,
              decryptSecret(account.secret, ENCRYPTION_KEY),
              account.algorithm,
              account.digits,
              account.period,
              account.visibility,
              account.created_by,
            ]
          : [
              account.id,
              `"${account.label}"`,
              `"${account.issuer || ""}"`,
              account.algorithm,
              account.digits,
              account.period,
              account.visibility,
              account.created_by,
            ]

        csvRows.push(row.join(","))
      })

      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="accounts-${Date.now()}.csv"`,
        },
      })
    } else if (format === "otpauth") {
      // OTPAuth URL format
      const otpauthUrls = accounts.map((account) => {
        const secret = decryptSecret(account.secret, ENCRYPTION_KEY)
        const issuer = account.issuer || "Otto"
        const label = account.label

        return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=${account.algorithm}&digits=${account.digits}&period=${account.period}`
      })

      return NextResponse.json({
        urls: otpauthUrls,
        exported_at: new Date().toISOString(),
        total: otpauthUrls.length,
        format: "otpauth",
        filter: filter,
      })
    }

    return NextResponse.json(
      { error: "Invalid format" },
      { status: 400 }
    )
  } catch (error: any) {
    console.error("Export error:", error)

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
