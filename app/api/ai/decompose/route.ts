import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getGeminiModel } from "@/lib/gemini"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, goalId: gid, title, description, context, deadline, type } = await req.json()
  const goalId = gid ?? id ?? null
  if (!title) return NextResponse.json({ error: "Goal title required" }, { status: 400 })

  const deadlineText = deadline
    ? `Deadline: ${new Date(deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
    : "No specific deadline"

  let contextText = ""
  if (context) {
    try {
      const qa = JSON.parse(context) as { q: string; a: string }[]
      if (Array.isArray(qa) && qa.length > 0) {
        const filled = qa.filter(({ a }) => a?.trim())
        if (filled.length > 0) {
          contextText = `\nUser context (use this to make tasks and habits specific to their situation):\n${filled.map(({ q, a }) => `- ${q}: ${a}`).join("\n")}`
        }
      }
    } catch { /* ignore */ }
  }

  const prompt = `
You are a world-class productivity coach and goal strategist. Break down the following goal into a realistic, actionable plan.

Goal: "${title}"
${description ? `Description: ${description}` : ""}
Type: ${type}
${deadlineText}${contextText}

Return a JSON object with this exact structure:
{
  "habits": [
    {
      "title": "Daily recurring action title",
      "recurrence": "DAILY"
    }
  ],
  "milestones": [
    {
      "title": "Phase name",
      "duration": "e.g. Week 1-2",
      "description": "What to focus on in this phase",
      "tasks": ["Specific one-time setup task 1", "Specific one-time setup task 2"]
    }
  ],
  "difficulty": "Easy" | "Medium" | "Hard" | "Very Hard",
  "tips": ["Practical tip 1", "Practical tip 2", "Practical tip 3"],
  "realisticAssessment": "Honest 1-2 sentence assessment of whether this goal is achievable given the constraints"
}

Rules:
- USE THE USER CONTEXT above to make everything specific. If user said they weigh 58kg, mention that. If they train 4 days/week, reflect that in habits. Generic output is a failure.
- habits: 3-6 core daily/recurring actions the user must repeat consistently. Make them concrete and quantified (e.g. "Eat 5 meals with 25g protein each", "Drink 3L water", "Weight training — 4x/week"). recurrence must be "DAILY" or "EVERY_OTHER_DAY".
- milestones: 3 to 5 phases of one-time setup and measurement steps (not the daily habits). Each milestone should have 2-4 concrete one-time tasks specific to the user's situation.
- milestones are for setup, measurement, calibration — not generic phases like "Start your journey". Include numbers from the user's context where possible.
- Be honest about difficulty and time requirements
- Tips should reference the user's specific numbers and constraints, not generic advice
`

  try {
    const model = getGeminiModel()
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const plan = JSON.parse(text)

    await db.aIAnalysis.create({
      data: {
        type: "GOAL_DECOMPOSITION",
        prompt: title,
        response: text,
        goalId: goalId || null,
        userId: session.user.id,
      },
    })

    if (goalId) {
      await db.goal.updateMany({
        where: { id: goalId, userId: session.user.id },
        data: { description: description || plan.realisticAssessment },
      })
    }

    revalidateTag(`goals-${session.user.id}`, "max")
    return NextResponse.json(plan)
  } catch (err) {
    console.error("Gemini decompose error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
