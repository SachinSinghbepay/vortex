"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, CheckCircle2, Circle, Trash2, Calendar, Sparkles, Repeat, ChevronDown, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { BreakdownModal } from "@/components/ai/breakdown-modal"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/ui/page-transition"

type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"

interface Task {
  id: string
  title: string
  completed: boolean
  startDate: string | null
  dueDate: string | null
  priority: Priority
  category: string | null
  recurrence: string
  recurrenceEndDate: string | null
  skippedDates: string
  updatedAt: string
  goal?: { id: string; title: string } | null
  createdAt: string
}

type TaskEntry = Task & { _group: string }

const priorityDot: Record<Priority, string> = {
  LOW: "bg-white/20",
  MEDIUM: "bg-blue-400",
  HIGH: "bg-orange-400",
  URGENT: "bg-red-400",
}

const filters = ["ALL", "TODAY", "PENDING", "COMPLETED"] as const

const inputCls =
  "w-full rounded-lg border border-white/[0.07] bg-white/4 px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none transition focus:border-violet-500/40 focus:bg-white/[0.07]"

const selectCls =
  "w-full rounded-lg border border-white/[0.07] bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-white outline-none"

const emptyForm = {
  title: "",
  priority: "MEDIUM" as Priority,
  dueDate: "",
  recurrence: "NONE" as "NONE" | "DAILY",
  startDate: "",
  recurrenceEndDate: "",
  category: "",
  goalId: "",
}

const formatDateForInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

interface Props {
  initialTasks: Task[]
  goals: Array<{ id: string; title: string }>
}

