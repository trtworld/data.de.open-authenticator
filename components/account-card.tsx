"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Account } from "@/types"
import { Copy, Trash2, Check, Clock } from "lucide-react"

interface AccountCardProps {
  account: Account
  onDelete?: (id: number) => void
}

export function AccountCard({ account, onDelete }: AccountCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(account.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
            <h3 className="font-bold text-lg truncate bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              {account.label}
            </h3>
            {account.issuer && (
              <p className="text-sm text-muted-foreground truncate mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                {account.issuer}
              </p>
            )}
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(account.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* TOTP Code */}
        <div className="mb-4 relative">
          <div
            className={`text-3xl sm:text-4xl font-mono font-bold tracking-wider text-center py-4 sm:py-6 select-all rounded-xl transition-all duration-300 ${
              isUrgent
                ? "bg-destructive/10 text-destructive animate-pulse"
                : isWarning
                ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                : "bg-primary/5 text-primary"
            }`}
          >
            <span className="inline-block">{account.code.slice(0, 3)}</span>
            {" "}
            <span className="inline-block">{account.code.slice(3)}</span>
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
