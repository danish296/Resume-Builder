export async function signup(data: { email: string; password: string; name?: string }) {
  const res = await fetch("/api/auth/signup", { 
    method: "POST", 
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data) 
  })
  return res.json()
}
export async function verifyEmailTokenUrl(url: string) {
  // for dev you can navigate to the url; this helper is here for completeness
  window.location.href = url
}
export async function login(data: { email: string; password: string }) {
  const res = await fetch("/api/auth/login", { 
    method: "POST", 
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data) 
  })
  return res.json()
}
export async function logout() {
  const res = await fetch("/api/auth/logout", { method: "POST" })
  return res.json()
}
export async function currentUser() {
  const res = await fetch("/api/auth/me")
  return res.json()
}
export async function listResumes() {
  const res = await fetch("/api/resumes")
  return res.json()
}
export async function createResume(payload: { title: string; data: unknown }) {
  const res = await fetch("/api/resumes", { method: "POST", body: JSON.stringify(payload) })
  return res.json()
}
export async function getResume(id: string) {
  const res = await fetch(`/api/resumes/${id}`)
  return res.json()
}
export async function updateResume(id: string, payload: { title: string; data: unknown }) {
  const res = await fetch(`/api/resumes/${id}`, { method: "PUT", body: JSON.stringify(payload) })
  return res.json()
}
export async function deleteResume(id: string) {
  const res = await fetch(`/api/resumes/${id}`, { method: "DELETE" })
  return res.json()
}
