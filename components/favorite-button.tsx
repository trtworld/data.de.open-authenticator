"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { useToast } from "@/components/ui/toast"

interface FavoriteButtonProps {
  accountId: number
  initialIsFavorite: boolean
  onToggle?: (isFavorite: boolean) => void
}

export function FavoriteButton({ accountId, initialIsFavorite, onToggle }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isLoading, setIsLoading] = useState(false)
  const { addToast } = useToast()

  const toggleFavorite = async () => {
    if (isLoading) return

    // Optimistic update
    const previousState = isFavorite
    setIsFavorite(!isFavorite)
    setIsLoading(true)

    try {
      const method = isFavorite ? "DELETE" : "POST"
      const response = await fetch(`/api/accounts/${accountId}/favorite`, {
        method,
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to update favorite")
      }

      const data = await response.json()
      onToggle?.(data.is_favorite)

      addToast({
        variant: "success",
        title: data.is_favorite ? "⭐ Added to favorites" : "Removed from favorites",
      })
    } catch (error) {
      // Revert optimistic update on error
      setIsFavorite(previousState)
      addToast({
        variant: "error",
        title: "Failed to update favorite",
      })
      console.error("Favorite toggle error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading}
      className="p-1 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Star
        className={`w-5 h-5 transition-all ${
          isFavorite
            ? "fill-yellow-400 text-yellow-400"
            : "text-muted-foreground hover:text-yellow-400"
        }`}
      />
    </button>
  )
}
