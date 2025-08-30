"use client"

import type { Resume } from "@/lib/types"

type Props = {
  resume: Resume
}

function toBullets(text?: string) {
  if (!text) return null
  const parts = text
    .split(/\r?\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length <= 1) {
    return <p className="text-sm leading-relaxed text-black/90 whitespace-pre-wrap">{text}</p>
  }
  return (
    <ul className="list-disc pl-5 text-sm leading-relaxed text-black/90">
      {parts.map((line, i) => (
        <li key={i} className="mb-1">
          {line.replace(/^[-•]\s*/, "")}
        </li>
      ))}
    </ul>
  )
}

function toList(items?: string[]) {
  if (!items || items.length === 0) return null
  return (
    <ul className="list-disc pl-5 text-sm leading-relaxed text-black/90">
      {items.map((line, i) => (
        <li key={i} className="mb-1">
          {line}
        </li>
      ))}
    </ul>
  )
}

export function ResumePreview({ resume }: Props) {
  const contacts = [resume.email, resume.phone, resume.linkedin, resume.site].filter(Boolean)

  return (
    <article
      aria-label="Resume preview"
      className="mx-auto w-full max-w-xl rounded-lg border bg-white p-6 text-black shadow-sm"
    >
      <header className="mb-4">
        <h1 className="font-sans text-2xl font-bold leading-tight text-black">{resume.name || "Your Name"}</h1>
        <p className="text-sm text-black/80">{resume.role || "Your Role"}</p>
        {contacts.length > 0 && <p className="mt-1 text-xs text-black/70">{contacts.join(" • ")}</p>}
      </header>

      {resume.summary && (
        <section className="mb-4">
          <h2 className="mb-1 border-b pb-1 text-sm font-semibold tracking-wide text-black">Professional Summary</h2>
          {toBullets(resume.summary)}
        </section>
      )}

      {resume.experience?.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-1 border-b pb-1 text-sm font-semibold tracking-wide text-black">Work Experience</h2>
          <ul className="space-y-3">
            {resume.experience.map((e) => (
              <li key={e.id}>
                <p className="text-sm font-medium text-black">{e.title}</p>
                {(e.startDate || e.endDate) && (
                  <p className="text-xs text-black/70">
                    {e.startDate || ""}
                    {e.startDate || e.endDate ? " – " : ""}
                    {e.endDate || ""}
                  </p>
                )}
                <div className="mt-1">{toBullets(e.content)}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {resume.education?.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-1 border-b pb-1 text-sm font-semibold tracking-wide text-black">Education</h2>
          <ul className="space-y-3">
            {resume.education.map((e) => (
              <li key={e.id}>
                <p className="text-sm font-medium text-black">{e.title}</p>
                {e.graduationDate && <p className="text-xs text-black/70">{e.graduationDate}</p>}
                <div className="mt-1">{toBullets(e.content)}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {resume.projects && resume.projects.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-1 border-b pb-1 text-sm font-semibold tracking-wide text-black">Projects</h2>
          <ul className="space-y-3">
            {resume.projects.map((p) => (
              <li key={p.id}>
                <p className="text-sm font-medium text-black">
                  {p.title}
                  {p.framework ? ` • ${p.framework}` : ""}
                  {p.duration ? ` • ${p.duration}` : ""}
                </p>
                {p.link && <p className="text-xs text-black/70 break-all">{p.link}</p>}
                <div className="mt-1">{toBullets(p.content)}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {resume.skills?.length > 0 && (
        <section>
          <h2 className="mb-1 border-b pb-1 text-sm font-semibold tracking-wide text-black">Skills</h2>
          <p className="text-sm text-black/90">{resume.skills.join(", ")}</p>
        </section>
      )}

      {resume.achievements && resume.achievements.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-1 border-b pb-1 text-sm font-semibold tracking-wide text-black">Achievements</h2>
          {toList(resume.achievements)}
        </section>
      )}

      {resume.languages && resume.languages.length > 0 && (
        <section>
          <h2 className="mb-1 border-b pb-1 text-sm font-semibold tracking-wide text-black">Languages</h2>
          {toList(resume.languages)}
        </section>
      )}
    </article>
  )
}
