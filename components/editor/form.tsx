"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, Save, Trash2 } from "lucide-react"
import type { Resume, ResumeSection } from "@/lib/types"
import AISuggestions from "./ai-suggestions"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

type Props = {
  value: Resume
  onChange: (next: Resume) => void
  onSave: () => void
}

function newSection(): ResumeSection {
  return {
    id: crypto.randomUUID(),
    title: "",
    content: "",
  }
}

function WandTextarea({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <div className="text-muted-foreground">
          <AISuggestions sourceText={value} onApply={onChange} />
        </div>
      </div>
      <div className="relative">
        <Textarea
          id={id}
          placeholder=""
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[100px] pr-10"
        />
        <div className="pointer-events-none absolute right-2 top-2 opacity-60">
          {/* decorative placement; actionable button is in the header above */}
          <span className="inline-block rounded bg-muted px-2 py-1 text-[10px]">AI</span>
        </div>
      </div>
    </div>
  )
}

export function ResumeForm({ value, onChange, onSave }: Props) {
  const update = <K extends keyof Resume>(key: K, v: Resume[K]) => {
    onChange({ ...value, [key]: v, updatedAt: Date.now() })
  }

  return (
    <div className="flex flex-col gap-4">
      <Accordion
        type="multiple"
        defaultValue={[
          "personal",
          "summary",
          "experience",
          "education",
          "skills",
          "projects",
          "achievements",
          "languages",
        ]}
      >
        <AccordionItem value="personal">
          <AccordionTrigger>Personal Details</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Jane Doe"
                  value={value.name}
                  onChange={(e) => update("name", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  placeholder="Senior Frontend Engineer"
                  value={value.role}
                  onChange={(e) => update("role", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="you@example.com"
                  value={value.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="(555) 555-5555"
                  value={value.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="linkedin">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  placeholder="https://linkedin.com/in/username"
                  value={value.linkedin}
                  onChange={(e) => update("linkedin", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="site">Portfolio/Website URL</Label>
                <Input
                  id="site"
                  placeholder="https://yoursite.com"
                  value={value.site}
                  onChange={(e) => update("site", e.target.value)}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="summary">
          <AccordionTrigger>Professional Summary</AccordionTrigger>
          <AccordionContent>
            <WandTextarea id="summary" label="Summary" value={value.summary} onChange={(t) => update("summary", t)} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="experience">
          <AccordionTrigger>Work Experience</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              {value.experience.map((sec, idx) => (
                <div key={sec.id} className="rounded-md border p-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <Label htmlFor={`exp-title-${sec.id}`}>Job Title • Company • Location</Label>
                      <Input
                        id={`exp-title-${sec.id}`}
                        placeholder="Senior Engineer • Acme • Remote"
                        value={sec.title}
                        onChange={(e) => {
                          const next = [...value.experience]
                          next[idx] = { ...sec, title: e.target.value }
                          update("experience", next)
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`exp-start-${sec.id}`}>Start Date</Label>
                        <Input
                          id={`exp-start-${sec.id}`}
                          placeholder="Jan 2023"
                          value={sec.startDate}
                          onChange={(e) => {
                            const next = [...value.experience]
                            next[idx] = { ...sec, startDate: e.target.value }
                            update("experience", next)
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`exp-end-${sec.id}`}>End Date</Label>
                        <Input
                          id={`exp-end-${sec.id}`}
                          placeholder="Present"
                          value={sec.endDate}
                          onChange={(e) => {
                            const next = [...value.experience]
                            next[idx] = { ...sec, endDate: e.target.value }
                            update("experience", next)
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-start gap-2">
                    <div className="flex-1">
                      <WandTextarea
                        id={`exp-content-${sec.id}`}
                        label="Description"
                        value={sec.content}
                        onChange={(t) => {
                          const next = [...value.experience]
                          next[idx] = { ...sec, content: t }
                          update("experience", next)
                        }}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="self-start text-red-600"
                      onClick={() =>
                        update(
                          "experience",
                          value.experience.filter((s) => s.id !== sec.id),
                        )
                      }
                      aria-label="Remove experience"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => update("experience", [...value.experience, newSection()])}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Experience
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="education">
          <AccordionTrigger>Education</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              {value.education.map((sec, idx) => (
                <div key={sec.id} className="rounded-md border p-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <Label htmlFor={`edu-title-${sec.id}`}>Degree • Institution • Location</Label>
                      <Input
                        id={`edu-title-${sec.id}`}
                        placeholder="B.S. Computer Science • State University"
                        value={sec.title}
                        onChange={(e) => {
                          const next = [...value.education]
                          next[idx] = { ...sec, title: e.target.value }
                          update("education", next)
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edu-grad-${sec.id}`}>Graduation Date</Label>
                      <Input
                        id={`edu-grad-${sec.id}`}
                        placeholder="May 2022"
                        value={sec.graduationDate}
                        onChange={(e) => {
                          const next = [...value.education]
                          next[idx] = { ...sec, graduationDate: e.target.value }
                          update("education", next)
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <WandTextarea
                      id={`edu-content-${sec.id}`}
                      label="Details"
                      value={sec.content}
                      onChange={(t) => {
                        const next = [...value.education]
                        next[idx] = { ...sec, content: t }
                        update("education", next)
                      }}
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => update("education", [...value.education, newSection()])}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Education
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="skills">
          <AccordionTrigger>Skills</AccordionTrigger>
          <AccordionContent>
            <Label htmlFor="skills">List skills separated by commas</Label>
            <Input
              id="skills"
              placeholder="React, TypeScript, Next.js, Accessibility"
              value={value.skills.join(", ")}
              onChange={(e) => {
                const arr = e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                update("skills", arr)
              }}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="projects">
          <AccordionTrigger>Projects</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              {(value.projects || []).map((sec, idx) => (
                <div key={sec.id} className="rounded-md border p-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <Label htmlFor={`proj-title-${sec.id}`}>Project Title</Label>
                      <Input
                        id={`proj-title-${sec.id}`}
                        placeholder="Timetable Management"
                        value={sec.title}
                        onChange={(e) => {
                          const next = [...(value.projects || [])]
                          next[idx] = { ...sec, title: e.target.value }
                          update("projects", next as any)
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`proj-framework-${sec.id}`}>Framework / Tech</Label>
                      <Input
                        id={`proj-framework-${sec.id}`}
                        placeholder="HTML, CSS, Database"
                        value={sec.framework || ""}
                        onChange={(e) => {
                          const next = [...(value.projects || [])]
                          next[idx] = { ...sec, framework: e.target.value }
                          update("projects", next as any)
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`proj-duration-${sec.id}`}>Duration</Label>
                      <Input
                        id={`proj-duration-${sec.id}`}
                        placeholder="3 months"
                        value={sec.duration || ""}
                        onChange={(e) => {
                          const next = [...(value.projects || [])]
                          next[idx] = { ...sec, duration: e.target.value }
                          update("projects", next as any)
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`proj-link-${sec.id}`}>Link</Label>
                      <Input
                        id={`proj-link-${sec.id}`}
                        placeholder="https://example.com/repo"
                        value={sec.link || ""}
                        onChange={(e) => {
                          const next = [...(value.projects || [])]
                          next[idx] = { ...sec, link: e.target.value }
                          update("projects", next as any)
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-start gap-2">
                    <div className="flex-1">
                      <WandTextarea
                        id={`proj-content-${sec.id}`}
                        label="Description"
                        value={sec.content}
                        onChange={(t) => {
                          const next = [...(value.projects || [])]
                          next[idx] = { ...sec, content: t }
                          update("projects", next as any)
                        }}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="self-start text-red-600"
                      onClick={() => update("projects", (value.projects || []).filter((s) => s.id !== sec.id) as any)}
                      aria-label="Remove project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => update("projects", [...(value.projects || []), newSection()] as any)}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Project
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="achievements">
          <AccordionTrigger>Achievements</AccordionTrigger>
          <AccordionContent>
            <Label htmlFor="achievements">One per line</Label>
            <Textarea
              id="achievements"
              placeholder={"Merit scholarship (2019-2020)\nHackathon finalist (2022)"}
              value={(value.achievements || []).join("\n")}
              onChange={(e) =>
                update(
                  "achievements",
                  e.target.value
                    .split(/\r?\n+/)
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              className="min-h-[100px]"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="languages">
          <AccordionTrigger>Languages</AccordionTrigger>
          <AccordionContent>
            <Label htmlFor="languages">Comma or new line separated</Label>
            <Textarea
              id="languages"
              placeholder={"English\nTelugu\nHindi"}
              value={(value.languages || []).join("\n")}
              onChange={(e) =>
                update(
                  "languages",
                  e.target.value
                    .split(/[\n,]+/)
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              className="min-h-[80px]"
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex items-center justify-end">
        <Button onClick={onSave}>
          <Save className="mr-2 h-4 w-4" /> Save
        </Button>
      </div>
    </div>
  )
}
