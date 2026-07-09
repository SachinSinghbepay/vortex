"use client"

import { useState } from "react"
import { Flame, Target, CheckSquare, Zap, TrendingUp, Shield, Sparkles, ChevronDown, ChevronUp, Loader2, Pencil, Check, X, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityRow = { name: string; Mon: number; Tue: number; Wed: number; Thu: number; Fri: number; Sat: number; Sun: number }
type HabitEntry  = { name: string; target: string }
type GoalSchedule = { title: string; activities: ActivityRow[]; habits: HabitEntry[] }
type Schedule = Record<string, GoalSchedule>
type ScheduleGoal = { id: string; title: string; description?: string | null; type?: string }

interface Props {
  streak: number
  taskCompletionRate: number
  goalCompletionRate: number
  weeklyFocusMinutes: number
  alignmentScore: number
  burnoutScore: number
  burnoutLevel: "LOW" | "MEDIUM" | "HIGH"
  weeklyFocusByDay: Array<{ day: string; minutes: number }>
  energyTrend: Array<{ date: string; energy: number; focus: number; stress: number }>
  tasksByDay: Array<{ day: string; completed: number }>
  activeGoals: Array<{ title: string; progress: number; type: string }>
  totalTasks: number
  completedTasks: number
  scheduleGoals: ScheduleGoal[]
  savedSchedule: Schedule
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({
  data,
  color = "bg-violet-500/60",
}: {
  data: Array<{ label: string; value: number }>
  color?: string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex h-32 items-end gap-1.5">
      {data.map(({ label, value }, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex w-full flex-col items-center justify-end" style={{ height: "100px" }}>
            <div
              className={cn("w-full rounded-t", color)}
              style={{ height: `${(value / max) * 100}%`, minHeight: value > 0 ? 4 : 0 }}
            />
          </div>
          <span className="text-[10px] text-white/30">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Multi-line SVG Chart ─────────────────────────────────────────────────────

function TrendChart({
  data,
}: {
  data: Array<{ date: string; energy: number; focus: number; stress: number }>
}) {
  if (data.length < 2) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-white/20">
        Log focus sessions to see trends
      </div>
    )
  }

  const W = 300
  const H = 80
  const MAX = 10

  const toX = (i: number) => (i / (data.length - 1)) * W
  const toY = (v: number) => H - (v / MAX) * H

  const linePath = (key: "energy" | "focus" | "stress") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)},${toY(d[key]).toFixed(1)}`).join(" ")

  const lines = [
    { key: "energy" as const, stroke: "#f59e0b", label: "Energy" },
    { key: "focus" as const, stroke: "#7c3aed", label: "Focus" },
    { key: "stress" as const, stroke: "#f43f5e", label: "Stress" },
  ]

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 100 }}>
        {[2, 5, 8].map((v) => (
          <line
            key={v}
            x1={0} y1={toY(v)} x2={W} y2={toY(v)}
            stroke="rgba(255,255,255,0.04)" strokeWidth={1}
          />
        ))}
        {lines.map(({ key, stroke }) => (
          <path
            key={key}
            d={linePath(key)}
            fill="none"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {data.map((d, i) => (
          lines.map(({ key, stroke }) => (
            <circle
              key={`${key}-${i}`}
              cx={toX(i)} cy={toY(d[key])} r={2.5}
              fill={stroke}
            />
          ))
        ))}
      </svg>
      <div className="mt-2 flex justify-between">
        {data.map((d, i) => (
          <span key={i} className="text-[9px] text-white/20">{d.date}</span>
        ))}
      </div>
      <div className="mt-3 flex gap-4">
        {lines.map(({ label, stroke }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="h-1.5 w-3 rounded-full" style={{ backgroundColor: stroke }} />
            <span className="text-[10px] text-white/40">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Burnout gauge ────────────────────────────────────────────────────────────

const burnoutConfig = {
  LOW: { label: "Low Risk", color: "text-emerald-400", bg: "bg-emerald-500", track: "bg-emerald-500/20" },
  MEDIUM: { label: "Moderate Risk", color: "text-amber-400", bg: "bg-amber-500", track: "bg-amber-500/20" },
  HIGH: { label: "High Risk", color: "text-red-400", bg: "bg-red-500", track: "bg-red-500/20" },
}

// ─── Cross-Goal Analysis ──────────────────────────────────────────────────────

type CrossGoalResult = {
  overallHealth: "thriving" | "steady" | "at_risk" | "struggling"
  headline: string
  insights: string[]
  bottleneck: string | null
  priorityOrder: string[]
  recommendation: string
  goalSummaries: Array<{ id: string; title: string; status: string; adherence: number | null; daysRemaining: number | null }>
}

const healthConfig = {
  thriving:   { label: "Thriving",   color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/5" },
  steady:     { label: "Steady",     color: "text-blue-400",    border: "border-blue-500/20",    bg: "bg-blue-500/5"    },
  at_risk:    { label: "At Risk",    color: "text-amber-400",   border: "border-amber-500/20",   bg: "bg-amber-500/5"   },
  struggling: { label: "Struggling", color: "text-red-400",     border: "border-red-500/20",     bg: "bg-red-500/5"     },
}

const statusDot: Record<string, string> = {
  ahead:    "bg-emerald-400",
  on_track: "bg-blue-400",
  behind:   "bg-amber-400",
  at_risk:  "bg-red-400",
}

function CrossGoalAnalysis() {
  const [result, setResult] = useState<CrossGoalResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")

  const run = async () => {
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/ai/cross-goal-analysis")
      if (res.ok) { setResult(await res.json()); setOpen(true) }
      else { const d = await res.json(); setError(d.error ?? "Failed") }
    } finally { setLoading(false) }
  }

  const hc = result ? healthConfig[result.overallHealth] : null

  return (
    <div className="mb-6">
      <div className={cn("rounded-xl border", hc ? `${hc.border} ${hc.bg}` : "border-white/6 bg-white/2")}>
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600/20">
            <Sparkles className="h-4 w-4 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">
              {result ? result.headline : "Why am I failing?"}
            </p>
            <p className="text-xs text-white/35">
              {result ? <span className={hc?.color}>{hc?.label}</span> : "AI analyses all your goals simultaneously"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <button onClick={() => setOpen(!open)} className="text-white/30 hover:text-white/60 transition">
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={run}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600/20 px-3 py-1.5 text-xs font-medium text-violet-400 transition hover:bg-violet-600/30 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {loading ? "Analysing…" : result ? "Re-analyse" : "Analyse all goals"}
            </button>
          </div>
        </div>

        {open && result && (
          <div className="border-t border-white/6 px-5 pb-5 pt-4 space-y-4">
            <div className="space-y-2">
              {result.goalSummaries.map((g) => (
                <div key={g.id} className="flex items-center gap-3 rounded-lg border border-white/6 bg-white/2 px-3 py-2.5">
                  <div className={cn("h-2 w-2 shrink-0 rounded-full", statusDot[g.status] ?? "bg-white/20")} />
                  <span className="flex-1 text-sm text-white/75 truncate">{g.title}</span>
                  {g.adherence !== null && (
                    <span className={cn("text-xs font-medium", g.adherence >= 70 ? "text-emerald-400" : g.adherence >= 50 ? "text-amber-400" : "text-red-400")}>
                      {g.adherence}%
                    </span>
                  )}
                  {g.daysRemaining !== null && (
                    <span className="text-[11px] text-white/30">{g.daysRemaining}d left</span>
                  )}
                </div>
              ))}
            </div>
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-white/30">Insights</p>
              <ul className="space-y-1.5">
                {result.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
            {result.priorityOrder.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-white/30">Focus Priority</p>
                <div className="flex flex-wrap gap-2">
                  {result.priorityOrder.map((title, i) => (
                    <span key={title} className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/4 px-2.5 py-1 text-xs text-white/60">
                      <span className="font-semibold text-white/30">{i + 1}</span>{title}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-violet-400/70">Recommendation</p>
              <p className="text-sm text-white/80">{result.recommendation}</p>
            </div>
          </div>
        )}
        {error && <p className="px-5 pb-4 text-xs text-red-400">{error}</p>}
      </div>
    </div>
  )
}

// ─── Schedule Section ─────────────────────────────────────────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const
type Day = typeof DAYS[number]

function activityWeeklyMins(row: ActivityRow): number {
  return DAYS.reduce((s, d) => s + (row[d] ?? 0), 0)
}

function GoalCard({
  goalId, entry, editable = false,
  onActivityChange,
}: {
  goalId: string
  entry: GoalSchedule
  editable?: boolean
  onActivityChange?: (goalId: string, actIdx: number, day: Day, val: number) => void
}) {
  const hasActivities = entry.activities.length > 0
  const hasHabits = entry.habits.length > 0
  if (!hasActivities && !hasHabits) return null

  return (
    <div className="rounded-xl border border-white/6 bg-white/2 p-4">
      <p className="mb-3 text-sm font-medium text-white">{entry.title}</p>

      {hasActivities && (
        <div className="space-y-4">
          {entry.activities.map((act, actIdx) => (
            <div key={actIdx}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-white/45">{act.name}</span>
                <span className="text-xs text-white/25">{Math.round(activityWeeklyMins(act) / 60 * 10) / 10}h/week</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {DAYS.map((d) => (
                  <div key={d} className="flex flex-col items-center gap-1">
                    {editable ? (
                      <input
                        type="number" min={0} max={480} value={act[d]}
                        onChange={(e) => {
                          const v = Math.max(0, Math.min(480, parseInt(e.target.value) || 0))
                          onActivityChange?.(goalId, actIdx, d, v)
                        }}
                        className="w-full rounded-md border border-white/8 bg-white/4 py-1.5 text-center text-xs text-white/80 focus:border-violet-500/50 focus:outline-none"
                      />
                    ) : (
                      <div className={cn("w-full rounded-md py-1.5 text-center text-[11px] font-medium",
                        act[d] > 0 ? "bg-violet-600/25 text-violet-300" : "bg-white/4 text-white/20"
                      )}>
                        {act[d] > 0 ? `${act[d]}m` : "—"}
                      </div>
                    )}
                    <span className="text-[9px] text-white/25">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasHabits && (
        <div className={cn("flex flex-wrap gap-2", hasActivities && "mt-4")}>
          {entry.habits.map((h, i) => (
            <div key={i} className="flex items-center gap-1.5 rounded-lg border border-white/6 bg-white/3 px-3 py-1.5">
              <span className="text-xs text-white/50">{h.name}</span>
              <span className="text-[11px] font-medium text-violet-400">{h.target}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ScheduleSection({ goals, initialSchedule }: { goals: ScheduleGoal[]; initialSchedule: Schedule }) {
  type Status = "view" | "generating" | "setup" | "confirming" | "editing" | "optimizing"
  const hasSchedule = Object.keys(initialSchedule).length > 0

  const [schedule, setSchedule] = useState<Schedule>(initialSchedule)
  const [status, setStatus] = useState<Status>("view")
  const [questions, setQuestions] = useState<Array<{ goalId: string; question: string }>>([])
  const [qaAnswers, setQaAnswers] = useState<string[]>([])
  const [currentInput, setCurrentInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [extracted, setExtracted] = useState<Schedule | null>(null)
  const [editDraft, setEditDraft] = useState<Schedule>({})
  const [optimizeResult, setOptimizeResult] = useState<{ suggestedSchedule: Schedule; changes: string[]; priorityOrder: string[]; reasoning: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const currentQ = qaAnswers.length
  const allAnswered = questions.length > 0 && currentQ >= questions.length

  const startSetup = async () => {
    setStatus("generating")
    try {
      const res = await fetch("/api/ai/schedule-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals }),
      })
      if (res.ok) {
        const data = await res.json()
        setQuestions(data.questions ?? [])
        setQaAnswers([])
        setCurrentInput("")
        setStatus("setup")
      } else {
        setStatus("view")
      }
    } catch {
      setStatus("view")
    }
  }

  const submitAnswer = async () => {
    if (!currentInput.trim()) return
    const newAnswers = [...qaAnswers, currentInput.trim()]
    setQaAnswers(newAnswers)
    setCurrentInput("")
    if (newAnswers.length >= questions.length) {
      setLoading(true)
      try {
        // Group questions+answers by goalId
        const byGoal = questions.reduce<Record<string, { questions: string[]; answers: string[] }>>((acc, q, i) => {
          if (!acc[q.goalId]) acc[q.goalId] = { questions: [], answers: [] }
          acc[q.goalId].questions.push(q.question)
          acc[q.goalId].answers.push(newAnswers[i] ?? "")
          return acc
        }, {})
        const qa = Object.entries(byGoal).map(([goalId, v]) => ({ goalId, questions: v.questions, answers: v.answers }))
        const res = await fetch("/api/ai/schedule-extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qa, goals }),
        })
        if (res.ok) { setExtracted((await res.json()).schedule ?? {}); setStatus("confirming") }
      } finally { setLoading(false) }
    }
  }

  const saveSchedule = async (s: Schedule) => {
    setSaving(true)
    try {
      await fetch("/api/user/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) })
      setSchedule(s); setStatus("view")
    } finally { setSaving(false) }
  }

  const runOptimize = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/schedule-optimize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedule }) })
      if (res.ok) { setOptimizeResult(await res.json()); setStatus("optimizing") }
    } finally { setLoading(false) }
  }

  const handleActivityChange = (goalId: string, actIdx: number, day: Day, val: number) => {
    setEditDraft((prev) => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        activities: prev[goalId].activities.map((act, i) =>
          i === actIdx ? { ...act, [day]: val } : act
        ),
      },
    }))
  }

  // ── Empty / idle ──────────────────────────────────────────────────────────
  if (status === "view" && !hasSchedule) return (
    <div className="mb-6 rounded-xl border border-white/6 bg-white/2 p-5">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-white">Understand my habits</p>
          <p className="mt-0.5 text-xs text-white/35">AI asks the right questions for each goal — workouts, meals, study time, sleep — to build a complete picture</p>
        </div>
        <button onClick={startSetup}
          className="shrink-0 rounded-lg bg-violet-600/20 px-4 py-2 text-sm font-medium text-violet-400 transition hover:bg-violet-600/30">
          Get started
        </button>
      </div>
    </div>
  )

  // ── Generating questions ───────────────────────────────────────────────────
  if (status === "generating") return (
    <div className="mb-6 rounded-xl border border-white/6 bg-white/2 p-5">
      <div className="flex items-center gap-3 text-sm text-white/40">
        <Loader2 className="h-4 w-4 animate-spin" />
        Understanding your goals…
      </div>
    </div>
  )

  // ── View saved schedule ────────────────────────────────────────────────────
  if (status === "view" && hasSchedule) return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">My Habits & Schedule</p>
          <p className="text-xs text-white/35">Workouts, study, meals, sleep — per goal</p>
        </div>
        <div className="flex gap-2">
          <button onClick={runOptimize} disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600/20 px-3 py-1.5 text-xs font-medium text-violet-400 transition hover:bg-violet-600/30 disabled:opacity-50">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {loading ? "Optimising…" : "AI Optimise"}
          </button>
          <button onClick={() => { setEditDraft(JSON.parse(JSON.stringify(schedule))); setStatus("editing") }}
            className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-3 py-1.5 text-xs font-medium text-white/50 transition hover:text-white/80">
            <Pencil className="h-3 w-3" /> Edit
          </button>
          <button onClick={startSetup}
            className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-3 py-1.5 text-xs font-medium text-white/50 transition hover:text-white/80">
            <RotateCcw className="h-3 w-3" /> Redo
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {Object.entries(schedule).map(([id, entry]) => (
          <GoalCard key={id} goalId={id} entry={entry} />
        ))}
      </div>
    </div>
  )

  // ── Edit mode ─────────────────────────────────────────────────────────────
  if (status === "editing") return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-white">Edit Schedule <span className="ml-2 text-xs font-normal text-white/30">minutes per day</span></p>
        <div className="flex gap-2">
          <button onClick={() => setStatus("view")} className="flex items-center gap-1 rounded-lg border border-white/8 px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition">
            <X className="h-3 w-3" /> Cancel
          </button>
          <button onClick={() => saveSchedule(editDraft)} disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600/30 px-3 py-1.5 text-xs font-medium text-violet-300 transition hover:bg-violet-600/40 disabled:opacity-50">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {Object.entries(editDraft).map(([id, entry]) => (
          <GoalCard key={id} goalId={id} entry={entry} editable onActivityChange={handleActivityChange} />
        ))}
      </div>
    </div>
  )

  // ── AI Optimize result ────────────────────────────────────────────────────
  if (status === "optimizing" && optimizeResult) return (
    <div className="mb-6 rounded-xl border border-violet-500/20 bg-violet-500/5 p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-white">AI Schedule Suggestion</p>
        <button onClick={() => setStatus("view")} className="text-white/30 hover:text-white/60 transition"><X className="h-4 w-4" /></button>
      </div>
      <p className="mb-4 text-xs text-white/55 leading-relaxed">{optimizeResult.reasoning}</p>
      {optimizeResult.changes.length > 0 && (
        <ul className="mb-4 space-y-1.5">
          {optimizeResult.changes.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-white/60">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-violet-400" />{c}
            </li>
          ))}
        </ul>
      )}
      <div className="space-y-3">
        {Object.entries(optimizeResult.suggestedSchedule).map(([id, entry]) => (
          <GoalCard key={id} goalId={id} entry={entry} />
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={() => saveSchedule(optimizeResult.suggestedSchedule)} disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600/30 px-4 py-2 text-xs font-medium text-violet-300 transition hover:bg-violet-600/40 disabled:opacity-50">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Apply suggestion
        </button>
        <button onClick={() => setStatus("view")} className="rounded-lg border border-white/8 px-4 py-2 text-xs text-white/40 hover:text-white/70 transition">Keep current</button>
      </div>
    </div>
  )

  // ── Confirming extracted schedule ─────────────────────────────────────────
  if (status === "confirming" && extracted) return (
    <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">Here&apos;s what I understood</p>
          <p className="text-xs text-white/35">Confirm or redo</p>
        </div>
        <button onClick={() => { setQaAnswers([]); setCurrentInput(""); setStatus("setup") }}
          className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition">
          <RotateCcw className="h-3 w-3" /> Re-do
        </button>
      </div>
      <div className="space-y-3">
        {Object.entries(extracted).map(([id, entry]) => (
          <GoalCard key={id} goalId={id} entry={entry} />
        ))}
      </div>
      <button onClick={() => saveSchedule(extracted)} disabled={saving}
        className="mt-5 flex items-center gap-1.5 rounded-lg bg-emerald-600/25 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-600/35 disabled:opacity-50">
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save
      </button>
    </div>
  )

  // ── Setup Q&A ─────────────────────────────────────────────────────────────
  if (goals.length === 0) return (
    <div className="mb-6 rounded-xl border border-white/6 bg-white/2 p-5 text-center">
      <p className="text-sm text-white/30">Create some active goals first.</p>
    </div>
  )

  const currentGoalId = questions[currentQ]?.goalId
  const currentGoalTitle = goals.find((g) => g.id === currentGoalId)?.title
  const prevGoalId = currentQ > 0 ? questions[currentQ - 1]?.goalId : null
  const isNewGoal = currentGoalId !== prevGoalId

  return (
    <div className="mb-6 rounded-xl border border-white/6 bg-white/2 p-5">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-medium text-white">Understanding your goals</p>
        <p className="text-xs text-white/30">{allAnswered ? "Processing…" : `${currentQ + 1} / ${questions.length}`}</p>
      </div>
      <div className="my-3 h-0.5 w-full rounded-full bg-white/6">
        <div className="h-full rounded-full bg-violet-500/60 transition-all duration-300" style={{ width: `${Math.round((currentQ / questions.length) * 100)}%` }} />
      </div>
      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-white/40">
          <Loader2 className="h-4 w-4 animate-spin" /> Building your profile…
        </div>
      ) : (
        <>
          {currentGoalTitle && (
            <p className={cn("mb-2 text-[11px] font-semibold uppercase tracking-widest",
              isNewGoal ? "text-violet-400/80" : "text-white/25"
            )}>
              {currentGoalTitle}
            </p>
          )}
          <p className="mb-3 text-sm text-white/80">{questions[currentQ]?.question}</p>
          <div className="flex gap-2">
            <input autoFocus value={currentInput} onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitAnswer()} placeholder="Type your answer…"
              className="flex-1 rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-violet-500/50 focus:outline-none" />
            <button onClick={submitAnswer} disabled={!currentInput.trim()}
              className="rounded-lg bg-violet-600/30 px-4 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-600/40 disabled:opacity-40">
              Next
            </button>
          </div>
        </>
      )}
      {hasSchedule && (
        <button onClick={() => setStatus("view")} className="mt-3 text-xs text-white/25 hover:text-white/50 transition">← Back</button>
      )}
    </div>
  )
}

// ─── Goal type colors ─────────────────────────────────────────────────────────

const typeColor: Record<string, string> = {
  LEARNING: "bg-blue-500",
  FITNESS: "bg-emerald-500",
  CAREER: "bg-amber-500",
  PERSONAL: "bg-violet-500",
  CUSTOM: "bg-white/30",
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AnalyticsClient({
  streak,
  taskCompletionRate,
  goalCompletionRate,
  weeklyFocusMinutes,
  alignmentScore,
  burnoutScore,
  burnoutLevel,
  weeklyFocusByDay,
  energyTrend,
  tasksByDay,
  activeGoals,
  totalTasks,
  completedTasks,
  scheduleGoals,
  savedSchedule,
}: Props) {
  const bc = burnoutConfig[burnoutLevel]
  const focusHours = (weeklyFocusMinutes / 60).toFixed(1)

  const kpis = [
    {
      label: "Streak",
      value: streak,
      suffix: streak === 1 ? " day" : " days",
      icon: Flame,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      label: "Task completion",
      value: taskCompletionRate,
      suffix: "%",
      icon: CheckSquare,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      sub: `${completedTasks}/${totalTasks} tasks`,
    },
    {
      label: "Goal completion",
      value: goalCompletionRate,
      suffix: "%",
      icon: Target,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Focus this week",
      value: focusHours,
      suffix: "h",
      icon: Zap,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      sub: `${weeklyFocusMinutes} minutes`,
    },
    {
      label: "Goal alignment",
      value: alignmentScore,
      suffix: "%",
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      sub: "tasks linked to goals",
    },
    {
      label: "Burnout risk",
      value: burnoutScore,
      suffix: "",
      icon: Shield,
      color: bc.color,
      bg: bc.track,
      sub: bc.label,
    },
  ]

  return (
    <div className="min-h-full p-4 lg:p-8" style={{ transform: "translateZ(0)" }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Analytics</h1>
        <p className="mt-0.5 text-sm text-white/40">How your work maps to your goals</p>
      </div>

      {/* KPI cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {kpis.map(({ label, value, suffix, icon: Icon, color, bg, sub }) => (
          <div
            key={label}
            className="rounded-xl border border-white/6 bg-white/2 p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-white/40">{label}</span>
              <div className={cn("rounded-lg p-2", bg)}>
                <Icon className={cn("h-3.5 w-3.5", color)} />
              </div>
            </div>
            <p className="text-2xl font-semibold text-white">
              {value}
              <span className="ml-0.5 text-sm font-normal text-white/40">{suffix}</span>
            </p>
            {sub && <p className="mt-0.5 text-[11px] text-white/25">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Burnout bar */}
      <div className="mb-8 rounded-xl border border-white/6 bg-white/2 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Burnout Risk</p>
            <p className="text-xs text-white/35">Based on stress levels and overdue tasks</p>
          </div>
          <span className={cn("text-sm font-semibold", bc.color)}>{bc.label}</span>
        </div>
        <div className={cn("h-2 w-full overflow-hidden rounded-full", bc.track)}>
          <div
            className={cn("h-full rounded-full", bc.bg)}
            style={{ width: `${burnoutScore}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-white/20">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </div>

      {/* Charts row */}
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        {/* Focus time */}
        <div className="rounded-xl border border-white/6 bg-white/2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-white">Focus Time</p>
            <span className="text-xs text-white/30">Last 7 days</span>
          </div>
          <BarChart
            data={weeklyFocusByDay.map((d) => ({ label: d.day, value: d.minutes }))}
          />
        </div>

        {/* Trend lines */}
        <div className="rounded-xl border border-white/6 bg-white/2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-white">Energy & Focus Trend</p>
            <span className="text-xs text-white/30">Last 10 sessions</span>
          </div>
          <TrendChart data={energyTrend} />
        </div>
      </div>

      {/* Tasks completed by day */}
      <div className="mb-8 rounded-xl border border-white/6 bg-white/2 p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-white">Tasks Completed</p>
          <span className="text-xs text-white/30">Last 7 days</span>
        </div>
        <BarChart
          data={tasksByDay.map((d) => ({ label: d.day, value: d.completed }))}
          color="bg-emerald-500/50"
        />
      </div>

      {/* Goal progress */}
      {activeGoals.length > 0 && (
        <div className="rounded-xl border border-white/6 bg-white/2 p-5">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm font-medium text-white">Goal Progress</p>
            <span className="text-xs text-white/30">{activeGoals.length} active</span>
          </div>
          <div className="space-y-4">
            {activeGoals.map((goal, i) => (
              <div key={i}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn("h-2 w-2 shrink-0 rounded-full", typeColor[goal.type] ?? "bg-white/30")} />
                    <span className="truncate text-sm text-white/70">{goal.title}</span>
                  </div>
                  <span className="ml-3 shrink-0 text-xs font-medium text-white/50">{goal.progress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/6">
                  <div
                    className={cn("h-full rounded-full", typeColor[goal.type] ?? "bg-white/30")}
                    style={{ width: `${goal.progress}%`, opacity: 0.7 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {activeGoals.length === 0 && completedTasks === 0 && weeklyFocusMinutes === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <TrendingUp className="mb-3 h-10 w-10 text-white/10" />
          <p className="text-sm font-medium text-white/30">No data yet</p>
          <p className="mt-1 text-xs text-white/20">
            Complete tasks, set goals, and log focus sessions to see your analytics
          </p>
        </div>
      )}

      {/* AI cross-goal analysis */}
      {activeGoals.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-sm font-medium text-white/50 uppercase tracking-widest">AI Analysis</h2>
          <CrossGoalAnalysis />
        </div>
      )}

      {/* Weekly schedule */}
      <div className="mt-8">
        <h2 className="mb-4 text-sm font-medium text-white/50 uppercase tracking-widest">My Schedule</h2>
        <ScheduleSection goals={scheduleGoals} initialSchedule={savedSchedule} />
      </div>
    </div>
  )
}
