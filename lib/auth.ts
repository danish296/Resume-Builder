import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { getSql } from "./db"

const SESSION_COOKIE = "session"

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

function addDays(d: Date, days: number) {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

export async function createSession(userId: string) {
  const sql = getSql()
  const token = randomBytes(32).toString("hex")
  const now = new Date()
  const expires = addDays(now, 30)
  await sql`
    insert into sessions (token, user_id, created_at, expires_at)
    values (${token}, ${userId}, ${now.toISOString()}, ${expires.toISOString()})
  `
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    expires,
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    expires: new Date(0),
  })
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  const now = new Date()
  const sql = getSql()
  const rows = await sql /*sql*/`
    select u.id, u.email, u.name, u.is_verified
    from sessions s
    join users u on u.id = s.user_id
    where s.token = ${token} and s.expires_at > ${now.toISOString()}
    limit 1
  `
  return rows[0] || null
}
