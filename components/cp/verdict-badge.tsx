"use client"

import { cn } from "@/lib/utils"

type VerdictType =
  | "OK"
  | "WRONG_ANSWER"
  | "TIME_LIMIT_EXCEEDED"
  | "RUNTIME_ERROR"
  | "COMPILATION_ERROR"

interface VerdictBadgeProps {
  verdict: VerdictType | string
  className?: string
}

const verdictConfig: Record<string, { label: string; className: string }> = {
  OK: {
    label: "Accepted",
    className: "bg-verdict-accepted text-white",
  },
  WRONG_ANSWER: {
    label: "Wrong Answer",
    className: "bg-verdict-wrong text-white",
  },
  TIME_LIMIT_EXCEEDED: {
    label: "TLE",
    className: "bg-verdict-tle text-black",
  },
  RUNTIME_ERROR: {
    label: "Runtime Error",
    className: "bg-verdict-runtime text-black",
  },
  COMPILATION_ERROR: {
    label: "Compile Error",
    className: "bg-verdict-compile text-white",
  },
}

export function VerdictBadge({ verdict, className }: VerdictBadgeProps) {
  const config = verdictConfig[verdict] ?? {
    label: verdict,
    className: "bg-muted text-muted-foreground",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold tracking-tight",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
