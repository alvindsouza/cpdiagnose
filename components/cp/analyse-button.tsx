"use client"

import { cn } from "@/lib/utils"
import { Loader2, ArrowRight } from "lucide-react"

interface AnalyseButtonProps {
  isLoading: boolean
  onClick: () => void
  className?: string
}

export function AnalyseButton({ isLoading, onClick, className }: AnalyseButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "relative inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all",
        "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none",
        isLoading && "animate-pulse",
        className
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          <span>Analysing...</span>
        </>
      ) : (
        <>
          <span>Analyse</span>
          <ArrowRight className="size-4" />
        </>
      )}
    </button>
  )
}
