export function AccountCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3 animate-pulse">
      {/* Header with icon and favorite button */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Icon skeleton */}
          <div className="w-8 h-8 rounded bg-muted shimmer" />
          {/* Label and issuer skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded shimmer" />
            <div className="h-3 w-24 bg-muted rounded shimmer" />
          </div>
        </div>
        {/* Favorite button skeleton */}
        <div className="w-8 h-8 rounded bg-muted shimmer" />
      </div>

      {/* TOTP code skeleton */}
      <div className="flex items-center justify-center py-4">
        <div className="h-8 w-48 bg-muted rounded shimmer" />
      </div>

      {/* Progress bar skeleton */}
      <div className="h-1 w-full bg-muted rounded shimmer" />
    </div>
  )
}

export function AccountCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <AccountCardSkeleton key={i} />
      ))}
    </div>
  )
}
