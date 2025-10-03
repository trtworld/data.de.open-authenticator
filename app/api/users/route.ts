import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { logAudit } from "@/lib/audit"
import bcrypt from "bcrypt"

/**
 * GET /api/users - List all users (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const db = getDb()

    const users = db.prepare(`
      SELECT id, username, role, created_by, created_at, updated_at, last_login, is_active
      FROM users
      ORDER BY created_at DESC
    `).all()

    logAudit({ username: admin.username, action: "users:list" }, request)

    return NextResponse.json({ users })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message === "Forbidden: Admin access required" ? 403 : 401 }
    )
  }
}

/**
 * POST /api/users - Create new user (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const body = await request.json()
    const { username, password, role } = body

    if (!username || !password || !role) {
      return NextResponse.json(
        { error: "Username, password, and role are required" },
        { status: 400 }
      )
    }

    if (!["admin", "user"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'admin' or 'user'" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Check if user exists
    const exists = db.prepare("SELECT 1 FROM users WHERE username = ?").get(username)
    if (exists) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const result = db.prepare(`
      INSERT INTO users (username, password_hash, role, created_by, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).run(username, passwordHash, role, admin.username)

    logAudit({
      username: admin.username,
      action: "users:create",
      resource: username,
      details: `Created ${role} user`
    }, request)

    return NextResponse.json({
      success: true,
      user: {
        id: result.lastInsertRowid,
        username,
        role,
        created_by: admin.username
      }
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message === "Forbidden: Admin access required" ? 403 : 401 }
    )
  }
}
