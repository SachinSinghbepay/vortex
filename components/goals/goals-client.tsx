"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Target, Trash2, Calendar, Sparkles, Shield, Eye, TrendingUp, CheckCircle2, AlertTriangle, XCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { DecomposeModal } from "@/components/ai/decompose-modal"
import { RealityCheckModal } from "@/components/ai/reality-check-modal"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { PageTransition, listVariants, itemVariants } from "@/components/ui/page-transition"

type GoalType = "LEARNING" | "FITNESS" | "CAREER" | "PERSONAL" | "CUSTOM"
type GoalStatus = "ACTIVE" | "COMPLETED" | "PAUSED" | "FAILED"
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"

interface Goal {
  id: string
  title: string
  description: string | null
  context: string | null
  deadline: string | null
  priority: Priority
  progress: number
  status: GoalStatus
  type: GoalType
  createdAt: string
  hasAnalysis: boolean
}

const typeConfig: Record<GoalType, { label: string; color: string; bg: string }> = {
  LEARNING: { label: "Learning", color: "text-blue-400", bg: "bg-blue-500/10" },
  FITNESS: { label: "Fitness", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  CAREER: { label: "Career", color: "text-amber-400", bg: "bg-amber-500/10" },
  PERSONAL: { label: "Personal", color: "text-violet-400", bg: "bg-violet-500/10" },
  CUSTOM: { label: "Custom", color: "text-white/40", bg: "bg-white/5" },
}

const statusConfig: Record<GoalStatus, { label: string; dot: string }> = {
  ACTIVE: { label: "Active", dot: "bg-emerald-400" },
  COMPLETED: { label: "Completed", dot: "bg-blue-400" },
  PAUSED: { label: "Paused", dot: "bg-amber-400" },
  FAILED: { label: "Failed", dot: "bg-red-400" },
}

const statusFilters = ["ALL", "ACTIVE", "COMPLETED", "PAUSED"] as const

const inputCls =
  "w-full rounded-lg border border-white/[0.07] bg-white/4 px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none transition focus:border-violet-500/40 focus:bg-white/[0.07]"

const selectCls =
  "w-full rounded-lg border border-white/[0.07] bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-white outline-none scheme-dark"

// ─── Prediction Viewer ───────────────────────────────────────────────────────

const statusBadge: Record<string, { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
  ahead:    { label: "Ahead of Schedule", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400", Icon: CheckCircle2 },
  on_track: { label: "On Track",          cls: "border-blue-500/30 bg-blue-500/10 text-blue-400",         Icon: CheckCircle2 },
  behind:   { label: "Behind Schedule",   cls: "border-amber-500/30 bg-amber-500/10 text-amber-400",      Icon: AlertTriangle },
  at_risk:  { label: "At Risk",           cls: "border-red-500/30 bg-red-500/10 text-red-400",            Icon: XCircle },
}

const actionLabel: Record<string, string> = {
  continue:           "Keep going",
  increase_frequency: "Increase frequency",
  extend_deadline:    "Extend deadline",
  reduce_scope:       "Reduce scope",
  focus_bottleneck:   "Focus on bottleneck",
}

function PredictionViewer({ data }: { data: Record<string, unknown> }) {
  const probability = typeof data.probability === "number" ? data.probability : 0
  const status = typeof data.status === "string" ? data.status : "on_track"
  const badge = statusBadge[status] ?? statusBadge.on_track
  const { Icon } = badge

  const probColor =
    probability >= 70 ? "text-emerald-400" :
    probability >= 40 ? "text-amber-400"   :
                        "text-red-400"

  const insights = Array.isArray(data.insights) ? (data.insights as unknown[]).map(String) : []
  const action = typeof data.action === "string" ? data.action : null
  const revisedDeadline = typeof data.revisedDeadline === "string" ? data.revisedDeadline : null
  const bottleneck = typeof data.bottleneckCategory === "string" ? data.bottleneckCategory : null

  return (
    <div className="space-y-4">
      {/* Probability */}
      <div className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/3 px-5 py-4">
        <span className={`text-5xl font-bold tabular-nums ${probColor}`}>{probability}%</span>
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-widest text-white/30">Achievement probability</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${badge.cls}`}>
            <Icon className="h-3 w-3" />
            {badge.label}
          </span>
        </div>
      </div>

      {/* Summary */}
      {!!data.summary && (
        <p className="text-sm leading-relaxed text-white/60">{String(data.summary)}</p>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-white/30">Insights</p>
          <ul className="space-y-1.5">
            {insights.map((ins, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/55">
                <span className="mt-0.5 text-violet-400">✦</span>{ins}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendation */}
      {!!data.recommendation && (
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-violet-400/60">Recommendation</p>
          <p className="text-sm text-violet-300">{String(data.recommendation)}</p>
          {action && actionLabel[action] && (
            <span className="mt-2 inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] text-violet-400">
              {actionLabel[action]}
            </span>
          )}
        </div>
      )}

      {/* Revised deadline / bottleneck */}
      {(revisedDeadline || bottleneck) && (
        <div className="flex flex-wrap gap-3">
          {revisedDeadline && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3.5 py-2.5">
              <p className="text-[10px] uppercase tracking-widest text-amber-400/60">Suggested deadline</p>
              <p className="mt-0.5 text-sm font-medium text-amber-300">{revisedDeadline}</p>
            </div>
          )}
          {bottleneck && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3.5 py-2.5">
              <p className="text-[10px] uppercase tracking-widest text-red-400/60">Bottleneck</p>
              <p className="mt-0.5 text-sm font-medium text-red-300">{bottleneck}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Analysis Viewer ─────────────────────────────────────────────────────────

function AnalysisViewer({ data, onSaveTasks, onSaveHabits }: {
  data: Record<string, unknown>
  onSaveTasks?: (tasks: string[], title: string, index: number) => Promise<void>
  onSaveHabits?: (habits: Array<{ title: string; recurrence: string }>) => Promise<void>
}) {
  const [saved, setSaved] = useState<number[]>([])
  const [saving, setSaving] = useState<number | null>(null)
  const [habitsSaved, setHabitsSaved] = useState(false)

  const handleSave = async (tasks: string[], title: string, index: number) => {
    if (!onSaveTasks || saved.includes(index)) return
    setSaving(index)
    await onSaveTasks(tasks, title, index)
    setSaved((p) => [...p, index])
    setSaving(null)
  }

  const handleSaveHabits = async () => {
    if (!onSaveHabits) return
    const habits = (data.habits as Array<{ title: string; recurrence: string }> | undefined) ?? []
    if (!habits.length) return
    await onSaveHabits(habits)
    setHabitsSaved(true)
  }

  const isStudyPlan = data._type === "STUDY_PLAN"

  if (isStudyPlan) {
    type WeekPlan = { week: number; focus: string; dailyTasks?: string[] }
    const weeklyPlan = (data.weeklyPlan as WeekPlan[] | undefined) ?? []
    const examTips = (data.examTips as string[] | undefined) ?? []
    return (
      <div className="space-y-4">
        {!!data.overview && (
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3">
            <p className="text-xs leading-relaxed text-violet-300">{String(data.overview)}</p>
          </div>
        )}
        {weeklyPlan.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-widest text-white/30">Weekly Plan</p>
            {weeklyPlan.map((w, i) => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">Week {w.week} <span className="text-xs text-white/35">{w.focus}</span></p>
                  {onSaveTasks && (w.dailyTasks ?? []).length > 0 && (
                    <button
                      onClick={() => handleSave(w.dailyTasks ?? [], `Week ${w.week} – ${w.focus}`, i)}
                      disabled={saved.includes(i) || saving === i}
                      className="shrink-0 text-[11px] text-violet-400 hover:text-violet-300 disabled:text-white/25 transition"
                    >
                      {saved.includes(i) ? "✓ Saved" : saving === i ? "Saving…" : "+ Add to Tasks"}
                    </button>
                  )}
                </div>
                {(w.dailyTasks ?? []).length > 0 && (
                  <ul className="space-y-1">
                    {(w.dailyTasks ?? []).map((t, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-white/55">
                        <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400/60" />{t}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
        {examTips.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-white/30">Tips</p>
            <ul className="space-y-1.5">
              {examTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                  <span className="text-violet-400">✦</span>{tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  // GOAL_DECOMPOSITION format
  type Habit = { title: string; recurrence: string }
  type Milestone = { title: string; duration: string; tasks: string[] }
  const habits = (data.habits as Habit[] | undefined) ?? []
  const milestones = (data.milestones as Milestone[] | undefined) ?? []
  const tips = (data.tips as string[] | undefined) ?? []
  return (
    <div className="space-y-4">
      {!!data.realisticAssessment && (
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3">
          <p className="text-xs leading-relaxed text-violet-300">{String(data.realisticAssessment)}</p>
        </div>
      )}
      {habits.length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-emerald-400/70">Daily Habits</p>
              <p className="mt-0.5 text-xs text-white/35">Recurring actions that actually move the needle</p>
            </div>
            {onSaveHabits && (
              <button
                onClick={handleSaveHabits}
                disabled={habitsSaved}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 disabled:text-white/25 transition"
              >
                {habitsSaved ? "✓ Added" : "+ Add all habits"}
              </button>
            )}
          </div>
          <ul className="space-y-1.5">
            {habits.map((h, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-white/65">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/60" />
                {h.title}
                <span className="ml-auto shrink-0 text-[10px] text-white/25">
                  {h.recurrence === "EVERY_OTHER_DAY" ? "every other day" : "daily"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {milestones.map((m, i) => (
        <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-white">{m.title} <span className="text-xs text-white/35">{m.duration}</span></p>
            {onSaveTasks && m.tasks.length > 0 && (
              <button
                onClick={() => handleSave(m.tasks, m.title, i)}
                disabled={saved.includes(i) || saving === i}
                className="shrink-0 text-[11px] text-violet-400 hover:text-violet-300 disabled:text-white/25 transition"
              >
                {saved.includes(i) ? "✓ Saved" : saving === i ? "Saving…" : "+ Add to Tasks"}
              </button>
            )}
          </div>
          <ul className="space-y-1">
            {m.tasks.map((t, j) => (
              <li key={j} className="flex items-start gap-2 text-xs text-white/55">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400/60" />{t}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {tips.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-white/30">Tips</p>
          <ul className="space-y-1.5">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                <span className="text-violet-400">✦</span>{tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function GoalsClient({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, setGoals] = useState(initialGoals)
  const [filter, setFilter] = useState<(typeof statusFilters)[number]>("ALL")
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [decomposeGoal, setDecomposeGoal] = useState<Goal | null>(null)
  const [decomposeAutoGenerate, setDecomposeAutoGenerate] = useState(false)
  const [showRealityCheck, setShowRealityCheck] = useState(false)
  const [analysisGoal, setAnalysisGoal] = useState<Goal | null>(null)
  const [analysisResult, setAnalysisResult] = useState<Record<string, unknown> | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  const [predictionGoal, setPredictionGoal] = useState<Goal | null>(null)
  const [predictionResult, setPredictionResult] = useState<Record<string, unknown> | null>(null)
  const [predictionLoading, setPredictionLoading] = useState(false)

  const handleViewAnalysis = async (goal: Goal) => {
    setAnalysisGoal(goal)
    setAnalysisResult(null)
    setAnalysisLoading(true)
    try {
      const res = await fetch(`/api/goals/${goal.id}/analysis`)
      if (res.ok) setAnalysisResult(await res.json())
      else setAnalysisResult({ error: "No AI analysis saved for this goal yet. Use 'Decompose with AI' first." })
    } finally {
      setAnalysisLoading(false)
    }
  }

  const handlePredict = async (goal: Goal) => {
    setPredictionGoal(goal)
    setPredictionResult(null)
    setPredictionLoading(true)
    try {
      const res = await fetch(`/api/goals/${goal.id}/prediction`)
      if (res.ok) setPredictionResult(await res.json())
      else setPredictionResult({ error: "Failed to generate prediction. Try again." })
    } finally {
      setPredictionLoading(false)
    }
  }
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "PERSONAL" as GoalType,
    priority: "MEDIUM" as Priority,
    deadline: "",
  })
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1)
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [expandedContextGoals, setExpandedContextGoals] = useState<Set<string>>(new Set())

  const filtered = filter === "ALL" ? goals : goals.filter((g) => g.status === filter)

  const handleCloseCreate = () => {
    setShowCreate(false)
    setCreateStep(1)
    setQuestions([])
    setAnswers([])
    setForm({ title: "", description: "", type: "PERSONAL", priority: "MEDIUM", deadline: "" })
  }

  const fetchQuestions = async () => {
    setQuestionsLoading(true)
    try {
      const res = await fetch("/api/ai/goal-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, type: form.type, description: form.description }),
      })
      const data = await res.json()
      const qs: string[] = data.questions ?? []
      setQuestions(qs)
      setAnswers(new Array(qs.length).fill(""))
      setCreateStep(2)
    } catch {
      setCreateStep(3)
    } finally {
      setQuestionsLoading(false)
    }
  }

  const handleCreate = async (withDecompose = false) => {
    if (!form.title.trim()) return
    setCreating(true)
    const contextData = questions.length > 0
      ? JSON.stringify(questions.map((q, i) => ({ q, a: answers[i] ?? "" })).filter(({ a }) => a.trim()))
      : undefined
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...(contextData && { context: contextData }) }),
      })
      if (res.ok) {
        const goal = await res.json()
        const newGoal: Goal = {
          ...goal,
          deadline: goal.deadline ?? null,
          context: goal.context ?? null,
          createdAt: goal.createdAt,
          hasAnalysis: false,
        }
        setGoals((p) => [newGoal, ...p])
        handleCloseCreate()
        toast.success("Goal created")
        if (withDecompose) setTimeout(() => { setDecomposeAutoGenerate(true); setDecomposeGoal(newGoal) }, 150)
      } else {
        toast.error("Failed to create goal")
      }
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    setGoals((p) => p.filter((g) => g.id !== id))
    await fetch(`/api/goals/${id}`, { method: "DELETE" })
    toast.success("Goal deleted")
  }

  const handleProgress = async (id: string, progress: number) => {
    setGoals((p) => p.map((g) => (g.id === id ? { ...g, progress } : g)))
    await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress }),
    })
    toast.success(`Progress updated to ${progress}%`)
  }

  const handleSaveTasks = async (tasks: string[], milestoneTitle: string, milestoneIndex = 0, goalId?: string) => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() + milestoneIndex * 14)
    const dueDate = new Date(today)
    dueDate.setDate(today.getDate() + (milestoneIndex + 1) * 14 - 1)

    await Promise.all(
      tasks.map((title) =>
        fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            priority: "MEDIUM",
            category: milestoneTitle,
            startDate: startDate.toISOString(),
            dueDate: dueDate.toISOString(),
            ...(goalId && { goalId }),
          }),
        })
      )
    )
    toast.success(`${tasks.length} task${tasks.length !== 1 ? "s" : ""} added`)
  }

  const handleSaveHabits = async (habits: Array<{ title: string; recurrence: string }>, goalId?: string, deadline?: string | null) => {
    const today = new Date()
    const endDate = deadline ? new Date(deadline) : new Date(today.getTime() + 180 * 86400000)
    await Promise.all(
      habits.map(({ title, recurrence }) =>
        fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            priority: "MEDIUM",
            recurrence: recurrence || "DAILY",
            startDate: today.toISOString(),
            recurrenceEndDate: endDate.toISOString(),
            ...(goalId && { goalId }),
          }),
        })
      )
    )
    toast.success(`${habits.length} recurring habit${habits.length !== 1 ? "s" : ""} added to tasks`)
  }

  const handleStatus = async (id: string, status: GoalStatus) => {
    setGoals((p) => p.map((g) => (g.id === id ? { ...g, status } : g)))
    await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
  }

  return (
    <PageTransition className="min-h-full p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Goals</h1>
          <p className="mt-0.5 text-sm text-white/40">{goals.length} total</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowRealityCheck(true)}
            variant="ghost"
            className="gap-1.5 border border-white/[0.07] text-white/50 hover:text-white/80"
          >
            <Shield className="h-4 w-4" /> Reality Check
          </Button>
          <Button onClick={() => { setShowCreate(true); setCreateStep(1) }} className="gap-1.5 bg-violet-600 text-white hover:bg-violet-500">
            <Plus className="h-4 w-4" /> New Goal
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-1">
        {statusFilters.map((f) => {
          const count = f === "ALL" ? goals.length : goals.filter((g) => g.status === f).length
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white/70"
              )}
            >
              {f === "ALL" ? "All" : f[0] + f.slice(1).toLowerCase()}
              <span className="ml-1.5 text-white/25">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Goals grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Target className="mb-3 h-10 w-10 text-white/10" />
          <p className="text-sm text-white/30">
            {filter === "ALL" ? "No goals yet" : `No ${filter.toLowerCase()} goals`}
          </p>
          {filter === "ALL" && (
            <Button
              onClick={() => setShowCreate(true)}
              variant="ghost"
              className="mt-4 gap-1.5 text-violet-400 hover:text-violet-300"
            >
              <Plus className="h-4 w-4" /> Create your first goal
            </Button>
          )}
        </div>
      ) : (
        <motion.div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" variants={listVariants} initial="hidden" animate="visible">
          {filtered.map((goal) => {
            const tc = typeConfig[goal.type]
            const sc = statusConfig[goal.status]
            return (
              <motion.div
                key={goal.id}
                variants={itemVariants}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition hover:border-white/10 hover:bg-white/[0.04]"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-medium", tc.bg, tc.color)}>
                    {tc.label}
                  </span>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="text-white/0 transition group-hover:text-white/25 hover:!text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <h3 className="mb-1 text-sm font-medium text-white">{goal.title}</h3>
                {goal.description && (
                  <p className="mb-1 line-clamp-2 text-xs text-white/35">{goal.description}</p>
                )}
                {goal.context && (() => {
                  try {
                    const qa = JSON.parse(goal.context) as { q: string; a: string }[]
                    if (!Array.isArray(qa) || !qa.some(({ a }) => a?.trim())) return null
                    const isExpanded = expandedContextGoals.has(goal.id)
                    return (
                      <div className="mb-3">
                        <button
                          onClick={() => setExpandedContextGoals((prev) => {
                            const next = new Set(prev)
                            if (next.has(goal.id)) next.delete(goal.id)
                            else next.add(goal.id)
                            return next
                          })}
                          className="flex items-center gap-1 text-[10px] text-white/25 transition hover:text-white/45"
                        >
                          {isExpanded ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                          {isExpanded ? "Hide context" : "View context"}
                        </button>
                        {isExpanded && (
                          <div className="mt-1.5 space-y-2 rounded-lg border border-white/5 bg-white/2 px-3 py-2">
                            {qa.filter(({ a }) => a?.trim()).map((item, i) => (
                              <div key={i}>
                                <p className="text-[10px] text-white/25">{item.q}</p>
                                <p className="text-[11px] text-white/50">{item.a}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  } catch { return null }
                })()}

                {/* Progress */}
                <div className="mb-4">
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-white/30">Progress</span>
                    <span className="font-medium text-white/60">{goal.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex gap-1">
                    {[0, 25, 50, 75, 100].map((p) => (
                      <button
                        key={p}
                        onClick={() => handleProgress(goal.id, p)}
                        style={goal.progress === p ? { color: "white" } : undefined}
                        className={cn(
                          "flex-1 rounded py-0.5 text-[10px] transition",
                          goal.progress === p
                            ? "bg-violet-600 dark:bg-violet-500/30"
                            : "text-foreground/35 hover:bg-foreground/5 hover:text-foreground/65"
                        )}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
                      <span className="text-white/40">{sc.label}</span>
                    </div>
                    {goal.deadline && (
                      <div className="flex items-center gap-1 text-white/30">
                        <Calendar className="h-3 w-3" />
                        {new Date(goal.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    )}
                  </div>
                  <select
                    value={goal.status}
                    onChange={(e) => handleStatus(goal.id, e.target.value as GoalStatus)}
                    className="cursor-pointer rounded bg-transparent text-[10px] text-white/25 outline-none hover:text-white/50 scheme-dark"
                  >
                    <option value="ACTIVE" className="bg-[#1a1a1a] text-white">Active</option>
                    <option value="COMPLETED" className="bg-[#1a1a1a] text-white">Completed</option>
                    <option value="PAUSED" className="bg-[#1a1a1a] text-white">Paused</option>
                    <option value="FAILED" className="bg-[#1a1a1a] text-white">Failed</option>
                  </select>
                </div>

                {/* AI button */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => { setDecomposeAutoGenerate(false); setDecomposeGoal(goal) }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/5 py-1.5 text-[11px] font-medium text-violet-400 transition hover:bg-violet-500/10 hover:text-violet-300"
                  >
                    <Sparkles className="h-3 w-3" />
                    {goal.hasAnalysis ? "Decompose Again" : "Decompose with AI"}
                  </button>
                  <button
                    onClick={() => handleViewAnalysis(goal)}
                    title="View saved AI analysis"
                    className="flex items-center justify-center gap-1 rounded-lg border border-white/8 bg-white/3 px-2.5 py-1.5 text-[11px] text-white/35 transition hover:bg-white/6 hover:text-white/60"
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handlePredict(goal)}
                    title="Predict goal achievement"
                    className="flex items-center justify-center gap-1 rounded-lg border border-white/8 bg-white/3 px-2.5 py-1.5 text-[11px] text-white/35 transition hover:bg-violet-500/20 hover:text-violet-400"
                  >
                    <TrendingUp className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* New Goal Modal — 3-step flow */}
      <Modal
        open={showCreate}
        onClose={handleCloseCreate}
        title={createStep === 1 ? "New Goal" : createStep === 2 ? "Tell Cortex more" : "Ready to plan"}
      >
        <div className="space-y-4">
          {/* Step indicator */}
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-0.5 flex-1 rounded-full transition-colors",
                  s <= createStep ? "bg-violet-500" : "bg-white/10"
                )}
              />
            ))}
          </div>

          {/* ── Step 1: Goal details ── */}
          {createStep === 1 && (
            <>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Learn Spanish to B1"
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional details..."
                  rows={2}
                  className={cn(inputCls, "resize-none")}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as GoalType })} className={selectCls}>
                    <option value="PERSONAL" className="bg-[#1a1a1a] text-white">Personal</option>
                    <option value="LEARNING" className="bg-[#1a1a1a] text-white">Learning</option>
                    <option value="FITNESS" className="bg-[#1a1a1a] text-white">Fitness</option>
                    <option value="CAREER" className="bg-[#1a1a1a] text-white">Career</option>
                    <option value="CUSTOM" className="bg-[#1a1a1a] text-white">Custom</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })} className={selectCls}>
                    <option value="LOW" className="bg-[#1a1a1a] text-white">Low</option>
                    <option value="MEDIUM" className="bg-[#1a1a1a] text-white">Medium</option>
                    <option value="HIGH" className="bg-[#1a1a1a] text-white">High</option>
                    <option value="URGENT" className="bg-[#1a1a1a] text-white">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Deadline</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className={cn(inputCls, "scheme-dark")}
                />
              </div>
              <Button
                onClick={fetchQuestions}
                disabled={!form.title.trim() || questionsLoading}
                className="w-full gap-2 bg-violet-600 text-white hover:bg-violet-500"
              >
                {questionsLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Preparing questions…</>
                ) : (
                  "Next →"
                )}
              </Button>
            </>
          )}

          {/* ── Step 2: AI Q&A ── */}
          {createStep === 2 && (
            <>
              <div>
                <p className="text-sm font-medium text-white">A few quick questions</p>
                <p className="mt-0.5 text-xs text-white/40">Cortex uses this to build a plan specific to you — answer what you can</p>
              </div>
              {questions.map((q, i) => (
                <div key={i} className="space-y-1.5">
                  <label className="text-xs text-white/60">{q}</label>
                  <input
                    value={answers[i] ?? ""}
                    onChange={(e) => setAnswers((prev) => { const next = [...prev]; next[i] = e.target.value; return next })}
                    placeholder="Your answer…"
                    className={inputCls}
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setCreateStep(1)} className="flex-1 text-xs text-white/40 hover:text-white/70">
                  ← Back
                </Button>
                <Button onClick={() => setCreateStep(3)} className="flex-1 bg-violet-600 text-white hover:bg-violet-500">
                  Continue →
                </Button>
              </div>
            </>
          )}

          {/* ── Step 3: Review + action ── */}
          {createStep === 3 && (
            <>
              {/* Summary preview */}
              <div className="rounded-xl border border-white/[0.07] bg-white/3 p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-white">{form.title}</p>
                  <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium", typeConfig[form.type].bg, typeConfig[form.type].color)}>
                    {typeConfig[form.type].label}
                  </span>
                </div>
                {form.description && (
                  <p className="text-xs text-white/40">{form.description}</p>
                )}
                {questions.some((_, i) => answers[i]?.trim()) && (
                  <div className="space-y-1.5 border-t border-white/6 pt-2">
                    {questions.map((q, i) =>
                      answers[i]?.trim() ? (
                        <div key={i}>
                          <p className="text-[10px] text-white/30">{q}</p>
                          <p className="text-xs text-white/55">{answers[i]}</p>
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </div>
              <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3">
                <p className="text-xs text-violet-300/80">
                  Cortex has enough context to generate a personalized roadmap with specific tasks and habits for this goal.
                </p>
              </div>
              <Button
                onClick={() => handleCreate(true)}
                disabled={creating}
                className="w-full gap-2 bg-violet-600 text-white hover:bg-violet-500"
              >
                {creating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Decompose &amp; Create Goal</>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleCreate(false)}
                disabled={creating}
                className="w-full text-xs text-white/30 hover:text-white/60"
              >
                Skip analysis, create goal
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCreateStep(2)}
                disabled={creating}
                className="w-full text-[11px] text-white/20 hover:text-white/40"
              >
                ← Back
              </Button>
            </>
          )}
        </div>
      </Modal>

      {/* AI Modals */}
      {decomposeGoal && (
        <DecomposeModal
          open={!!decomposeGoal}
          onClose={() => { setDecomposeGoal(null); setDecomposeAutoGenerate(false) }}
          goal={decomposeGoal}
          autoGenerate={decomposeAutoGenerate}
          onSaveTasks={(tasks, title, idx) => handleSaveTasks(tasks, title, idx, decomposeGoal.id)}
          onSaveHabits={(habits) => handleSaveHabits(habits, decomposeGoal.id, decomposeGoal.deadline)}
          onDecomposed={() =>
            setGoals((p) =>
              p.map((g) => (g.id === decomposeGoal.id ? { ...g, hasAnalysis: true } : g))
            )
          }
        />
      )}
      <RealityCheckModal
        open={showRealityCheck}
        onClose={() => setShowRealityCheck(false)}
      />

      {/* Saved analysis viewer */}
      <Modal
        open={!!analysisGoal}
        onClose={() => { setAnalysisGoal(null); setAnalysisResult(null) }}
        title={`AI Analysis — ${analysisGoal?.title ?? ""}`}
      >
        {analysisLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-white/40">
            <span className="animate-spin">⟳</span> Loading saved analysis...
          </div>
        ) : analysisResult && "error" in analysisResult ? (
          <div className="rounded-lg border border-white/8 bg-white/3 px-4 py-6 text-center text-sm text-white/40">
            {String(analysisResult.error)}
          </div>
        ) : analysisResult ? (
          <AnalysisViewer
            data={analysisResult}
            onSaveTasks={(tasks, title, idx) => handleSaveTasks(tasks, title, idx, analysisGoal!.id)}
            onSaveHabits={(habits) => handleSaveHabits(habits, analysisGoal!.id, analysisGoal!.deadline)}
          />
        ) : null}
      </Modal>

      {/* Goal Prediction */}
      <Modal
        open={!!predictionGoal}
        onClose={() => { setPredictionGoal(null); setPredictionResult(null) }}
        title={`Goal Prediction — ${predictionGoal?.title ?? ""}`}
      >
        {predictionLoading ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-3 rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3">
              <span className="animate-spin text-violet-400">⟳</span>
              <p className="text-sm text-white/50">Analysing your task history and deadline…</p>
            </div>
          </div>
        ) : predictionResult && "error" in predictionResult ? (
          <div className="rounded-lg border border-white/8 bg-white/3 px-4 py-6 text-center text-sm text-white/40">
            {String(predictionResult.error)}
          </div>
        ) : predictionResult ? (
          <PredictionViewer data={predictionResult} />
        ) : null}
      </Modal>
    </PageTransition>
  )
}
