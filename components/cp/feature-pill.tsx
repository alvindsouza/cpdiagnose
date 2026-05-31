"use client"

import { cn } from "@/lib/utils"

interface FeaturePillProps {
  children: React.ReactNode
  className?: string
}

export function FeaturePill({ children, className }: FeaturePillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  )
}
