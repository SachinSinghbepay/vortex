import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getGeminiModel } from "@/lib/gemini"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { task } = await req.json()
  if (!task?.trim()) return NextResponse.json({ error: "Task required" }, { status: 400 })

  const prompt = `
Break this task into 3-5 specific, concrete subtasks. Each should take 30-90 minutes maximum.

Task: "${task}"

Return JSON:
{
  "subtasks": ["Action verb + specific outcome 1", "Action verb + specific outcome 2", "Action verb + specific outcome 3"]
}

Rules:
- Start each with an action verb (Write, Research, Set up, Review, Create...)
- Be specific enough that someone knows exactly what to do
- 3 subtasks minimum, 5 maximum
`

  try {
    const model = getGeminiModel()
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return NextResponse.json(JSON.parse(text))
  } catch (err) {
    console.error("Breakdown AI error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
