"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, CheckCircle2, Circle, Trash2, Calendar, Sparkles } from "lucide-react"
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
  goal?: { id: string; title: string } | null
  createdAt: string
}

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

interface Props {
  initialTasks: Task[]
  goals: Array<{ id: string; title: string }>
}

export function TasksClient({ initialTasks, goals }: Props) {
  const [tasks, setTasks] = useState(initialTasks)
  const [filter, setFilter] = useState<(typeof filters)[number]>("ALL")
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [breakdownTask, setBreakdownTask] = useState<Task | null>(null)
  const [form, setForm] = useState({
    title: "",
    priority: "MEDIUM" as Priority,
    dueDate: "",
    category: "",
    goalId: "",
  })

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

  const getTaskDate = (t: Task) =>
    t.startDate ? new Date(t.startDate) : t.dueDate ? new Date(t.dueDate) : null

  const getGroup = (t: Task): string => {
    const d = getTaskDate(t)
    if (!d) return "No Date"
    if (d < todayStart) return "Overdue"
    if (d < todayEnd) return "Today"
    if (d < tomorrowEnd) return "Tomorrow"
    if (d < thisWeekEnd) return "This Week"
    if (d < nextWeekEnd) return "Next Week"
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  const groupTasks = (tasks: Task[]) => {
    const order = ["Overdue", "Today", "Tomorrow", "This Week", "Next Week"]
    const map = new Map<string, Task[]>()
    for (const t of tasks) {
      const g = getGroup(t)
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(t)
    }
    // Sort groups: known order first, then chronological for month groups
    return Array.from(map.entries()).sort(([a], [b]) => {
      const ai = order.indexOf(a), bi = order.indexOf(b)
      if (ai !== -1 && bi !== -1) return ai - bi
      if (ai !== -1) return -1
      if (bi !== -1) return 1
      return a < b ? -1 : 1
    })
  }

  // A task is "active today" if:
  // 1. Single dueDate that falls today (original behaviour)
  // 2. Has a startDate–dueDate range that includes today (AI-generated weekly tasks)
  const isActiveToday = (t: Task) => {
    if (t.completed) return false
    if (t.startDate && t.dueDate) {
      const s = new Date(t.startDate)
      const e = new Date(t.dueDate)
      return s <= todayEnd && e >= todayStart
    }
    if (t.dueDate) {
      const d = new Date(t.dueDate)
      return d >= todayStart && d < todayEnd
    }
    return false
  }

  const filtered = tasks.filter((t) => {
    if (filter === "COMPLETED") return t.completed
    if (filter === "PENDING") return !t.completed
    if (filter === "TODAY") return isActiveToday(t)
    return true
  })

  const filterCount = (f: (typeof filters)[number]) => {
    if (f === "ALL") return tasks.length
    if (f === "COMPLETED") return tasks.filter((t) => t.completed).length
    if (f === "PENDING") return tasks.filter((t) => !t.completed).length
    return tasks.filter(isActiveToday).length
  }

  const handleToggle = async (id: string, completed: boolean) => {
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, completed } : t)))
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    })
    if (completed) toast.success("Task completed ✓")
  }

  const handleDelete = async (id: string) => {
    setTasks((p) => p.filter((t) => t.id !== id))
    await fetch(`/api/tasks/${id}`, { method: "DELETE" })
    toast("Task deleted", { description: "Removed from your list" })
  }

  const handleCreate = async () => {
    if (!form.title.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          goalId: form.goalId || null,
          category: form.category || null,
          dueDate: form.dueDate || null,
        }),
      })
      if (res.ok) {
        const task = await res.json()
        setTasks((p) => [task, ...p])
        setShowCreate(false)
        setForm({ title: "", priority: "MEDIUM", dueDate: "", category: "", goalId: "" })
        toast.success("Task added")
      } else {
        toast.error("Failed to add task")
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <PageTransition className="min-h-full p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Tasks</h1>
          <p className="mt-0.5 text-sm text-white/40">
            {tasks.filter((t) => !t.completed).length} remaining
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-1.5 bg-violet-600 text-white hover:bg-violet-500">
          <Plus className="h-4 w-4" /> New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-1">
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

      {/* Task list */}
      <div className="rounded-xl border border-white/[0.06]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="mb-2 h-8 w-8 text-white/10" />
            <p className="text-sm text-white/25">
              {filter === "COMPLETED" ? "No completed tasks yet" : "No tasks here"}
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
            {groupTasks(filtered).map(([groupLabel, groupItems]) => (
              <div key={groupLabel}>
                {/* Group divider */}
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest",
                  groupLabel === "Overdue" ? "text-red-400/70" : "text-white/25"
                )}>
                  {groupLabel === "Overdue" && <span className="text-red-400">!</span>}
                  {groupLabel}
                  <span className="text-white/15 font-normal normal-case tracking-normal">{groupItems.length}</span>
                </div>
                <ul className="divide-y divide-white/[0.04]">
                  {groupItems.map((task) => (
              <li
                key={task.id}
                className="group flex items-center gap-3 px-4 py-3.5 transition hover:bg-white/[0.02]"
              >
                <button
                  onClick={() => handleToggle(task.id, !task.completed)}
                  className="flex-shrink-0 text-white/25 transition hover:text-violet-400"
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-violet-400" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </button>

                <div className={cn("h-1.5 w-1.5 flex-shrink-0 rounded-full", priorityDot[task.priority])} />

                <span
                  className={cn(
                    "flex-1 truncate text-sm",
                    task.completed ? "text-white/25 line-through" : "text-white/75"
                  )}
                >
                  {task.title}
                </span>

                {task.category && (
                  <span className="flex-shrink-0 rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/30">
                    {task.category}
                  </span>
                )}

                {(task.dueDate || task.startDate) && (
                  <div className="flex flex-shrink-0 items-center gap-1 text-xs text-white/25">
                    <Calendar className="h-3 w-3" />
                    {task.startDate && task.dueDate
                      ? `${new Date(task.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                      : new Date(task.dueDate!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                )}

                {task.goal && (
                  <span className="flex-shrink-0 rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-400">
                    {task.goal.title}
                  </span>
                )}

                {!task.completed && (
                  <button
                    onClick={() => setBreakdownTask(task)}
                    className="shrink-0 text-white/0 transition group-hover:text-violet-400/50 hover:!text-violet-400"
                    title="Break down with AI"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </button>
                )}

                <button
                  onClick={() => handleDelete(task.id)}
                  className="shrink-0 text-white/0 transition group-hover:text-white/20 hover:!text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Task">
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
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })} className={selectCls}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className={cn(inputCls, "[color-scheme:dark]")}
              />
            </div>
          </div>
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
              <select value={form.goalId} onChange={(e) => setForm({ ...form, goalId: e.target.value })} className={selectCls}>
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
