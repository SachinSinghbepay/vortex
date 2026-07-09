import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getAllTasksAnalytics, getAllGoalsAnalytics, getFocusLogsAnalytics } from "@/lib/queries"
import { AnalyticsClient } from "@/components/analytics/analytics-client"
import { cookies } from "next/headers"

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// Parse completedSections — handles both string[] and legacy {start,end}[] formats
function parseCompletedDates(raw: string): string[] {
  try {
    const arr = JSON.parse(raw || "[]")
    if (!Array.isArray(arr) || arr.length === 0) return []
    if (typeof arr[0] === "string") return arr as string[]
    return (arr as { start: string }[]).map((e) => e.start?.slice(0, 10)).filter(Boolean)
  } catch { return [] }
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  const userId = session!.user.id
  const tz = (await cookies()).get("tz")?.value

  const [allTasks, goals, focusLogs, currentUser] = await Promise.all([
    getAllTasksAnalytics(userId),
    getAllGoalsAnalytics(userId),
    getFocusLogsAnalytics(userId),
    db.user.findUnique({ where: { id: userId }, select: { schedule: true } }),
  ])

  // ── Build per-task completion date sets ───────────────────────────────────
  const taskCompletionDates = allTasks.map((t) => {
    const sections = parseCompletedDates(t.completedSections)
    const dates = new Set<string>(sections)
    if (t.completed && dates.size === 0) {
      dates.add(toLocalDateStr(t.updatedAt))
    }
    return { task: t, dates }
  })

  const completedTasks = taskCompletionDates.filter(({ dates, task }) => dates.size > 0 || task.completed)

  // ── Streak ────────────────────────────────────────────────────────────────
  const activityDates = new Set<string>()
  taskCompletionDates.forEach(({ dates, task }) => {
    dates.forEach((d) => activityDates.add(d))
    if (task.completed && dates.size === 0) {
      activityDates.add(toLocalDateStr(task.updatedAt))
    }
  })
  focusLogs.forEach((f) => activityDates.add(toLocalDateStr(f.createdAt)))

  const todayStreak = tz
    ? (() => { try { return new Date().toLocaleDateString("en-CA", { timeZone: tz }) } catch { return toLocalDateStr(new Date()) } })()
    : toLocalDateStr(new Date())
  const todayDate = new Date(todayStreak + "T12:00:00")
  let streakFromYesterday = 0
  for (let i = 1; i <= 60; i++) {
    const d = new Date(todayDate)
    d.setDate(d.getDate() - i)
    if (activityDates.has(toLocalDateStr(d))) streakFromYesterday++
    else break
  }
  const streak = activityDates.has(todayStreak) ? streakFromYesterday + 1 : streakFromYesterday

  // ── Rates ─────────────────────────────────────────────────────────────────
  const taskCompletionRate = allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0
  const completedGoals = goals.filter((g) => g.status === "COMPLETED").length
  const goalCompletionRate = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0

  // ── Alignment score ───────────────────────────────────────────────────────
  const linkedTasks = allTasks.filter((t) => t.goalId).length
  const alignmentScore = allTasks.length > 0 ? Math.round((linkedTasks / allTasks.length) * 100) : 0

  // ── Weekly focus by day (last 7) ──────────────────────────────────────────
  const weeklyFocusByDay = Array.from({ length: 7 }, (_, i) => {
    const start = new Date(todayDate)
    start.setDate(start.getDate() - (6 - i))
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    const mins = focusLogs
      .filter((f) => f.createdAt >= start && f.createdAt < end)
      .reduce((s, f) => s + f.duration, 0)
    return {
      day: start.toLocaleDateString("en-US", { weekday: "short" }),
      minutes: mins,
    }
  })

  const weeklyFocusMinutes = weeklyFocusByDay.reduce((s, d) => s + d.minutes, 0)

  // ── Energy/Focus/Stress trend (last 10 logs) ──────────────────────────────
  const energyTrend = focusLogs.slice(0, 10).reverse().map((l) => ({
    date: l.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    energy: l.energy,
    focus: l.focus,
    stress: l.stress,
  }))

  // ── Tasks completed by day (last 7) ───────────────────────────────────────
  const tasksByDay = Array.from({ length: 7 }, (_, i) => {
    const start = new Date(todayDate)
    start.setDate(start.getDate() - (6 - i))
    start.setHours(0, 0, 0, 0)
    const dayStr = toLocalDateStr(start)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)

    let count = 0
    for (const { dates, task } of taskCompletionDates) {
      if (dates.has(dayStr)) {
        count++
      } else if (task.completed && dates.size === 0 && task.updatedAt >= start && task.updatedAt < end) {
        count++
      }
    }
    return { day: start.toLocaleDateString("en-US", { weekday: "short" }), completed: count }
  })

  // ── Burnout risk ──────────────────────────────────────────────────────────
  const recentStress = focusLogs.slice(0, 7).map((l) => l.stress)
  const avgStress = recentStress.length ? recentStress.reduce((s, v) => s + v, 0) / recentStress.length : 0
  const overdueTasks = allTasks.filter(
    (t) => !t.completed && t.dueDate && t.dueDate < todayDate
  ).length
  const burnoutScore = Math.min(100, Math.round((avgStress / 10) * 60 + Math.min(40, overdueTasks * 8)))
  const burnoutLevel = burnoutScore >= 70 ? "HIGH" : burnoutScore >= 40 ? "MEDIUM" : "LOW"

  // ── Serialize goals ───────────────────────────────────────────────────────
  const activeGoalsRaw = goals.filter((g) => g.status === "ACTIVE")
  const activeGoals = activeGoalsRaw.map((g) => ({ title: g.title, progress: g.progress, type: g.type }))
  const scheduleGoals = activeGoalsRaw.map((g) => ({ id: g.id, title: g.title, description: g.description ?? null, type: g.type }))

  // ── Parse saved schedule (handles both old flat format and new activities/habits format) ──
  type ActivityRow = { name: string; Mon: number; Tue: number; Wed: number; Thu: number; Fri: number; Sat: number; Sun: number }
  type GoalSchedule = { title: string; activities: ActivityRow[]; habits: { name: string; target: string }[] }
  let savedSchedule: Record<string, GoalSchedule> = {}
  try {
    const raw = JSON.parse(currentUser?.schedule ?? "{}")
    for (const [goalId, entry] of Object.entries(raw)) {
      const e = entry as Record<string, unknown>
      if (Array.isArray(e.activities)) {
        savedSchedule[goalId] = e as unknown as GoalSchedule
      } else if (typeof e.Mon === "number" || typeof e.Tue === "number") {
        // legacy flat format — convert to new structure
        const { title, Mon = 0, Tue = 0, Wed = 0, Thu = 0, Fri = 0, Sat = 0, Sun = 0 } = e as { title: string } & Record<string, number>
        savedSchedule[goalId] = { title, activities: [{ name: title, Mon, Tue, Wed, Thu, Fri, Sat, Sun }], habits: [] }
      }
    }
  } catch { /* empty */ }

  return (
    <AnalyticsClient
      streak={streak}
      taskCompletionRate={taskCompletionRate}
      goalCompletionRate={goalCompletionRate}
      weeklyFocusMinutes={weeklyFocusMinutes}
      alignmentScore={alignmentScore}
      burnoutScore={burnoutScore}
      burnoutLevel={burnoutLevel}
      weeklyFocusByDay={weeklyFocusByDay}
      energyTrend={energyTrend}
      tasksByDay={tasksByDay}
      activeGoals={activeGoals}
      totalTasks={allTasks.length}
      completedTasks={completedTasks.length}
      scheduleGoals={scheduleGoals}
      savedSchedule={savedSchedule}
    />
  )
}
