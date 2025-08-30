import { NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { randomBytes } from "crypto"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Email validation (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }

    const sql = getSql()
    
    // Check if user exists and is verified
    const users = await sql /*sql*/`select id, email, is_verified from users where email = ${email} limit 1`
    const user = users[0]
    
    if (!user) {
      // Don't reveal if user exists for security
      return NextResponse.json({ ok: true, message: "If an account with this email exists, you will receive a password reset link." })
    }

    if (!user.is_verified) {
      return NextResponse.json({ error: "Account not verified. Please verify your email first." }, { status: 400 })
    }

    // Generate reset token
    const token = randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

    // Store reset token (remove any existing tokens for this user first)
    await sql /*sql*/`delete from password_reset_tokens where user_id = ${user.id}`
    await sql /*sql*/`
      insert into password_reset_tokens (user_id, token, expires_at)
      values (${user.id}, ${token}, ${expires.toISOString()})
    `

    // In development, return the reset URL
    const origin = req.headers.get("origin") || "http://localhost:3000"
    const resetUrl = `${origin}/reset-password?token=${token}`

    return NextResponse.json({ 
      ok: true, 
      message: "If an account with this email exists, you will receive a password reset link.",
      resetUrl // Dev-friendly: include URL for testing
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}