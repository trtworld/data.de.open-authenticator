import { getDb } from "./db"
import { NextRequest } from "next/server"

export interface AuditLogEntry {
  username: string
  action: string
  resource?: string
  details?: string
  ip_address?: string
  user_agent?: string
}

/**
 * Log an audit event
 */
export function logAudit(entry: AuditLogEntry, request?: NextRequest) {
  const db = getDb()

  const ipAddress = request?.headers.get("x-forwarded-for") || 
                    request?.headers.get("x-real-ip") || 
                    entry.ip_address || "unknown"
  
  const userAgent = request?.headers.get("user-agent") || 
                    entry.user_agent || "unknown"

  db.prepare(`
    INSERT INTO audit_logs (username, action, resource, details, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    entry.username,
    entry.action,
    entry.resource || null,
    entry.details || null,
    ipAddress,
    userAgent
  )
}

/**
 * Get audit logs with pagination
 */
export function getAuditLogs(params: {
  username?: string
  action?: string
  limit?: number
  offset?: number
}) {
  const db = getDb()
  const { username, action, limit = 100, offset = 0 } = params

  let query = "SELECT * FROM audit_logs WHERE 1=1"
  const queryParams: any[] = []

  if (username) {
    query += " AND username = ?"
    queryParams.push(username)
  }

  if (action) {
    query += " AND action = ?"
    queryParams.push(action)
  }

  query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
  queryParams.push(limit, offset)

  return db.prepare(query).all(...queryParams)
}
