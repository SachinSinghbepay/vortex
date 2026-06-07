import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getGeminiModel } from "@/lib/gemini"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [completed, pending, goals] = await Promise.all([
    db.task.findMany({
      where: { userId: session.user.id, completed: true, updatedAt: { gte: weekAgo } },
      select: { title: true, category: true },
      take: 20,
    }),
    db.task.findMany({
      where: { userId: session.user.id, completed: false, createdAt: { lte: weekAgo } },
      select: { title: true, priority: true },
      orderBy: { priority: "desc" },
      take: 10,
    }),
    db.goal.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      select: { title: true, progress: true },
      take: 6,
    }),
  ])

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })

  const prompt = `
You are a strategic productivity coach doing a weekly review. Today is ${today}.

Data for the past 7 days:
- Completed tasks (${completed.length}): ${completed.map(t => `"${t.title}"`).join(", ") || "None"}
- Still pending old tasks (${pending.length}): ${pending.map(t => `"${t.title}" [${t.priority}]`).join(", ") || "None"}
- Active goals: ${goals.map(g => `"${g.title}" at ${g.progress}%`).join(", ") || "None set yet"}

Return this exact JSON:
{
  "headline": "One honest sentence capturing this week — no fluff",
  "score": <number 0-100, overall week quality>,
  "wins": ["Specific thing they actually did well", "Another win if applicable"],
  "slipped": ["What didn't get done and why it probably happened"],
  "pattern": "One specific behavioral pattern you notice from their data — be concrete not generic",
  "nextWeekFocus": "The single most important thing to prioritize next week, and why",
  "insight": "One non-obvious insight about how they work based on this data"
}

If they have no data yet, still return the structure with helpful onboarding-focused content.
Be specific to their actual tasks and goals. No generic productivity advice.
`

  try {
    const model = getGeminiModel()
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return NextResponse.json(JSON.parse(text))
  } catch (err) {
    console.error("Debrief AI error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
