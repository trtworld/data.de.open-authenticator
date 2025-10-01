import bcrypt from "bcrypt"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"
import { getDb } from "../db"

export interface User {
  username: string
  role: "admin" | "viewer" | "user"
}

export interface Session extends User {
  sessionId: string
  expiresAt: Date
}

export interface DbUser {
  id: number
  username: string
  password_hash: string
  role: "admin" | "viewer" | "user"
  is_active: number
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
)
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Initialize default users from environment variables
 */
async function initializeDefaultUsers() {
  const db = getDb()

  const adminPassword = process.env.ADMIN_PASSWORD || "actrt123admin"
  const viewerPassword = process.env.VIEWER_PASSWORD || "actrt123viewer"

  // Check if users already exist
  const adminExists = db.prepare("SELECT 1 FROM users WHERE username = ?").get("admin")
  const viewerExists = db.prepare("SELECT 1 FROM users WHERE username = ?").get("viewer")

  if (!adminExists) {
    const adminHash = await bcrypt.hash(adminPassword, 10)
    db.prepare(`
      INSERT INTO users (username, password_hash, role, created_by, is_active)
      VALUES (?, ?, 'admin', 'system', 1)
    `).run("admin", adminHash)
  }

  if (!viewerExists) {
    const viewerHash = await bcrypt.hash(viewerPassword, 10)
    db.prepare(`
      INSERT INTO users (username, password_hash, role, created_by, is_active)
      VALUES (?, ?, 'viewer', 'system', 1)
    `).run("viewer", viewerHash)
  }
}

/**
 * Authenticate user with username/password
 */
export async function authenticate(
  username: string,
  password: string
): Promise<User | null> {
  // Initialize default users on first auth attempt
  await initializeDefaultUsers()

  const db = getDb()
  const user = db.prepare<DbUser, string>(
    "SELECT * FROM users WHERE username = ? AND is_active = 1"
  ).get(username)

  if (!user) return null

  const isValid = await bcrypt.compare(password, user.password_hash)
  if (!isValid) return null

  // Update last login
  db.prepare("UPDATE users SET last_login = unixepoch() WHERE id = ?").run(user.id)

  return {
    username: user.username,
    role: user.role,
  }
}

/**
 * Create session token
 */
export async function createSession(user: User): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  const token = await new SignJWT({
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresAt)
    .setIssuedAt()
    .sign(JWT_SECRET)

  return token
}

/**
 * Verify session token
 */
export async function verifySession(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)

    return {
      username: payload.username as string,
      role: payload.role as "admin" | "viewer" | "user",
    }
  } catch {
    return null
  }
}

/**
 * Get current user from request
 */
export async function getCurrentUser(
  request?: NextRequest
): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value

    if (!token) return null

    return await verifySession(token)
  } catch {
    return null
  }
}

/**
 * Require authentication middleware
 */
export async function requireAuth(request?: NextRequest): Promise<User> {
  const user = await getCurrentUser(request)

  if (!user) {
    throw new Error("Unauthorized")
  }

  return user
}

/**
 * Require admin role middleware
 */
export async function requireAdmin(request?: NextRequest): Promise<User> {
  const user = await requireAuth(request)

  if (user.role !== "admin") {
    throw new Error("Forbidden: Admin access required")
  }

  return user
}

/**
 * Hash password (for generating hashes)
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}
