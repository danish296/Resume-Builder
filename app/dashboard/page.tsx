"use client"
import { useEffect, useState } from "react"
import { Nav } from "@/components/nav"
import { Button } from "@/components/ui/button"
import type { Resume } from "@/lib/types"
import { ResumeCard } from "@/components/resume-card"
import { ResumePreview } from "@/components/resume-preview"
import { generateAndDownloadPdf, generatePdfFilename } from "@/lib/pdf-generator"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import {
  listResumes,
  createResume as apiCreateResume,
  deleteResume as apiDeleteResume,
  getResume as apiGetResume,
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

function createLocalResume(): Resume {
  return {
    id: crypto.randomUUID(),
    name: "Software Engineer Resume",
    role: "",
    summary: "",
    experience: [],
    education: [],
    projects: [],
    achievements: [],
    languages: [],
    skills: [],
    updatedAt: Date.now(),
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await listResumes()
        if (!cancelled && Array.isArray(res?.resumes)) {
          // rows: { id, title, data }
          const mapped = res.resumes.map((row: any) => {
            const d = row.data || {}
            return {
              ...(d as Resume),
              id: row.id,
              name: d.name || row.title || "Untitled Resume",
              updatedAt: Date.now(),
            } as Resume
          })
          setResumes(mapped)
          setLoading(false)
          return
        }
      } catch {
        // fall through to local
      }
      if (!cancelled) {
        const local = loadResumesLocal()
        setResumes(local)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const onCreate = async () => {
    const local = createLocalResume()
    try {
      const created = await apiCreateResume({ title: local.name, data: local })
      const id = created?.resume?.id
      if (id) {
        router.push(`/editor?id=${id}`)
        return
      }
    } catch {}
    // Fallback local
    const next = [local, ...resumes]
    setResumes(next)
    saveResumesLocal(next)
    router.push(`/editor?id=${local.id}`)
  }

  const onDuplicate = async (id: string) => {
    // Try server duplicate
    try {
      const srcRes = await apiGetResume(id)
      const src = srcRes?.resume
      if (src?.id && src?.data) {
        const dupData: Resume = {
          ...(src.data as Resume),
          id: crypto.randomUUID(),
          name: `${(src.data?.name as string) || src.title || "Resume"} (Copy)`,
          updatedAt: Date.now(),
        }
        await apiCreateResume({ title: dupData.name, data: dupData })
        // refresh list
        const refreshed = await listResumes()
        if (Array.isArray(refreshed?.resumes)) {
          const mapped = refreshed.resumes.map((row: any) => ({
            ...(row.data as Resume),
            id: row.id,
            name: row.data?.name || row.title || "Untitled Resume",
            updatedAt: Date.now(),
          }))
          setResumes(mapped)
          return
        }
      }
    } catch {}
    // Fallback local
    const src = resumes.find((r) => r.id === id)
    if (!src) return
    const dup: Resume = {
      ...src,
      id: crypto.randomUUID(),
      name: `${src.name} (Copy)`,
      updatedAt: Date.now(),
    }
    const next = [dup, ...resumes]
    setResumes(next)
    saveResumesLocal(next)
  }

  const onDelete = async (id: string) => {
    try {
      await apiDeleteResume(id)
      const refreshed = await listResumes()
      if (Array.isArray(refreshed?.resumes)) {
        const mapped = refreshed.resumes.map((row: any) => ({
          ...(row.data as Resume),
          id: row.id,
          name: row.data?.name || row.title || "Untitled Resume",
          updatedAt: Date.now(),
        }))
        setResumes(mapped)
        return
      }
    } catch {}
    // Fallback local
    const next = resumes.filter((r) => r.id !== id)
    setResumes(next)
    saveResumesLocal(next)
  }

  const onDownload = async (id: string) => {
    const resume = resumes.find(r => r.id === id)
    if (!resume) {
      console.error('Resume not found')
      return
    }

    setIsGeneratingPdf(id)

    try {
      // Wait for fonts to load
      await document.fonts.ready

      // Find the hidden preview element
      const previewElement = document.querySelector(`[data-resume-id="${id}"]`) as HTMLElement
      
      if (previewElement) {
        const filename = generatePdfFilename(resume.name, resume.role)
        const result = await generateAndDownloadPdf({
          element: previewElement,
          filename,
          quality: 1,
          scale: 2
        })

        if (result.success) {
          console.log('PDF generated successfully:', result.filename)
        } else {
          console.error('PDF generation failed:', result.error)
          // Fallback to print route
          window.open(`/print/${id}?print=1`, "_blank")
        }
      } else {
        console.error('Preview element not found, using fallback')
        // Fallback to your existing print route
        window.open(`/print/${id}?print=1`, "_blank")
      }

    } catch (error) {
      console.error('Download failed:', error)
      // Fallback to your existing print route
      window.open(`/print/${id}?print=1`, "_blank")
    } finally {
      setIsGeneratingPdf(null)
    }
  }

  return (
    <main>
      <Nav
        userName={user?.name}
        onLogout={() => {
          logout()
          router.push("/")
        }}
      />
      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-balance text-2xl font-bold">
            {user?.name ? `Welcome back, ${user.name}!` : "Welcome back!"}
          </h1>
          <Button onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" /> Create New Resume
          </Button>
        </div>
        <h2 className="mb-3 text-sm font-semibold">My Resumes</h2>
        {loading ? (
          <div className="rounded-md border p-6 text-center text-muted-foreground">Loading...</div>
        ) : resumes.length === 0 ? (
          <div className="rounded-md border p-6 text-center text-muted-foreground">
            No resumes yet. Create your first one.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resumes.map((r) => (
                <div key={r.id}>
                  <ResumeCard 
                    resume={r} 
                    onDuplicate={onDuplicate} 
                    onDelete={onDelete} 
                    onDownload={onDownload} 
                  />
                  
                  {/* Hidden preview for PDF generation */}
                  <div 
                    data-resume-id={r.id}
                    className="fixed -left-[9999px] top-0 w-[800px] bg-white pointer-events-none"
                    style={{ visibility: 'hidden' }}
                  >
                    <ResumePreview resume={r} />
                  </div>
                </div>
              ))}
            </div>

            {/* Loading overlay for PDF generation */}
            {isGeneratingPdf && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 flex items-center gap-3 shadow-lg">
                  <div className="w-6 h-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  <p className="text-sm font-medium">Generating PDF...</p>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}