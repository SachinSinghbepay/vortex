import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getGeminiModel } from "@/lib/gemini"

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function parseCompletedDates(raw: string): string[] {
  try {
    const arr = JSON.parse(raw || "[]")
    if (!Array.isArray(arr) || arr.length === 0) return []
    if (typeof arr[0] === "string") return arr as string[]
    return (arr as { start: string }[]).map((e) => e.start?.slice(0, 10)).filter(Boolean)
  } catch { return [] }
}

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
      select: { id: true, title: true, description: true, deadline: true, progress: true, type: true, createdAt: true },
    }),
    db.task.findMany({
      where: { userId, goalId: id },
      select: { title: true, category: true, completedSections: true, completed: true, updatedAt: true },
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

  // Per-category completion stats
  const categoryMap = new Map<string, { total: number; completions: number; lastDate: string | null }>()
  for (const task of tasks) {
    const cat = task.category || "Uncategorized"
    if (!categoryMap.has(cat)) categoryMap.set(cat, { total: 0, completions: 0, lastDate: null })
    const entry = categoryMap.get(cat)!
    entry.total++
    const dates = parseCompletedDates(task.completedSections)
    const count = dates.length > 0 ? dates.length : (task.completed ? 1 : 0)
    entry.completions += count
    const last = dates.sort().at(-1) ?? (task.completed ? toLocalDateStr(task.updatedAt) : null)
    if (last && (!entry.lastDate || last > entry.lastDate)) entry.lastDate = last
  }

  // Weekly completion trend (last 6 weeks, oldest first)
  const weeklyTrend = Array.from({ length: 6 }, (_, i) => {
    const wStart = new Date(today)
    wStart.setDate(today.getDate() - (5 - i) * 7)
    const wEnd = new Date(wStart)
    wEnd.setDate(wStart.getDate() + 7)
    const wStartStr = toLocalDateStr(wStart)
    const wEndStr = toLocalDateStr(wEnd)
    let completed = 0
    for (const task of tasks) {
      const dates = parseCompletedDates(task.completedSections)
      completed += dates.filter((d) => d >= wStartStr && d < wEndStr).length
    }
    return { weekLabel: `Week ending ${toLocalDateStr(wEnd)}`, completed }
  }).filter((w) => w.completed > 0)

  const categoryStats = Array.from(categoryMap.entries()).map(([cat, d]) => ({
    category: cat,
    taskCount: d.total,
    totalCompletions: d.completions,
    lastCompletedDate: d.lastDate,
    completionRate: d.total > 0 ? Math.round((d.completions / d.total) * 100) : 0,
  }))

  const context = {
    goal: {
      title: goal.title,
      description: goal.description || null,
      type: goal.type,
      deadline: deadline ? toLocalDateStr(deadline) : null,
      currentProgress: goal.progress,
      daysElapsed: elapsedDays,
      daysRemaining: remainingDays,
      expectedProgressAtThisPoint: expectedProgress,
      progressDelta: expectedProgress !== null ? goal.progress - expectedProgress : null,
    },
    linkedTasks: {
      total: tasks.length,
      categories: categoryStats,
    },
    weeklyCompletionTrend: weeklyTrend,
    today: todayStr,
  }

  const model = getGeminiModel(true)
  const prompt = `You are a goal achievement prediction system. Analyze the data and give an honest, data-driven assessment.

Data:
${JSON.stringify(context, null, 2)}

Notes:
- progressDelta = actual progress minus expected progress. Negative = behind schedule.
- completionRate per category = how consistently the user completes tasks in that group.
- weeklyCompletionTrend shows task completions per week (only weeks with activity shown).
- If linkedTasks.total is 0, base prediction purely on progress vs deadline timeline.

Return ONLY valid JSON with this exact structure (no markdown):
{
  "probability": <integer 0-100>,
  "status": <"ahead" | "on_track" | "behind" | "at_risk">,
  "summary": <2-3 sentence honest assessment>,
  "insights": [<2-4 specific data-driven observations mentioning actual numbers>],
  "recommendation": <one concrete actionable next step>,
  "action": <"continue" | "increase_frequency" | "extend_deadline" | "reduce_scope" | "focus_bottleneck">,
  "revisedDeadline": <"YYYY-MM-DD" string if they need more time, null if on track or no deadline>,
  "bottleneckCategory": <category name that needs most attention, or null>
}`

  try {
    const result = await model.generateContent(prompt)
    const prediction = JSON.parse(result.response.text())
    return NextResponse.json(prediction)
  } catch {
    return NextResponse.json({ error: "Failed to generate prediction" }, { status: 500 })
  }
}
