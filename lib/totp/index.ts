import { authenticator } from "otplib"
import crypto from "crypto"

// Configure authenticator
authenticator.options = {
  window: 1, // Allow 1 time step before/after for clock skew
}

export interface TOTPConfig {
  secret: string
  algorithm?: "SHA1" | "SHA256" | "SHA512"
  digits?: number
  period?: number
}

export interface TOTPResult {
  code: string
  timeRemaining: number
  period: number
}

/**
 * Generate TOTP code from secret
 */
export function generateTOTP(config: TOTPConfig): TOTPResult {
  const {
    secret,
    algorithm = "SHA1",
    digits = 6,
    period = 30,
  } = config

  // Configure otplib
  authenticator.options = {
    ...authenticator.options,
    algorithm: algorithm.toLowerCase(),
    digits,
    step: period,
  }

  const code = authenticator.generate(secret)
  const timeRemaining = getTimeRemaining(period)

  return {
    code,
    timeRemaining,
    period,
  }
}

/**
 * Verify TOTP code
 */
export function verifyTOTP(token: string, config: TOTPConfig): boolean {
  const { secret, algorithm = "SHA1", digits = 6, period = 30 } = config

  authenticator.options = {
    ...authenticator.options,
    algorithm: algorithm.toLowerCase(),
    digits,
    step: period,
  }

  return authenticator.check(token, secret)
}

/**
 * Calculate time remaining in current period
 */
export function getTimeRemaining(period: number = 30): number {
  const now = Math.floor(Date.now() / 1000)
  return period - (now % period)
}

/**
 * Parse otpauth:// URL to extract TOTP config
 */
export function parseOtpAuthUrl(url: string): {
  label: string
  issuer?: string
  secret: string
  algorithm?: string
  digits?: number
  period?: number
} | null {
  try {
    const parsed = new URL(url)

    if (parsed.protocol !== "otpauth:" || parsed.host !== "totp") {
      return null
    }

    const label = decodeURIComponent(parsed.pathname.slice(1))
    const params = parsed.searchParams

    const secret = params.get("secret")
    if (!secret) return null

    return {
      label,
      issuer: params.get("issuer") || undefined,
      secret,
      algorithm: params.get("algorithm") || undefined,
      digits: params.has("digits") ? parseInt(params.get("digits")!) : undefined,
      period: params.has("period") ? parseInt(params.get("period")!) : undefined,
    }
  } catch {
    return null
  }
}

/**
 * Encrypt secret for storage
 */
export function encryptSecret(plaintext: string, key: string): string {
  const iv = crypto.randomBytes(16)
  const keyBuffer = crypto.scryptSync(key, "salt", 32)
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, iv)

  let encrypted = cipher.update(plaintext, "utf8", "hex")
  encrypted += cipher.final("hex")

  const authTag = cipher.getAuthTag()

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`
}

/**
 * Decrypt secret from storage
 */
export function decryptSecret(ciphertext: string, key: string): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(":")

  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")
  const keyBuffer = crypto.scryptSync(key, "salt", 32)

  const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

/**
 * Validate base32 secret format
 */
export function validateSecret(secret: string): boolean {
  const base32Regex = /^[A-Z2-7]+=*$/
  return base32Regex.test(secret.toUpperCase())
}
