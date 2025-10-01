"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AccountCard } from "@/components/account-card"
import { AddAccountDialog } from "@/components/add-account-dialog"
import { apiClient } from "@/lib/api-client"
import { Account, User } from "@/types"
import { LogOut, Plus, Shield } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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
      })
      setAccounts([...accounts, account])
      setIsAddDialogOpen(false)
    } catch (error: any) {
      alert(error.message || "Failed to add account")
    }
  }

  const handleDeleteAccount = async (id: number) => {
    if (!confirm("Are you sure you want to delete this account?")) return

    try {
      await apiClient.deleteAccount(id)
      setAccounts(accounts.filter(acc => acc.id !== id))
    } catch (error: any) {
      alert(error.message || "Failed to delete account")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 animate-pulse text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
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
              {accounts.length}
            </span>
            account{accounts.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        {user.role === "admin" && (
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

      {accounts.length === 0 ? (
        <div className="text-center py-16 sm:py-20 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 mb-6">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">No accounts yet</h3>
          <p className="text-base text-muted-foreground mb-6 max-w-md mx-auto">
            Add your first account to start generating secure TOTP codes
          </p>
          {user.role === "admin" && (
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-slide-up">
          {accounts.map((account, index) => (
            <div
              key={account.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className="animate-fade-in"
            >
              <AccountCard
                account={account}
                onDelete={user.role === "admin" ? handleDeleteAccount : undefined}
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
      />
    </div>
  )
}
