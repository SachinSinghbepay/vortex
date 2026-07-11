import { db } from "@/lib/db"

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export type StreakStatus = "active" | "grace" | "missed" | "lost"
// active  = completed today
// grace   = today not done yet, yesterday was done (first warning — show after 8pm)
// missed  = yesterday missed, today is still the second chance (always show warning)
// lost    = 2+ consecutive days missed

export type StreakResult = {
  streak: number
  status: StreakStatus
}

function getTodayInTz(tz?: string): string {
  if (tz) {
    try {
      return new Date().toLocaleDateString("en-CA", { timeZone: tz })
    } catch { /* invalid tz, fall through */ }
  }
  return toLocalDateStr(new Date())
}

export async function getUserStreak(userId: string, tz?: string): Promise<StreakResult> {
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

  const todayStr = getTodayInTz(tz)
  const today = new Date(todayStr + "T12:00:00")

  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const yesterdayStr = toLocalDateStr(yesterday)

  const twoDaysAgo = new Date(today)
  twoDaysAgo.setDate(today.getDate() - 2)
  const twoDaysAgoStr = toLocalDateStr(twoDaysAgo)

  const hasToday     = activityDates.has(todayStr)
  const hasYesterday = activityDates.has(yesterdayStr)
  const has2DaysAgo  = activityDates.has(twoDaysAgoStr)

  // Lost only after 2 consecutive missed days
  if (!hasToday && !hasYesterday && !has2DaysAgo) {
    return { streak: 0, status: "lost" }
  }

  // Helper: count consecutive days backwards from a starting offset
  function countBack(startOffset: number): number {
    let s = 0
    for (let i = startOffset; i <= 61; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      if (activityDates.has(toLocalDateStr(d))) s++
      else break
    }
    return s
  }

  if (hasToday) {
    return { streak: countBack(1) + 1, status: "active" }
  }

  if (hasYesterday) {
    // Missed today — first warning, still have until midnight
    return { streak: countBack(1), status: "grace" }
  }

  // Missed yesterday, today is the second (last) chance
  return { streak: countBack(2), status: "missed" }
}
