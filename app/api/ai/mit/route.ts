import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getGeminiModel } from "@/lib/gemini"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [goals, tasks] = await Promise.all([
    db.goal.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      select: { title: true, progress: true, deadline: true, priority: true },
      take: 10,
    }),
    db.task.findMany({
      where: { userId: session.user.id, completed: false },
      select: { title: true, priority: true, dueDate: true, category: true },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ])

  if (goals.length === 0 && tasks.length === 0) {
    return NextResponse.json({
      task: "Set your first goal",
      reasoning: "You haven't added any goals yet. Start by defining what you want to achieve.",
      urgent: false,
    })
  }

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })

  const prompt = `
You are a strategic productivity advisor. Today is ${today}.

A user's active goals:
${goals.map((g) => `- "${g.title}" (${g.progress}% done, priority: ${g.priority}${g.deadline ? `, due ${new Date(g.deadline).toLocaleDateString()}` : ""})`).join("\n") || "None"}

Their pending tasks:
${tasks.map((t) => `- "${t.title}" (priority: ${t.priority}${t.dueDate ? `, due ${new Date(t.dueDate).toLocaleDateString()}` : ""}${t.category ? `, category: ${t.category}` : ""})`).join("\n") || "None"}

Pick the single most important thing this person should work on TODAY. Consider deadlines, goal progress, and what actually moves the needle.

Return JSON:
{
  "task": "The specific task or action to focus on",
  "reasoning": "One sentence — why this is the most important thing right now",
  "urgent": <true if deadline within 48 hours or URGENT priority, else false>
}

Be direct. No fluff.
`

  try {
    const model = getGeminiModel()
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return NextResponse.json(JSON.parse(text))
  } catch (err) {
    console.error("Gemini MIT error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
