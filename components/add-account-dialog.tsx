"use client"

import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Account } from "@/types"
import { Upload, KeyRound, Link2 } from "lucide-react"

interface AddAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (account: Omit<Account, "id" | "code" | "timeRemaining">) => void
}

export function AddAccountDialog({ open, onOpenChange, onAdd }: AddAccountDialogProps) {
  const [tab, setTab] = useState("manual")
  const [label, setLabel] = useState("")
  const [issuer, setIssuer] = useState("")
  const [secret, setSecret] = useState("")
  const [otpauthUrl, setOtpauthUrl] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!label || !secret) return

    onAdd({
      label,
      secret,
      issuer: issuer || "Unknown",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    })

    // Reset form
    setLabel("")
    setIssuer("")
    setSecret("")
  }

  const parseOtpauthUrl = async (url: string) => {
    try {
      setIsProcessing(true)
      const res = await fetch("/api/qr/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        credentials: "include",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse OTPAuth URL")
      }

      // Fill form with parsed data
      const parsed = data.data
      setLabel(parsed.label || "")
      setIssuer(parsed.issuer || "")
      setSecret(parsed.secret || "")
      setTab("manual") // Switch to manual tab to show filled data

      alert("✅ OTPAuth URL parsed successfully! Review the details and click Add Account.")
    } catch (error: any) {
      alert(error.message || "Failed to parse OTPAuth URL")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOtpauthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpauthUrl) return

    // Check if input is a data URL (base64 image)
    if (otpauthUrl.startsWith("data:image/")) {
      await handleDataUrlQR(otpauthUrl)
    } else {
      // Regular OTPAuth URL
      await parseOtpauthUrl(otpauthUrl)
    }
  }

  const handleDataUrlQR = async (dataUrl: string) => {
    try {
      setIsProcessing(true)

      // Use jsQR library for client-side QR parsing
      const jsQR = (await import("jsqr")).default

      // Create image from data URL
      const img = new Image()

      img.onload = async () => {
        // Create canvas and get image data
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          alert("Failed to create canvas context")
          setIsProcessing(false)
          return
        }

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        // Parse QR code
        const code = jsQR(imageData.data, imageData.width, imageData.height)

        if (code && code.data) {
          await parseOtpauthUrl(code.data)
        } else {
          alert("❌ No QR code found in image. Please try again or use manual entry.")
          setIsProcessing(false)
        }
      }

      img.onerror = () => {
        alert("❌ Failed to load image from data URL")
        setIsProcessing(false)
      }

      img.src = dataUrl
    } catch (error: any) {
      alert(error.message || "Failed to process QR code from data URL")
      setIsProcessing(false)
    }
  }

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsProcessing(true)

      // Use jsQR library for client-side QR parsing
      const jsQR = (await import("jsqr")).default

      // Read file as image
      const img = new Image()
      const reader = new FileReader()

      reader.onload = async (event) => {
        img.onload = async () => {
          // Create canvas and get image data
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")
          if (!ctx) {
            alert("Failed to create canvas context")
            setIsProcessing(false)
            return
          }

          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

          // Parse QR code
          const code = jsQR(imageData.data, imageData.width, imageData.height)

          if (code && code.data) {
            await parseOtpauthUrl(code.data)
          } else {
            alert("❌ No QR code found in image. Please try again or use manual entry.")
            setIsProcessing(false)
          }
        }

        img.onerror = () => {
          alert("❌ Failed to load image")
          setIsProcessing(false)
        }

        img.src = event.target?.result as string
      }

      reader.readAsDataURL(file)
    } catch (error: any) {
      alert(error.message || "Failed to process QR code")
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Account</DialogTitle>
          <DialogDescription>
            Add a new TOTP account by uploading a QR code or entering the secret key manually
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual">
              <KeyRound className="w-4 h-4 mr-2" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="qr">
              <Upload className="w-4 h-4 mr-2" />
              QR Upload
            </TabsTrigger>
            <TabsTrigger value="url">
              <Link2 className="w-4 h-4 mr-2" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="label" className="text-sm font-medium">
                  Account Label *
                </label>
                <Input
                  id="label"
                  placeholder="e.g., Gmail - Work"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="issuer" className="text-sm font-medium">
                  Issuer
                </label>
                <Input
                  id="issuer"
                  placeholder="e.g., Google"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="secret" className="text-sm font-medium">
                  Secret Key *
                </label>
                <Input
                  id="secret"
                  placeholder="Base32 encoded secret"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  required
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  The secret key is usually provided when setting up 2FA
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Add Account
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-accent/50 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleQRUpload}
                className="hidden"
                id="qr-upload"
                ref={fileInputRef}
              />
              <label htmlFor="qr-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  {isProcessing ? "Processing..." : "Click to upload QR code"}
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG up to 10MB
                </p>
              </label>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <form onSubmit={handleOtpauthSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="otpauth-url" className="text-sm font-medium">
                  OTPAuth URL or Data URL *
                </label>
                <Input
                  id="otpauth-url"
                  placeholder="otpauth://totp/... or data:image/png;base64,..."
                  value={otpauthUrl}
                  onChange={(e) => setOtpauthUrl(e.target.value)}
                  required
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Paste otpauth:// URL or data:image/png;base64,... QR code
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isProcessing}>
                  {isProcessing ? "Parsing..." : "Parse URL"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
