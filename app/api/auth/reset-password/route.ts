import { NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()
    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    const sql = getSql()
    const now = new Date().toISOString()

    // Find valid reset token
    const rows = await sql /*sql*/`
      select user_id from password_reset_tokens
      where token = ${token} and expires_at > ${now}
      limit 1
    `
    const row = rows[0]
    
    if (!row) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    // Update password
    const hashedPassword = await hashPassword(password)
    await sql /*sql*/`update users set password_hash = ${hashedPassword} where id = ${row.user_id}`
    
    // Delete the used token
    await sql /*sql*/`delete from password_reset_tokens where token = ${token}`
    
    // Clear all sessions for this user (force re-login)
    await sql /*sql*/`delete from sessions where user_id = ${row.user_id}`

    return NextResponse.json({ ok: true, message: "Password reset successfully" })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}