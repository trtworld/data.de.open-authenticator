import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { logAudit } from "@/lib/audit"
import bcrypt from "bcrypt"
import crypto from "crypto"

/**
 * POST /api/users/bulk - Create multiple users at once (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { usernames, role } = await request.json()

    if (!Array.isArray(usernames) || usernames.length === 0) {
      return NextResponse.json(
        { error: "Usernames array is required" },
        { status: 400 }
      )
    }

    if (usernames.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 users at once" },
        { status: 400 }
      )
    }

    if (!role || !["user", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      )
    }

    const db = getDb()
    const createdUsers: Array<{ username: string; password: string }> = []
    const errors: Array<{ username: string; error: string }> = []

    // Generate random secure password
    const generatePassword = () => {
      const length = 16
      const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
      let password = ""
      const randomBytes = crypto.randomBytes(length)

      for (let i = 0; i < length; i++) {
        password += charset[randomBytes[i] % charset.length]
      }

      return password
    }

    // Create users one by one
    for (const username of usernames) {
      try {
        // Validate username
        if (typeof username !== "string" || username.trim().length === 0) {
          errors.push({ username: username || "(empty)", error: "Invalid username" })
          continue
        }

        const cleanUsername = username.trim().toLowerCase()

        if (cleanUsername.length < 3) {
          errors.push({ username, error: "Username must be at least 3 characters" })
          continue
        }

        // Check if user already exists
        const existing = db
          .prepare("SELECT id FROM users WHERE username = ?")
          .get(cleanUsername)

        if (existing) {
          errors.push({ username, error: "Username already exists" })
          continue
        }

        // Generate random password
        const password = generatePassword()
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user
        db.prepare(`
          INSERT INTO users (username, password_hash, role, created_by)
          VALUES (?, ?, ?, ?)
        `).run(cleanUsername, hashedPassword, role, user.username)

        createdUsers.push({
          username: cleanUsername,
          password,
        })

        // Log audit event
        logAudit(
          {
            username: user.username,
            action: "user_created",
            resource: cleanUsername,
            details: `Bulk creation - role: ${role}`,
          },
          request
        )
      } catch (error: any) {
        errors.push({
          username,
          error: error.message || "Failed to create user",
        })
      }
    }

    return NextResponse.json({
      success: true,
      users: createdUsers,
      errors,
      summary: {
        total: usernames.length,
        created: createdUsers.length,
        failed: errors.length,
      },
    })
  } catch (error: any) {
    console.error("Failed to create bulk users:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create users" },
      { status: 500 }
    )
  }
}
