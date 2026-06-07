import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getGeminiModel } from "@/lib/gemini"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, goalId: gid, title, description, deadline, type } = await req.json()
  const goalId = gid ?? id ?? null
  if (!title) return NextResponse.json({ error: "Goal title required" }, { status: 400 })

  const deadlineText = deadline
    ? `Deadline: ${new Date(deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
    : "No specific deadline"

  const prompt = `
You are a world-class productivity coach and goal strategist. Break down the following goal into a realistic, actionable plan.

Goal: "${title}"
${description ? `Context: ${description}` : ""}
Type: ${type}
${deadlineText}

Return a JSON object with this exact structure:
{
  "milestones": [
    {
      "title": "Phase name",
      "duration": "e.g. Week 1-2",
      "description": "What to focus on in this phase",
      "tasks": ["Specific task 1", "Specific task 2", "Specific task 3"]
    }
  ],
  "weeklyHours": <number — realistic hours per week needed>,
  "difficulty": "Easy" | "Medium" | "Hard" | "Very Hard",
  "tips": ["Practical tip 1", "Practical tip 2", "Practical tip 3"],
  "realisticAssessment": "Honest 1-2 sentence assessment of whether this goal is achievable given the constraints"
}

Rules:
- 3 to 5 milestones maximum
- Be specific, not generic
- Each milestone should have 3-5 concrete tasks
- Be honest about difficulty and time requirements
- Tips should be specific to THIS goal, not generic productivity advice
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
