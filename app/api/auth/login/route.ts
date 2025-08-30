import { NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { verifyPassword, createSession } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 })

    const sql = getSql()
    const users =
      await sql /*sql*/`select id, password_hash, is_verified, email, name from users where email = ${email} limit 1`
    const user = users[0]
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 })
    if (!user.is_verified) return NextResponse.json({ error: "Email not verified" }, { status: 403 })

    const ok = await verifyPassword(password, user.password_hash)
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 })

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
