import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { parseOtpAuthUrl } from "@/lib/totp"

/**
 * POST /api/qr/parse - Parse OTPAuth URL from QR code or direct URL
 * Accepts either:
 * - imageData: base64 image (client-side parsing recommended)
 * - url: otpauth:// URL string
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)

    const body = await request.json()
    const { url, imageData } = body

    // Direct URL parsing (preferred method)
    if (url) {
      if (!url.startsWith("otpauth://")) {
        return NextResponse.json(
          { error: "Invalid OTPAuth URL format. Must start with otpauth://" },
          { status: 400 }
        )
      }

      try {
        const parsed = parseOtpAuthUrl(url)
        return NextResponse.json({ success: true, data: parsed })
      } catch (error: any) {
        return NextResponse.json(
          { error: `Failed to parse OTPAuth URL: ${error.message}` },
          { status: 400 }
        )
      }
    }

    // Image data provided - use client-side parsing
    if (imageData) {
      return NextResponse.json({
        error: "Please use client-side QR parsing for images. Server-side image parsing is not implemented.",
        hint: "Upload QR code image in the UI for automatic parsing"
      }, { status: 501 })
    }

    return NextResponse.json(
      { error: "Either 'url' or 'imageData' must be provided" },
      { status: 400 }
    )

  } catch (error: any) {
    console.error("QR parse error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
