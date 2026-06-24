import { db } from "@/lib/db"

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export async function getUserStreak(userId: string): Promise<number> {
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
  const sixtyDaysAgoStr = toLocalDateStr(sixtyDaysAgo)

  const [tasks, focusLogs] = await Promise.all([
    db.task.findMany({
      where: { userId },
      select: { completed: true, completedSections: true, updatedAt: true },
    }),
    db.focusLog.findMany({
      where: { userId, createdAt: { gte: sixtyDaysAgo } },
      select: { createdAt: true },
    }),
  ])

  const activityDates = new Set<string>()

  tasks.forEach((t) => {
    try {
      const dates = JSON.parse(t.completedSections) as unknown[]
      if (Array.isArray(dates) && dates.length > 0) {
        dates.forEach((d) => {
          if (typeof d === "string" && d >= sixtyDaysAgoStr) activityDates.add(d.slice(0, 10))
        })
        return
      }
    } catch { /* empty */ }
    if (t.completed && t.updatedAt >= sixtyDaysAgo) {
      activityDates.add(toLocalDateStr(t.updatedAt))
    }
  })

  focusLogs.forEach((f) => activityDates.add(toLocalDateStr(f.createdAt)))

  let streak = 0
  const today = new Date()
  for (let i = 0; i < 60; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (activityDates.has(toLocalDateStr(d))) streak++
    else break
  }

  return streak
}
