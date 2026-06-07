import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getGeminiModel } from "@/lib/gemini"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { taskTitle, daysAvoided, priority } = await req.json()
  if (!taskTitle) return NextResponse.json({ error: "Task required" }, { status: 400 })

  const prompt = `
You are a productivity psychologist. This person has been avoiding a task for ${daysAvoided} days.

Task: "${taskTitle}"
Priority: ${priority}
Days avoided: ${daysAvoided}

Be direct and specific to THIS task — not generic procrastination advice.

Return JSON:
{
  "why": "The specific psychological reason they're avoiding THIS task (2 sentences max — be honest, not judgmental)",
  "firstStep": "The single most concrete action they can take RIGHT NOW to start — must be completable in under 5 minutes and extremely specific to this task",
  "reframe": "One sentence that makes this feel less overwhelming"
}
`

  try {
    const model = getGeminiModel()
    const result = await model.generateContent(prompt)
    return NextResponse.json(JSON.parse(result.response.text()))
  } catch (err) {
    console.error("Procrastination AI error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
