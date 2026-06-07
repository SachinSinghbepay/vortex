"use client"

import { useState } from "react"
import { Target, CheckSquare, TrendingUp, Zap, Plus, ArrowRight, Sparkles, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProcrastinationRadar } from "@/components/dashboard/procrastination-radar"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/ui/page-transition"

const priorityColor: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-violet-500",
  LOW: "bg-white/20",
}

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const mockActivity = [40, 65, 30, 80, 55, 20, 70]

interface Props {
  user: { name?: string | null }
  goals: Array<{
    id: string
    title: string
    progress: number
    type: string
    deadline: Date | null
  }>
  tasksDueToday: Array<{
    id: string
    title: string
    priority: string
    completed: boolean
  }>
  stats: {
    activeGoals: number
    tasksDueToday: number
    completionRate: number
    focusScore: number
  }
  streak: number
  quote: { text: string; author: string }
  procrastinatedTasks: Array<{ id: string; title: string; priority: string; daysAvoided: number }>
}

const statCards = (s: Props["stats"]) => [
  {
    label: "Active Goals",
    value: s.activeGoals,
    icon: Target,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    suffix: "",
  },
  {
    label: "Due Today",
    value: s.tasksDueToday,
    icon: CheckSquare,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    suffix: " tasks",
  },
  {
    label: "Completion Rate",
    value: s.completionRate,
    icon: TrendingUp,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    suffix: "%",
  },
  {
    label: "Focus Score",
    value: s.focusScore,
    icon: Zap,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    suffix: "/10",
  },
]

function MITWidget() {
  const [mit, setMit] = useState<{ task: string; reasoning: string; urgent: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  const fetchMIT = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/mit")
      if (res.ok) setMit(await res.json())
    } finally {
      setLoading(false)
      setFetched(true)
    }
  }

  // Loading check must come FIRST — otherwise the idle button stays visible while fetching
  if (loading) {
    return (
      <div className="mb-6 rounded-xl border border-violet-500/20 bg-violet-500/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600/20">
            <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Analysing your goals &amp; tasks...</p>
            <p className="text-xs text-white/35">Cortex is picking your most important task</p>
          </div>
        </div>
        {/* Animated progress bar */}
        <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-violet-500/10">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-violet-500/50" />
        </div>
      </div>
    )
  }

  if (!fetched) {
    return (
      <button
        onClick={fetchMIT}
        disabled={loading}
        className="mb-6 flex w-full items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/5 px-5 py-4 text-left transition hover:bg-violet-500/10 disabled:cursor-not-allowed"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600/20">
          <Sparkles className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">What should I focus on today?</p>
          <p className="text-xs text-white/35">Click to get your AI-recommended task</p>
        </div>
      </button>
    )
  }

  if (!mit) return null

  return (
    <div className={cn(
      "mb-6 flex items-start gap-3 rounded-xl border px-5 py-4",
      mit.urgent ? "border-orange-500/20 bg-orange-500/5" : "border-violet-500/20 bg-violet-500/5"
    )}>
      <div className={cn(
        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
        mit.urgent ? "bg-orange-600/20" : "bg-violet-600/20"
      )}>
        <Sparkles className={cn("h-4 w-4", mit.urgent ? "text-orange-400" : "text-violet-400")} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <p className="text-[11px] font-medium uppercase tracking-widest text-white/35">Today&apos;s Focus</p>
          {mit.urgent && (
            <span className="rounded-full bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-medium text-orange-400">Urgent</span>
          )}
        </div>
        <p className="text-sm font-medium text-white">{mit.task}</p>
        <p className="mt-0.5 text-xs text-white/40">{mit.reasoning}</p>
      </div>
      <button onClick={fetchMIT} className="shrink-0 text-xs text-white/25 hover:text-white/50 transition">↺</button>
    </div>
  )
}

export function DashboardClient({ user, goals, tasksDueToday, stats, streak, quote, procrastinatedTasks }: Props) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const firstName = user.name?.split(" ")[0] ?? "there"
  const streakEmoji = streak >= 30 ? "🏆" : streak >= 14 ? "🔥" : streak >= 7 ? "⚡" : streak > 0 ? "✨" : "🌱"

  return (
    <PageTransition className="min-h-full p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-white/40">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        {/* Streak badge */}
        <div className={cn(
          "flex items-center gap-2 rounded-xl border px-4 py-2",
          streak > 0
            ? "border-orange-500/20 bg-orange-500/10"
            : "border-white/6 bg-white/2"
        )}>
          <span className="text-xl">{streakEmoji}</span>
          <div className="text-right">
            <p className="text-lg font-bold text-white leading-none">{streak}</p>
            <p className="text-[10px] text-white/40 mt-0.5">day streak</p>
          </div>
        </div>
      </div>

      {/* AI — Most Important Task */}
      <MITWidget />

      {/* Procrastination Radar */}
      <ProcrastinationRadar tasks={procrastinatedTasks} />

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards(stats).map(({ label, value, icon: Icon, color, bg, suffix }) => (
          <div
            key={label}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition hover:border-white/10 hover:bg-white/[0.04]"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs text-white/40">{label}</span>
              <div className={cn("rounded-lg p-2", bg)}>
                <Icon className={cn("h-3.5 w-3.5", color)} />
              </div>
            </div>
            <p className="text-2xl font-semibold text-white">
              {value}
              <span className="text-sm font-normal text-white/40">{suffix}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tasks due today */}
        <div className="lg:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white/70">Due Today</h2>
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-white/30 hover:text-white/60">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
            {tasksDueToday.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckSquare className="mb-2 h-7 w-7 text-white/10" />
                <p className="text-sm text-white/25">Nothing due today</p>
                <Link href="/tasks" className="mt-3">
                  <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-violet-400 hover:text-violet-300">
                    <Plus className="h-3 w-3" /> Add task
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {tasksDueToday.map((task) => (
                  <li key={task.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={cn("h-1.5 w-1.5 flex-shrink-0 rounded-full", priorityColor[task.priority])} />
                    <span className="flex-1 truncate text-sm text-white/70">{task.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Active goals */}
        <div className="lg:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white/70">Active Goals</h2>
            <Link href="/goals">
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-white/30 hover:text-white/60">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
            {goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Target className="mb-2 h-7 w-7 text-white/10" />
                <p className="text-sm text-white/25">No active goals</p>
                <Link href="/goals" className="mt-3">
                  <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-violet-400 hover:text-violet-300">
                    <Plus className="h-3 w-3" /> Create goal
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {goals.map((goal) => (
                  <li key={goal.id} className="px-4 py-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="truncate text-sm text-white/70">{goal.title}</span>
                      <span className="ml-2 flex-shrink-0 text-xs text-white/30">{goal.progress}%</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Weekly activity */}
        <div className="lg:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white/70">Weekly Activity</h2>
            <span className="text-xs text-white/25">This week</span>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex h-28 items-end gap-2">
              {mockActivity.map((val, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t-sm bg-violet-500/40 transition-all hover:bg-violet-500/70"
                    style={{ height: `${val}%` }}
                  />
                  <span className="text-[10px] text-white/25">{weekDays[i]}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-white/25">
              Log focus sessions to see real data
            </p>
          </div>
        </div>
      </div>

      {/* Daily quote */}
      <div className="mt-6 rounded-xl border border-white/6 bg-white/2 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-lg">💬</span>
          <div>
            <p className="text-sm italic text-white/60 leading-relaxed">
              &ldquo;{quote.text}&rdquo;
            </p>
            <p className="mt-1.5 text-xs text-white/30">— {quote.author}</p>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
