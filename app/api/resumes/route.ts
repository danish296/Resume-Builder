import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getSql } from "@/lib/db"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const sql = getSql()
  const rows =
    await sql /*sql*/`select id, title, data, created_at, updated_at from resumes where user_id = ${user.id} order by updated_at desc`
  return NextResponse.json({ resumes: rows })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title, data } = await req.json()
  if (!title || !data) return NextResponse.json({ error: "Missing title or data" }, { status: 400 })

  const sql = getSql()
  const rows = await sql /*sql*/`
    insert into resumes (user_id, title, data)
    values (${user.id}, ${title}, ${JSON.stringify(data)})
    returning id, title, data, created_at, updated_at
  `
  return NextResponse.json({ resume: rows[0] }, { status: 201 })
}
