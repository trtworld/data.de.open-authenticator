import jsQR from "jsqr"
import { createCanvas, loadImage } from "canvas"

/**
 * Parse QR code from image buffer
 */
export async function parseQRCode(imageBuffer: Buffer): Promise<string | null> {
  try {
    // Load image
    const img = await loadImage(imageBuffer)

    // Create canvas and draw image
    const canvas = createCanvas(img.width, img.height)
    const ctx = canvas.getContext("2d")
    ctx.drawImage(img, 0, 0)

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // Scan QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height)

    if (!code) {
      return null
    }

    return code.data
  } catch (error) {
    console.error("QR code parsing error:", error)
    return null
  }
}
