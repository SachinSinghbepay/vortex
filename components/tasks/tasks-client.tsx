"use client"

import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Plus, CheckCircle2, Circle, Trash2, Calendar, Sparkles, Repeat, ChevronDown, ChevronLeft, ChevronRight, Pencil, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { BreakdownModal } from "@/components/ai/breakdown-modal"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/ui/page-transition"

type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"
type Recurrence = "NONE" | "DAILY" | "EVERY_OTHER_DAY" | "CUSTOM_DATES"

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
  customDates: string
  completedSections: string
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


const RECURRENCE_OPTIONS: { value: Recurrence; label: string; sub: string }[] = [
  { value: "NONE", label: "None", sub: "One-time task" },
  { value: "DAILY", label: "Every day", sub: "Repeats daily" },
  { value: "EVERY_OTHER_DAY", label: "Alt. days", sub: "Every 2nd day" },
  { value: "CUSTOM_DATES", label: "Pick dates", sub: "Choose specific dates" },
]

const PRIORITY_OPTIONS: { value: Priority; label: string; active: string; dot: string }[] = [
  { value: "LOW", label: "Low", active: "border-white/20 bg-white/10 text-white/70", dot: "bg-white/30" },
  { value: "MEDIUM", label: "Med", active: "border-blue-500/40 bg-blue-500/15 text-blue-300", dot: "bg-blue-400" },
  { value: "HIGH", label: "High", active: "border-orange-500/40 bg-orange-500/15 text-orange-300", dot: "bg-orange-400" },
  { value: "URGENT", label: "Urgent", active: "border-red-500/40 bg-red-500/15 text-red-300", dot: "bg-red-400" },
]

function MultiDatePicker({ selected, onChange }: { selected: string[]; onChange: (d: string[]) => void }) {
  const [view, setView] = useState(() => {
    const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1)
  })
  const year = view.getFullYear(), month = view.getMonth()
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
  const toggle = (s: string) => onChange(selected.includes(s) ? selected.filter(x => x !== s) : [...selected, s].sort())
  const cells: (string | null)[] = Array(firstDow).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(fmt(new Date(year, month, d)))

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => setView(new Date(year, month-1, 1))} className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/8 hover:text-white/70"><ChevronLeft className="h-3.5 w-3.5"/></button>
        <span className="text-xs font-medium text-white/70">{view.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span>
        <button type="button" onClick={() => setView(new Date(year, month+1, 1))} className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/8 hover:text-white/70"><ChevronRight className="h-3.5 w-3.5"/></button>
      </div>
      <div className="mb-1 grid grid-cols-7 text-center text-[9px] font-medium uppercase tracking-widest text-white/20">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((s, i) =>
          s ? (
            <button key={i} type="button" onClick={() => toggle(s)}
              className={cn("mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs transition",
                selected.includes(s) ? "bg-violet-600 text-white" : "text-white/50 hover:bg-white/8 hover:text-white/80"
              )}
            >
              {new Date(s+"T00:00:00").getDate()}
            </button>
          ) : <div key={i}/>
        )}
      </div>
      {selected.length > 0 && (
        <p className="mt-2 text-[10px] text-white/30">{selected.length} date{selected.length !== 1 ? "s" : ""} selected</p>
      )}
    </div>
  )
}

