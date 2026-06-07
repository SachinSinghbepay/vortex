"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Play, Pause, Square, Zap, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/ui/page-transition"

// ─── Types ───────────────────────────────────────────────────────────────────

interface FocusLog {
  id: string
  energy: number
  focus: number
  stress: number
  duration: number
  taskTitle: string | null
  notes: string | null
  createdAt: string
}

interface Props {
  tasks: Array<{ id: string; title: string }>
  recentLogs: FocusLog[]
  weeklyMinutes: number
  weeklyCount: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const DURATIONS = [15, 25, 45, 60]

type TimerState = "IDLE" | "RUNNING" | "PAUSED" | "DONE"

// ─── Slider ──────────────────────────────────────────────────────────────────

function Slider({ label, value, onChange, color }: {
  label: string; value: number; onChange: (v: number) => void; color: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">{label}</label>
        <span className={cn("text-sm font-semibold", color)}>{value}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-violet-500"
      />
      <div className="flex justify-between text-[10px] text-white/20">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function FocusClient({ tasks, recentLogs: initialLogs, weeklyMinutes, weeklyCount }: Props) {
  const [logs, setLogs] = useState(initialLogs)
  const [durationMin, setDurationMin] = useState(25)
  const [customMin, setCustomMin] = useState("")
  const [taskTitle, setTaskTitle] = useState("")
  const [timerState, setTimerState] = useState<TimerState>("IDLE")
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [totalSeconds, setTotalSeconds] = useState(25 * 60)
  const [showCheckIn, setShowCheckIn] = useState(false)

  // Check-in form state
  const [energy, setEnergy] = useState(7)
  const [focus, setFocus] = useState(7)
  const [stress, setStress] = useState(4)
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const activeDuration = customMin ? parseInt(customMin) || 25 : durationMin
  const progress = (totalSeconds - timeLeft) / totalSeconds
  const strokeOffset = CIRCUMFERENCE * (1 - progress)

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
  }

  // Timer tick
  useEffect(() => {
    if (timerState !== "RUNNING") return
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setTimerState("DONE")
          setShowCheckIn(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timerState])

  const handleStart = () => {
    const secs = activeDuration * 60
    setTotalSeconds(secs)
    setTimeLeft(secs)
    setTimerState("RUNNING")
  }

  const handlePause = () => setTimerState("PAUSED")
  const handleResume = () => setTimerState("RUNNING")

  const handleStop = useCallback(() => {
    setTimerState("IDLE")
    setTimeLeft(activeDuration * 60)
    setTotalSeconds(activeDuration * 60)
  }, [activeDuration])

  const handleSaveLog = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ energy, focus, stress, duration: activeDuration, taskTitle: taskTitle || null, notes: notes || null }),
      })
      if (res.ok) {
        const log = await res.json()
        setLogs((p) => [log, ...p])
        setShowCheckIn(false)
        setTimerState("IDLE")
        setTimeLeft(activeDuration * 60)
        setNotes("")
        setEnergy(7); setFocus(7); setStress(4)
        toast.success(`${activeDuration}min session saved`, { description: "Great work. Keep it up." })
      }
    } finally {
      setSaving(false)
    }
  }

  const todayLogs = logs.filter((l) => {
    const d = new Date(l.createdAt)
    const now = new Date()
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth()
  })

  const todayMinutes = todayLogs.reduce((sum, l) => sum + l.duration, 0)

  const ringColor = timerState === "DONE"
    ? "#10b981"
    : timerState === "RUNNING"
    ? "#7c3aed"
    : "#4f46e5"

  return (
    <PageTransition className="min-h-full p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Focus</h1>
        <p className="mt-0.5 text-sm text-white/40">Deep work sessions tied to your goals</p>
      </div>

      {/* Stats strip */}
      <div className="mb-8 grid grid-cols-3 gap-2">
        {[
          { label: "Today", value: `${todayMinutes}m`, sub: `${todayLogs.length} sessions` },
          { label: "This week", value: `${weeklyMinutes + todayMinutes}m`, sub: `${weeklyCount + todayLogs.length} total` },
          { label: "Avg focus", value: todayLogs.length ? `${Math.round(todayLogs.reduce((s, l) => s + l.focus, 0) / todayLogs.length)}/10` : "—", sub: "today" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-xl border border-white/6 bg-white/2 p-4">
            <p className="text-xs text-white/35">{label}</p>
            <p className="mt-1 text-xl font-semibold text-white">{value}</p>
            <p className="text-[10px] text-white/25">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Timer */}
        <div className="flex flex-col items-center rounded-2xl border border-white/6 bg-white/2 p-8">
          {timerState === "IDLE" && (
            <>
              {/* Duration picker */}
              <div className="mb-6 flex gap-1.5">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => { setDurationMin(d); setCustomMin("") }}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                      durationMin === d && !customMin
                        ? "bg-violet-600 text-white"
                        : "text-white/40 hover:bg-white/5 hover:text-white/70"
                    )}
                  >
                    {d}m
                  </button>
                ))}
                <input
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value.replace(/\D/g, ""))}
                  placeholder="?"
                  maxLength={3}
                  className="w-12 rounded-lg border border-white/8 bg-transparent px-2 py-1.5 text-center text-xs text-white/60 outline-none focus:border-violet-500/40"
                />
              </div>

              {/* Task picker */}
              <div className="mb-8 w-full">
                <select
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full rounded-lg border border-white/8 bg-[#111] px-3.5 py-2.5 text-sm text-white/70 outline-none"
                >
                  <option value="">Focus on... (optional)</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.title}>{t.title}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Timer ring */}
          <div className="relative mb-6 flex items-center justify-center">
            <svg width="160" height="160" className="-rotate-90">
              <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle
                cx="80" cy="80" r={RADIUS}
                fill="none"
                stroke={ringColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeOffset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold tabular-nums text-white">
                {timerState === "DONE" ? "Done!" : formatTime(timeLeft)}
              </span>
              {taskTitle && timerState !== "IDLE" && (
                <span className="mt-1 max-w-[120px] truncate text-center text-[11px] text-white/40">{taskTitle}</span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {timerState === "IDLE" && (
              <Button onClick={handleStart} className="gap-2 bg-violet-600 px-8 text-white hover:bg-violet-500">
                <Play className="h-4 w-4" /> Start
              </Button>
            )}
            {timerState === "RUNNING" && (
              <>
                <Button onClick={handlePause} variant="ghost" className="gap-2 border border-white/10 text-white/60 hover:text-white">
                  <Pause className="h-4 w-4" /> Pause
                </Button>
                <Button onClick={handleStop} variant="ghost" className="gap-2 text-white/30 hover:text-red-400">
                  <Square className="h-3.5 w-3.5" /> Stop
                </Button>
              </>
            )}
            {timerState === "PAUSED" && (
              <>
                <Button onClick={handleResume} className="gap-2 bg-violet-600 text-white hover:bg-violet-500">
                  <Play className="h-4 w-4" /> Resume
                </Button>
                <Button onClick={handleStop} variant="ghost" className="gap-2 text-white/30 hover:text-red-400">
                  <Square className="h-3.5 w-3.5" /> Stop
                </Button>
              </>
            )}
            {timerState === "DONE" && (
              <Button onClick={() => setShowCheckIn(true)} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-500">
                <CheckCircle2 className="h-4 w-4" /> Log Session
              </Button>
            )}
          </div>

          {timerState === "RUNNING" && (
            <p className="mt-4 text-xs text-white/25 animate-pulse">Session in progress — stay focused</p>
          )}
        </div>

        {/* Today's sessions */}
        <div>
          <h2 className="mb-3 text-sm font-medium text-white/60">Today&apos;s Sessions</h2>
          <div className="rounded-xl border border-white/6">
            {todayLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Zap className="mb-2 h-7 w-7 text-white/10" />
                <p className="text-sm text-white/25">No sessions yet today</p>
                <p className="mt-1 text-xs text-white/15">Start a timer to track your focus</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/4">
                {todayLogs.map((log) => (
                  <li key={log.id} className="flex items-center gap-4 px-4 py-3.5">
                    <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-violet-600/15 text-center">
                      <span className="text-xs font-semibold text-violet-400">{log.duration}</span>
                      <span className="text-[9px] text-violet-400/60">min</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white/70">
                        {log.taskTitle ?? "Free focus"}
                      </p>
                      <div className="mt-0.5 flex gap-3 text-[10px] text-white/30">
                        <span>⚡ {log.energy}/10</span>
                        <span>🎯 {log.focus}/10</span>
                        <span>😤 {log.stress}/10</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] text-white/20">
                      {new Date(log.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Check-in modal */}
      <Modal open={showCheckIn} onClose={() => setShowCheckIn(false)} title="Session Complete 🎉">
        <div className="space-y-5">
          <p className="text-sm text-white/50">
            {activeDuration} minute session done{taskTitle ? ` — ${taskTitle}` : ""}. How did it go?
          </p>

          <Slider label="Energy Level" value={energy} onChange={setEnergy} color="text-amber-400" />
          <Slider label="Focus Quality" value={focus} onChange={setFocus} color="text-violet-400" />
          <Slider label="Stress Level" value={stress} onChange={setStress} color="text-rose-400" />

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="What did you get done? Any blockers?"
              className="w-full resize-none rounded-lg border border-white/8 bg-white/4 px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none transition focus:border-violet-500/40"
            />
          </div>

          <Button
            onClick={handleSaveLog}
            disabled={saving}
            className="w-full bg-violet-600 text-white hover:bg-violet-500"
          >
            {saving ? "Saving..." : "Save Session"}
          </Button>
        </div>
      </Modal>
    </PageTransition>
  )
}
