// renders the actual ResumePreview in an always-light, ATS-friendly layout, and auto-opens print when ?print=1.
"use client"

import { useEffect, useState } from "react"
import type { Resume } from "@/lib/types"
import { ResumePreview } from "@/components/editor/preview"

export default function PrintPage({
  params,
  searchParams,
}: { params: { id: string }; searchParams?: Record<string, string> }) {
  const id = params?.id
  const shouldAutoPrint = !!searchParams?.print
  const [resume, setResume] = useState<Resume | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id) return
      // Try server (Neon-backed) first
      try {
        const res = await fetch(`/api/resumes/${id}`, { cache: "no-store" })
        if (res.ok) {
          const json = await res.json()
          const d = json?.resume?.data as Resume | undefined
          if (!cancelled && d) {
            setResume({
              ...d,
              id: json.resume.id,
              name: d.name || json.resume.title || "Untitled Resume",
            })
            return
          }
        }
      } catch {
        // ignore and fallback to local
      }
      // Fallback: localStorage
      try {
        const raw = localStorage.getItem("resumes.v1")
        if (raw) {
          const arr = JSON.parse(raw) as Resume[]
          const found = arr.find((r) => r.id === id) || null
          if (!cancelled) setResume(found)
        }
      } catch {
        if (!cancelled) setResume(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!shouldAutoPrint || !resume) return
    // Wait for fonts/layout to settle
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [shouldAutoPrint, resume])

  return (
    <main className="mx-auto max-w-[794px] bg-white p-6 text-black print:p-0">
      {resume ? (
        <div className="rounded-none border-0 bg-white">
          <ResumePreview resume={resume} />
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Preparing document…</div>
      )}
      <style jsx global>{`
        @page {
          size: A4;
          margin: 12mm;
        }
        @media print {
          html,
          body {
            background: #ffffff !important;
            color: #000 !important;
          }
          #__next,
          main {
            background: #ffffff !important;
          }
        }
      `}</style>
    </main>
  )
}
