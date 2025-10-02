import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { cleanOldAuditLogs } from "@/lib/audit"

/**
 * POST /api/audit/cleanup - Clean old audit logs (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const retentionDays = parseInt(process.env.AUDIT_RETENTION_DAYS || "2")
    const deletedCount = cleanOldAuditLogs(retentionDays)

    return NextResponse.json({
      success: true,
      deletedCount,
      retentionDays,
      message: `Deleted ${deletedCount} audit logs older than ${retentionDays} days`,
    })
  } catch (error: any) {
    console.error("Failed to clean audit logs:", error)
    return NextResponse.json(
      { error: error.message || "Failed to clean audit logs" },
      { status: 500 }
    )
  }
}
