"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AnalyseButton } from "./analyse-button"
import { Eye, EyeOff } from "lucide-react"

interface LoginFormProps {
  onSubmit: (username: string, password: string) => void
  isLoading?: boolean
  disabled?: boolean
}

export function LoginForm({ onSubmit, isLoading = false, disabled = false }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(username, password)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-sm font-medium text-foreground">
          Codeforces username
        </Label>
        <Input
          id="username"
          type="text"
          placeholder="tourist"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={disabled}
          className="h-11 bg-input border-border focus:border-ring"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={disabled}
            className="h-11 bg-input border-border focus:border-ring pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      <AnalyseButton
        isLoading={isLoading}
        onClick={() => {}}
      />
    </form>
  )
}
