import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getGeminiModel } from "@/lib/gemini"
import { computeTaskAdherence, toLocalDateStr } from "@/lib/task-analytics"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { schedule } = await req.json() as {
    schedule: Record<string, { title: string; Mon: number; Tue: number; Wed: number; Thu: number; Fri: number; Sat: number; Sun: number }>
  }

  const userId = session.user.id
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toLocalDateStr(today)

  const goals = await db.goal.findMany({
    where: { userId, status: "ACTIVE" },
    select: { id: true, title: true, deadline: true, progress: true, type: true, createdAt: true, description: true },
  })

  const goalData = await Promise.all(goals.map(async (goal) => {
    const tasks = await db.task.findMany({
      where: { userId, goalId: goal.id },
      select: {
        title: true, category: true, priority: true, recurrence: true,
        startDate: true, dueDate: true, recurrenceEndDate: true,
        completedSections: true, skippedDates: true, customDates: true,
        completed: true, createdAt: true, updatedAt: true,
      },
    })

    const taskStats = tasks.map((t) => computeTaskAdherence(t, today))
    const recurring = taskStats.filter((t) => t.type === "recurring")
    const overallAdherence = recurring.length > 0
      ? Math.round(recurring.reduce((s, t) => s + (t.adherenceRate ?? 0), 0) / recurring.length)
      : null

    const deadline = goal.deadline ? new Date(goal.deadline) : null
    if (deadline) deadline.setHours(0, 0, 0, 0)
    const createdAt = new Date(goal.createdAt)
    createdAt.setHours(0, 0, 0, 0)
    const totalDays = deadline ? Math.max(1, Math.round((deadline.getTime() - createdAt.getTime()) / 86400000)) : null
    const elapsedDays = Math.max(0, Math.round((today.getTime() - createdAt.getTime()) / 86400000))
    const remainingDays = deadline ? Math.max(0, Math.round((deadline.getTime() - today.getTime()) / 86400000)) : null
    const expectedProgress = totalDays ? Math.min(100, Math.round((elapsedDays / totalDays) * 100)) : null

    const currentSchedule = schedule[goal.id]
    const minutesPerWeek = currentSchedule
      ? Object.values({ Mon: currentSchedule.Mon, Tue: currentSchedule.Tue, Wed: currentSchedule.Wed, Thu: currentSchedule.Thu, Fri: currentSchedule.Fri, Sat: currentSchedule.Sat, Sun: currentSchedule.Sun }).reduce((s, v) => s + v, 0)
      : 0

    return {
      id: goal.id,
      title: goal.title,
      type: goal.type,
      deadline: deadline ? toLocalDateStr(deadline) : null,
      daysRemaining: remainingDays,
      currentProgress: goal.progress,
      expectedProgress,
      progressDelta: expectedProgress !== null ? goal.progress - expectedProgress : null,
      overallAdherence,
      committedMinutesPerWeek: minutesPerWeek,
      currentSchedule: currentSchedule ?? null,
    }
  }))

  const model = getGeminiModel(true)

  const prompt = `You are a productivity coach optimizing a user's weekly schedule based on goal urgency and adherence data.

Today: ${todayStr}

Goals with current performance:
${JSON.stringify(goalData, null, 2)}

Current schedule (minutes per day per goal):
${JSON.stringify(schedule, null, 2)}

Rules for optimization:
- Prioritize goals by: urgency (deadline proximity) + risk (low adherence + behind schedule)
- If adherence is low, either increase time OR reduce scope (not both)
- If a goal has plenty of time remaining and good adherence, it can yield time to urgent goals
- Suggest specific minute amounts per day (realistic, not just "more time")
- If a goal has no deadline, it's lower priority than one that does
- Keep total weekly time reasonable — don't suggest doubling everything

Return ONLY valid JSON (no markdown):
{
  "suggestedSchedule": {
    "<goalId>": {
      "title": "<goal title>",
      "Mon": <minutes>, "Tue": <minutes>, "Wed": <minutes>, "Thu": <minutes>,
      "Fri": <minutes>, "Sat": <minutes>, "Sun": <minutes>
    }
  },
  "changes": [<2-4 specific changes from current schedule with reasoning, e.g. "German: 60→90 min/day — 35 days left, needs more intensity">],
  "priorityOrder": [<goal titles in priority order, highest first>],
  "reasoning": <2-3 sentence overall explanation of the optimization strategy>
}`

  try {
    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()
    const jsonStr = raw.startsWith("```") ? raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "") : raw
    return NextResponse.json(JSON.parse(jsonStr))
  } catch {
    return NextResponse.json({ error: "Failed to optimize schedule" }, { status: 500 })
  }
}
