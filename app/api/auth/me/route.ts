import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ user: null }, { status: 200 })
    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    console.error("Get current user error:", error)
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return NextResponse.json({ user: null, error: "Database not configured" }, { status: 200 })
    }
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
