import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

const deepinfra = createOpenAI({
  baseURL: "https://api.deepinfra.com/v1/openai",
  apiKey: process.env.DEEPINFRA_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Invalid text" }, { status: 400 })
    }

    const { text: out } = await generateText({
      model: deepinfra("mistralai/Mistral-7B-Instruct-v0.2"),
      system:
        "You are an ATS resume editor. Enhance clarity, concision, and action verbs without inventing details. Keep single-column, bullet points, and neutral tone.",
      prompt: `Improve the following resume section. Keep it concise and ATS-friendly without changing factual meaning.\n\n---\n${text}\n---\nReturn only the improved text.`,
    })

    return NextResponse.json({ text: out })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "AI error" }, { status: 500 })
  }
}
