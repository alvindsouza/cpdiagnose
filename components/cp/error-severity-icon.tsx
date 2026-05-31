"use client"

import { cn } from "@/lib/utils"

type Severity = "critical" | "warning" | "suggestion"

interface ErrorSeverityIconProps {
  severity: Severity
  className?: string
}

export function ErrorSeverityIcon({ severity, className }: ErrorSeverityIconProps) {
  return (
    <span className={cn("inline-flex items-center justify-center", className)}>
      {severity === "critical" && (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Critical error"
        >
          <circle cx="10" cy="10" r="10" className="fill-severity-critical" />
          <path
            d="M6.5 6.5L13.5 13.5M13.5 6.5L6.5 13.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
      {severity === "warning" && (
        <svg
          width="22"
          height="20"
          viewBox="0 0 22 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Warning"
        >
          <path
            d="M11 0L22 20H0L11 0Z"
            className="fill-severity-warning"
          />
          <path
            d="M11 7V12"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="11" cy="15.5" r="1.25" fill="black" />
        </svg>
      )}
      {severity === "suggestion" && (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Suggestion"
        >
          <circle cx="10" cy="10" r="10" className="fill-severity-suggestion" />
          <path
            d="M10 4C7.79 4 6 5.79 6 8C6 9.5 6.8 10.77 8 11.5V13C8 13.55 8.45 14 9 14H11C11.55 14 12 13.55 12 13V11.5C13.2 10.77 14 9.5 14 8C14 5.79 12.21 4 10 4Z"
            fill="white"
          />
          <rect x="8.5" y="15" width="3" height="1.5" rx="0.75" fill="white" />
        </svg>
      )}
    </span>
  )
}
