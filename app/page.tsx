"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/hooks/use-auth"
import { signup as apiSignup } from "@/lib/client/api"
import { useRef, useState } from "react"

function checkPasswordStrength(password: string): { score: number; feedback: string } {
  if (password.length < 8) return { score: 0, feedback: "Password must be at least 8 characters" }
  
  let score = 0
  const feedback: string[] = []
  
  if (password.length >= 8) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  
  if (score < 3) feedback.push("Add uppercase, lowercase, numbers or symbols")
  
  const messages = {
    1: "Very weak",
    2: "Weak", 
    3: "Fair",
    4: "Good",
    5: "Strong"
  }
  
  return { 
    score, 
    feedback: score > 0 ? messages[score as keyof typeof messages] : "Too short" 
  }
}

export default function Page() {
  const router = useRouter()
  const { loginWithCredentials, loading } = useAuth()
  const [tab, setTab] = useState<"login" | "signup">("login")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: "" })
  const authRef = useRef<HTMLDivElement | null>(null)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")
    setIsSubmitting(true)
    
    const data = new FormData(e.currentTarget)
    const email = String(data.get("email") || "")
    const password = String(data.get("password") || "")
    
    if (!email || !password) {
      setError("Please fill in all fields")
      setIsSubmitting(false)
      return
    }

    try {
      const result = await loginWithCredentials(email, password)
      if (result.ok) {
        router.push("/dashboard")
      } else {
        setError(result.error || "Login failed")
      }
    } catch {
      setError("Network error occurred")
    }
    setIsSubmitting(false)
  }

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)
    
    const data = new FormData(e.currentTarget)
    const name = String(data.get("name") || "")
    const email = String(data.get("email") || "")
    const password = String(data.get("password") || "")
    
    if (!name || !email || !password) {
      setError("Please fill in all fields")
      setIsSubmitting(false)
      return
    }

    // Basic password validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsSubmitting(false)
      return
    }

    try {
      const signupResult = await apiSignup({ name, email, password })
      if (signupResult.ok) {
        // Show success message and ask user to verify email
        setError("")
        setSuccessMessage("Account created successfully! Please check your email to verify your account before logging in.")
        // Reset form and show success state
        e.currentTarget.reset()
        setTab("login")
      } else {
        setError(signupResult.error || "Signup failed")
      }
    } catch {
      setError("Network error occurred")
    }
    setIsSubmitting(false)
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="font-sans text-sm font-semibold tracking-tight">ResumeBuilder</div>
          <ModeToggle />
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100svh-56px)] max-w-3xl grid-cols-1 items-center gap-8 px-4 py-10 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h1 className="text-pretty font-sans text-3xl font-bold leading-tight md:text-4xl">
            Create a modern, ATS‑friendly resume in minutes
          </h1>
          <p className="text-muted-foreground">
            Write faster with smart suggestions and export a clean, single‑column layout that passes ATS scans.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setTab("signup")
                authRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
              }}
            >
              Get started
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setTab("login")
                authRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
              }}
            >
              Sign in
            </Button>
          </div>
        </div>

        <div id="auth" ref={authRef} className="w-full">
          <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
            <Tabs value={tab} onValueChange={(v) => {
              setTab(v as "login" | "signup")
              setError("")
              setSuccessMessage("")
              setPassword("")
              setPasswordStrength({ score: 0, feedback: "" })
            }} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-4">
                <form className="space-y-3 rounded-lg border bg-card p-4 text-left" onSubmit={handleLogin}>
                  {error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  {successMessage && (
                    <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 border border-green-200">
                      {successMessage}
                    </div>
                  )}
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      className="bg-background"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      name="password" 
                      type="password" 
                      className="bg-background" 
                      disabled={isSubmitting}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting || loading}>
                    {isSubmitting ? "Logging in..." : "Login"}
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      className="text-sm text-muted-foreground hover:text-foreground underline"
                      onClick={() => alert("Password reset functionality available in production. For demo, contact support.")}
                    >
                      Forgot your password?
                    </button>
                  </div>
                </form>
              </TabsContent>
              <TabsContent value="signup" className="mt-4">
                <form className="space-y-3 rounded-lg border bg-card p-4 text-left" onSubmit={handleSignup}>
                  {error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="Jane Doe" 
                      className="bg-background" 
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email2">Email</Label>
                    <Input
                      id="email2"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      className="bg-background"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password2">Password</Label>
                    <Input 
                      id="password2" 
                      name="password" 
                      type="password" 
                      className="bg-background" 
                      disabled={isSubmitting}
                      value={password}
                      onChange={(e) => {
                        const value = e.target.value
                        setPassword(value)
                        setPasswordStrength(checkPasswordStrength(value))
                      }}
                    />
                    {password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded ${
                                level <= passwordStrength.score
                                  ? passwordStrength.score <= 2
                                    ? "bg-red-400"
                                    : passwordStrength.score <= 3
                                    ? "bg-yellow-400"
                                    : "bg-green-400"
                                  : "bg-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs ${
                          passwordStrength.score <= 2 ? "text-red-600" : 
                          passwordStrength.score <= 3 ? "text-yellow-600" : "text-green-600"
                        }`}>
                          {passwordStrength.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting || loading}>
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </main>
  )
}
