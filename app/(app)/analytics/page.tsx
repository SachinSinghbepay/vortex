import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getAllTasksAnalytics, getAllGoalsAnalytics, getFocusLogsAnalytics } from "@/lib/queries"
import { AnalyticsClient } from "@/components/analytics/analytics-client"

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  const userId = session!.user.id

  const [allTasks, goals, focusLogs] = await Promise.all([
    getAllTasksAnalytics(userId),
    getAllGoalsAnalytics(userId),
    getFocusLogsAnalytics(userId),
  ])

  // ── Streak ────────────────────────────────────────────────────────────────
  const completedTasks = allTasks.filter((t) => t.completed)
  const activityDates = new Set<string>()
  completedTasks.forEach((t) => activityDates.add(t.updatedAt.toISOString().slice(0, 10)))
  focusLogs.forEach((f) => activityDates.add(f.createdAt.toISOString().slice(0, 10)))

  let streak = 0
  const todayDate = new Date()
  for (let i = 0; i < 60; i++) {
    const d = new Date(todayDate)
    d.setDate(d.getDate() - i)
    if (activityDates.has(d.toISOString().slice(0, 10))) streak++
    else break
  }

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
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return {
      day: start.toLocaleDateString("en-US", { weekday: "short" }),
      completed: completedTasks.filter((t) => t.updatedAt >= start && t.updatedAt < end).length,
    }
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
  const activeGoals = goals
    .filter((g) => g.status === "ACTIVE")
    .map((g) => ({ title: g.title, progress: g.progress, type: g.type }))

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
    />
  )
}
