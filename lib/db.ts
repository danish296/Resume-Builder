import { neon } from "@neondatabase/serverless"

export function getSql() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL
  if (!url) {
    throw new Error("DATABASE_URL (Neon) is not set")
  }
  return neon(url)
}
