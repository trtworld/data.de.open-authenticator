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
import { Users, Download, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface BulkUserCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BulkUserCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: BulkUserCreateDialogProps) {
  const [usernames, setUsernames] = useState("")
  const [role, setRole] = useState<"user" | "admin">("user")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [csvData, setCsvData] = useState<string>("")

  const handleCreate = async () => {
    setError("")

    // Parse usernames (split by newlines, commas, or spaces)
    const usernameList = usernames
      .split(/[\n,\s]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0)

    if (usernameList.length === 0) {
      setError("Please enter at least one username")
      return
    }

    if (usernameList.length > 100) {
      setError("Maximum 100 users at once")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/users/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          usernames: usernameList,
          role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create users")
      }

      // Generate CSV content
      const csv = generateCSV(data.users)
      setCsvData(csv)

      // Show success message
      alert(`Successfully created ${data.users.length} users! Download the CSV file to get the passwords.`)

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || "Failed to create users")
    } finally {
      setIsLoading(false)
    }
  }

  const generateCSV = (users: Array<{ username: string; password: string }>) => {
    const header = "Username,Password,Role\n"
    const rows = users.map((u) => `${u.username},${u.password},${role}`).join("\n")
    return header + rows
  }

  const downloadCSV = () => {
    if (!csvData) return

    const blob = new Blob([csvData], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleClose = () => {
    if (csvData) {
      const confirmed = confirm(
        "You have created users but haven't downloaded the CSV yet. Are you sure you want to close?"
      )
      if (!confirmed) return
    }

    setUsernames("")
    setRole("user")
    setError("")
    setCsvData("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bulk User Creation
          </DialogTitle>
          <DialogDescription>
            Enter usernames (one per line, comma-separated, or space-separated). Random passwords will be generated.
          </DialogDescription>
        </DialogHeader>

        {!csvData ? (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="usernames">Usernames</Label>
                <Textarea
                  id="usernames"
                  placeholder="john.doe&#10;jane.smith&#10;alice.johnson&#10;&#10;or comma: user1, user2, user3&#10;or space: user1 user2 user3"
                  value={usernames}
                  onChange={(e) => setUsernames(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum 100 users at once
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Default Role</Label>
                <Select value={role} onValueChange={(value: "user" | "admin") => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Users"
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 p-4 rounded-md">
                <p className="font-semibold mb-2">✓ Users created successfully!</p>
                <p className="text-sm">
                  Download the CSV file containing usernames and passwords. Share this file securely
                  with your users.
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 p-4 rounded-md">
                <p className="font-semibold mb-2">⚠️ Important</p>
                <p className="text-sm">
                  Passwords are generated randomly and will NOT be shown again. Make sure to download
                  the CSV file before closing this dialog.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={downloadCSV} className="gap-2">
                <Download className="w-4 h-4" />
                Download CSV
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
