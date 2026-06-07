"use client"

import { useState } from "react"
import { AlertTriangle, Loader2, CheckCircle2, Trash2, ChevronDown, ChevronUp, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface RadarTask {
  id: string
  title: string
  priority: string
  daysAvoided: number
}

interface AIInsight {
  why: string
  firstStep: string
  reframe: string
}

const urgencyConfig = (days: number) => {
  if (days >= 21) return { label: `${days}d`, dot: "bg-red-500", border: "border-red-500/20", bg: "bg-red-500/5" }
  if (days >= 14) return { label: `${days}d`, dot: "bg-orange-500", border: "border-orange-500/20", bg: "bg-orange-500/5" }
  return { label: `${days}d`, dot: "bg-amber-400", border: "border-amber-400/20", bg: "bg-amber-400/5" }
}

interface Props {
  tasks: RadarTask[]
}

export function ProcrastinationRadar({ tasks: initialTasks }: Props) {
  const [tasks, setTasks] = useState(initialTasks)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [insights, setInsights] = useState<Record<string, AIInsight>>({})
  const [loadingInsight, setLoadingInsight] = useState<string | null>(null)

  if (tasks.length === 0) return null

  const handleExpand = async (task: RadarTask) => {
    if (expanded === task.id) {
      setExpanded(null)
      return
    }
    setExpanded(task.id)

    if (insights[task.id]) return // already fetched

    setLoadingInsight(task.id)
    try {
      const res = await fetch("/api/ai/procrastination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskTitle: task.title, daysAvoided: task.daysAvoided, priority: task.priority }),
      })
      if (res.ok) {
        const data = await res.json()
        setInsights((p) => ({ ...p, [task.id]: data }))
      }
    } finally {
      setLoadingInsight(null)
    }
  }

  const handleComplete = async (id: string) => {
    setTasks((p) => p.filter((t) => t.id !== id))
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    })
    toast.success("Task completed ✓")
  }

  const handleDelete = async (id: string) => {
    setTasks((p) => p.filter((t) => t.id !== id))
    await fetch(`/api/tasks/${id}`, { method: "DELETE" })
    toast("Task removed")
  }

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <h2 className="text-sm font-medium text-white/70">Procrastination Radar</h2>
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""} avoiding
        </span>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => {
          const u = urgencyConfig(task.daysAvoided)
          const isExpanded = expanded === task.id
          const insight = insights[task.id]
          const isLoading = loadingInsight === task.id

          return (
            <div key={task.id} className={cn("rounded-xl border transition-all", u.border, isExpanded ? u.bg : "bg-white/[0.02]")}>
              {/* Task row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className={cn("h-2 w-2 shrink-0 rounded-full", u.dot)} />

                <span className="flex-1 truncate text-sm text-white/75">{task.title}</span>

                <span className={cn(
                  "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium",
                  task.daysAvoided >= 21 ? "bg-red-500/15 text-red-400"
                    : task.daysAvoided >= 14 ? "bg-orange-500/15 text-orange-400"
                    : "bg-amber-400/15 text-amber-400"
                )}>
                  {u.label}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleExpand(task)}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition",
                      isExpanded ? "bg-violet-600/20 text-violet-400" : "text-white/30 hover:bg-white/5 hover:text-violet-400"
                    )}
                  >
                    <Sparkles className="h-3 w-3" />
                    {isExpanded ? "Hide" : "Why?"}
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={() => handleComplete(task.id)}
                    className="rounded-lg p-1.5 text-white/20 transition hover:bg-emerald-500/10 hover:text-emerald-400"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="rounded-lg p-1.5 text-white/20 transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* AI insight panel */}
              {isExpanded && (
                <div className="border-t border-white/6 px-4 pb-4 pt-3">
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Cortex is analysing why...
                    </div>
                  ) : insight ? (
                    <div className="space-y-3">
                      <div>
                        <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-white/30">Why you're avoiding it</p>
                        <p className="text-xs leading-relaxed text-white/60">{insight.why}</p>
                      </div>
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
                        <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-emerald-400/70">Do this right now (5 min)</p>
                        <p className="text-xs font-medium leading-relaxed text-white/75">{insight.firstStep}</p>
                      </div>
                      <p className="text-xs italic text-white/35">&ldquo;{insight.reframe}&rdquo;</p>
                    </div>
                  ) : (
                    <p className="text-xs text-red-400">Failed to load insight. Try again.</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
