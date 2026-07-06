import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getGeminiModel } from "@/lib/gemini"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { goals } = await req.json() as {
    goals: Array<{ id: string; title: string; description?: string | null; type?: string }>
  }

  const model = getGeminiModel(true)

  const prompt = `You are getting to know a user's habits and lifestyle to build a complete picture of how they work toward each of their active goals.

These goals are already active — the user is currently working on them. Ask in PRESENT tense ("do you", "how many", "how long is") NOT future tense.

For each goal, think about ALL the dimensions that matter for that goal type, then ask 2–5 focused questions that together reveal the full picture:

FITNESS / BODY goals (gain weight, lose weight, build muscle, etc.) — ask about:
  - Workout frequency (how many days/week) and duration
  - Meals per day and eating pattern
  - Calorie or protein awareness (do they track?)
  - Water intake
  - Sleep hours

LEARNING goals (language, exam prep, skills) — ask about:
  - Study days and session duration
  - What they specifically practice (e.g. grammar, speaking, mock tests)
  - Consistency (every day or specific days?)

PROJECT / CAREER goals (launch product, build business, etc.) — ask about:
  - How many days a week and hours per session
  - Type of work (deep focused work vs meetings vs admin)

PERSONAL habits (read, meditate, journal) — ask about:
  - Frequency and duration
  - What time of day (morning/evening/anytime)

Rules:
- Each question covers ONE thing (short, direct, conversational)
- Present tense always
- Ask ONLY what's relevant — don't ask a fitness goal about study sessions

Goals:
${goals.map((g) => `- id: ${g.id}, title: "${g.title}", type: ${g.type ?? "PERSONAL"}${g.description ? `, description: "${g.description.slice(0, 120)}"` : ""}`).join("\n")}

Return ONLY valid JSON (no markdown). A goal with N questions appears N times:
{
  "questions": [
    { "goalId": "<id>", "question": "<question>" }
  ]
}`

  try {
    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()
    const jsonStr = raw.startsWith("```") ? raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "") : raw
    return NextResponse.json(JSON.parse(jsonStr))
  } catch {
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 })
  }
}
