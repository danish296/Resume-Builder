import { NextResponse } from "next/server"
import { clearSession } from "@/lib/auth"
import { getSql } from "@/lib/db"
import { cookies } from "next/headers"

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value
  if (token) {
    const sql = getSql()
    await sql /*sql*/`delete from sessions where token = ${token}`
  }
  await clearSession()
  return NextResponse.json({ ok: true })
}
