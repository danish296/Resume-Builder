import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getSql } from "@/lib/db"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const sql = getSql()
  const rows = await sql /*sql*/`
    select id, title, data, created_at, updated_at from resumes
    where id = ${params.id} and user_id = ${user.id}
    limit 1
  `
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ resume: rows[0] })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { title, data } = await req.json()
  if (!title || !data) return NextResponse.json({ error: "Missing title or data" }, { status: 400 })
  const sql = getSql()
  const rows = await sql /*sql*/`
    update resumes
    set title = ${title},
        data = ${JSON.stringify(data)},
        updated_at = now()
    where id = ${params.id} and user_id = ${user.id}
    returning id, title, data, created_at, updated_at
  `
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ resume: rows[0] })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const sql = getSql()
  await sql /*sql*/`delete from resumes where id = ${params.id} and user_id = ${user.id}`
  return NextResponse.json({ ok: true })
}
