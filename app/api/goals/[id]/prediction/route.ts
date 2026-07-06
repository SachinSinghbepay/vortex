import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getGeminiModel } from "@/lib/gemini"
import { parseJsonArray, toLocalDateStr, countExpectedOccurrences, computeTaskAdherence } from "@/lib/task-analytics"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const userId = session.user.id

  const [goal, tasks] = await Promise.all([
    db.goal.findFirst({
      where: { id, userId },
      select: {
        id: true, title: true, description: true, deadline: true,
        progress: true, type: true, createdAt: true,
      },
    }),
    db.task.findMany({
      where: { userId, goalId: id },
      select: {
        title: true, category: true, priority: true, recurrence: true,
        startDate: true, dueDate: true, recurrenceEndDate: true,
        completedSections: true, skippedDates: true, customDates: true,
        completed: true, createdAt: true, updatedAt: true,
      },
    }),
  ])

  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toLocalDateStr(today)

  const createdAt = new Date(goal.createdAt)
  createdAt.setHours(0, 0, 0, 0)
  const deadline = goal.deadline ? new Date(goal.deadline) : null
  if (deadline) deadline.setHours(0, 0, 0, 0)

  const totalDays = deadline ? Math.max(1, Math.round((deadline.getTime() - createdAt.getTime()) / 86400000)) : null
  const elapsedDays = Math.max(0, Math.round((today.getTime() - createdAt.getTime()) / 86400000))
  const remainingDays = deadline ? Math.max(0, Math.round((deadline.getTime() - today.getTime()) / 86400000)) : null
  const expectedProgress = totalDays ? Math.min(100, Math.round((elapsedDays / totalDays) * 100)) : null

  const taskStats = tasks.map((task) => computeTaskAdherence(task, today))

  // Weekly adherence trend — completed vs expected per week (last 6 weeks, oldest first)
  const weeklyTrend = Array.from({ length: 6 }, (_, i) => {
    const wStart = new Date(today)
    wStart.setDate(today.getDate() - (5 - i) * 7)
    wStart.setHours(0, 0, 0, 0)
    const wEnd = new Date(wStart)
    wEnd.setDate(wStart.getDate() + 6)
    const wStartStr = toLocalDateStr(wStart)
    const wEndStr = toLocalDateStr(wEnd)

    let completed = 0
    let expected = 0

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

      if (rangeStart <= rangeEnd) {
        expected += countExpectedOccurrences(task.recurrence, rangeStart, rangeEnd, customDates)
      }
      completed += completedDates.filter((d) => d >= wStartStr && d <= wEndStr).length
    }

    return {
      week: `${wStartStr} → ${wEndStr}`,
      completed,
      expected,
      adherenceRate: expected > 0 ? Math.round((completed / expected) * 100) : null,
    }
  }).filter((w) => w.expected > 0)

  const recurringTasks = taskStats.filter((t) => t.type === "recurring")
  const oneTimeTasks = taskStats.filter((t) => t.type === "one_time")
  const overdueOneTime = oneTimeTasks.filter((t) => t.type === "one_time" && t.isOverdue)

  const context = {
    goal: {
      title: goal.title,
      description: goal.description ?? null,
      type: goal.type,
      deadline: deadline ? toLocalDateStr(deadline) : null,
      currentProgress: goal.progress,
      daysElapsed: elapsedDays,
      daysRemaining: remainingDays,
      expectedProgressAtThisPoint: expectedProgress,
      progressDelta: expectedProgress !== null ? goal.progress - expectedProgress : null,
    },
    tasks: taskStats,
    summary: {
      totalTasks: tasks.length,
      recurringTasks: recurringTasks.length,
      oneTimeTasks: oneTimeTasks.length,
      overdueOneTimeTasks: overdueOneTime.length,
      overallAdherence: recurringTasks.length > 0
        ? Math.round(
            recurringTasks.reduce((s, t) => s + (t.adherenceRate ?? 0), 0) / recurringTasks.length
          )
        : null,
    },
    weeklyAdherenceTrend: weeklyTrend,
    today: todayStr,
  }

  const model = getGeminiModel(true)
  const prompt = `You are a goal achievement prediction system. Analyze the detailed behavioral data and give an honest, data-driven assessment.

Data:
${JSON.stringify(context, null, 2)}

Key metrics to reason about:
- progressDelta: actual minus expected progress. Negative means behind schedule.
- adherenceRate (per recurring task): % of scheduled occurrences actually completed (skipped = intentional, missed = didn't do it). Low adherence = avoidance pattern.
- missedCount: occurrences that were neither completed nor skipped — user simply didn't show up.
- currentStreak: consecutive days of completion up to today. A streak of 0 means they haven't done it recently.
- daysSinceLastCompletion: longer gaps signal avoidance or dropout.
- weeklyAdherenceTrend: shows if consistency is improving, stable, or declining. A downward trend is a serious warning sign.
- isOverdue / daysOverdue: for one-time tasks still not completed past their due date.
- overallAdherence: average adherence across all recurring tasks — the single clearest signal of whether they will succeed.

Return ONLY valid JSON with this exact structure (no markdown):
{
  "probability": <integer 0-100>,
  "status": <"ahead" | "on_track" | "behind" | "at_risk">,
  "summary": <2-3 sentence honest assessment referencing actual task names and numbers>,
  "insights": [<3-5 specific observations with actual numbers, adherence rates, task names, trend direction>],
  "recommendation": <one concrete actionable next step>,
  "action": <"continue" | "increase_frequency" | "extend_deadline" | "reduce_scope" | "focus_bottleneck">,
  "revisedDeadline": <"YYYY-MM-DD" if they need more time, null if on track or no deadline>,
  "bottleneckCategory": <category or task name that needs most attention, or null>
}`

  try {
    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()
    const jsonStr = raw.startsWith("```") ? raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "") : raw
    const prediction = JSON.parse(jsonStr)
    return NextResponse.json(prediction)
  } catch {
    return NextResponse.json({ error: "Failed to generate prediction" }, { status: 500 })
  }
}
