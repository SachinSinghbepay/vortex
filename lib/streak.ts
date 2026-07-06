import { db } from "@/lib/db"

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export type StreakStatus = "active" | "grace" | "lost"

export type StreakResult = {
  streak: number
  status: StreakStatus
}

export async function getUserStreak(userId: string): Promise<StreakResult> {
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

  const today = new Date()
  const todayStr = toLocalDateStr(today)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const yesterdayStr = toLocalDateStr(yesterday)

  const hasToday = activityDates.has(todayStr)
  const hasYesterday = activityDates.has(yesterdayStr)

  // Neither today nor yesterday → streak is gone
  if (!hasToday && !hasYesterday) {
    return { streak: 0, status: "lost" }
  }

  // Count consecutive completed days from yesterday backwards
  let streakFromYesterday = 0
  for (let i = 1; i <= 60; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    if (activityDates.has(toLocalDateStr(d))) streakFromYesterday++
    else break
  }

  if (hasToday) {
    return { streak: streakFromYesterday + 1, status: "active" }
  }

  // hasYesterday but not today → grace period
  return { streak: streakFromYesterday, status: "grace" }
}
