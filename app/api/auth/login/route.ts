import { NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { verifyPassword, createSession } from "@/lib/auth"

// Simple in-memory rate limiting (in production, use Redis or database)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(ip: string): { allowed: boolean; remaining?: number; resetTime?: number } {
  const now = Date.now()
  const attempt = loginAttempts.get(ip)
  
  if (!attempt) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 }
  }
  
  // Reset if lockout period has passed
  if (now - attempt.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 }
  }
  
  if (attempt.count >= MAX_ATTEMPTS) {
    const resetTime = attempt.lastAttempt + LOCKOUT_DURATION
    return { allowed: false, resetTime }
  }
  
  return { allowed: true, remaining: MAX_ATTEMPTS - attempt.count }
}

function recordFailedAttempt(ip: string) {
  const now = Date.now()
  const attempt = loginAttempts.get(ip)
  
  if (!attempt || now - attempt.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now })
  } else {
    loginAttempts.set(ip, { count: attempt.count + 1, lastAttempt: now })
  }
}

export async function POST(req: Request) {
  try {
    // Get client IP for rate limiting
    const forwarded = req.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : req.headers.get("x-real-ip") || "unknown"
    
    // Check rate limit
    const rateLimit = checkRateLimit(ip)
    if (!rateLimit.allowed) {
      const resetTime = rateLimit.resetTime ? new Date(rateLimit.resetTime).toISOString() : "unknown"
      return NextResponse.json({ 
        error: `Too many login attempts. Try again in 15 minutes.`,
        resetTime
      }, { status: 429 })
    }
    
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 })

    const sql = getSql()
    const users =
      await sql /*sql*/`select id, password_hash, is_verified, email, name from users where email = ${email} limit 1`
    const user = users[0]
    if (!user) {
      recordFailedAttempt(ip)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 })
    }
    if (!user.is_verified) return NextResponse.json({ error: "Email not verified. Please check your inbox and click the verification link." }, { status: 403 })

    const ok = await verifyPassword(password, user.password_hash)
    if (!ok) {
      recordFailedAttempt(ip)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 })
    }

    // Reset attempts on successful login
    loginAttempts.delete(ip)
    
    await createSession(user.id)
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } })
  } catch (error) {
    console.error("Login error:", error)
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return NextResponse.json({ error: "Database not configured. Please set up DATABASE_URL environment variable." }, { status: 500 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
