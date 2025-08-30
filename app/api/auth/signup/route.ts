import { NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { randomBytes } from "crypto"

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }
    const sql = getSql()
    const hashed = await hashPassword(password)
    const users =
      await sql /*sql*/`insert into users (email, password_hash, name) values (${email}, ${hashed}, ${name || null}) returning id`
    const userId = users[0].id as string

    const token = randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24) // 24h
    await sql /*sql*/`
      insert into email_verification_tokens (user_id, token, expires_at)
      values (${userId}, ${token}, ${expires.toISOString()})
    `

    // Dev-friendly: return the verification URL so you can click it
    const origin = (await req.headers.get("origin")) || "http://localhost:3000"
    const verifyUrl = `${origin}/api/auth/verify?token=${token}`

    return NextResponse.json({ ok: true, verifyUrl }, { status: 201 })
  } catch (e: any) {
    const msg = e?.message?.includes("unique") ? "Email already registered" : e?.message || "Signup failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
