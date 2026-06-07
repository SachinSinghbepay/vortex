"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Target, Trash2, Calendar, Sparkles, Shield, Eye } from "lucide-react"
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
  "w-full rounded-lg border border-white/[0.07] bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-white outline-none"

// ─── Analysis Viewer ─────────────────────────────────────────────────────────

function AnalysisViewer({ data }: { data: Record<string, unknown> }) {
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
                <p className="mb-2 text-sm font-medium text-white">Week {w.week} <span className="text-xs text-white/35">{w.focus}</span></p>
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
  type Milestone = { title: string; duration: string; tasks: string[] }
  const milestones = (data.milestones as Milestone[] | undefined) ?? []
  const tips = (data.tips as string[] | undefined) ?? []
  return (
    <div className="space-y-4">
      {!!data.realisticAssessment && (
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3">
          <p className="text-xs leading-relaxed text-violet-300">{String(data.realisticAssessment)}</p>
        </div>
      )}
      {milestones.map((m, i) => (
        <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4">
          <p className="mb-2 text-sm font-medium text-white">{m.title} <span className="text-xs text-white/35">{m.duration}</span></p>
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
  const [showRealityCheck, setShowRealityCheck] = useState(false)
  const [analysisGoal, setAnalysisGoal] = useState<Goal | null>(null)
  const [analysisResult, setAnalysisResult] = useState<Record<string, unknown> | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

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
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "PERSONAL" as GoalType,
    priority: "MEDIUM" as Priority,
    deadline: "",
  })

  const filtered = filter === "ALL" ? goals : goals.filter((g) => g.status === filter)

  const handleCreate = async () => {
    if (!form.title.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const goal = await res.json()
        setGoals((p) => [{ ...goal, deadline: goal.deadline ?? null, createdAt: goal.createdAt }, ...p])
        setShowCreate(false)
        setForm({ title: "", description: "", type: "PERSONAL", priority: "MEDIUM", deadline: "" })
        toast.success("Goal created")
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

  const handleSaveTasks = async (tasks: string[], milestoneTitle: string, milestoneIndex = 0) => {
    const today = new Date()
    // Each milestone = ~2 weeks: milestone 0 = week 1-2, milestone 1 = week 3-4, etc.
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
          }),
        })
      )
    )
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
          <Button onClick={() => setShowCreate(true)} className="gap-1.5 bg-violet-600 text-white hover:bg-violet-500">
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
                  <p className="mb-3 line-clamp-2 text-xs text-white/35">{goal.description}</p>
                )}

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
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PAUSED">Paused</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>

                {/* AI button */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setDecomposeGoal(goal)}
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
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Goal">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Learn Spanish to B1"
              className={inputCls}
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
                <option value="PERSONAL">Personal</option>
                <option value="LEARNING">Learning</option>
                <option value="FITNESS">Fitness</option>
                <option value="CAREER">Career</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })} className={selectCls}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Deadline</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className={cn(inputCls, "[color-scheme:dark]")}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={!form.title.trim() || creating}
            className="w-full bg-violet-600 text-white hover:bg-violet-500"
          >
            {creating ? "Creating..." : "Create Goal"}
          </Button>
        </div>
      </Modal>

      {/* AI Modals */}
      {decomposeGoal && (
        <DecomposeModal
          open={!!decomposeGoal}
          onClose={() => setDecomposeGoal(null)}
          goal={decomposeGoal}
          onSaveTasks={handleSaveTasks}
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
          <AnalysisViewer data={analysisResult} />
        ) : null}
      </Modal>
    </PageTransition>
  )
}
