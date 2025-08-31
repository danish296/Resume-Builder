// Parent component that ties everything together
"use client"

import { useState } from 'react'
import { ResumeCard } from './ResumeCard'
import { ResumePreview } from './ResumePreview'
import { generateAndDownloadPdf, generatePdfFilename } from './pdf-generator'
import type { Resume } from '@/lib/types'

type Props = {
  resumes: Resume[]
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

export function ResumeDashboard({ resumes, onDelete, onDuplicate }: Props) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null)

  const handleDownload = async (resumeId: string) => {
    const resume = resumes.find(r => r.id === resumeId)
    if (!resume) {
      console.error('Resume not found')
      return
    }

    setIsGeneratingPdf(resumeId)

    try {
      // Create a temporary container for the resume
      const tempContainer = document.createElement('div')
      tempContainer.id = `temp-resume-${resumeId}`
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.top = '0'
      tempContainer.style.width = '800px' // Fixed width for consistent PDF
      tempContainer.style.backgroundColor = 'white'
      
      document.body.appendChild(tempContainer)

      // Render the resume using React (you'll need to use ReactDOM.render or similar)
      // For now, let's assume you have a way to get the resume element
      // This is a simplified approach - you might need to use ReactDOMServer
      
      // Alternative: Find existing preview element
      const existingPreview = document.querySelector(`[data-resume-id="${resumeId}"]`) as HTMLElement
      
      let targetElement: HTMLElement
      
      if (existingPreview) {
        // Clone the existing preview
        targetElement = existingPreview.cloneNode(true) as HTMLElement
        tempContainer.appendChild(targetElement)
      } else {
        // Create the resume HTML manually (fallback)
        tempContainer.innerHTML = generateResumeHTML(resume)
        targetElement = tempContainer
      }

      // Generate PDF
      const filename = generatePdfFilename(resume.name, resume.role)
      const result = await generateAndDownloadPdf({
        element: targetElement,
        filename,
        quality: 1,
        scale: 2
      })

      // Clean up
      document.body.removeChild(tempContainer)

      if (result.success) {
        console.log('PDF generated successfully:', result.filename)
      } else {
        console.error('PDF generation failed:', result.error)
        // You might want to show a toast notification here
      }

    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsGeneratingPdf(null)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {resumes.map((resume) => (
        <div key={resume.id}>
          <ResumeCard
            resume={resume}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onDownload={handleDownload}
          />
          
          {/* Hidden preview for PDF generation */}
          <div 
            data-resume-id={resume.id}
            className="sr-only" // Screen reader only, visually hidden
          >
            <ResumePreview resume={resume} />
          </div>
        </div>
      ))}
      
      {/* Loading indicator */}
      {isGeneratingPdf && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <p>Generating PDF...</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Fallback function to generate resume HTML if React rendering isn't available
function generateResumeHTML(resume: Resume): string {
  const contacts = [resume.email, resume.phone, resume.linkedin, resume.site].filter(Boolean)
  
  return `
    <article class="mx-auto w-full max-w-xl rounded-lg border bg-white p-6 text-black shadow-sm">
      <header class="mb-4">
        <h1 class="font-sans text-2xl font-bold leading-tight text-black">${resume.name || "Your Name"}</h1>
        <p class="text-sm text-black/80">${resume.role || "Your Role"}</p>
        ${contacts.length > 0 ? `<p class="mt-1 text-xs text-black/70">${contacts.join(" • ")}</p>` : ''}
      </header>

      ${resume.summary ? `
        <section class="mb-4">
          <h2 class="mb-1 border-b pb-1 text-sm font-semibold tracking-wide text-black">Professional Summary</h2>
          <p class="text-sm leading-relaxed text-black/90">${resume.summary}</p>
        </section>
      ` : ''}

      ${resume.experience?.length ? `
        <section class="mb-4">
          <h2 class="mb-1 border-b pb-1 text-sm font-semibold tracking-wide text-black">Work Experience</h2>
          <ul class="space-y-3">
            ${resume.experience.map(e => `
              <li>
                <p class="text-sm font-medium text-black">${e.title}</p>
                ${(e.startDate || e.endDate) ? `
                  <p class="text-xs text-black/70">
                    ${e.startDate || ""}${(e.startDate || e.endDate) ? " – " : ""}${e.endDate || ""}
                  </p>
                ` : ''}
                <div class="mt-1">
                  <p class="text-sm leading-relaxed text-black/90">${e.content || ''}</p>
                </div>
              </li>
            `).join('')}
          </ul>
        </section>
      ` : ''}

      ${resume.skills?.length ? `
        <section>
          <h2 class="mb-1 border-b pb-1 text-sm font-semibold tracking-wide text-black">Skills</h2>
          <p class="text-sm text-black/90">${resume.skills.join(", ")}</p>
        </section>
      ` : ''}
    </article>
  `
}

// Enhanced ResumeCard with download state
export function EnhancedResumeCard({ 
  resume, 
  onDelete, 
  onDownload, 
  onDuplicate,
  isDownloading = false 
}: Props & { isDownloading?: boolean }) {
  return (
    <Card className="group flex h-full flex-col border-border/80 transition-shadow hover:shadow-sm">
      <CardHeader className="space-y-0">
        <CardTitle className="text-base">{resume.name || "Untitled Resume"}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <div className="truncate">{resume.role || "—"}</div>
      </CardContent>
      <CardFooter className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
        <span>Last updated: {format(new Date(resume.updatedAt), "MMM d, yyyy")}</span>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Duplicate"
            className="hover:text-foreground"
            onClick={() => onDuplicate(resume.id)}
            disabled={isDownloading}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Edit"
            className="hover:text-foreground"
            onClick={() => router.push(`/editor?id=${resume.id}`)}
            disabled={isDownloading}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Download"
            className="hover:text-foreground"
            onClick={() => onDownload(resume.id)}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Delete"
            className="text-red-600 hover:text-red-600"
            onClick={() => onDelete(resume.id)}
            disabled={isDownloading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}