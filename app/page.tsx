"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/hooks/use-auth"
import { useRef, useState } from "react"

export default function Page() {
  const router = useRouter()
  const { login } = useAuth()
  const [tab, setTab] = useState<"login" | "signup">("login")
  const authRef = useRef<HTMLDivElement | null>(null)

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const email = String(data.get("email") || "")
    const password = String(data.get("password") || "")
    if (!email || !password) return
    login({ name: email.split("@")[0], email })
    router.push("/dashboard")
  }

  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const name = String(data.get("name") || "")
    const email = String(data.get("email") || "")
    const password = String(data.get("password") || "")
    if (!name || !email || !password) return
    login({ name, email })
    router.push("/dashboard")
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
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-4">
                <form className="space-y-3 rounded-lg border bg-card p-4 text-left" onSubmit={handleLogin}>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" className="bg-background" />
                  </div>
                  <Button type="submit" className="w-full">
                    Login
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup" className="mt-4">
                <form className="space-y-3 rounded-lg border bg-card p-4 text-left" onSubmit={handleSignup}>
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" placeholder="Jane Doe" className="bg-background" />
                  </div>
                  <div>
                    <Label htmlFor="email2">Email</Label>
                    <Input
                      id="email2"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password2">Password</Label>
                    <Input id="password2" name="password" type="password" className="bg-background" />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Account
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
