"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { User } from "@/types"
import { Settings, Download, UserPlus, KeyRound, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChangePasswordDialog } from "@/components/change-password-dialog"
import { UserManagementDialog } from "@/components/user-management-dialog"
import { ToastProvider } from "@/components/ui/toast"
import Image from "next/image"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showUsersDialog, setShowUsersDialog] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await apiClient.getMe()
      if (!currentUser) {
        router.push("/")
        return
      }
      setUser(currentUser)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await apiClient.logout()
    router.push("/")
  }

  const handleBackup = async () => {
    try {
      const blob = await apiClient.downloadBackup()

      // Verify we got a valid blob (not JSON error)
      if (blob.type === "application/json") {
        const text = await blob.text()
        const error = JSON.parse(text)
        throw new Error(error.error || "Failed to download backup")
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `authenticator-backup-${new Date().toISOString()}.db`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      alert(error.message || "Failed to download backup")
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Modern Navigation Bar */}
      <nav className="glass-effect sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center ring-2 ring-primary/20 shadow-md">
                <Image
                  src="/logo.png"
                  alt="Otto-TP Logo"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Otto-TP
                </h1>
                <p className="text-xs text-muted-foreground font-medium">
                  Team-Based TOTP Authenticator
                </p>
              </div>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-2">
              <div className="text-right hidden md:block mr-2 px-3 py-1 rounded-lg bg-primary/5">
                <p className="text-sm font-semibold text-foreground">
                  {user?.username}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role}
                </p>
              </div>

              {/* Admin Menu */}
              {user?.role === "admin" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Admin Tools</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowUsersDialog(true)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Manage Users
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBackup}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Backup
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Password Change */}
              <Button variant="ghost" size="sm" onClick={() => setShowPasswordDialog(true)} className="hover:bg-primary/10">
                <KeyRound className="w-4 h-4" />
              </Button>

              {/* Logout */}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:bg-destructive/10 hover:text-destructive">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/50 dark:border-slate-800/50 glass-effect">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col items-center gap-4 text-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full text-slate-600 dark:text-slate-400">
              <p className="text-center sm:text-left">
                Developed with <span className="text-red-500 animate-pulse">❤</span> as open source by{" "}
                <a
                  href="https://github.com/alameddinc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:underline transition-colors"
                >
                  Alameddin Çelik
                </a>
              </p>
              <a
                href="https://github.com/alameddinc/open-authenticator"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors group"
              >
                <Github className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Star on GitHub</span>
              </a>
            </div>
            <p className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-1.5">
              <span className="text-base">🇵🇸</span>
              Free Palestine
            </p>
          </div>
        </div>
      </footer>

      {/* Password Change Dialog */}
      <ChangePasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
      />

      {/* User Management Dialog */}
      <UserManagementDialog
        open={showUsersDialog}
        onOpenChange={setShowUsersDialog}
      />
      </div>
    </ToastProvider>
  )
}
