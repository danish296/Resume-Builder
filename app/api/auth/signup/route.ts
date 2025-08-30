import { NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }
    const sql = getSql()
    const hashed = await hashPassword(password)
    // Set is_verified = true on user creation
    const users =
      await sql /*sql*/`insert into users (email, password_hash, name, is_verified) values (${email}, ${hashed}, ${name || null}, true) returning id`
    const userId = users[0].id as string

    // No email verification logic or tokens

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e: any) {
    const msg = e?.message?.includes("unique") ? "Email already registered" : e?.message || "Signup failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}