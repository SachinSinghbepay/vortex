import { db } from "@/lib/db"

export async function getUserStreak(userId: string): Promise<number> {
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const [completedTasks, focusLogs] = await Promise.all([
    db.task.findMany({
      where: { userId, completed: true, updatedAt: { gte: sixtyDaysAgo } },
      select: { updatedAt: true },
    }),
    db.focusLog.findMany({
      where: { userId, createdAt: { gte: sixtyDaysAgo } },
      select: { createdAt: true },
    }),
  ])

  const activityDates = new Set<string>()
  completedTasks.forEach((t) => activityDates.add(t.updatedAt.toISOString().slice(0, 10)))
  focusLogs.forEach((f) => activityDates.add(f.createdAt.toISOString().slice(0, 10)))

  let streak = 0
  const today = new Date()
  for (let i = 0; i < 60; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (activityDates.has(d.toISOString().slice(0, 10))) streak++
    else break
  }

  return streak
}
