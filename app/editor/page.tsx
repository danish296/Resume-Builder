"use client"
import { useEffect, useRef, useState } from "react"
import { Nav } from "@/components/nav"
import type { Resume } from "@/lib/types"
import { ResumeForm } from "@/components/editor/form"
import { ResumePreview } from "@/components/editor/preview"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  getResume as apiGetResume,
  createResume as apiCreateResume,
  updateResume as apiUpdateResume,
} from "@/lib/client/api"
import { 
  generateAndDownloadPdf, 
  generatePdfFilename, 
  fallbackToPrint 
} from "@/lib/pdf-generator"

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
  const [isDownloading, setIsDownloading] = useState(false)
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
    if (!resume || !previewRef.current || isDownloading) return
    
    setIsDownloading(true)
    
    try {
      // Save first to ensure data is persisted
      await onSave()
      
      // Show loading toast
      toast.loading("Generating PDF...", { id: "pdf-generation" })
      
      // Generate meaningful filename
      const filename = generatePdfFilename(resume.name)
      
      // Find the preview element within the ref - try multiple strategies
      let previewElement: HTMLElement | null = null
      
      // Strategy 1: Look for article with aria-label
      previewElement = previewRef.current.querySelector('article[aria-label="Resume preview"]') as HTMLElement
      
      // Strategy 2: Look for any article element
      if (!previewElement) {
        previewElement = previewRef.current.querySelector('article') as HTMLElement
      }
      
      // Strategy 3: Look for any element with specific classes that contain resume content
      if (!previewElement) {
        previewElement = previewRef.current.querySelector('[class*="resume"], [class*="preview"]') as HTMLElement
      }
      
      // Strategy 4: Use the first child element if nothing else works
      if (!previewElement && previewRef.current.children.length > 0) {
        previewElement = previewRef.current.children[0] as HTMLElement
      }
      
      // Strategy 5: Use the ref element itself as last resort
      if (!previewElement) {
        previewElement = previewRef.current
      }
      
      console.log('Selected preview element:', previewElement)
      console.log('Element dimensions:', previewElement?.getBoundingClientRect())
      
      if (!previewElement) {
        throw new Error("Could not find any preview element to convert to PDF")
      }
      
      // Verify element has content
      const rect = previewElement.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        throw new Error(`Preview element has no visible content (${rect.width}x${rect.height})`)
      }
      
      // Generate and download PDF
      const result = await generateAndDownloadPdf({
        element: previewElement,
        filename,
        quality: 0.95,
        scale: 2
      })
      
      if (result.success) {
        toast.success(`PDF downloaded successfully as ${result.filename}`, { 
          id: "pdf-generation" 
        })
      } else {
        throw new Error(result.error || "PDF generation failed")
      }
      
    } catch (error) {
      console.error("PDF download failed:", error)
      
      // For debugging - show the actual error message
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error(`PDF generation failed: ${errorMessage}. Opening print dialog as fallback.`, { 
        id: "pdf-generation",
        duration: 5000
      })
      
      // Small delay before fallback to let user see the error
      setTimeout(() => {
        const idForPrint = idParam || resume.id
        const url = `/print/${encodeURIComponent(idForPrint)}?print=1`
        fallbackToPrint(url)
      }, 2000)
    } finally {
      setIsDownloading(false)
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
            <Button onClick={onDownloadPDF} disabled={isDownloading}>
              {isDownloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isDownloading ? "Generating PDF..." : "Download as PDF"}
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
