import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getGeminiModel } from "@/lib/gemini"
import { computeTaskAdherence, countExpectedOccurrences, parseJsonArray, toLocalDateStr } from "@/lib/task-analytics"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toLocalDateStr(today)

  const goals = await db.goal.findMany({
    where: { userId, status: "ACTIVE" },
    select: { id: true, title: true, deadline: true, progress: true, type: true, createdAt: true, description: true },
  })

  if (goals.length === 0) return NextResponse.json({ error: "No active goals" }, { status: 400 })

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

    // Weekly adherence trend (last 4 weeks)
    const weeklyTrend = Array.from({ length: 4 }, (_, i) => {
      const wStart = new Date(today)
      wStart.setDate(today.getDate() - (3 - i) * 7)
      wStart.setHours(0, 0, 0, 0)
      const wEnd = new Date(wStart)
      wEnd.setDate(wStart.getDate() + 6)
      const wStartStr = toLocalDateStr(wStart)
      const wEndStr = toLocalDateStr(wEnd)

      let completed = 0, expected = 0
      for (const task of tasks) {
        if (task.recurrence === "NONE") continue
        const completedDates = parseJsonArray(task.completedSections)
        const customDates = parseJsonArray(task.customDates)
        const taskStart = new Date(task.startDate ?? task.createdAt)
        taskStart.setHours(0, 0, 0, 0)
        const rangeStart = taskStart > wStart ? taskStart : wStart
        const taskEnd = task.recurrenceEndDate ? new Date(task.recurrenceEndDate) : wEnd
        taskEnd.setHours(0, 0, 0, 0)
        const rangeEnd = taskEnd < wEnd ? taskEnd : wEnd
        if (rangeStart <= rangeEnd)
          expected += countExpectedOccurrences(task.recurrence, rangeStart, rangeEnd, customDates)
        completed += completedDates.filter((d) => d >= wStartStr && d <= wEndStr).length
      }

      return { adherenceRate: expected > 0 ? Math.round((completed / expected) * 100) : null }
    })

    const trendDirection =
      weeklyTrend.filter((w) => w.adherenceRate !== null).length >= 2
        ? (() => {
            const valid = weeklyTrend.filter((w) => w.adherenceRate !== null)
            const last = valid[valid.length - 1].adherenceRate!
            const prev = valid[valid.length - 2].adherenceRate!
            return last > prev + 10 ? "improving" : last < prev - 10 ? "declining" : "stable"
          })()
        : "unknown"

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
      trendDirection,
      totalTasks: tasks.length,
      recurringTasks: recurring.length,
    }
  }))

  const model = getGeminiModel(true)

  const prompt = `You are a productivity coach analyzing a user's performance across ALL their active goals simultaneously. Give an honest, cross-goal assessment that identifies conflicts, bottlenecks, and what to do.

Today: ${todayStr}
Active goals: ${goals.length}

Goal data:
${JSON.stringify(goalData, null, 2)}

Key signals to reason about:
- progressDelta: positive = ahead, negative = behind schedule
- overallAdherence: % of scheduled task occurrences actually completed. Below 60% = struggling.
- trendDirection: is adherence getting better or worse?
- daysRemaining + low adherence = urgency signal
- Too many goals with deadlines = spreading too thin

Return ONLY valid JSON (no markdown):
{
  "overallHealth": <"thriving" | "steady" | "at_risk" | "struggling">,
  "headline": <one sharp sentence summarizing the user's situation, e.g. "You're spreading too thin — German needs immediate focus">,
  "insights": [<3-5 cross-goal observations with actual numbers, e.g. "German: 53% adherence with 35 days left — highest risk", "You have 3 concurrent deadlines in the next 60 days">],
  "bottleneck": <title of the goal most at risk right now, or null>,
  "priorityOrder": [<goal titles ranked by urgency, highest first>],
  "recommendation": <one concrete actionable strategy, e.g. "Pause Web Animation 3x/week and redirect that time to German until Aug 10">,
  "goalSummaries": [
    { "id": "<goalId>", "title": "<title>", "status": <"ahead" | "on_track" | "behind" | "at_risk">, "adherence": <number or null>, "daysRemaining": <number or null> }
  ]
}`

  try {
    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()
    const jsonStr = raw.startsWith("```") ? raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "") : raw
    return NextResponse.json(JSON.parse(jsonStr))
  } catch {
    return NextResponse.json({ error: "Failed to generate analysis" }, { status: 500 })
  }
}
