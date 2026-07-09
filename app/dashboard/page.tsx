export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { getUserStreak } from "@/lib/streak"
import { getDailyQuote } from "@/lib/quotes"
import { cookies } from "next/headers"

type TaskRow = {
  id: string
  title: string
  priority: string
  completed: boolean
  recurrence: string
  startDate: Date | null
  dueDate: Date | null
  recurrenceEndDate: Date | null
  completedSections: string
  skippedDates: string
  customDates: string
  createdAt: Date
  updatedAt: Date
}

function isActiveToday(task: TaskRow, today: Date, todayStr: string): boolean {
  if (task.recurrence === "NONE") {
    if (!task.dueDate) return false
    const due = new Date(task.dueDate)
    due.setHours(0, 0, 0, 0)
    return due.getTime() === today.getTime() && !task.completed
  }

  const start = new Date(task.startDate ?? task.createdAt)
  start.setHours(0, 0, 0, 0)
  if (start.getTime() > today.getTime()) return false

  if (task.recurrenceEndDate) {
    const end = new Date(task.recurrenceEndDate)
    end.setHours(0, 0, 0, 0)
    if (end.getTime() < today.getTime()) return false
  }

  try {
    if ((JSON.parse(task.completedSections) as string[]).includes(todayStr)) return false
  } catch { /* empty */ }

  try {
    if ((JSON.parse(task.skippedDates) as string[]).includes(todayStr)) return false
  } catch { /* empty */ }

  if (task.recurrence === "DAILY") return true

  if (task.recurrence === "EVERY_OTHER_DAY") {
    const diff = Math.round((today.getTime() - start.getTime()) / 86400000)
    return diff % 2 === 0
  }

  if (task.recurrence === "CUSTOM_DATES") {
    try {
      return (JSON.parse(task.customDates) as string[]).includes(todayStr)
    } catch { return false }
  }

  return true
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = session!.user.id
  const tz = (await cookies()).get("tz")?.value

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toLocalDateStr(today)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const fetchData = () => Promise.all([
    db.goal.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    db.task.findMany({
      where: { userId },
      select: {
        id: true, title: true, priority: true, completed: true,
        recurrence: true, startDate: true, dueDate: true,
        recurrenceEndDate: true, completedSections: true,
        skippedDates: true, customDates: true, createdAt: true, updatedAt: true,
      },
    }),
    db.focusLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 7,
    }),
    getUserStreak(userId, tz),
    db.task.findMany({
      where: { userId, completed: false, recurrence: { not: "NONE" }, createdAt: { lte: sevenDaysAgo } },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, priority: true, createdAt: true, completedSections: true },
    }),
  ])

  // Retry once on Neon cold-start errors (DB was paused/sleeping)
  const [goals, allTasks, recentFocus, streak, staleTasks] = await fetchData().catch(async (err) => {
    const msg = err instanceof Error ? err.message : ""
    if (msg.includes("Can't reach database") || msg.includes("connect")) {
      await new Promise((r) => setTimeout(r, 2000))
      return fetchData()
    }
    throw err
  })

  // Run goal count in parallel with data fetch (separate to avoid breaking tuple inference)
  const totalActiveGoals = await db.goal.count({ where: { userId, status: "ACTIVE" } })

  // Due today: recurring tasks active today + one-time tasks with dueDate=today
  const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
  const allDueToday = allTasks.filter((t) => isActiveToday(t, today, todayStr))
  const tasksDueToday = allDueToday
    .sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2))
    .slice(0, 6)
    .map((t) => ({ id: t.id, title: t.title, priority: t.priority, completed: t.completed }))

  // Completion rate: tasks completed at least once (completedSections OR legacy completed=true)
  const completedCount = allTasks.filter((t) => {
    try {
      const dates = JSON.parse(t.completedSections) as unknown[]
      if (Array.isArray(dates) && dates.length > 0) return true
    } catch { /* empty */ }
    return t.completed
  }).length
  const completionRate = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0

  // Weekly activity: task completions per day for last 7 days (oldest→today)
  const weeklyActivityRaw = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    const dayStr = toLocalDateStr(d)
    let count = 0
    for (const t of allTasks) {
      try {
        const dates = JSON.parse(t.completedSections) as string[]
        if (Array.isArray(dates) && dates.includes(dayStr)) { count++; continue }
      } catch { /* empty */ }
      if (t.completed && toLocalDateStr(t.updatedAt) === dayStr) count++
    }
    return count
  })
  const maxActivity = Math.max(...weeklyActivityRaw, 1)
  const weeklyActivity = weeklyActivityRaw.map((v) => Math.round((v / maxActivity) * 100))

  const avgFocus =
    recentFocus.length > 0
      ? Math.round(recentFocus.reduce((s, l) => s + l.focus, 0) / recentFocus.length)
      : 0

  const quote = getDailyQuote()

  // Compute daysAvoided from last completion date, filter to tasks not done in 7+ days
  const procrastinatedTasks = staleTasks
    .map((t) => {
      let lastDone = t.createdAt
      try {
        const dates = JSON.parse(t.completedSections) as string[]
        if (Array.isArray(dates) && dates.length > 0) {
          const latest = [...dates].sort().at(-1)!
          lastDone = new Date(latest + "T00:00:00")
        }
      } catch { /* empty */ }
      return {
        id: t.id,
        title: t.title,
        priority: t.priority,
        daysAvoided: Math.floor((today.getTime() - new Date(lastDone).getTime()) / 86400000),
      }
    })
    .filter((t) => t.daysAvoided >= 7)
    .sort((a, b) => b.daysAvoided - a.daysAvoided)
    .slice(0, 5)

  return (
    <DashboardClient
      user={session!.user}
      goals={goals}
      tasksDueToday={tasksDueToday}
      streak={streak.streak}
      streakStatus={streak.status}
      quote={quote}
      procrastinatedTasks={procrastinatedTasks}
      weeklyActivity={weeklyActivity}
      stats={{
        activeGoals: totalActiveGoals,
        tasksDueToday: allDueToday.length,
        completionRate,
        focusScore: avgFocus,
      }}
    />
  )
}