export function TasksClient({ initialTasks, goals }: Props) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)
  const tomorrowEnd = new Date(todayEnd)
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1)
  const thisWeekEnd = new Date(todayStart)
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 7)
  const nextWeekEnd = new Date(thisWeekEnd)
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 7)

  // Date range — default to current month, persisted in localStorage
  const defaultRangeStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const defaultRangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const getSavedRange = (): { start: Date; end: Date } | null => {
    if (typeof window === "undefined") return null
    try {
      const saved = localStorage.getItem("cortex-tasks-range")
      if (!saved) return null
      const { start, end } = JSON.parse(saved)
      return { start: new Date(start + "T00:00:00"), end: new Date(end + "T23:59:59") }
    } catch {
      return null
    }
  }

  const saveRange = (s: Date, e: Date) => {
    try {
      localStorage.setItem("cortex-tasks-range", JSON.stringify({
        start: formatDateForInput(s),
        end: formatDateForInput(e),
      }))
    } catch { /* empty */ }
  }

  const saved = getSavedRange()
  const initRangeStart = saved?.start ?? defaultRangeStart
  const initRangeEnd = saved?.end ?? defaultRangeEnd

  const [tasks, setTasks] = useState(initialTasks)
  const [filter, setFilter] = useState<(typeof filters)[number]>("ALL")
  const [rangeStart, setRangeStart] = useState(initRangeStart)
  const [rangeEnd, setRangeEnd] = useState(initRangeEnd)
  const [showRangePicker, setShowRangePicker] = useState(false)
  const [pickerStart, setPickerStart] = useState(formatDateForInput(initRangeStart))
  const [pickerEnd, setPickerEnd] = useState(formatDateForInput(initRangeEnd))
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [breakdownTask, setBreakdownTask] = useState<Task | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)
  const [deleteGroup, setDeleteGroup] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<Task | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)

  // ── Date range helpers ──────────────────────────────────────────────────────

  const isFullMonth = (s: Date, e: Date) =>
    s.getDate() === 1 &&
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    e.getDate() === new Date(s.getFullYear(), s.getMonth() + 1, 0).getDate()

  const rangeLabel = isFullMonth(rangeStart, rangeEnd)
    ? rangeStart.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : `${rangeStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${rangeEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`

  const applyPreset = (offset: number) => {
    const s = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const e = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59)
    setRangeStart(s)
    setRangeEnd(e)
    setPickerStart(formatDateForInput(s))
    setPickerEnd(formatDateForInput(new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)))
    setShowRangePicker(false)
    saveRange(s, e)
  }

  const applyCustomRange = () => {
    if (!pickerStart || !pickerEnd) return
    const s = new Date(pickerStart + "T00:00:00")
    const e = new Date(pickerEnd + "T23:59:59")
    setRangeStart(s)
    setRangeEnd(e)
    setShowRangePicker(false)
    saveRange(s, e)
  }

  // A task is "in the selected date range" (for ALL/PENDING/COMPLETED)
  const isInDateRange = (t: Task) => {
    if (t.recurrence === "DAILY") {
      const start = t.startDate ? new Date(t.startDate) : new Date(t.createdAt)
      const end = t.recurrenceEndDate ? new Date(t.recurrenceEndDate) : null
      // Always include tasks starting within the Next Week window even if that
      // window bleeds past the range end (e.g. Jun range ends Jun 30 but Next Week
      // runs to Jul 4 — a task starting Jul 1 should still show under Next Week)
      const effectiveEnd = rangeEnd < nextWeekEnd ? nextWeekEnd : rangeEnd
      return start <= effectiveEnd && (end === null || end >= rangeStart)
    }
    const d = t.startDate ? new Date(t.startDate) : t.dueDate ? new Date(t.dueDate) : null
    if (!d) return true // no-date tasks always visible
    return d >= rangeStart && d <= rangeEnd
  }

  // ── Skip helpers ────────────────────────────────────────────────────────────

  const getSectionDateRange = (group: string): { start: Date; end: Date } | null => {
    if (group === "Today") return { start: todayStart, end: todayEnd }
    if (group === "Tomorrow") return { start: todayEnd, end: tomorrowEnd }
    if (group === "This Week") return { start: tomorrowEnd, end: thisWeekEnd }
    if (group === "Next Week") return { start: thisWeekEnd, end: nextWeekEnd }
    const d = new Date(group)
    if (!isNaN(d.getTime()))
      return { start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth() + 1, 1) }
    return null
  }

  const isSectionSkipped = (t: Task, sectionStart: Date): boolean => {
    try {
      const skipped: { start: string; end: string }[] = JSON.parse(t.skippedDates || "[]")
      return skipped.some((r) => {
        const s = new Date(r.start + "T00:00:00")
        const e = new Date(r.end + "T23:59:59")
        return sectionStart >= s && sectionStart <= e
      })
    } catch {
      return false
    }
  }

  // ── Task state helpers ──────────────────────────────────────────────────────

  const effectiveCompleted = (t: Task) => {
    if (t.recurrence !== "DAILY") return t.completed
    return t.completed && new Date(t.updatedAt) >= todayStart
  }

  const isInRange = (t: Task) => {
    if (t.recurrence !== "DAILY") return false
    const start = t.startDate ? new Date(t.startDate) : new Date(t.createdAt)
    const end = t.recurrenceEndDate ? new Date(t.recurrenceEndDate) : null
    return start <= todayEnd && (end === null || end >= todayStart)
  }

  const getTaskDate = (t: Task) =>
    t.startDate ? new Date(t.startDate) : t.dueDate ? new Date(t.dueDate) : null

  // ── Grouping ────────────────────────────────────────────────────────────────

  const getGroups = (t: Task): string[] => {
    // Non-recurring completed before today → dated "Completed" section
    if (t.recurrence !== "DAILY" && t.completed) {
      const completedDate = new Date(t.updatedAt)
      if (completedDate < todayStart) {
        return [`Completed ${completedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`]
      }
    }

    if (t.recurrence !== "DAILY") {
      const d = getTaskDate(t)
      if (!d) return ["No Date"]
      if (d < todayStart) return ["Overdue"]
      if (d < todayEnd) return ["Today"]
      if (d < tomorrowEnd) return ["Tomorrow"]
      if (d < thisWeekEnd) return ["This Week"]
      if (d < nextWeekEnd) return ["Next Week"]
      return [d.toLocaleDateString("en-US", { month: "long", year: "numeric" })]
    }

    // Recurring: show in every near-future section it's active in
    // (active today → Today only; future start → each applicable upcoming section)
    const start = t.startDate ? new Date(t.startDate) : new Date(t.createdAt)
    const end = t.recurrenceEndDate ? new Date(t.recurrenceEndDate) : null
    const activeIn = (sectionStart: Date, sectionEnd: Date) =>
      start < sectionEnd && (end === null || end >= sectionStart) && !isSectionSkipped(t, sectionStart)

    // Show in every section the task is active in, but only if that section overlaps the date range
    const inRange = (sectionStart: Date, sectionEnd: Date) =>
      sectionEnd > rangeStart && sectionStart <= rangeEnd

    const groups: string[] = []
    if (activeIn(todayStart, todayEnd) && inRange(todayStart, todayEnd)) groups.push("Today")
    if (activeIn(todayEnd, tomorrowEnd) && inRange(todayEnd, tomorrowEnd)) groups.push("Tomorrow")
    if (activeIn(tomorrowEnd, thisWeekEnd) && inRange(tomorrowEnd, thisWeekEnd)) groups.push("This Week")
    if (activeIn(thisWeekEnd, nextWeekEnd) && inRange(thisWeekEnd, nextWeekEnd)) groups.push("Next Week")

    // Beyond next week: one entry per month the task is active in, within the range
    const monthCursorStart = new Date(nextWeekEnd.getFullYear(), nextWeekEnd.getMonth(), 1)
    const rangeEndMonth = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth() + 1, 1)
    let cursor = new Date(monthCursorStart)
    while (cursor < rangeEndMonth) {
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
      if (activeIn(cursor, monthEnd) && inRange(cursor, monthEnd)) {
        const label = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })
        if (!groups.includes(label)) groups.push(label)
      }
      cursor = monthEnd
    }

    return groups.length > 0 ? groups : [start.toLocaleDateString("en-US", { month: "long", year: "numeric" })]
  }

  const groupTasks = (list: Task[]): [string, TaskEntry[]][] => {
    const order = ["Overdue", "Today", "Tomorrow", "This Week", "Next Week"]
    const map = new Map<string, TaskEntry[]>()
    for (const t of list) {
      for (const g of getGroups(t)) {
        if (!map.has(g)) map.set(g, [])
        map.get(g)!.push({ ...t, _group: g })
      }
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      const ai = order.indexOf(a), bi = order.indexOf(b)
      if (ai !== -1 && bi !== -1) return ai - bi
      if (ai !== -1) return -1
      if (bi !== -1) return 1
      const aC = a.startsWith("Completed "), bC = b.startsWith("Completed ")
      if (aC && !bC) return 1
      if (!aC && bC) return -1
      // Sort "Month Year" groups chronologically
      const aTime = new Date(a).getTime(), bTime = new Date(b).getTime()
      if (!isNaN(aTime) && !isNaN(bTime)) return aTime - bTime
      return a < b ? -1 : 1
    })
  }

  const isActiveToday = (t: Task) => {
    if (t.recurrence === "DAILY") return isInRange(t) && !effectiveCompleted(t) && !isSectionSkipped(t, todayStart)
    if (t.completed) return false
    if (t.startDate && t.dueDate) {
      const s = new Date(t.startDate), e = new Date(t.dueDate)
      return s <= todayEnd && e >= todayStart
    }
    if (t.dueDate) {
      const d = new Date(t.dueDate)
      return d >= todayStart && d < todayEnd
    }
    return false
  }

  // ── Filtering ───────────────────────────────────────────────────────────────

  // TODAY bypasses date range; ALL/PENDING/COMPLETED respect it
  const filtered = tasks.filter((t) => {
    if (filter === "TODAY") return isActiveToday(t)
    if (!isInDateRange(t)) return false
    if (filter === "COMPLETED") return effectiveCompleted(t)
    if (filter === "PENDING") {
      if (t.recurrence === "DAILY") return isInRange(t) && !effectiveCompleted(t)
      return !t.completed
    }
    return true
  })

  const filterCount = (f: (typeof filters)[number]) => {
    if (f === "TODAY") return tasks.filter(isActiveToday).length
    const base = tasks.filter(isInDateRange)
    if (f === "ALL") return base.length
    if (f === "COMPLETED") return base.filter(effectiveCompleted).length
    if (f === "PENDING")
      return base.filter((t) => {
        if (t.recurrence === "DAILY") return isInRange(t) && !effectiveCompleted(t)
        return !t.completed
      }).length
    return 0
  }

  const remainingCount = tasks.filter(
    (t) => !effectiveCompleted(t) && (t.recurrence === "DAILY" ? isInRange(t) : true)
  ).length

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleToggle = async (id: string, completed: boolean) => {
    setTasks((p) => p.map((t) =>
      t.id === id ? { ...t, completed, updatedAt: new Date().toISOString() } : t
    ))
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    })
    if (completed) toast.success("Task completed ✓")
  }

  const handleDelete = async (id: string) => {
    setTasks((p) => p.filter((t) => t.id !== id))
    setDeleteTarget(null)
    await fetch(`/api/tasks/${id}`, { method: "DELETE" })
    toast("Task deleted")
  }

  const groupText = (g: string | null) =>
    g === "Today" ? "today"
    : g === "Tomorrow" ? "tomorrow"
    : g === "This Week" ? "this week"
    : g === "Next Week" ? "next week"
    : g?.toLowerCase() ?? "this occurrence"

  const handleSkipOccurrence = async (id: string) => {
    const range = deleteGroup ? getSectionDateRange(deleteGroup) : null
    if (!range) return
    const task = tasks.find((t) => t.id === id)
    if (!task) return

    let existing: { start: string; end: string }[] = []
    try { existing = JSON.parse(task.skippedDates || "[]") } catch { /* empty */ }

    const entry = {
      start: formatDateForInput(range.start),
      // range.end is exclusive (start of next period), so subtract 1 day for inclusive end
      end: formatDateForInput(new Date(range.end.getTime() - 86400000)),
    }
    const newSkipped = JSON.stringify([...existing, entry])

    setTasks((p) => p.map((t) => t.id === id ? { ...t, skippedDates: newSkipped } : t))
    setDeleteTarget(null)
    setDeleteGroup(null)
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skippedDates: newSkipped }),
    })
    toast(`Skipped ${groupText(deleteGroup)}`)
  }

  const handleStopAfter = async (id: string) => {
    const range = deleteGroup ? getSectionDateRange(deleteGroup) : null
    // range.end is exclusive — subtract 1ms to get last moment of this section
    const endDate = range ? new Date(range.end.getTime() - 1).toISOString() : todayStart.toISOString()

    setTasks((p) => p.map((t) => t.id === id ? { ...t, recurrenceEndDate: endDate } : t))
    setDeleteTarget(null)
    setDeleteGroup(null)
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recurrenceEndDate: endDate }),
    })
    toast(`Task stops after ${groupText(deleteGroup)}`)
  }

  const openEdit = (task: Task) => {
    setEditForm({
      title: task.title,
      priority: task.priority,
      recurrence: task.recurrence as "NONE" | "DAILY",
      startDate: task.startDate ? task.startDate.split("T")[0] : "",
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      recurrenceEndDate: task.recurrenceEndDate ? task.recurrenceEndDate.split("T")[0] : "",
      category: task.category ?? "",
      goalId: task.goal?.id ?? "",
    })
    setEditTarget(task)
  }

  const handleEdit = async () => {
    if (!editTarget || !editForm.title.trim()) return
    setSaving(true)
    try {
      const body = {
        title: editForm.title.trim(),
        priority: editForm.priority,
        category: editForm.category || null,
        goalId: editForm.goalId || null,
        recurrence: editForm.recurrence,
        ...(editForm.recurrence === "NONE"
          ? { dueDate: editForm.dueDate || null, startDate: null, recurrenceEndDate: null }
          : { startDate: editForm.startDate || null, dueDate: null, recurrenceEndDate: editForm.recurrenceEndDate || null }),
      }
      const res = await fetch(`/api/tasks/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setTasks((p) => p.map((t) =>
          t.id === editTarget.id
            ? {
                ...t,
                ...body,
                goal: editForm.goalId ? (goals.find((g) => g.id === editForm.goalId) ?? t.goal) : null,
              }
            : t
        ))
        setEditTarget(null)
        toast.success("Task updated")
      } else {
        toast.error("Failed to update task")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async () => {
    if (!form.title.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          priority: form.priority,
          category: form.category || null,
          goalId: form.goalId || null,
          recurrence: form.recurrence,
          ...(form.recurrence === "NONE"
            ? { dueDate: form.dueDate || null }
            : {
                startDate: form.startDate || new Date().toISOString().split("T")[0],
                dueDate: null,
                recurrenceEndDate: form.recurrenceEndDate || null,
              }),
        }),
      })
      if (res.ok) {
        const task = await res.json()
        setTasks((p) => [task, ...p])
        setShowCreate(false)
        setForm(emptyForm)
        toast.success("Task added")
      } else {
        toast.error("Failed to add task")
      }
    } finally {
      setCreating(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <PageTransition className="min-h-full p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Tasks</h1>
          <p className="mt-0.5 text-sm text-white/40">{remainingCount} remaining</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-1.5 bg-violet-600 text-white hover:bg-violet-500">
          <Plus className="h-4 w-4" /> New Task
        </Button>
      </div>

      {/* Filters + date range */}
      <div className="mb-6 flex items-center gap-1">
        {/* Filter tabs */}
        <div className="flex flex-1 gap-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white/70"
              )}
            >
              {f === "ALL" ? "All" : f[0] + f.slice(1).toLowerCase()}
              <span className="ml-1.5 text-white/25">{filterCount(f)}</span>
            </button>
          ))}
        </div>

        {/* Date range picker */}
        <div className="relative">
          <button
            onClick={() => setShowRangePicker((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors",
              showRangePicker
                ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                : "border-white/[0.07] text-white/40 hover:bg-white/5 hover:text-white/60"
            )}
          >
            <Calendar className="h-3 w-3" />
            {rangeLabel}
            <ChevronDown className={cn("h-3 w-3 transition-transform", showRangePicker && "rotate-180")} />
          </button>

          {showRangePicker && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-10" onClick={() => setShowRangePicker(false)} />

              {/* Dropdown */}
              <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-white/8 bg-[#141414] p-4 shadow-2xl">
                {/* Presets */}
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/25">Quick select</p>
                <div className="mb-3 flex gap-1.5">
                  {[
                    { label: "Last month", offset: -1 },
                    { label: "This month", offset: 0 },
                    { label: "Next month", offset: 1 },
                  ].map(({ label, offset }) => {
                    const s = new Date(now.getFullYear(), now.getMonth() + offset, 1)
                    const isActive = isFullMonth(rangeStart, rangeEnd) &&
                      rangeStart.getMonth() === s.getMonth() &&
                      rangeStart.getFullYear() === s.getFullYear()
                    return (
                      <button
                        key={label}
                        onClick={() => applyPreset(offset)}
                        className={cn(
                          "flex-1 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors",
                          isActive
                            ? "bg-violet-600 text-white"
                            : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
                        )}
                      >
                        {offset === 0 ? "This month" : offset === -1 ? "Last month" : "Next month"}
                      </button>
                    )
                  })}
                </div>

                {/* Custom range */}
                <div className="border-t border-white/6 pt-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/25">Custom range</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-white/30">From</label>
                      <input
                        type="date"
                        value={pickerStart}
                        onChange={(e) => setPickerStart(e.target.value)}
                        className="w-full rounded-lg border border-white/[0.07] bg-white/4 px-2.5 py-1.5 text-[11px] text-white scheme-dark outline-none focus:border-violet-500/40"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-white/30">To</label>
                      <input
                        type="date"
                        value={pickerEnd}
                        onChange={(e) => setPickerEnd(e.target.value)}
                        className="w-full rounded-lg border border-white/[0.07] bg-white/4 px-2.5 py-1.5 text-[11px] text-white scheme-dark outline-none focus:border-violet-500/40"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={applyCustomRange}
                    disabled={!pickerStart || !pickerEnd}
                    className="mt-2 w-full bg-violet-600 py-2 text-xs text-white hover:bg-violet-500"
                  >
                    Apply range
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Task list */}
      <div className="rounded-xl border border-white/6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="mb-2 h-8 w-8 text-white/10" />
            <p className="text-sm text-white/25">
              {filter === "COMPLETED" ? "No completed tasks in this range" : "No tasks in this range"}
            </p>
            {filter === "ALL" && (
              <Button
                onClick={() => setShowCreate(true)}
                variant="ghost"
                className="mt-3 gap-1.5 text-xs text-violet-400 hover:text-violet-300"
              >
                <Plus className="h-3.5 w-3.5" /> Add your first task
              </Button>
            )}
          </div>
        ) : (
          <div>
            {groupTasks(filtered).map(([groupLabel, groupItems]) => {
              const isCompletedGroup = groupLabel.startsWith("Completed ")
              const isOverdue = groupLabel === "Overdue"
              return (
                <div key={groupLabel}>
                  <div
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest",
                      isOverdue ? "text-red-400/70" : isCompletedGroup ? "text-white/40" : "text-white/25"
                    )}
                  >
                    {isOverdue && <span className="text-red-400">!</span>}
                    {isCompletedGroup ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        {groupLabel.replace("Completed ", "")}
                      </>
                    ) : (
                      groupLabel
                    )}
                    <span className="font-normal normal-case tracking-normal text-white/15">{groupItems.length}</span>
                  </div>
                  <ul className="divide-y divide-white/4">
                    {groupItems.map((task) => {
                      const done = effectiveCompleted(task)
                      return (
                        <li
                          key={`${task.id}-${task._group}`}
                          className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-white/2"
                        >
                          <button
                            onClick={() => handleToggle(task.id, !done)}
                            className="shrink-0 text-white/25 transition hover:text-violet-400"
                          >
                            {done ? (
                              <CheckCircle2 className="h-4 w-4 text-violet-400" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </button>

                          <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", priorityDot[task.priority])} />

                          <span
                            className={cn(
                              "flex-1 truncate text-sm",
                              done ? "text-white/25 line-through" : "text-white/75"
                            )}
                          >
                            {task.title}
                          </span>

                          {task.category && (
                            <span className="shrink-0 rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/30">
                              {task.category}
                            </span>
                          )}

                          {task.recurrence === "DAILY" ? (
                            <div className="flex shrink-0 items-center gap-1 text-xs text-violet-400/50">
                              <Repeat className="h-3 w-3" />
                              {task.recurrenceEndDate
                                ? `until ${new Date(task.recurrenceEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                                : "every day"}
                            </div>
                          ) : task.dueDate || task.startDate ? (
                            <div className="flex shrink-0 items-center gap-1 text-xs text-white/25">
                              <Calendar className="h-3 w-3" />
                              {task.startDate && task.dueDate
                                ? `${new Date(task.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                                : new Date((task.dueDate || task.startDate)!).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                            </div>
                          ) : null}

                          {task.goal && (
                            <span className="shrink-0 rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-400">
                              {task.goal.title}
                            </span>
                          )}

                          {!done && (
                            <button
                              onClick={() => setBreakdownTask(task)}
                              className="shrink-0 text-white/40 transition hover:text-violet-400"
                              title="Break down with AI"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => openEdit(task)}
                            className="shrink-0 text-white/40 transition hover:text-white/70"
                            title="Edit task"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => { setDeleteTarget(task); setDeleteGroup(task._group) }}
                            className="shrink-0 text-white/40 transition hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete dialog */}
      <Modal
        open={!!deleteTarget}
        onClose={() => { setDeleteTarget(null); setDeleteGroup(null) }}
        title={deleteTarget?.recurrence === "DAILY" ? "Remove repeating task" : "Delete task"}
      >
        {deleteTarget && (
          <div className="space-y-4">
            {deleteTarget.recurrence === "DAILY" ? (
              <>
                <p className="text-sm text-white/50">
                  <span className="text-white/80">"{deleteTarget.title}"</span> repeats every day. What would you like to do?
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => handleSkipOccurrence(deleteTarget.id)}
                    className="w-full rounded-lg border border-white/[0.07] px-4 py-3 text-left transition hover:bg-white/5"
                  >
                    <div className="text-sm text-white/80">Skip {groupText(deleteGroup)} only</div>
                    <div className="mt-0.5 text-xs text-white/30">
                      Hides {groupText(deleteGroup)}, keeps repeating before and after
                    </div>
                  </button>
                  <button
                    onClick={() => handleStopAfter(deleteTarget.id)}
                    className="w-full rounded-lg border border-white/[0.07] px-4 py-3 text-left transition hover:bg-white/5"
                  >
                    <div className="text-sm text-white/80">Stop after {groupText(deleteGroup)}</div>
                    <div className="mt-0.5 text-xs text-white/30">
                      Keeps repeating until {groupText(deleteGroup)}, then stops
                    </div>
                  </button>
                  <button
                    onClick={() => handleDelete(deleteTarget.id)}
                    className="w-full rounded-lg border border-red-500/20 px-4 py-3 text-left transition hover:bg-red-500/10"
                  >
                    <div className="text-sm text-red-400">Delete entirely</div>
                    <div className="mt-0.5 text-xs text-white/30">Removes all occurrences permanently</div>
                  </button>
                </div>
                <button
                  onClick={() => { setDeleteTarget(null); setDeleteGroup(null) }}
                  className="w-full py-1 text-center text-sm text-white/30 transition hover:text-white/50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-white/50">
                  Delete <span className="text-white/80">"{deleteTarget.title}"</span>? This can't be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setDeleteTarget(null)}
                    variant="ghost"
                    className="flex-1 border border-white/[0.07] text-white/50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleDelete(deleteTarget.id)}
                    className="flex-1 bg-red-500/80 text-white hover:bg-red-500"
                  >
                    Delete
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Task">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Title</label>
            <input
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Priority</label>
              <select
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as Priority })}
                className={selectCls}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Repeat</label>
              <select
                value={editForm.recurrence}
                onChange={(e) => setEditForm({ ...editForm, recurrence: e.target.value as "NONE" | "DAILY" })}
                className={selectCls}
              >
                <option value="NONE">None</option>
                <option value="DAILY">Every day</option>
              </select>
            </div>
          </div>

          {editForm.recurrence === "NONE" ? (
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Due Date</label>
              <input
                type="date"
                value={editForm.dueDate}
                onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                className={cn(inputCls, "scheme-dark")}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Start Date</label>
                <input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  className={cn(inputCls, "scheme-dark")}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">
                  End Date <span className="normal-case text-white/40">(optional)</span>
                </label>
                <input
                  type="date"
                  value={editForm.recurrenceEndDate}
                  onChange={(e) => setEditForm({ ...editForm, recurrenceEndDate: e.target.value })}
                  className={cn(inputCls, "scheme-dark")}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Category</label>
            <input
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              placeholder="e.g. Work, Study..."
              className={inputCls}
            />
          </div>

          {goals.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Link to Goal</label>
              <select
                value={editForm.goalId}
                onChange={(e) => setEditForm({ ...editForm, goalId: e.target.value })}
                className={selectCls}
              >
                <option value="">None</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>
          )}

          <Button
            onClick={handleEdit}
            disabled={!editForm.title.trim() || saving}
            className="w-full bg-violet-600 text-white hover:bg-violet-500"
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </Modal>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setForm(emptyForm) }} title="New Task">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="What needs to be done?"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                className={selectCls}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Repeat</label>
              <select
                value={form.recurrence}
                onChange={(e) => setForm({ ...form, recurrence: e.target.value as "NONE" | "DAILY" })}
                className={selectCls}
              >
                <option value="NONE">None</option>
                <option value="DAILY">Every day</option>
              </select>
            </div>
          </div>

          {form.recurrence === "NONE" ? (
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className={cn(inputCls, "scheme-dark")}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className={cn(inputCls, "scheme-dark")}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">
                  End Date <span className="normal-case text-white/40">(optional)</span>
                </label>
                <input
                  type="date"
                  value={form.recurrenceEndDate}
                  onChange={(e) => setForm({ ...form, recurrenceEndDate: e.target.value })}
                  className={cn(inputCls, "scheme-dark")}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Category</label>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Work, Study..."
              className={inputCls}
            />
          </div>

          {goals.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Link to Goal</label>
              <select
                value={form.goalId}
                onChange={(e) => setForm({ ...form, goalId: e.target.value })}
                className={selectCls}
              >
                <option value="">None</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>
          )}

          <Button
            onClick={handleCreate}
            disabled={!form.title.trim() || creating}
            className="w-full bg-violet-600 text-white hover:bg-violet-500"
          >
            {creating ? "Adding..." : "Add Task"}
          </Button>
        </div>
      </Modal>

      {breakdownTask && (
        <BreakdownModal
          open={!!breakdownTask}
          onClose={() => setBreakdownTask(null)}
          task={breakdownTask.title}
          onSave={async (subtasks) => {
            const created = await Promise.all(
              subtasks.map(async (title) => {
                const res = await fetch("/api/tasks", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title,
                    priority: breakdownTask.priority,
                    category: breakdownTask.category,
                    startDate: new Date().toISOString(),
                    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
                  }),
                })
                return res.json()
              })
            )
            setTasks((p) => [...created, ...p])
          }}
        />
      )}
    </PageTransition>
  )
}
