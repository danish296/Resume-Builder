import { NextResponse } from "next/server"
import { getSql } from "@/lib/db"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get("token")
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 })

  const sql = getSql()
  const nowIso = new Date().toISOString()

  const rows = await sql /*sql*/`
    select user_id from email_verification_tokens
    where token = ${token} and expires_at > ${nowIso}
    limit 1
  `
  const row = rows[0]
  if (!row) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })

  await sql /*sql*/`update users set is_verified = true where id = ${row.user_id}`
  await sql /*sql*/`delete from email_verification_tokens where token = ${token}`

  return NextResponse.redirect(new URL("/dashboard?verified=1", req.url))
}
