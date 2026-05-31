"use client"

import { cn } from "@/lib/utils"

interface ProblemTagPillProps {
  tag: string
  className?: string
}

export function ProblemTagPill({ tag, className }: ProblemTagPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground lowercase",
        className
      )}
    >
      {tag}
    </span>
  )
}
