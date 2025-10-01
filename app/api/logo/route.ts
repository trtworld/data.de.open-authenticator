import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import fs from "fs"
import path from "path"

const LOGO_DIR = path.join(process.cwd(), "data", "logo")
const LOGO_PATH = path.join(LOGO_DIR, "logo.png")

/**
 * GET /api/logo - Get current logo
 */
export async function GET() {
  try {
    // Ensure logo directory exists
    if (!fs.existsSync(LOGO_DIR)) {
      fs.mkdirSync(LOGO_DIR, { recursive: true })
    }

    // Check if custom logo exists
    if (fs.existsSync(LOGO_PATH)) {
      const logoBuffer = fs.readFileSync(LOGO_PATH)
      return new NextResponse(logoBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=3600",
        },
      })
    }

    // Return default logo URL as JSON if no custom logo
    return NextResponse.json({
      defaultLogo: true,
      url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0qC5LjxaKwXYMFQjLb9VX07dw5-sDc8ERySdSlZOhmXeEXAq9iqaqzKqOxjPuehTIPqY&usqp=CAU"
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get logo" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/logo - Upload custom logo (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()

    const formData = await request.formData()
    const file = formData.get("logo") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    // Ensure logo directory exists
    if (!fs.existsSync(LOGO_DIR)) {
      fs.mkdirSync(LOGO_DIR, { recursive: true })
    }

    // Save file
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    fs.writeFileSync(LOGO_PATH, buffer)

    logAudit({
      username: admin.username,
      action: "logo:upload",
      details: `Uploaded custom logo: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`
    }, request)

    return NextResponse.json({
      success: true,
      message: "Logo uploaded successfully"
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to upload logo" },
      { status: error.message === "Forbidden: Admin access required" ? 403 : 401 }
    )
  }
}

/**
 * DELETE /api/logo - Delete custom logo and revert to default (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin()

    if (fs.existsSync(LOGO_PATH)) {
      fs.unlinkSync(LOGO_PATH)

      logAudit({
        username: admin.username,
        action: "logo:delete",
        details: "Reverted to default logo"
      }, request)
    }

    return NextResponse.json({
      success: true,
      message: "Logo deleted successfully"
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete logo" },
      { status: error.message === "Forbidden: Admin access required" ? 403 : 401 }
    )
  }
}
