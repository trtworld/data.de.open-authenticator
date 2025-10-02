import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { logAudit, AuditActions } from "@/lib/audit"

/**
 * POST /api/audit/log - Log user actions (TOTP viewing, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, resource, details } = body

    if (!action || !resource) {
      return NextResponse.json(
        { error: "Action and resource are required" },
        { status: 400 }
      )
    }

    // Log the audit event
    logAudit({
      username: user.username,
      action: action,
      resource: resource,
      details: details || null,
    }, request)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Failed to log audit:", error)
    return NextResponse.json(
      { error: error.message || "Failed to log audit" },
      { status: 500 }
    )
  }
}
