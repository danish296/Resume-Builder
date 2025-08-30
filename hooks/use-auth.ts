"use client"

import { useEffect, useState } from "react"
// import { currentUser as apiCurrentUser, login as apiLogin, logout as apiLogout } from "@/lib/client/api"

export type AuthUser = {
  name: string
  email: string
}

const KEY = "auth.user.v1"

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const raw = localStorage.getItem(KEY)
        if (!cancelled) setUser(raw ? (JSON.parse(raw) as AuthUser) : null)
      } catch {
        if (!cancelled) setUser(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Legacy/local login (guest mode)
  const login = (u: AuthUser) => {
    localStorage.setItem(KEY, JSON.stringify(u))
    setUser(u)
  }

  const loginWithCredentials = async (email: string, _password: string) => {
    const name = email?.split?.("@")?.[0] || "Guest"
    const mapped = { name, email }
    localStorage.setItem(KEY, JSON.stringify(mapped))
    setUser(mapped)
    return { ok: true }
  }

  const logout = async () => {
    localStorage.removeItem(KEY)
    setUser(null)
  }

  return { user, login, loginWithCredentials, logout }
}
