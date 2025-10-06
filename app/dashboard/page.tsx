"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AccountCard } from "@/components/account-card"
import { AccountCardSkeletonGrid } from "@/components/account-card-skeleton"
import { AddAccountDialog } from "@/components/add-account-dialog"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { QRCodeDialog } from "@/components/qr-code-dialog"
import { apiClient } from "@/lib/api-client"
import { Account, User } from "@/types"
import { LogOut, Plus, Shield, Key, BookOpen, Search, X, Activity } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<User | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [accountForQR, setAccountForQR] = useState<Account | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIssuer, setSelectedIssuer] = useState<string>("all")

  // Load user and accounts
  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await apiClient.getMe()
        if (!currentUser) {
          router.push("/")
          return
        }
        setUser(currentUser)

        const accountsList = await apiClient.getAccounts()
        setAccounts(accountsList)
      } catch (error) {
        console.error("Failed to load data:", error)
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  // Update time remaining every second
  useEffect(() => {
    if (accounts.length === 0) return

    const interval = setInterval(() => {
      setAccounts(prev => prev.map(account => {
        const newTimeRemaining = account.timeRemaining - 1

        // Refresh accounts when any code expires
        if (newTimeRemaining <= 0) {
          apiClient.getAccounts().then(setAccounts)
          return account
        }

        return { ...account, timeRemaining: newTimeRemaining }
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [accounts.length])

  // Keyboard shortcut: Ctrl+F / Cmd+F to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F or Cmd+F
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      // Escape to clear search
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setSearchQuery("")
        searchInputRef.current?.blur()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleLogout = async () => {
    await apiClient.logout()
    router.push("/")
  }

  const handleAddAccount = async (newAccount: Omit<Account, "id" | "code" | "timeRemaining">) => {
    try {
      if (!newAccount.secret) {
        alert("Secret is required")
        return
      }

      const account = await apiClient.addAccount({
        label: newAccount.label,
        secret: newAccount.secret,
        issuer: newAccount.issuer,
        algorithm: newAccount.algorithm,
        digits: newAccount.digits,
        period: newAccount.period,
        visibility: newAccount.visibility,
      })
      setAccounts([...accounts, account])
      setIsAddDialogOpen(false)
    } catch (error: any) {
      alert(error.message || "Failed to add account")
    }
  }

  const handleRequestDelete = (account: Account) => {
    setAccountToDelete(account)
    setDeleteDialogOpen(true)
  }

  const handleShowQR = (account: Account) => {
    setAccountForQR(account)
    setQrDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return

    try {
      await apiClient.deleteAccount(accountToDelete.id)
      setAccounts(accounts.filter(acc => acc.id !== accountToDelete.id))
      setDeleteDialogOpen(false)
      setAccountToDelete(null)
    } catch (error: any) {
      alert(error.message || "Failed to delete account")
    }
  }

  const reloadAccounts = async () => {
    try {
      const accountsList = await apiClient.getAccounts()
      setAccounts(accountsList)
    } catch (error) {
      console.error("Failed to reload accounts:", error)
    }
  }

  // Get unique issuers for filter
  const uniqueIssuers = useMemo(() => {
    const issuers = new Set<string>()
    accounts.forEach(acc => {
      if (acc.issuer) issuers.add(acc.issuer)
    })
    return Array.from(issuers).sort()
  }, [accounts])

  // Filter and sort accounts based on search and issuer
  const filteredAccounts = useMemo(() => {
    const filtered = accounts.filter(account => {
      // Search filter
      const matchesSearch = searchQuery === "" ||
        account.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (account.issuer && account.issuer.toLowerCase().includes(searchQuery.toLowerCase()))

      // Issuer filter
      const matchesIssuer = selectedIssuer === "all" || account.issuer === selectedIssuer

      return matchesSearch && matchesIssuer
    })

    // Sort: favorites first, then by popularity (view_count + copy_count)
    return filtered.sort((a, b) => {
      // Favorites always come first
      if (a.is_favorite && !b.is_favorite) return -1
      if (!a.is_favorite && b.is_favorite) return 1

      // Then sort by popularity (total interactions)
      const aPopularity = (a.view_count || 0) + (a.copy_count || 0)
      const bPopularity = (b.view_count || 0) + (b.copy_count || 0)
      return bPopularity - aPopularity // Descending order
    })
  }, [accounts, searchQuery, selectedIssuer])

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Your Accounts
            </h2>
            <div className="h-6 w-32 bg-muted rounded shimmer mt-2" />
          </div>
        </div>
        <AccountCardSkeletonGrid count={6} />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            Your Accounts
          </h2>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
              {filteredAccounts.length}
            </span>
            {filteredAccounts.length !== accounts.length && (
              <span className="text-xs">
                of {accounts.length}
              </span>
            )}
            account{filteredAccounts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.role === "admin" && (
            <>
              <Button
                onClick={() => router.push("/audit-logs")}
                size="lg"
                variant="outline"
                className="shadow-md"
              >
                <Activity className="w-4 h-4 mr-2" />
                Audit Logs
              </Button>
              <Button
                onClick={() => router.push("/api-docs")}
                size="lg"
                variant="outline"
                className="shadow-md"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                API Docs
              </Button>
              <Button
                onClick={() => router.push("/api-keys")}
                size="lg"
                variant="outline"
                className="shadow-md"
              >
                <Key className="w-4 h-4 mr-2" />
                API Keys
              </Button>
            </>
          )}
          {(user.role === "admin" || user.role === "user") && (
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              size="lg"
              className="gradient-primary hover:opacity-90 shadow-lg shadow-primary/25"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filter Section */}
      {accounts.length > 0 && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search accounts... (Ctrl+F)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-11 text-base sm:text-sm shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-accent rounded"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Issuer Filter */}
            {uniqueIssuers.length > 0 && (
              <select
                value={selectedIssuer}
                onChange={(e) => setSelectedIssuer(e.target.value)}
                className="px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
              >
                <option value="all">All Issuers ({accounts.length})</option>
                {uniqueIssuers.map(issuer => (
                  <option key={issuer} value={issuer}>
                    {issuer} ({accounts.filter(a => a.issuer === issuer).length})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Active Filters Display */}
          {(searchQuery || selectedIssuer !== "all") && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery("")} className="hover:text-primary/70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedIssuer !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary">
                  Issuer: {selectedIssuer}
                  <button onClick={() => setSelectedIssuer("all")} className="hover:text-primary/70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedIssuer("all")
                }}
                className="text-muted-foreground hover:text-foreground underline ml-2"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="text-center py-16 sm:py-20 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 mb-6">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">No accounts yet</h3>
          <p className="text-base text-muted-foreground mb-6 max-w-md mx-auto">
            Add your first account to start generating secure TOTP codes
          </p>
          {(user.role === "admin" || user.role === "user") && (
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              size="lg"
              className="gradient-primary hover:opacity-90 shadow-lg shadow-primary/25"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Account
            </Button>
          )}
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="text-center py-16 sm:py-20 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 mb-6">
            <Search className="w-10 h-10 text-yellow-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">No accounts found</h3>
          <p className="text-base text-muted-foreground mb-6 max-w-md mx-auto">
            Try adjusting your search or filters
          </p>
          <Button
            onClick={() => {
              setSearchQuery("")
              setSelectedIssuer("all")
            }}
            variant="outline"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-slide-up">
          {filteredAccounts.map((account, index) => (
            <div
              key={account.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className="animate-fade-in"
            >
              <AccountCard
                account={account}
                onRequestDelete={handleRequestDelete}
                onFavoriteToggle={reloadAccounts}
                onShowQR={handleShowQR}
                userRole={user?.role}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add Account Dialog */}
      <AddAccountDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddAccount}
        userRole={user?.role || "user"}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        account={accountToDelete}
      />

      {/* QR Code Dialog */}
      <QRCodeDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        account={accountForQR}
      />
    </div>
  )
}
