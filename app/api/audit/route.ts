import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getAuditLogs, getAuditStats } from "@/lib/audit"

/**
 * GET /api/audit - Get audit logs (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action") || undefined
    const username = searchParams.get("username") || undefined
    const resource = searchParams.get("resource") || undefined

    // Input validation for timestamps
    let startDate: number | undefined
    let endDate: number | undefined

    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")

    if (startDateParam) {
      const parsed = parseInt(startDateParam)
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json({ error: "Invalid startDate" }, { status: 400 })
      }
      startDate = parsed
    }

    if (endDateParam) {
      const parsed = parseInt(endDateParam)
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json({ error: "Invalid endDate" }, { status: 400 })
      }
      endDate = parsed
    }

    // Validate limit and offset
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 1000) // Max 1000
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0) // Min 0

    const stats = searchParams.get("stats") === "true"

    if (stats) {
      const statistics = getAuditStats()
      return NextResponse.json(statistics)
    }

    const logs = getAuditLogs({ username, action, resource, startDate, endDate, limit, offset })

    return NextResponse.json({
      logs,
      total: logs.length,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error("Failed to fetch audit logs:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch audit logs" },
      { status: 500 }
    )
  }
}
