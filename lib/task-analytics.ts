export function parseJsonArray(raw: string): string[] {
  try {
    const arr = JSON.parse(raw || "[]")
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : []
  } catch { return [] }
}

export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function countExpectedOccurrences(
  recurrence: string,
  startDate: Date,
  endDate: Date,
  customDates: string[],
): number {
  if (endDate < startDate) return 0
  const days = Math.round((endDate.getTime() - startDate.getTime()) / 86400000)
  switch (recurrence) {
    case "DAILY": return days + 1
    case "EVERY_OTHER_DAY": return Math.floor(days / 2) + 1
    case "WEEKLY": return Math.floor(days / 7) + 1
    case "CUSTOM_DATES": {
      const s = toLocalDateStr(startDate)
      const e = toLocalDateStr(endDate)
      return customDates.filter((d) => d >= s && d <= e).length
    }
    default: return 0
  }
}

export type TaskAdherence = {
  title: string
  category: string
  priority: string
  type: "recurring" | "one_time"
  recurrence?: string
  expectedOccurrences?: number
  completedCount?: number
  skippedCount?: number
  missedCount?: number
  adherenceRate?: number
  currentStreak?: number
  lastCompletedDate?: string | null
  daysSinceLastCompletion?: number | null
  dueDate?: string | null
  completed?: boolean
  isOverdue?: boolean
  daysOverdue?: number | null
}

type RawTask = {
  title: string
  category: string | null
  priority: string
  recurrence: string
  startDate: Date | null
  dueDate: Date | null
  recurrenceEndDate: Date | null
  completedSections: string
  skippedDates: string
  customDates: string
  completed: boolean
  createdAt: Date
}

export function computeTaskAdherence(task: RawTask, today: Date): TaskAdherence {
  const completedDates = parseJsonArray(task.completedSections)
  const skippedDatesArr = parseJsonArray(task.skippedDates)
  const customDatesArr = parseJsonArray(task.customDates)
  const isRecurring = task.recurrence !== "NONE"

  const taskStart = new Date(task.startDate ?? task.createdAt)
  taskStart.setHours(0, 0, 0, 0)

  const sortedCompleted = [...completedDates].sort()
  const lastCompletedDate = sortedCompleted.at(-1) ?? null
  const daysSinceLastCompletion = lastCompletedDate
    ? Math.round((today.getTime() - new Date(lastCompletedDate + "T00:00:00").getTime()) / 86400000)
    : null

  if (isRecurring) {
    const effectiveEnd = task.recurrenceEndDate
      ? new Date(Math.min(new Date(task.recurrenceEndDate).getTime(), today.getTime()))
      : new Date(today)
    effectiveEnd.setHours(0, 0, 0, 0)

    const expectedOccurrences = countExpectedOccurrences(task.recurrence, taskStart, effectiveEnd, customDatesArr)
    const completedCount = completedDates.length
    const skippedCount = skippedDatesArr.length
    const missedCount = Math.max(0, expectedOccurrences - completedCount - skippedCount)
    const adherenceRate = expectedOccurrences > 0 ? Math.round((completedCount / expectedOccurrences) * 100) : 0

    const completedSet = new Set(completedDates)
    let currentStreak = 0
    for (let i = 0; i <= 60; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      if (completedSet.has(toLocalDateStr(d))) currentStreak++
      else break
    }

    return {
      title: task.title,
      category: task.category ?? "Uncategorized",
      priority: task.priority,
      type: "recurring",
      recurrence: task.recurrence,
      expectedOccurrences,
      completedCount,
      skippedCount,
      missedCount,
      adherenceRate,
      currentStreak,
      lastCompletedDate,
      daysSinceLastCompletion,
    }
  } else {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null
    if (dueDate) dueDate.setHours(0, 0, 0, 0)
    const isOverdue = !task.completed && dueDate !== null && dueDate < today
    const daysOverdue = isOverdue && dueDate
      ? Math.round((today.getTime() - dueDate.getTime()) / 86400000)
      : null

    return {
      title: task.title,
      category: task.category ?? "Uncategorized",
      priority: task.priority,
      type: "one_time",
      dueDate: dueDate ? toLocalDateStr(dueDate) : null,
      completed: task.completed,
      lastCompletedDate,
      isOverdue,
      daysOverdue,
    }
  }
}
