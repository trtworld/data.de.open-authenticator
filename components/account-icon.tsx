"use client"

import * as simpleIcons from "simple-icons"
import { Shield } from "lucide-react"

interface AccountIconProps {
  iconIdentifier?: string | null
  issuer?: string
  label: string
  className?: string
}

export function AccountIcon({ iconIdentifier, issuer, label, className = "w-8 h-8" }: AccountIconProps) {
  // Try to get icon from simple-icons
  if (iconIdentifier) {
    try {
      // simple-icons uses 'si' prefix: siGithub, siGoogle, etc.
      const iconKey = `si${iconIdentifier.charAt(0).toUpperCase()}${iconIdentifier.slice(1)}` as keyof typeof simpleIcons
      const icon = simpleIcons[iconKey]

      if (icon) {
        return (
          <div
            className={className}
            dangerouslySetInnerHTML={{ __html: icon.svg }}
            style={{ color: `#${icon.hex}` }}
            title={icon.title}
          />
        )
      }
    } catch (error) {
      // Icon not found, fall through to next strategy
    }
  }

  // Fallback 2: Generic shield icon for security services
  const displayName = issuer || label
  if (displayName) {
    return (
      <div className={`${className} flex items-center justify-center rounded bg-muted`}>
        <Shield className="w-5 h-5 text-muted-foreground" />
      </div>
    )
  }

  // Fallback 3: Text initials
  const initials = label
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={`${className} flex items-center justify-center rounded bg-primary/10 text-primary font-semibold text-sm`}>
      {initials}
    </div>
  )
}
