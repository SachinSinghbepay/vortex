import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getGeminiModel } from "@/lib/gemini"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { qa, goals } = await req.json() as {
    qa: Array<{ goalId: string; questions: string[]; answers: string[] }>
    goals: Array<{ id: string; title: string; type?: string }>
  }

  const model = getGeminiModel(true)

  const goalMap = Object.fromEntries(goals.map((g) => [g.id, g]))

  const prompt = `You are building a rich habit and schedule profile for a user based on their answers about each goal.

For each goal, extract TWO things:
1. "activities" — time-based things they DO on specific days (gym, study sessions, practice). Each activity has a name and minutes per day of the week.
2. "habits" — non-time-based commitments (meals per day, water intake, sleep hours, calorie targets, daily tracking habits). Each habit has a name and a target value/description.

Not every goal needs activities. Not every goal needs habits. Use only what was mentioned.

Examples:
- "Gain weight" with answers about gym 3x/week 90min, 5 meals/day, 3L water, 8h sleep →
  activities: [{ name: "Gym workouts", Mon: 90, Tue: 0, Wed: 90, Thu: 0, Fri: 90, Sat: 0, Sun: 0 }]
  habits: [{ name: "Meals", target: "5 per day" }, { name: "Water", target: "3L daily" }, { name: "Sleep", target: "8h" }]

- "German B1" with answers about studying Mon–Fri 90min →
  activities: [{ name: "German study", Mon: 90, Tue: 90, Wed: 90, Thu: 90, Fri: 90, Sat: 0, Sun: 0 }]
  habits: []

- "Read 20 books" with answers about 30min every evening →
  activities: [{ name: "Reading", Mon: 30, Tue: 30, Wed: 30, Thu: 30, Fri: 30, Sat: 30, Sun: 30 }]
  habits: []

Rules for activities:
- Times in MINUTES (integer 0–480)
- "every day" → all 7 days; "weekdays" → Mon–Fri; "X days/week" without named days → spread evenly
- Range like "30–60 min" → midpoint

Q&A per goal:
${qa.map((x) => {
  const g = goalMap[x.goalId]
  return `Goal: "${g?.title ?? x.goalId}" (id: ${x.goalId}, type: ${g?.type ?? "PERSONAL"})
${x.questions.map((q, i) => `  Q: ${q}\n  A: ${x.answers[i] ?? ""}`).join("\n")}`
}).join("\n\n")}

Return ONLY valid JSON (no markdown):
{
  "schedule": {
    "<goalId>": {
      "title": "<goal title>",
      "activities": [
        { "name": "<activity name>", "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0 }
      ],
      "habits": [
        { "name": "<habit name>", "target": "<value or description>" }
      ]
    }
  }
}`

  try {
    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()
    const jsonStr = raw.startsWith("```") ? raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "") : raw
    return NextResponse.json(JSON.parse(jsonStr))
  } catch {
    return NextResponse.json({ error: "Failed to extract schedule" }, { status: 500 })
  }
}
