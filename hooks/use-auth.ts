"use client"

import { useEffect, useState } from "react"
import { currentUser as apiCurrentUser, login as apiLogin, logout as apiLogout } from "@/lib/client/api"

export type AuthUser = {
  name: string
  email: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const response = await apiCurrentUser()
        if (!cancelled) {
          setUser(response.user || null)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setUser(null)
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loginWithCredentials = async (email: string, password: string) => {
    try {
      const loginResponse = await apiLogin({ email, password })
      if (loginResponse.ok || loginResponse.user) {
        // Fetch the user from /api/auth/me to ensure we have the latest session state
        const userResponse = await apiCurrentUser()
        if (userResponse.user) {
          setUser(userResponse.user)
          return { ok: true }
        }
      }
      return { ok: false, error: loginResponse.error || "Login failed" }
    } catch (error) {
      return { ok: false, error: "Network error" }
    }
  }

  const logout = async () => {
    try {
      await apiLogout()
    } catch {
      // Continue logout even if API call fails
    }
    setUser(null)
  }

  return { user, loginWithCredentials, logout, loading }
}
