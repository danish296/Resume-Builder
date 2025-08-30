"use client"
import { useEffect, useState } from "react"
import { Nav } from "@/components/nav"
import { Button } from "@/components/ui/button"
import type { Resume } from "@/lib/types"
import { ResumeCard } from "@/components/resume-card"
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

  const onDownload = (id: string) => {
    // Use print route for PDF instead of JSON
    window.open(`/print/${id}?print=1`, "_blank")
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map((r) => (
              <ResumeCard key={r.id} resume={r} onDuplicate={onDuplicate} onDelete={onDelete} onDownload={onDownload} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
