import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { getDb } from "@/lib/db"
import fs from "fs"
import path from "path"

/**
 * GET /api/backup - Download database backup (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()

    // Use same path as db/index.ts
    const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "app.db")

    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: "Database file not found" }, { status: 404 })
    }

    // Create a temporary backup file using SQLite's VACUUM INTO
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const tempBackupPath = path.join(process.cwd(), "data", `temp-backup-${timestamp}.db`)
    const filename = `authenticator-backup-${timestamp}.db`

    try {
      // Use VACUUM INTO to create a complete backup including WAL changes
      const db = getDb()
      db.prepare(`VACUUM INTO ?`).run(tempBackupPath)

      // Read the complete backup file
      const dbBuffer = fs.readFileSync(tempBackupPath)

      // Delete temp file
      fs.unlinkSync(tempBackupPath)

      logAudit({
        username: admin.username,
        action: "backup:download",
        details: `Downloaded database backup (${(dbBuffer.length / 1024).toFixed(2)}KB)`
      }, request)

      return new NextResponse(dbBuffer, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": dbBuffer.length.toString(),
        },
      })
    } catch (backupError: any) {
      // Clean up temp file if it exists
      if (fs.existsSync(tempBackupPath)) {
        fs.unlinkSync(tempBackupPath)
      }
      throw backupError
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create backup" },
      { status: error.message === "Forbidden: Admin access required" ? 403 : 401 }
    )
  }
}
