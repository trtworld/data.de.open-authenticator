"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { QrCode, Copy, Check, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react"
import QRCodeLib from "qrcode"
import { Account } from "@/types"

interface QRCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: Account | null
}

export function QRCodeDialog({ open, onOpenChange, account }: QRCodeDialogProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [otpauthUri, setOtpauthUri] = useState<string>("")
  const [secret, setSecret] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showSecret, setShowSecret] = useState(false)
  const [copiedUri, setCopiedUri] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  useEffect(() => {
    if (open && account) {
      loadQRCode()
    } else {
      // Reset state when dialog closes
      setQrCodeUrl("")
      setOtpauthUri("")
      setSecret("")
      setShowSecret(false)
      setError("")
      setCopiedUri(false)
      setCopiedSecret(false)
    }
  }, [open, account])

  const loadQRCode = async () => {
    if (!account) return

    setIsLoading(true)
    setError("")

    try {
      // Fetch decrypted secret from API
      const response = await fetch(`/api/accounts/${account.id}/qr`, {
        credentials: "include",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to load QR code")
      }

      const data = await response.json()
      const { secret: decryptedSecret, otpauth_uri } = data

      setSecret(decryptedSecret)
      setOtpauthUri(otpauth_uri)

      // Generate QR code
      const qrUrl = await QRCodeLib.toDataURL(otpauth_uri, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })

      setQrCodeUrl(qrUrl)
    } catch (err: any) {
      setError(err.message || "Failed to generate QR code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyUri = async () => {
    if (!otpauthUri) return
    await navigator.clipboard.writeText(otpauthUri)
    setCopiedUri(true)
    setTimeout(() => setCopiedUri(false), 2000)
  }

  const handleCopySecret = async () => {
    if (!secret) return
    await navigator.clipboard.writeText(secret)
    setCopiedSecret(true)
    setTimeout(() => setCopiedSecret(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Add to Phone Authenticator
          </DialogTitle>
          <DialogDescription>
            Scan this QR code with Google Authenticator, Authy, or any TOTP app
          </DialogDescription>
        </DialogHeader>

        {account && (
          <div className="space-y-4 py-4">
            {/* Account Info */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-semibold text-sm">
                {account.issuer ? `${account.issuer}: ` : ""}
                {account.label}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Algorithm: {account.algorithm || "SHA1"} • Digits: {account.digits || 6} • Period:{" "}
                {account.period || 30}s
              </p>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Generating QR code...</p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium">⚠️ {error}</p>
              </div>
            )}

            {/* QR Code */}
            {qrCodeUrl && !isLoading && !error && (
              <>
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg shadow-md">
                    <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    📱 How to Scan
                  </p>
                  <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                    <li>Open your authenticator app</li>
                    <li>Tap "+" or "Add Account"</li>
                    <li>Select "Scan QR Code"</li>
                    <li>Point camera at the QR code above</li>
                  </ol>
                </div>

                {/* Manual Entry Option */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Manual Entry (if QR fails)</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          Show
                        </>
                      )}
                    </Button>
                  </div>

                  {showSecret && (
                    <div className="space-y-2">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Secret Key:</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm font-mono break-all">{secret}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopySecret}
                          >
                            {copiedSecret ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">OTPAuth URI:</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs font-mono break-all overflow-auto max-h-20">
                            {otpauthUri}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyUri}
                          >
                            {copiedUri ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Security Warning */}
                <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-amber-900 dark:text-amber-100 mb-1">
                        Security Notice
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        This QR code contains the secret key. Anyone with access can generate codes.
                        Keep this screen private and don't share screenshots.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
