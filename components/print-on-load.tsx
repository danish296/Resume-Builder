"use client"

import { useEffect } from "react"

export default function PrintOnLoad({ enabled = true, delay = 300 }: { enabled?: boolean; delay?: number }) {
  useEffect(() => {
    if (!enabled) return
    const t = setTimeout(() => {
      try {
        window.print()
      } catch {
        // ignore
      }
    }, delay)
    return () => clearTimeout(t)
  }, [enabled, delay])

  return null
}
