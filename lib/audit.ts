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
  resource?: string
  startDate?: number
  endDate?: number
  limit?: number
  offset?: number
}) {
  const db = getDb()
  const { username, action, resource, startDate, endDate, limit = 100, offset = 0 } = params

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

  if (resource) {
    query += " AND resource LIKE ?"
    queryParams.push(`%${resource}%`)
  }

  if (startDate) {
    query += " AND timestamp >= ?"
    queryParams.push(startDate)
  }

  if (endDate) {
    query += " AND timestamp <= ?"
    queryParams.push(endDate)
  }

  query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
  queryParams.push(limit, offset)

  return db.prepare(query).all(...queryParams)
}

/**
 * Get audit log statistics
 */
export function getAuditStats() {
  const db = getDb()

  const totalLogs = db.prepare("SELECT COUNT(*) as count FROM audit_logs").get() as { count: number }

  const recentActivity = db.prepare(`
    SELECT action, COUNT(*) as count
    FROM audit_logs
    WHERE timestamp > unixepoch() - 86400
    GROUP BY action
    ORDER BY count DESC
  `).all()

  const topUsers = db.prepare(`
    SELECT username, COUNT(*) as count
    FROM audit_logs
    WHERE timestamp > unixepoch() - 604800
    GROUP BY username
    ORDER BY count DESC
    LIMIT 10
  `).all()

  return {
    total: totalLogs.count,
    last24Hours: recentActivity,
    topUsersLastWeek: topUsers,
  }
}

/**
 * Clean old audit logs (retention policy)
 */
export function cleanOldAuditLogs(daysToKeep: number = 90) {
  const db = getDb()
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - daysToKeep * 86400

  const result = db.prepare(
    "DELETE FROM audit_logs WHERE timestamp < ?"
  ).run(cutoffTimestamp)

  return result.changes
}

// Common audit actions
export const AuditActions = {
  // Authentication
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILED: "login_failed",
  LOGOUT: "logout",
  PASSWORD_CHANGED: "password_changed",

  // Account operations
  ACCOUNT_CREATED: "account_created",
  ACCOUNT_UPDATED: "account_updated",
  ACCOUNT_DELETED: "account_deleted",
  TOTP_VIEWED: "totp_viewed",

  // User management
  USER_CREATED: "user_created",
  USER_DELETED: "user_deleted",
  USERS_LIST: "users:list",

  // API operations
  API_KEY_CREATED: "api_key_created",
  API_KEY_DELETED: "api_key_deleted",
  API_KEY_UPDATED: "api_key_updated",

  // System operations
  BACKUP_DOWNLOADED: "backup_downloaded",
  LOGO_UPLOADED: "logo_uploaded",

  // Favorites
  FAVORITE_ADDED: "favorite_added",
  FAVORITE_REMOVED: "favorite_removed",
}

/**
 * Get distinct usernames from audit logs (for autocomplete)
 */
export function getDistinctUsernames(query?: string) {
  const db = getDb()

  let sql = "SELECT DISTINCT username FROM audit_logs"
  const params: any[] = []

  if (query && query.length >= 3) {
    sql += " WHERE username LIKE ?"
    params.push(`%${query}%`)
  }

  sql += " ORDER BY username LIMIT 20"

  return db.prepare(sql).all(...params) as Array<{ username: string }>
}

/**
 * Get distinct resources from audit logs (for autocomplete)
 */
export function getDistinctResources(query?: string) {
  const db = getDb()

  let sql = "SELECT DISTINCT resource FROM audit_logs WHERE resource IS NOT NULL"
  const params: any[] = []

  if (query && query.length >= 3) {
    sql += " AND resource LIKE ?"
    params.push(`%${query}%`)
  }

  sql += " ORDER BY resource LIMIT 20"

  return db.prepare(sql).all(...params) as Array<{ resource: string }>
}
