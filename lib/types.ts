export type ResumeSection = {
  id: string
  title: string
  content: string
  // Optional fields to support the editor form
  startDate?: string
  endDate?: string
  graduationDate?: string
  // Project-related optional fields
  framework?: string
  link?: string
  duration?: string
}

export type Resume = {
  id: string
  name: string
  role: string
  summary: string
  // Contact details
  email?: string
  phone?: string
  linkedin?: string
  site?: string

  experience: ResumeSection[]
  education: ResumeSection[]
  // New ATS-friendly sections
  projects?: ResumeSection[]
  achievements?: string[]
  languages?: string[]
  skills: string[]
  updatedAt: number
}
