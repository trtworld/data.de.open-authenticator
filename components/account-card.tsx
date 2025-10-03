"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Account } from "@/types"
import { Copy, Trash2, Check, Clock, Users, Lock, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { AccountIcon } from "@/components/account-icon"
import { FavoriteButton } from "@/components/favorite-button"

interface AccountCardProps {
  account: Account
  onDelete?: (id: number) => void
  onRequestDelete?: (account: Account) => void
  onFavoriteToggle?: () => void
}

export function AccountCard({ account, onDelete, onRequestDelete, onFavoriteToggle }: AccountCardProps) {
  const [copied, setCopied] = useState(false)
  const [idCopied, setIdCopied] = useState(false)
  const [isCodeVisible, setIsCodeVisible] = useState(false)
  const { addToast } = useToast()

  const handleCopy = async () => {
    // Automatically reveal code when copying
    if (!isCodeVisible) {
      await toggleCodeVisibility()
    }
    await navigator.clipboard.writeText(account.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    // Show success toast
    addToast({
      variant: "success",
      title: "✓ Code Copied!",
      description: `${account.label} - ${account.code}`,
    })

    // Increment copy count
    try {
      await fetch(`/api/accounts/${account.id}/increment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: "copy" }),
      })
    } catch (error) {
      console.error("Failed to increment copy count:", error)
    }
  }

  const handleDeleteClick = () => {
    if (onRequestDelete) {
      onRequestDelete(account)
    } else if (onDelete) {
      onDelete(account.id)
    }
  }

  const handleCopyId = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(account.id.toString())
    setIdCopied(true)
    setTimeout(() => setIdCopied(false), 2000)
  }

  const toggleCodeVisibility = async () => {
    const newVisibility = !isCodeVisible
    setIsCodeVisible(newVisibility)

    // Log to audit when code is revealed
    if (newVisibility) {
      try {
        await fetch("/api/audit/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action: "totp_viewed",
            resource: `account_${account.id}`,
            details: `Viewed TOTP code for ${account.issuer || ""}:${account.label}`,
          }),
        })

        // Increment view count
        await fetch(`/api/accounts/${account.id}/increment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ type: "view" }),
        })
      } catch (error) {
        console.error("Failed to log TOTP view:", error)
      }
    }
  }

  const progressPercentage = (account.timeRemaining / 30) * 100
  const isUrgent = account.timeRemaining <= 5
  const isWarning = account.timeRemaining <= 10 && account.timeRemaining > 5

  return (
    <Card className="relative overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 border-2 hover:border-primary/30">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardContent className="p-5 sm:p-6 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-center gap-2 mb-2">
              <AccountIcon
                iconIdentifier={account.icon_identifier}
                issuer={account.issuer}
                label={account.label}
                className="w-8 h-8 flex-shrink-0"
              />
              <h3 className="font-bold text-lg break-words bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                {account.label}
              </h3>
            </div>

            {/* Metadata Row - Issuer, Badges, API ID */}
            <div className="flex flex-wrap items-center gap-2">
              {account.issuer && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  {account.issuer}
                </p>
              )}

              {/* Visibility Badge */}
              {account.visibility === "private" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                  <Lock className="w-3 h-3" />
                  Private
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  <Users className="w-3 h-3" />
                  Team
                </span>
              )}

              {/* Favorite Badge */}
              {account.is_favorite && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
                  ⭐ Favorite
                </span>
              )}

              {/* API ID Copy Button */}
              <button
                onClick={handleCopyId}
                className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 hover:bg-muted rounded text-xs flex items-center gap-1"
                title={`Copy API ID for this account`}
              >
                {idCopied ? (
                  <>
                    <Check className="w-3 h-3 text-green-600" />
                    <span className="text-green-600 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground transition-colors" />
                    <span className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                      API ID: {account.id}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <FavoriteButton
              accountId={account.id}
              initialIsFavorite={account.is_favorite || false}
              onToggle={onFavoriteToggle}
            />
            {(onDelete || onRequestDelete) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteClick}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* TOTP Code */}
        <div className="mb-4 relative">
          <div
            className={`relative text-3xl sm:text-4xl font-mono font-bold tracking-wider text-center py-4 sm:py-6 select-all rounded-xl transition-all duration-300 ${
              isUrgent
                ? "bg-destructive/10 text-destructive animate-pulse"
                : isWarning
                ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                : "bg-primary/5 text-primary"
            }`}
          >
            {isCodeVisible ? (
              <>
                <span className="inline-block">{account.code.slice(0, 3)}</span>
                {" "}
                <span className="inline-block">{account.code.slice(3)}</span>
              </>
            ) : (
              <span className="inline-block select-none">••• •••</span>
            )}

            {/* Eye Icon Toggle */}
            <button
              onClick={toggleCodeVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 dark:hover:bg-black/10 transition-colors"
              title={isCodeVisible ? "Hide code" : "Show code"}
            >
              {isCodeVisible ? (
                <EyeOff className="w-5 h-5 opacity-50 hover:opacity-100 transition-opacity" />
              ) : (
                <Eye className="w-5 h-5 opacity-50 hover:opacity-100 transition-opacity" />
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar and Timer */}
        <div className="mb-4 space-y-2">
          <div className="relative h-2 bg-secondary/50 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full transition-all duration-1000 ease-linear relative ${
                isUrgent
                  ? "bg-gradient-to-r from-destructive to-destructive/80"
                  : isWarning
                  ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                  : "bg-gradient-to-r from-primary to-primary/80"
              }`}
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs font-medium">
            <Clock className={`w-3.5 h-3.5 ${isUrgent ? "text-destructive animate-pulse" : isWarning ? "text-yellow-600 dark:text-yellow-500" : "text-muted-foreground"}`} />
            <span className={isUrgent ? "text-destructive" : isWarning ? "text-yellow-600 dark:text-yellow-500" : "text-muted-foreground"}>
              {account.timeRemaining}s remaining
            </span>
          </div>
        </div>

        {/* Copy Button */}
        <Button
          variant={copied ? "default" : "outline"}
          className={`w-full transition-all duration-200 ${
            copied
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "hover:bg-primary hover:text-primary-foreground hover:border-primary"
          }`}
          onClick={handleCopy}
          disabled={copied}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 animate-scale-in" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Code
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
