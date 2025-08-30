"use client"
import { useEffect, useRef, useState } from "react"
import { Nav } from "@/components/nav"
import type { Resume } from "@/lib/types"
import { ResumeForm } from "@/components/editor/form"
import { ResumePreview } from "@/components/editor/preview"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  getResume as apiGetResume,
  createResume as apiCreateResume,
  updateResume as apiUpdateResume,
} from "@/lib/client/api"

const STORAGE_KEY = "resumes.v1"

function loadResumesLocal(): Resume[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Resume[]) : []
  } catch {
    return []
  }
}
function saveResumesLocal(resumes: Resume[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(resumes))
}

function fromSharedData(param: string | null): Resume | null {
  if (!param) return null
  try {
    const json = decodeURIComponent(escape(atob(decodeURIComponent(param))))
    return JSON.parse(json) as Resume
  } catch {
    return null
  }
}

export default function EditorPage() {
  const router = useRouter()
  const params = useSearchParams()
  const idParam = params.get("id")
  const dataParam = params.get("data")
  const [resumesLocal, setResumesLocal] = useState<Resume[]>([])
  const [resume, setResume] = useState<Resume | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setResumesLocal(loadResumesLocal())
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const shared = fromSharedData(dataParam)
      if (shared) {
        if (!cancelled) setResume({ ...shared, id: shared.id || crypto.randomUUID(), updatedAt: Date.now() })
        return
      }
      if (idParam) {
        // Try server
        try {
          const res = await apiGetResume(idParam)
          const row = res?.resume
          if (row?.id) {
            const d = (row.data || {}) as Resume
            if (!cancelled) {
              setResume({
                ...(d as Resume),
                id: row.id,
                name: d.name || row.title || "Untitled Resume",
                updatedAt: Date.now(),
              })
            }
            return
          }
        } catch {
          // fall back to local
        }
        // Local fallback
        const found = loadResumesLocal().find((r) => r.id === idParam) || null
        if (!cancelled) setResume(found)
        return
      }
      // New resume (unsaved)
      if (!cancelled) {
        setResume({
          id: crypto.randomUUID(),
          name: "My Resume",
          role: "",
          summary: "",
          experience: [],
          education: [],
          projects: [],
          achievements: [],
          languages: [],
          skills: [],
          updatedAt: Date.now(),
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [idParam, dataParam])

  const onChange = (next: Resume) => setResume(next)

  const onSave = async () => {
    if (!resume) return
    try {
      if (idParam) {
        await apiUpdateResume(idParam, { title: resume.name || "Untitled Resume", data: resume })
      } else {
        const created = await apiCreateResume({ title: resume.name || "Untitled Resume", data: resume })
        const newId = created?.resume?.id
        if (newId) {
          // Move URL to server ID so future saves/prints work
          router.replace(`/editor?id=${newId}`)
        }
      }
      return
    } catch {
      // Fallback local
      const idx = resumesLocal.findIndex((r) => r.id === resume.id)
      const next = [...resumesLocal]
      if (idx === -1) next.unshift(resume)
      else next[idx] = resume
      setResumesLocal(next)
      saveResumesLocal(next)
    }
  }

  const onDownloadPDF = async () => {
    if (!resume) return
    try {
      await onSave()
    } catch {}
    const idForPrint = idParam || resume.id
    const url = `/print/${encodeURIComponent(idForPrint)}?print=1`
    const win = window.open(url, "_blank", "noopener,noreferrer")
    if (!win) {
      // Popup blocked: fallback to same tab
      window.location.href = url
    }
  }

  if (!resume) {
    return (
      <main>
        <Nav />
        <div className="mx-auto max-w-5xl px-4 py-8">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <Nav />
      <section className="mx-auto max-w-6xl gap-6 px-4 py-6">
        <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Input
              className="sm:ml-2"
              value={resume.name}
              onChange={(e) => onChange({ ...resume, name: e.target.value, updatedAt: Date.now() })}
              aria-label="Resume Title"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onSave}>
              Save
            </Button>
            <Button onClick={onDownloadPDF}>
              <Download className="mr-2 h-4 w-4" /> Download as PDF
            </Button>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          <div className="flex flex-col gap-4">
            <ResumeForm value={resume} onChange={onChange} onSave={onSave} />
          </div>

          <div className="mt-6 lg:mt-0">
            <div className="rounded-lg border bg-white p-4">
              <div ref={previewRef}>
                <ResumePreview resume={resume} />
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Preview is always in light mode for ATS readability.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