function GoalPicker({
  value,
  onChange,
  goals,
}: {
  value: string
  onChange: (id: string) => void
  goals: Array<{ id: string; title: string }>
}) {
  const [open, setOpen] = useState(false)
  const [opensUp, setOpensUp] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const selected = goals.find((g) => g.id === value)

  const toggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setOpensUp(window.innerHeight - rect.bottom < 220)
    }
    setOpen((v) => !v)
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between rounded-lg border border-white/[0.07] bg-white/4 px-3.5 py-2.5 text-sm transition hover:border-white/15"
      >
        <span className={selected ? "text-white/75" : "text-white/25"}>{selected?.title ?? "None"}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-white/30 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className={cn("absolute left-0 right-0 z-20 max-h-48 overflow-y-auto rounded-xl border border-white/8 bg-[#141414] shadow-2xl", opensUp ? "bottom-full mb-1" : "top-full mt-1")}>
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false) }}
              className={cn("w-full px-3.5 py-2.5 text-left text-sm transition hover:bg-white/5", !value ? "text-violet-300" : "text-white/30")}
            >
              None
            </button>
            {goals.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => { onChange(g.id); setOpen(false) }}
                className={cn("w-full px-3.5 py-2.5 text-left text-sm transition hover:bg-white/5", value === g.id ? "text-violet-300" : "text-white/60")}
              >
                {g.title}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const emptyForm = {
  title: "",
  priority: "MEDIUM" as Priority,
  dueDate: "",
  recurrence: "NONE" as Recurrence,
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
  // Calendar Mon–Sun weeks: thisWeekEnd = next Monday, nextWeekEnd = Monday after that
  const dow = todayStart.getDay() // 0=Sun … 6=Sat
  const daysToNextMonday = ((8 - dow) % 7) || 7
  const thisWeekEnd = new Date(todayStart)
  thisWeekEnd.setDate(todayStart.getDate() + daysToNextMonday)
  const nextWeekEnd = new Date(thisWeekEnd)
  nextWeekEnd.setDate(thisWeekEnd.getDate() + 7)

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

  const [tasks, setTasks] = useState(initialTasks)
  const [filter, setFilter] = useState<(typeof filters)[number]>("ALL")
  const [rangeStart, setRangeStart] = useState(defaultRangeStart)
  const [rangeEnd, setRangeEnd] = useState(defaultRangeEnd)
  const [showRangePicker, setShowRangePicker] = useState(false)
  const [pickerStart, setPickerStart] = useState(formatDateForInput(defaultRangeStart))
  const [pickerEnd, setPickerEnd] = useState(formatDateForInput(defaultRangeEnd))

  // Load persisted range after hydration to avoid SSR mismatch
  useEffect(() => {
    const saved = getSavedRange()
    if (saved) {
      setRangeStart(saved.start)
      setRangeEnd(saved.end)
      setPickerStart(formatDateForInput(saved.start))
      setPickerEnd(formatDateForInput(saved.end))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [breakdownTask, setBreakdownTask] = useState<Task | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)
  const [deleteGroup, setDeleteGroup] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<Task | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [formCustomDates, setFormCustomDates] = useState<string[]>([])
  const [editCustomDates, setEditCustomDates] = useState<string[]>([])
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set())
  const [overdueExpanded, setOverdueExpanded] = useState(false)
  const [completedExpanded, setCompletedExpanded] = useState(false)

  const isPastRange = rangeEnd < todayStart

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
    if (e < todayStart && (filter === "TODAY" || filter === "PENDING")) setFilter("ALL")
  }

  const applyCustomRange = () => {
    if (!pickerStart || !pickerEnd) return
    const s = new Date(pickerStart + "T00:00:00")
    const e = new Date(pickerEnd + "T23:59:59")
    setRangeStart(s)
    setRangeEnd(e)
    setShowRangePicker(false)
    saveRange(s, e)
    if (e < todayStart && (filter === "TODAY" || filter === "PENDING")) setFilter("ALL")
  }

  // A task is "in the selected date range" (for ALL/PENDING/COMPLETED)
  // Only extend rangeEnd to catch Next Week bleed when the range boundary falls
  // inside the current week→next-week window. Never extend for past ranges.
  const nextWeekBleedEnd = (rangeEnd >= thisWeekEnd && rangeEnd < nextWeekEnd) ? nextWeekEnd : rangeEnd

  const isInDateRange = (t: Task) => {
    if (t.recurrence === "CUSTOM_DATES") {
      const dates: string[] = JSON.parse(t.customDates || "[]")
      return dates.some(ds => { const d = new Date(ds+"T00:00:00"); return d >= rangeStart && d <= nextWeekBleedEnd })
    }
    if (t.recurrence === "DAILY" || t.recurrence === "EVERY_OTHER_DAY") {
      const start = localDay(new Date(t.startDate ?? t.createdAt))
      const end = t.recurrenceEndDate ? localDay(new Date(t.recurrenceEndDate)) : null
      // Only bleed into next week if task already starts within the range
      const bleedEnd = start < nextWeekBleedEnd ? nextWeekBleedEnd : rangeEnd
      return start <= bleedEnd && (end === null || end >= rangeStart)
    }
    const d = t.startDate ? new Date(t.startDate) : t.dueDate ? new Date(t.dueDate) : null
    if (!d) return true
    return d >= rangeStart && d <= rangeEnd
  }

  // ── Skip helpers ────────────────────────────────────────────────────────────

  const getSectionDateRange = (group: string): { start: Date; end: Date } | null => {
    if (group === "Today") return { start: todayStart, end: todayEnd }
    if (group === "Tomorrow") return { start: todayEnd, end: tomorrowEnd }
    if (group === "This Week") return { start: tomorrowEnd, end: thisWeekEnd }
    if (group === "Next Week") return { start: thisWeekEnd, end: nextWeekEnd }
    const d = new Date(group)
    if (!isNaN(d.getTime())) {
      // YYYY-MM-DD = day-level section (for completedSections toggle in COMPLETED view)
      if (/^\d{4}-\d{2}-\d{2}$/.test(group))
        return { start: d, end: new Date(d.getTime() + 86400000) }
      return { start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth() + 1, 1) }
    }
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

  const isRepeating = (r: string) => r !== "NONE"

  const effectiveCompleted = (t: Task) => {
    if (!isRepeating(t.recurrence)) return t.completed
    const dates = parseCompletedDates(t)
    if (dates.includes(todayStr)) return true
    // Legacy: completed via old boolean path before date log existed
    return t.completed && new Date(t.updatedAt) >= todayStart
  }

  const effectiveCompletedForGroup = (t: Task, group: string): boolean => {
    if (!isRepeating(t.recurrence)) return t.completed
    const dates = parseCompletedDates(t)
    const range = getSectionDateRange(group)
    if (!range) return dates.includes(todayStr)
    if (dates.some(d => { const dt = new Date(d + "T00:00:00"); return dt >= range.start && dt < range.end })) return true
    // Legacy fallback for Today
    if (group === "Today") return t.completed && new Date(t.updatedAt) >= todayStart
    return false
  }

  const todayStr = formatDateForInput(todayStart)

  // Parse completedSections as a flat date-string array ["YYYY-MM-DD", ...]
  // Handles legacy {start,end} object format by extracting the start date
  const parseCompletedDates = (t: Task): string[] => {
    try {
      const raw = JSON.parse(t.completedSections || "[]")
      if (!Array.isArray(raw) || raw.length === 0) return []
      if (typeof raw[0] === "string") return raw as string[]
      return (raw as { start: string }[]).map(s => s.start)
    } catch { return [] }
  }

  const isInRange = (t: Task) => {
    if (t.recurrence === "CUSTOM_DATES") {
      const dates: string[] = JSON.parse(t.customDates || "[]")
      return dates.includes(todayStr)
    }
    if (t.recurrence === "NONE") return false
    const start = t.startDate ? new Date(t.startDate) : new Date(t.createdAt)
    const end = t.recurrenceEndDate ? new Date(t.recurrenceEndDate) : null
    if (!(start <= todayEnd && (end === null || end >= todayStart))) return false
    if (t.recurrence === "EVERY_OTHER_DAY") {
      const diffDays = Math.round((todayStart.getTime() - start.getTime()) / 86400000)
      return diffDays >= 0 && diffDays % 2 === 0
    }
    return true // DAILY
  }

  const recurrenceLabel = (t: Task): string | null => {
    if (!isRepeating(t.recurrence)) return null
    if (t.recurrence === "CUSTOM_DATES") {
      try { const d: string[] = JSON.parse(t.customDates || "[]"); return `${d.length} date${d.length !== 1 ? "s" : ""}` } catch { return "custom" }
    }
    const until = t.recurrenceEndDate
      ? ` until ${new Date(t.recurrenceEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : ""
    return t.recurrence === "EVERY_OTHER_DAY" ? `every 2 days${until}` : `every day${until}`
  }

  // Normalize UTC-midnight DB dates to local midnight (fixes UTC+5:30 offset shifting dates by 5h30m)
  const localDay = (d: Date): Date => { const r = new Date(d); r.setHours(0, 0, 0, 0); return r }

  const getTaskDate = (t: Task) =>
    t.startDate ? localDay(new Date(t.startDate)) : t.dueDate ? localDay(new Date(t.dueDate)) : null

  // ── Grouping ────────────────────────────────────────────────────────────────

  const getGroups = (t: Task): string[] => {
    // Non-repeating completed before today → dated "Completed" section
    if (!isRepeating(t.recurrence) && t.completed) {
      const completedDate = new Date(t.updatedAt)
      if (completedDate < todayStart) {
        return [`Completed ${completedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`]
      }
    }

    if (!isRepeating(t.recurrence)) {
      const d = getTaskDate(t)
      if (!d) return ["No Date"]
      if (d < todayStart) return ["Overdue"]
      if (d < todayEnd) return ["Today"]
      if (d < tomorrowEnd) return ["Tomorrow"]
      if (d < thisWeekEnd) return ["This Week"]
      if (d < nextWeekEnd) return ["Next Week"]
      return [d.toLocaleDateString("en-US", { month: "long", year: "numeric" })]
    }

    const inRange = (sectionStart: Date, sectionEnd: Date) =>
      sectionEnd > rangeStart && sectionStart <= rangeEnd

    // ── CUSTOM_DATES: place each selected date in its section ──
    if (t.recurrence === "CUSTOM_DATES") {
      const dates: string[] = JSON.parse(t.customDates || "[]")
      const inSec = (ss: Date, se: Date) =>
        !isSectionSkipped(t, ss) && dates.some(ds => { const d = new Date(ds+"T00:00:00"); return d >= ss && d < se })
      const groups: string[] = []
      if (inSec(todayStart, todayEnd)) groups.push("Today")
      if (inSec(todayEnd, tomorrowEnd)) groups.push("Tomorrow")
      if (inSec(tomorrowEnd, thisWeekEnd)) groups.push("This Week")
      if (inSec(thisWeekEnd, nextWeekEnd)) groups.push("Next Week")
      const rangeEndMonth = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth() + 1, 1)
      let cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1)
      while (cur < rangeEndMonth) {
        const me = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
        const isCurMonth = cur.getFullYear() === now.getFullYear() && cur.getMonth() === now.getMonth()
        if (!isCurMonth && inSec(cur, me)) { const lbl = cur.toLocaleDateString("en-US",{month:"long",year:"numeric"}); if (!groups.includes(lbl)) groups.push(lbl) }
        cur = me
      }
      return groups
    }

    // ── DAILY / EVERY_OTHER_DAY ──
    const start = localDay(new Date(t.startDate ?? t.createdAt))
    const end = t.recurrenceEndDate ? localDay(new Date(t.recurrenceEndDate)) : null

    const activeIn = (sectionStart: Date, sectionEnd: Date) => {
      if (isSectionSkipped(t, sectionStart)) return false
      if (start >= sectionEnd) return false
      if (end && end < sectionStart) return false
      if (t.recurrence === "DAILY") return true
      // EVERY_OTHER_DAY: iterate through section days (max 31) for an active day
      const cur = new Date(Math.max(sectionStart.getTime(), start.getTime()))
      while (cur < sectionEnd) {
        const diff = Math.round((cur.getTime() - start.getTime()) / 86400000)
        if (diff % 2 === 0 && (!end || cur <= end)) return true
        cur.setDate(cur.getDate() + 1)
      }
      return false
    }

    const groups: string[] = []
    if (activeIn(todayStart, todayEnd) && inRange(todayStart, todayEnd)) groups.push("Today")
    if (activeIn(todayEnd, tomorrowEnd) && inRange(todayEnd, tomorrowEnd)) groups.push("Tomorrow")
    if (activeIn(tomorrowEnd, thisWeekEnd) && inRange(tomorrowEnd, thisWeekEnd)) groups.push("This Week")
    if (activeIn(thisWeekEnd, nextWeekEnd) && inRange(thisWeekEnd, nextWeekEnd)) groups.push("Next Week")

    const rangeEndMonth = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth() + 1, 1)
    let cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1)
    while (cursor < rangeEndMonth) {
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
      const isCurMon = cursor.getFullYear() === now.getFullYear() && cursor.getMonth() === now.getMonth()
      if (!isCurMon && activeIn(cursor, monthEnd) && inRange(cursor, monthEnd)) {
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

  // Groups completed tasks by the day they were actually checked off
  const getCompletedGroups = (): [string, TaskEntry[]][] => {
    const map = new Map<string, TaskEntry[]>()
    const yesterday = new Date(todayStart); yesterday.setDate(yesterday.getDate() - 1)

    const dayLabel = (d: Date): string => {
      const ms = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      if (ms === todayStart.getTime()) return "Today"
      if (ms === yesterday.getTime()) return "Yesterday"
      return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    }

    const push = (t: Task, completedAt: Date, toggleGroup: string) => {
      if (completedAt < rangeStart || completedAt > rangeEnd) return
      const label = dayLabel(completedAt)
      if (!map.has(label)) map.set(label, [])
      const bucket = map.get(label)!
      if (!bucket.some(e => e.id === t.id && e._group === toggleGroup))
        bucket.push({ ...t, _group: toggleGroup })
    }

    for (const t of tasks) {
      if (!isInDateRange(t)) continue
      if (!isRepeating(t.recurrence)) {
        if (t.completed) push(t, new Date(t.updatedAt), "Today")
      } else {
        const dates = parseCompletedDates(t)
        for (const dateStr of dates) {
          push(t, new Date(dateStr + "T00:00:00"), dateStr)
        }
        // Legacy: completed=true but date log is empty (old boolean-only data)
        if (dates.length === 0 && t.completed) {
          push(t, new Date(t.updatedAt), "Today")
        }
      }
    }

    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === "Today") return -1; if (b === "Today") return 1
      if (a === "Yesterday") return -1; if (b === "Yesterday") return 1
      return new Date(b).getTime() - new Date(a).getTime()
    })
  }

  const getWeekDaySubGroups = (items: TaskEntry[], weekStart: Date, weekEnd: Date): [string, TaskEntry[]][] => {
    const map = new Map<string, TaskEntry[]>()
    for (const t of items) {
      let cur = new Date(weekStart)
      while (cur < weekEnd) {
        const dayEnd = new Date(cur.getTime() + 86400000)
        const dayStr = formatDateForInput(cur)
        let active = false
        if (!isRepeating(t.recurrence)) {
          const d = t.dueDate ? new Date(t.dueDate) : t.startDate ? new Date(t.startDate) : null
          active = !!(d && d >= cur && d < dayEnd)
        } else if (t.recurrence === "DAILY") {
          const s = localDay(new Date(t.startDate ?? t.createdAt))
          const e = t.recurrenceEndDate ? localDay(new Date(t.recurrenceEndDate)) : null
          active = s <= cur && (e === null || e >= cur) && !isSectionSkipped(t, cur)
        } else if (t.recurrence === "EVERY_OTHER_DAY") {
          const s = localDay(new Date(t.startDate ?? t.createdAt))
          const e = t.recurrenceEndDate ? localDay(new Date(t.recurrenceEndDate)) : null
          if (s <= cur && (e === null || e >= cur) && !isSectionSkipped(t, cur)) {
            const diff = Math.round((cur.getTime() - s.getTime()) / 86400000)
            active = diff % 2 === 0
          }
        } else if (t.recurrence === "CUSTOM_DATES") {
          try { active = (JSON.parse(t.customDates || "[]") as string[]).includes(dayStr) && !isSectionSkipped(t, cur) } catch { /* empty */ }
        }
        if (active) {
          if (!map.has(dayStr)) map.set(dayStr, [])
          map.get(dayStr)!.push({ ...t, _group: dayStr })
        }
        cur = dayEnd
      }
    }
    return Array.from(map.entries()).sort(([a], [b]) => a < b ? -1 : 1)
  }

  // Returns missed occurrences grouped by date (selected range, oldest→newest)
  const getOverdueEntries = (): [string, TaskEntry[]][] => {
    const map = new Map<string, TaskEntry[]>()
    const overdueCutoff = isPastRange ? new Date(rangeEnd.getTime() + 86400000) : todayStart
    let cur = new Date(rangeStart)
    while (cur < overdueCutoff) {
      const dayStr = formatDateForInput(cur)
      for (const t of tasks) {
        if (!isRepeating(t.recurrence)) continue
        const start = localDay(new Date(t.startDate ?? t.createdAt))
        const end = t.recurrenceEndDate ? localDay(new Date(t.recurrenceEndDate)) : null
        if (start > cur || (end && end < cur) || isSectionSkipped(t, cur)) continue
        let activeOnDay = false
        if (t.recurrence === "DAILY") {
          activeOnDay = true
        } else if (t.recurrence === "EVERY_OTHER_DAY") {
          activeOnDay = Math.round((cur.getTime() - start.getTime()) / 86400000) % 2 === 0
        } else if (t.recurrence === "CUSTOM_DATES") {
          try { activeOnDay = (JSON.parse(t.customDates || "[]") as string[]).includes(dayStr) } catch { /* empty */ }
        }
        if (!activeOnDay) continue
        if (parseCompletedDates(t).includes(dayStr)) continue
        if (!map.has(dayStr)) map.set(dayStr, [])
        map.get(dayStr)!.push({ ...t, _group: dayStr })
      }
      cur = new Date(cur.getTime() + 86400000)
    }
    return Array.from(map.entries()).sort(([a], [b]) => b > a ? 1 : -1) // newest first
  }

  const isScheduledToday = (t: Task) => {
    if (isRepeating(t.recurrence)) return isInRange(t) && !isSectionSkipped(t, todayStart)
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

  const isCompletedInRange = (t: Task) => {
    if (!isRepeating(t.recurrence)) return t.completed
    const dates = parseCompletedDates(t)
    if (dates.some(d => { const dt = new Date(d + "T00:00:00"); return dt >= rangeStart && dt <= rangeEnd })) return true
    // Legacy: stale completed=true with no date log yet
    if (t.completed) { const d = new Date(t.updatedAt); return d >= rangeStart && d <= rangeEnd }
    return false
  }

  // PENDING = today's scheduled tasks that aren't done yet (range-independent, like TODAY)
  const isPending = (t: Task) => isScheduledToday(t) && !effectiveCompleted(t)

  // TODAY bypasses date range; ALL/COMPLETED respect it; PENDING is also range-independent
  const filtered = tasks.filter((t) => {
    if (filter === "TODAY") return isScheduledToday(t)
    if (filter === "PENDING") return isPending(t)
    if (!isInDateRange(t)) return false
    if (filter === "COMPLETED") return isCompletedInRange(t)
    return true
  })

  const filterCount = (f: (typeof filters)[number]) => {
    if (f === "TODAY") return tasks.filter(isScheduledToday).length
    if (f === "PENDING") return tasks.filter(isPending).length
    const base = tasks.filter(isInDateRange)
    if (f === "ALL") return base.length
    // Count individual occurrences, not just distinct tasks
    if (f === "COMPLETED") {
      let n = 0
      for (const t of base) {
        if (!isRepeating(t.recurrence)) { if (t.completed) n++; continue }
        n += parseCompletedDates(t).filter(d => {
          const dt = new Date(d + "T00:00:00")
          return dt >= rangeStart && dt <= rangeEnd
        }).length
      }
      return n
    }
    return 0
  }

  const remainingCount = tasks.filter(
    (t) => !effectiveCompleted(t) && (t.recurrence === "DAILY" ? isInRange(t) : true)
  ).length

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleToggle = async (id: string, done: boolean, group: string) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return

    if (!isRepeating(task.recurrence)) {
      // Non-recurring: simple boolean
      setTasks((p) => p.map((t) =>
        t.id === id ? { ...t, completed: done, updatedAt: new Date().toISOString() } : t
      ))
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: done }),
      })
      if (done) toast.success("Task completed ✓")
      return
    }

    // Recurring tasks: log each completed occurrence date in completedSections
    // completedSections stores a flat array of date strings: ["YYYY-MM-DD", ...]
    const range = group === "Today" ? { start: todayStart, end: todayEnd } : getSectionDateRange(group)
    if (!range) return
    // Store the occurrence date (start of the section being completed)
    const occurrenceDate = formatDateForInput(range.start)

    const dates = parseCompletedDates(task)
    // Migrate legacy: if this is the first write and completed=true, preserve the updatedAt date as a prior log entry
    const seedDates = (dates.length === 0 && task.completed)
      ? [formatDateForInput(new Date(task.updatedAt))]
      : dates
    const newDates = done
      ? (seedDates.includes(occurrenceDate) ? seedDates : [...seedDates, occurrenceDate])
      : seedDates.filter(d => d !== occurrenceDate)
    const payload = JSON.stringify(newDates)
    // When unchecking, clear completed flag so the legacy updatedAt fallback can't resurrect it
    const patchBody: Record<string, unknown> = { completedSections: payload }
    if (!done) patchBody.completed = false
    setTasks((p) => p.map((t) => t.id === id
      ? { ...t, completedSections: payload, ...(!done && { completed: false }) }
      : t
    ))
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchBody),
    })
    if (done) toast.success("Task completed ✓")
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
      recurrence: task.recurrence as Recurrence,
      startDate: task.startDate ? task.startDate.split("T")[0] : "",
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      recurrenceEndDate: task.recurrenceEndDate ? task.recurrenceEndDate.split("T")[0] : "",
      category: task.category ?? "",
      goalId: task.goal?.id ?? "",
    })
    try { setEditCustomDates(JSON.parse(task.customDates || "[]")) } catch { setEditCustomDates([]) }
    setEditTarget(task)
  }

  const handleEdit = async () => {
    if (!editTarget || !editForm.title.trim()) return
    setSaving(true)
    try {
      const isCustom = editForm.recurrence === "CUSTOM_DATES"
      const body = {
        title: editForm.title.trim(),
        priority: editForm.priority,
        category: editForm.category || null,
        goalId: editForm.goalId || null,
        recurrence: editForm.recurrence,
        customDates: isCustom ? JSON.stringify(editCustomDates) : "[]",
        ...(editForm.recurrence === "NONE"
          ? { dueDate: editForm.dueDate || null, startDate: null, recurrenceEndDate: null }
          : isCustom
          ? { startDate: null, dueDate: null, recurrenceEndDate: null }
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
          customDates: form.recurrence === "CUSTOM_DATES" ? JSON.stringify(formCustomDates) : "[]",
          ...(form.recurrence === "NONE"
            ? { dueDate: form.dueDate || null }
            : form.recurrence === "CUSTOM_DATES"
            ? { startDate: null, dueDate: null, recurrenceEndDate: null }
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
        setFormCustomDates([])
        toast.success("Task added")
      } else {
        toast.error("Failed to add task")
      }
    } finally {
      setCreating(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const renderTaskLi = (task: TaskEntry, done: boolean) => (
    <li key={`${task.id}-${task._group}`} className="px-4 py-3 transition hover:bg-white/2">
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleToggle(task.id, !done, task._group)}
          className="shrink-0 text-white/25 transition hover:text-violet-400"
        >
          {done ? <CheckCircle2 className="h-4 w-4 text-violet-400" /> : <Circle className="h-4 w-4" />}
        </button>
        <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", priorityDot[task.priority])} />
        <span className={cn("flex-1 truncate text-sm", done ? "text-white/25 line-through" : "text-white/75")}>
          {task.title}
        </span>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {task.category && (
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/30">{task.category}</span>
          )}
          {isRepeating(task.recurrence) ? (
            <div className="flex items-center gap-1 text-xs text-violet-400/50">
              <Repeat className="h-3 w-3" />
              {recurrenceLabel(task)}
            </div>
          ) : task.dueDate || task.startDate ? (
            <div className="flex items-center gap-1 text-xs text-white/25">
              <Calendar className="h-3 w-3" />
              {task.startDate && task.dueDate
                ? `${new Date(task.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : new Date((task.dueDate || task.startDate)!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
          ) : null}
          {task.goal && (
            <span className="rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-400">{task.goal.title}</span>
          )}
          {!done && (
            <button onClick={() => setBreakdownTask(task)} className="shrink-0 text-white/40 transition hover:text-violet-400" title="Break down with AI">
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => openEdit(task)} className="shrink-0 text-white/40 transition hover:text-white/70">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => { setDeleteTarget(task); setDeleteGroup(task._group) }} className="shrink-0 text-white/40 transition hover:text-red-400">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          onClick={() => { setDeleteTarget(task); setDeleteGroup(task._group) }}
          className="sm:hidden shrink-0 text-white/40 transition hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex sm:hidden items-center gap-1.5 mt-2 pl-[26px] flex-wrap">
        {task.category && (
          <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/30">{task.category}</span>
        )}
        {isRepeating(task.recurrence) ? (
          <div className="flex items-center gap-1 text-[11px] text-violet-400/50">
            <Repeat className="h-3 w-3" />
            {recurrenceLabel(task)}
          </div>
        ) : task.dueDate || task.startDate ? (
          <div className="flex items-center gap-1 text-[11px] text-white/30">
            <Calendar className="h-3 w-3" />
            {task.startDate && task.dueDate
              ? `${new Date(task.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : new Date((task.dueDate || task.startDate)!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        ) : null}
        {task.goal && (
          <span className="rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-400">{task.goal.title}</span>
        )}
        <div className="flex-1" />
        {!done && (
          <button onClick={() => setBreakdownTask(task)} className="text-white/40 transition hover:text-violet-400">
            <Sparkles className="h-3.5 w-3.5" />
          </button>
        )}
        <button onClick={() => openEdit(task)} className="text-white/40 transition hover:text-white/70">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  )

  const displayGroups = filter === "COMPLETED"
    ? getCompletedGroups()
    : groupTasks(filtered).filter(([g]) => {
        if (filter === "TODAY" || filter === "PENDING") return g === "Today"
        return true
      })

  return (
    <PageTransition className="min-h-full p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Tasks</h1>
          <p className="mt-0.5 text-sm text-white/40">{remainingCount} remaining</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date range picker — lives in header on mobile, hidden here on desktop */}
          <div className="relative sm:hidden">
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
                <div className="fixed inset-0 z-10" onClick={() => setShowRangePicker(false)} />
                <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-white/8 bg-[#141414] p-4 shadow-2xl">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/25">Quick select</p>
                  <div className="mb-3 flex gap-1.5">
                    {[{ label: "Last month", offset: -1 }, { label: "This month", offset: 0 }, { label: "Next month", offset: 1 }].map(({ label, offset }) => {
                      const s = new Date(now.getFullYear(), now.getMonth() + offset, 1)
                      const isActive = isFullMonth(rangeStart, rangeEnd) && rangeStart.getMonth() === s.getMonth() && rangeStart.getFullYear() === s.getFullYear()
                      return (
                        <button key={label} onClick={() => applyPreset(offset)} className={cn("flex-1 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors", isActive ? "bg-violet-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80")}>
                          {offset === 0 ? "This month" : offset === -1 ? "Last month" : "Next month"}
                        </button>
                      )
                    })}
                  </div>
                  <div className="border-t border-white/6 pt-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/25">Custom range</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-white/30">From</label>
                        <input type="date" value={pickerStart} onChange={(e) => setPickerStart(e.target.value)} className="w-full rounded-lg border border-white/[0.07] bg-white/4 px-2.5 py-1.5 text-[11px] text-white scheme-dark outline-none focus:border-violet-500/40" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-white/30">To</label>
                        <input type="date" value={pickerEnd} onChange={(e) => setPickerEnd(e.target.value)} className="w-full rounded-lg border border-white/[0.07] bg-white/4 px-2.5 py-1.5 text-[11px] text-white scheme-dark outline-none focus:border-violet-500/40" />
                      </div>
                    </div>
                    <Button onClick={applyCustomRange} disabled={!pickerStart || !pickerEnd} className="mt-2 w-full bg-violet-600 py-2 text-xs text-white hover:bg-violet-500">Apply range</Button>
                  </div>
                </div>
              </>
            )}
          </div>

          <Button onClick={() => setShowCreate(true)} className="gap-1.5 bg-violet-600 text-white hover:bg-violet-500">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Task</span><span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Filters + date range (desktop) */}
      <div className="mb-6 flex items-center gap-1">
        {/* Filter tabs */}
        <div className="flex flex-1 gap-1">
          {filters
            .filter(f => !(isPastRange && (f === "TODAY" || f === "PENDING")))
            .map((f) => (
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

        {/* Date range picker — desktop only */}
        <div className="relative hidden sm:block">
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
        {filter === "ALL" && isPastRange ? (
          /* ── Past month All view: Overdue + Completed sections ── */
          (() => {
            const overdueGroups = getOverdueEntries()
            const completedGroups = getCompletedGroups()
            const overdueTotal = overdueGroups.reduce((s, [, items]) => s + items.length, 0)
            const completedTotal = completedGroups.reduce((s, [, items]) => s + items.length, 0)
            if (overdueTotal === 0 && completedTotal === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckCircle2 className="mb-2 h-8 w-8 text-white/10" />
                  <p className="text-sm text-white/25">No activity in this range</p>
                </div>
              )
            }
            const showOverdue = overdueTotal <= 5 || overdueExpanded
            const showCompleted = completedTotal <= 5 || completedExpanded
            return (
              <div className="divide-y divide-white/10">
                {overdueTotal > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-red-400/70">
                      <span className="text-red-400">!</span>
                      Overdue
                      <span className="font-normal normal-case tracking-normal text-white/15">{overdueTotal}</span>
                      {overdueTotal > 5 && (
                        <button onClick={() => setOverdueExpanded(p => !p)} className="ml-auto text-white/40 transition hover:text-white/70">
                          <ChevronDown className={cn("h-4 w-4 transition-transform", overdueExpanded && "rotate-180")} />
                        </button>
                      )}
                    </div>
                    {showOverdue && (
                      <div className="divide-y divide-white/8">
                        {overdueGroups.map(([dayStr, dayItems]) => (
                          <div key={dayStr}>
                            <div className="flex items-center gap-2 px-4 py-1.5 text-[10px] font-medium uppercase tracking-widest text-white/20">
                              <span className="pl-7">{new Date(dayStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                              <span className="text-white/10">{dayItems.length}</span>
                            </div>
                            <ul>{dayItems.map(task => renderTaskLi(task, false))}</ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {completedTotal > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed
                      <span className="font-normal normal-case tracking-normal text-white/15">{completedTotal}</span>
                      {completedTotal > 5 && (
                        <button onClick={() => setCompletedExpanded(p => !p)} className="ml-auto text-white/40 transition hover:text-white/70">
                          <ChevronDown className={cn("h-4 w-4 transition-transform", completedExpanded && "rotate-180")} />
                        </button>
                      )}
                    </div>
                    {showCompleted && (
                      <div className="divide-y divide-white/8">
                        {completedGroups.map(([dayLabel, dayItems]) => (
                          <div key={dayLabel}>
                            <div className="flex items-center gap-2 px-4 py-1.5 text-[10px] font-medium uppercase tracking-widest text-white/20">
                              <span className="pl-7">{dayLabel}</span>
                              <span className="text-white/10">{dayItems.length}</span>
                            </div>
                            <ul>{dayItems.map(task => renderTaskLi(task, true))}</ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })()
        ) : displayGroups.length === 0 ? (
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
          <div className="divide-y divide-white/10">
            {/* ── Overdue recurring tasks (current/future range only, ALL tab) ── */}
            {filter === "ALL" && rangeEnd >= todayStart && (() => {
              const overdueGroups = getOverdueEntries()
              const totalCount = overdueGroups.reduce((s, [, items]) => s + items.length, 0)
              if (totalCount === 0) return null
              const showContent = totalCount <= 5 || overdueExpanded
              return (
                <div className="border-b border-white/10">
                  <div className="flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-red-400/70">
                    <span className="text-red-400">!</span>
                    Overdue
                    <span className="font-normal normal-case tracking-normal text-white/15">{totalCount}</span>
                    {totalCount > 5 && (
                      <button
                        onClick={() => setOverdueExpanded(p => !p)}
                        className="ml-auto text-white/40 transition hover:text-white/70"
                      >
                        <ChevronDown className={cn("h-4 w-4 transition-transform", overdueExpanded && "rotate-180")} />
                      </button>
                    )}
                  </div>
                  {showContent && (
                    <div className="divide-y divide-white/8">
                      {overdueGroups.map(([dayStr, dayItems]) => (
                        <div key={dayStr}>
                          <div className="flex items-center gap-2 px-4 py-1.5 text-[10px] font-medium uppercase tracking-widest text-white/20">
                            <span className="pl-7">{new Date(dayStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                            <span className="text-white/10">{dayItems.length}</span>
                          </div>
                          <ul>
                            {dayItems.map(task => renderTaskLi(task, false))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}
            {displayGroups
              .map(([groupLabel, groupItems]) => {
              const isCompletedView = filter === "COMPLETED"
              const isCompletedGroup = isCompletedView || groupLabel.startsWith("Completed ")
              const isOverdue = groupLabel === "Overdue"
              const isDateKey = /^\d{4}-\d{2}-\d{2}$/.test(groupLabel)
              const displayLabel = isDateKey
                ? new Date(groupLabel + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                : groupLabel
              const isThisWeek = groupLabel === "This Week"
              const isNextWeek = groupLabel === "Next Week"
              const isExpandable = isThisWeek || isNextWeek
              const isExpanded = expandedWeeks.has(groupLabel)
              const weekStart = isThisWeek ? tomorrowEnd : thisWeekEnd
              const weekEnd = isThisWeek ? thisWeekEnd : nextWeekEnd
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
                        {displayLabel}
                      </>
                    ) : (
                      displayLabel
                    )}
                    <span className="font-normal normal-case tracking-normal text-white/15">{groupItems.length}</span>
                    {isExpandable && (
                      <button
                        onClick={() => setExpandedWeeks(prev => {
                          const next = new Set(prev)
                          next.has(groupLabel) ? next.delete(groupLabel) : next.add(groupLabel)
                          return next
                        })}
                        className="ml-auto text-white/40 transition hover:text-white/70"
                      >
                        <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                      </button>
                    )}
                  </div>
                  {isExpandable && isExpanded ? (
                    <div className="divide-y divide-white/8">
                      {getWeekDaySubGroups(groupItems, weekStart, weekEnd).map(([dayStr, dayItems]) => (
                        <div key={dayStr}>
                          <div className="flex items-center gap-2 px-4 py-1.5 text-[10px] font-medium uppercase tracking-widest text-white/20">
                            <span className="pl-7">{new Date(dayStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                            <span className="text-white/10">{dayItems.length}</span>
                          </div>
                          <ul>
                            {dayItems.map((task) => renderTaskLi(task, effectiveCompletedForGroup(task, task._group)))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul>
                      {groupItems.map((task) => renderTaskLi(task, isCompletedView ? true : effectiveCompletedForGroup(task, task._group)))}
                    </ul>
                  )}
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
        title={deleteTarget && isRepeating(deleteTarget.recurrence) ? "Remove repeating task" : "Delete task"}
      >
        {deleteTarget && (
          <div className="space-y-4">
            {isRepeating(deleteTarget.recurrence) ? (
              <>
                <p className="text-sm text-white/50">
                  <span className="text-white/80">"{deleteTarget.title}"</span> is a repeating task. What would you like to do?
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
                  {deleteTarget.recurrence !== "CUSTOM_DATES" && (
                    <button
                      onClick={() => handleStopAfter(deleteTarget.id)}
                      className="w-full rounded-lg border border-white/[0.07] px-4 py-3 text-left transition hover:bg-white/5"
                    >
                      <div className="text-sm text-white/80">Stop after {groupText(deleteGroup)}</div>
                      <div className="mt-0.5 text-xs text-white/30">
                        Keeps repeating until {groupText(deleteGroup)}, then stops
                      </div>
                    </button>
                  )}
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

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Priority</label>
            <div className="flex gap-1.5">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEditForm({ ...editForm, priority: opt.value })}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition",
                    editForm.priority === opt.value
                      ? opt.active
                      : "border-white/[0.07] text-white/30 hover:border-white/15 hover:text-white/50"
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", editForm.priority === opt.value ? opt.dot : "bg-white/20")} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Repeat</label>
            <div className="grid grid-cols-2 gap-1.5">
              {RECURRENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEditForm({ ...editForm, recurrence: opt.value })}
                  className={cn(
                    "flex flex-col rounded-lg border px-3 py-2.5 text-left transition",
                    editForm.recurrence === opt.value
                      ? "border-violet-500/40 bg-violet-500/10"
                      : "border-white/[0.07] hover:border-white/15 hover:bg-white/3"
                  )}
                >
                  <span className={cn("text-xs font-medium", editForm.recurrence === opt.value ? "text-violet-300" : "text-white/50")}>{opt.label}</span>
                  <span className="mt-0.5 text-[10px] text-white/25">{opt.sub}</span>
                </button>
              ))}
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
          ) : editForm.recurrence === "CUSTOM_DATES" ? (
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Pick Dates</label>
              <MultiDatePicker selected={editCustomDates} onChange={setEditCustomDates} />
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
              <GoalPicker
                value={editForm.goalId}
                onChange={(id) => setEditForm({ ...editForm, goalId: id })}
                goals={goals}
              />
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
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setForm(emptyForm); setFormCustomDates([]) }} title="New Task">
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

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Priority</label>
            <div className="flex gap-1.5">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, priority: opt.value })}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition",
                    form.priority === opt.value
                      ? opt.active
                      : "border-white/[0.07] text-white/30 hover:border-white/15 hover:text-white/50"
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", form.priority === opt.value ? opt.dot : "bg-white/20")} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Repeat</label>
            <div className="grid grid-cols-2 gap-1.5">
              {RECURRENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, recurrence: opt.value })}
                  className={cn(
                    "flex flex-col rounded-lg border px-3 py-2.5 text-left transition",
                    form.recurrence === opt.value
                      ? "border-violet-500/40 bg-violet-500/10"
                      : "border-white/[0.07] hover:border-white/15 hover:bg-white/3"
                  )}
                >
                  <span className={cn("text-xs font-medium", form.recurrence === opt.value ? "text-violet-300" : "text-white/50")}>{opt.label}</span>
                  <span className="mt-0.5 text-[10px] text-white/25">{opt.sub}</span>
                </button>
              ))}
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
          ) : form.recurrence === "CUSTOM_DATES" ? (
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Pick Dates</label>
              <MultiDatePicker selected={formCustomDates} onChange={setFormCustomDates} />
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
              <GoalPicker
                value={form.goalId}
                onChange={(id) => setForm({ ...form, goalId: id })}
                goals={goals}
              />
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
