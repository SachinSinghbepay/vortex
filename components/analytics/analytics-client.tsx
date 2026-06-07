"use client"

import { Flame, Target, CheckSquare, Zap, TrendingUp, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/ui/page-transition"

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({
  data,
  color = "bg-violet-500/60",
  hoverColor = "hover:bg-violet-500",
  unit = "",
}: {
  data: Array<{ label: string; value: number }>
  color?: string
  hoverColor?: string
  unit?: string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex h-32 items-end gap-1.5">
      {data.map(({ label, value }, i) => (
        <div key={i} className="group flex flex-1 flex-col items-center gap-1.5">
          <div className="relative flex w-full flex-col items-center justify-end" style={{ height: "100px" }}>
            {value > 0 && (
              <span className="absolute -top-5 text-[9px] text-white/0 transition group-hover:text-white/50">
                {value}{unit}
              </span>
            )}
            <div
              className={cn("w-full rounded-t transition-all", color, hoverColor)}
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
    <PageTransition className="min-h-full p-4 lg:p-8">
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
            className="rounded-xl border border-white/6 bg-white/2 p-5 transition hover:border-white/10 hover:bg-white/4"
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
            className={cn("h-full rounded-full transition-all", bc.bg)}
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
            unit="m"
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
          hoverColor="hover:bg-emerald-500"
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
                    className={cn("h-full rounded-full transition-all", typeColor[goal.type] ?? "bg-white/30")}
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
    </PageTransition>
  )
}
