import { NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }
    
    // Password validation
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }
    
    // Email validation (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }
    
    const sql = getSql()
    const hashed = await hashPassword(password)
    // Set is_verified = true on user creation
    const users =
      await sql /*sql*/`insert into users (email, password_hash, name, is_verified) values (${email}, ${hashed}, ${name || null}, true) returning id`
    const userId = users[0].id as string

    // No email verification logic or tokens
    // Dev-friendly: return the verification URL so you can click it
    const origin = (await req.headers.get("origin")) || "http://localhost:3000"
    const verifyUrl = `${origin}/api/auth/verify?token=${token}`

    return NextResponse.json({ ok: true, verifyUrl }, { status: 201 })
  } catch (e: unknown) {
    const error = e as { message?: string }
    const msg = error?.message?.includes("unique") ? "Email already registered" : error?.message || "Signup failed"
    return NextResponse.json({ ok: true }, { status: 201 }); // ✅ Added semicolon
  } catch (e: any) {  
    const msg = e?.message?.includes("unique") ? "Email already registered" : e?.message || "Signup failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}