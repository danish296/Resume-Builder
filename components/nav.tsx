"use client"
import Link from "next/link"
import { ModeToggle } from "./mode-toggle"
import { Button } from "@/components/ui/button"

export function Nav({
  showDashboardLink = true,
  userName,
  onLogout,
}: {
  showDashboardLink?: boolean
  userName?: string
  onLogout?: () => void
}) {
  return (
    <header className="w-full border-b bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-semibold tracking-tight text-foreground">ResumeCraft</span>
          <span className="sr-only">Home</span>
        </Link>
        <nav className="flex items-center gap-3">
          {userName && <span className="text-sm text-muted-foreground">Hi, {userName}</span>}
          {showDashboardLink && (
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
          )}
          <ModeToggle />
          {onLogout && (
            <Button variant="outline" size="sm" onClick={onLogout} aria-label="Logout">
              Logout
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
