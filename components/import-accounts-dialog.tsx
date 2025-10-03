"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

interface ImportAccountsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface ImportResult {
  label: string
  issuer?: string
  status: "success" | "skipped" | "error"
  error?: string
}

export function ImportAccountsDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportAccountsDialogProps) {
  const [format, setFormat] = useState<"json" | "otpauth">("json")
  const [content, setContent] = useState("")
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [results, setResults] = useState<ImportResult[] | null>(null)
  const [summary, setSummary] = useState<{
    total: number
    success: number
    skipped: number
    failed: number
  } | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setContent(text)

      // Auto-detect format
      if (text.trim().startsWith("otpauth://")) {
        setFormat("otpauth")
      } else if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
        setFormat("json")
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    setError("")
    setResults(null)
    setSummary(null)

    if (!content.trim()) {
      setError("Please paste content or upload a file")
      return
    }

    setIsLoading(true)

    try {
      let body: any = {
        format,
        skip_duplicates: skipDuplicates,
      }

      if (format === "json") {
        // Parse JSON content
        let parsed
        try {
          parsed = JSON.parse(content)
        } catch (err) {
          throw new Error("Invalid JSON format")
        }

        // Handle both array and object with accounts array
        if (Array.isArray(parsed)) {
          body.accounts = parsed
        } else if (parsed.accounts && Array.isArray(parsed.accounts)) {
          body.accounts = parsed.accounts
        } else {
          throw new Error("Expected array of accounts or object with 'accounts' property")
        }
      } else if (format === "otpauth") {
        // Split by newlines to get individual URIs
        const uris = content
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.startsWith("otpauth://"))

        if (uris.length === 0) {
          throw new Error("No valid OTPAuth URIs found")
        }

        body.otpauth_uris = uris
      }

      const response = await fetch("/api/v1/accounts/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to import accounts")
      }

      setResults(data.results)
      setSummary(data.summary)

      if (data.summary.success > 0 && onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || "Failed to import accounts")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setContent("")
    setFormat("json")
    setSkipDuplicates(true)
    setError("")
    setResults(null)
    setSummary(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Accounts
          </DialogTitle>
          <DialogDescription>
            Import accounts from backup file or OTPAuth URIs
          </DialogDescription>
        </DialogHeader>

        {!results ? (
          <>
            <div className="space-y-4 py-4">
              {/* Format Selection */}
              <div className="space-y-2">
                <Label htmlFor="format">Import Format</Label>
                <Select value={format} onValueChange={(value: "json" | "otpauth") => setFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON (from export)</SelectItem>
                    <SelectItem value="otpauth">OTPAuth URIs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file">Upload File (Optional)</Label>
                <input
                  id="file"
                  type="file"
                  accept=".json,.txt"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/90"
                />
              </div>

              {/* Content Input */}
              <div className="space-y-2">
                <Label htmlFor="content">Or Paste Content</Label>
                <Textarea
                  id="content"
                  placeholder={
                    format === "json"
                      ? '[\n  {\n    "label": "user@example.com",\n    "issuer": "Google",\n    "secret": "BASE32SECRET",\n    "algorithm": "SHA1",\n    "digits": 6,\n    "period": 30,\n    "visibility": "team"\n  }\n]'
                      : "otpauth://totp/Google:user@example.com?secret=BASE32SECRET&issuer=Google\notpauth://totp/GitHub:myuser?secret=ANOTHERSECRET&issuer=GitHub"
                  }
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  className="font-mono text-xs"
                />
              </div>

              {/* Skip Duplicates */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="skip-duplicates"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="skip-duplicates" className="text-sm cursor-pointer">
                  Skip duplicate accounts (recommended)
                </Label>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  💡 Format Examples
                </p>
                {format === "json" ? (
                  <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <p>• Export from OttoTP: Use exported JSON file directly</p>
                    <p>• Each account must have: label, secret</p>
                    <p>• Optional: issuer, algorithm, digits, period, visibility</p>
                  </div>
                ) : (
                  <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <p>• One OTPAuth URI per line</p>
                    <p>• Format: otpauth://totp/Issuer:Label?secret=SECRET</p>
                    <p>• Can be exported from Google Authenticator, Authy, etc.</p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Accounts
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-4">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
                  <p className="text-2xl font-bold">{summary?.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {summary?.success}
                  </p>
                  <p className="text-xs text-muted-foreground">Success</p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                    {summary?.skipped}
                  </p>
                  <p className="text-xs text-muted-foreground">Skipped</p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                    {summary?.failed}
                  </p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>

              {/* Results List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      result.status === "success"
                        ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                        : result.status === "skipped"
                        ? "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"
                        : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {result.status === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      ) : result.status === "skipped" ? (
                        <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {result.issuer ? `${result.issuer}: ` : ""}
                          {result.label}
                        </p>
                        {result.error && (
                          <p className="text-xs text-muted-foreground mt-1">{result.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {summary && summary.success > 0 && (
                <div className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 p-4 rounded-md">
                  <p className="font-semibold mb-1">
                    ✓ Successfully imported {summary.success} account{summary.success > 1 ? "s" : ""}!
                  </p>
                  <p className="text-sm">
                    Accounts are now available in your dashboard.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
