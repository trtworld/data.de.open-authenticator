import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { encrypt } from "@/lib/encryption"
import { logAudit } from "@/lib/audit"
import { verifyApiKey } from "@/lib/api-auth"

interface ImportAccount {
  label: string
  issuer?: string
  secret: string
  algorithm?: string
  digits?: number
  period?: number
  visibility?: "team" | "private"
}

/**
 * POST /api/v1/accounts/import - Import accounts from backup
 * Supports JSON format and OTPAuth URIs
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const authResult = await verifyApiKey(request)
    if (!authResult.valid || !authResult.username) {
      return NextResponse.json(
        { error: "Invalid or missing API key" },
        { status: 401 }
      )
    }

    const username = authResult.username
    const body = await request.json()
    const { format, accounts, otpauth_uris, skip_duplicates } = body

    if (!format || !["json", "otpauth"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Must be 'json' or 'otpauth'" },
        { status: 400 }
      )
    }

    const db = getDb()
    const importResults: Array<{
      label: string
      issuer?: string
      status: "success" | "skipped" | "error"
      error?: string
    }> = []

    let accountsToImport: ImportAccount[] = []

    // Parse accounts based on format
    if (format === "json") {
      if (!Array.isArray(accounts) || accounts.length === 0) {
        return NextResponse.json(
          { error: "Invalid accounts array" },
          { status: 400 }
        )
      }
      accountsToImport = accounts
    } else if (format === "otpauth") {
      if (!Array.isArray(otpauth_uris) || otpauth_uris.length === 0) {
        return NextResponse.json(
          { error: "Invalid otpauth_uris array" },
          { status: 400 }
        )
      }

      // Parse OTPAuth URIs
      for (const uri of otpauth_uris) {
        try {
          const parsed = parseOTPAuthUri(uri)
          if (parsed) {
            accountsToImport.push(parsed)
          }
        } catch (error) {
          importResults.push({
            label: uri.substring(0, 50),
            status: "error",
            error: "Failed to parse OTPAuth URI",
          })
        }
      }
    }

    // Import accounts
    for (const account of accountsToImport) {
      try {
        // Validate required fields
        if (!account.label || !account.secret) {
          importResults.push({
            label: account.label || "(no label)",
            issuer: account.issuer,
            status: "error",
            error: "Missing required fields (label or secret)",
          })
          continue
        }

        // Check for duplicates
        const existing = db
          .prepare(
            `SELECT id FROM accounts
             WHERE label = ? AND issuer = ? AND created_by = ?`
          )
          .get(account.label, account.issuer || "", username)

        if (existing) {
          if (skip_duplicates) {
            importResults.push({
              label: account.label,
              issuer: account.issuer,
              status: "skipped",
              error: "Account already exists",
            })
            continue
          } else {
            importResults.push({
              label: account.label,
              issuer: account.issuer,
              status: "error",
              error: "Account already exists",
            })
            continue
          }
        }

        // Encrypt secret
        const encryptedSecret = encrypt(account.secret)

        // Insert account
        db.prepare(
          `INSERT INTO accounts
           (label, issuer, secret, algorithm, digits, period, visibility, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          account.label,
          account.issuer || "",
          encryptedSecret,
          account.algorithm || "SHA1",
          account.digits || 6,
          account.period || 30,
          account.visibility || "team",
          username
        )

        importResults.push({
          label: account.label,
          issuer: account.issuer,
          status: "success",
        })

        // Log audit
        logAudit(
          {
            username,
            action: "account_imported",
            resource: `${account.issuer}:${account.label}`,
            details: `Imported via ${format} format`,
          },
          request
        )
      } catch (error: any) {
        importResults.push({
          label: account.label || "(unknown)",
          issuer: account.issuer,
          status: "error",
          error: error.message || "Failed to import account",
        })
      }
    }

    // Calculate summary
    const summary = {
      total: accountsToImport.length,
      success: importResults.filter((r) => r.status === "success").length,
      skipped: importResults.filter((r) => r.status === "skipped").length,
      failed: importResults.filter((r) => r.status === "error").length,
    }

    return NextResponse.json({
      success: true,
      results: importResults,
      summary,
    })
  } catch (error: any) {
    console.error("Import error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to import accounts" },
      { status: 500 }
    )
  }
}

/**
 * Parse OTPAuth URI
 * Format: otpauth://totp/Issuer:Label?secret=BASE32SECRET&issuer=Issuer&algorithm=SHA1&digits=6&period=30
 */
function parseOTPAuthUri(uri: string): ImportAccount | null {
  try {
    const url = new URL(uri)

    if (url.protocol !== "otpauth:") {
      return null
    }

    // Extract label and issuer from path
    const pathParts = url.pathname.substring(1).split("/")
    if (pathParts.length < 2) {
      return null
    }

    const labelPart = decodeURIComponent(pathParts[1])
    let label = labelPart
    let issuer = url.searchParams.get("issuer") || ""

    // Check if label contains issuer prefix (Issuer:Label format)
    if (labelPart.includes(":")) {
      const parts = labelPart.split(":")
      issuer = parts[0]
      label = parts.slice(1).join(":")
    }

    const secret = url.searchParams.get("secret")
    if (!secret) {
      return null
    }

    return {
      label: label.trim(),
      issuer: issuer.trim(),
      secret,
      algorithm: url.searchParams.get("algorithm") || "SHA1",
      digits: parseInt(url.searchParams.get("digits") || "6"),
      period: parseInt(url.searchParams.get("period") || "30"),
      visibility: "team",
    }
  } catch (error) {
    console.error("Failed to parse OTPAuth URI:", error)
    return null
  }
}
