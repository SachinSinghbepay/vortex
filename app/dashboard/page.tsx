import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { getUserStreak } from "@/lib/streak"
import { getDailyQuote } from "@/lib/quotes"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = session!.user.id

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [goals, tasksDueToday, totalTasks, completedTasks, recentFocus, streak, staleTasks] =
    await Promise.all([
      db.goal.findMany({
        where: { userId, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      db.task.findMany({
        where: { userId, dueDate: { gte: today, lt: tomorrow }, completed: false },
        orderBy: { priority: "desc" },
        take: 6,
      }),
      db.task.count({ where: { userId } }),
      db.task.count({ where: { userId, completed: true } }),
      db.focusLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 7,
      }),
      getUserStreak(userId),
      db.task.findMany({
        where: { userId, completed: false, createdAt: { lte: sevenDaysAgo } },
        orderBy: { createdAt: "asc" }, // oldest (most avoided) first
        take: 5,
        select: { id: true, title: true, priority: true, createdAt: true },
      }),
    ])

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const avgFocus =
    recentFocus.length > 0
      ? Math.round(recentFocus.reduce((s, l) => s + l.focus, 0) / recentFocus.length)
      : 0

  const quote = getDailyQuote()

  const procrastinatedTasks = staleTasks.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    daysAvoided: Math.floor((today.getTime() - t.createdAt.getTime()) / 86400000),
  }))

  return (
    <DashboardClient
      user={session!.user}
      goals={goals}
      tasksDueToday={tasksDueToday}
      streak={streak}
      quote={quote}
      procrastinatedTasks={procrastinatedTasks}
      stats={{
        activeGoals: goals.length,
        tasksDueToday: tasksDueToday.length,
        completionRate,
        focusScore: avgFocus,
      }}
    />
  )
}
