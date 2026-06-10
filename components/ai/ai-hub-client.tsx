"use client"

import { useState } from "react"
import {
  Sparkles, Scale, Calendar, Loader2, Plus, X,
  CheckCircle2, AlertTriangle, Lightbulb, ArrowRight, TrendingUp, MessageSquare,
  BookOpen, ChevronDown, ChevronUp, Target,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { CoachChat } from "@/components/ai/coach-chat"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/ui/page-transition"

// ─── Types ───────────────────────────────────────────────────────────────────

interface DecisionResult {
  verdict: string
  recommendation: string
  confidence: number
  tradeoffs: string[]
  risks: string[]
  overlooked: string
  nextStep: string
  leanToward: "YES" | "NO" | "BOTH_VALID" | "NEED_MORE_INFO"
}

interface DebriefResult {
  headline: string
  score: number
  wins: string[]
  slipped: string[]
  pattern: string
  nextWeekFocus: string
  insight: string
}

// ─── Decision Analysis ───────────────────────────────────────────────────────

const leanConfig = {
  YES: { label: "Lean Yes", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  NO: { label: "Lean No", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  BOTH_VALID: { label: "Both Valid", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  NEED_MORE_INFO: { label: "Need More Info", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
}

function DecisionAnalysis() {
  const [decision, setDecision] = useState("")
  const [pros, setPros] = useState([""])
  const [cons, setCons] = useState([""])
  const [priorities, setPriorities] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DecisionResult | null>(null)
  const [error, setError] = useState("")

  const addItem = (list: string[], set: (v: string[]) => void) => set([...list, ""])
  const updateItem = (list: string[], set: (v: string[]) => void, i: number, val: string) => {
    const next = [...list]; next[i] = val; set(next)
  }
  const removeItem = (list: string[], set: (v: string[]) => void, i: number) =>
    set(list.filter((_, idx) => idx !== i))

  const handleAnalyze = async () => {
    if (!decision.trim()) return
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch("/api/ai/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, pros: pros.filter(Boolean), cons: cons.filter(Boolean), priorities }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  // transition-colors only — avoids adding transform/backdrop-filter to transition list which can cause GPU glitches on Android Chrome
  const inputCls = "w-full rounded-lg border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-violet-500/50 focus:bg-white/[0.09]"

  if (result) {
    const lean = leanConfig[result.leanToward]
    return (
      <div className="space-y-4">
        <div className={cn("rounded-xl border p-5", lean.bg, lean.border)}>
          <div className="mb-2 flex items-center justify-between">
            <span className={cn("text-xs font-semibold uppercase tracking-widest", lean.color)}>{lean.label}</span>
            <span className={cn("text-2xl font-bold", lean.color)}>{result.confidence}%</span>
          </div>
          <p className={cn("text-sm font-medium", lean.color)}>{result.verdict}</p>
          <p className="mt-2 text-sm text-white/60">{result.recommendation}</p>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-white/35">Tradeoffs</p>
            <ul className="space-y-2">
              {result.tradeoffs.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                  <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-white/25" />{t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-white/35">Risks</p>
            <ul className="space-y-2">
              {result.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-orange-400/60" />{r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-widest text-violet-400/60">What most people overlook</p>
          <p className="text-sm text-white/65">{result.overlooked}</p>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-widest text-emerald-400/60">Next action</p>
          <p className="text-sm text-white/65">{result.nextStep}</p>
        </div>

        <Button
          variant="ghost"
          onClick={() => { setResult(null); setDecision(""); setPros([""]); setCons([""]); setPriorities("") }}
          className="w-full text-xs text-white/30 hover:text-white/60"
        >
          Analyze a different decision
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/40">Describe your decision. AI will give you a direct recommendation — no hedging.</p>

      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium uppercase tracking-widest text-white/35">The Decision</label>
        <textarea
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
          rows={2}
          placeholder={`e.g. "Should I quit my job to freelance full-time?"`}
          className={cn(inputCls, "resize-none")}
        />
      </div>



      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium uppercase tracking-widest text-white/35">Pros</label>
        <div className="space-y-2" style={{ transform: "translateZ(0)" }}>
          {pros.map((p, i) => (
            <div key={i} className="relative">
              <input
                value={p}
                onChange={(e) => updateItem(pros, setPros, i, e.target.value)}
                placeholder={`Pro ${i + 1}`}
                className={cn(inputCls, "pr-9")}
              />
              <button
                type="button"
                onClick={() => removeItem(pros, setPros, i)}
                className={cn(
                  "absolute inset-y-0 right-0 flex items-center pr-3",
                  pros.length > 1 ? "text-white/20 hover:text-white/50" : "pointer-events-none opacity-0"
                )}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {pros.length < 5 && (
            <button type="button" onClick={() => addItem(pros, setPros)} className="flex items-center gap-1 text-xs text-violet-400/60 hover:text-violet-400">
              <Plus className="h-3 w-3" /> Add pro
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium uppercase tracking-widest text-white/35">Cons</label>
        <div className="space-y-2" style={{ transform: "translateZ(0)" }}>
          {cons.map((c, i) => (
            <div key={i} className="relative">
              <input
                value={c}
                onChange={(e) => updateItem(cons, setCons, i, e.target.value)}
                placeholder={`Con ${i + 1}`}
                className={cn(inputCls, "pr-9")}
              />
              <button
                type="button"
                onClick={() => removeItem(cons, setCons, i)}
                className={cn(
                  "absolute inset-y-0 right-0 flex items-center pr-3",
                  cons.length > 1 ? "text-white/20 hover:text-white/50" : "pointer-events-none opacity-0"
                )}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {cons.length < 5 && (
            <button type="button" onClick={() => addItem(cons, setCons)} className="flex items-center gap-1 text-xs text-violet-400/60 hover:text-violet-400">
              <Plus className="h-3 w-3" /> Add con
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium uppercase tracking-widest text-white/35">What matters most to you</label>
        <input
          value={priorities}
          onChange={(e) => setPriorities(e.target.value)}
          placeholder="e.g. financial stability, creative freedom, time with family..."
          className={inputCls}
        />
      </div>

      {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}

      <Button
        onClick={handleAnalyze}
        disabled={!decision.trim() || loading}
        className="w-full gap-2 bg-violet-600 text-white hover:bg-violet-500"
      >
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analysing...</> : <><Scale className="h-4 w-4" /> Analyse Decision</>}
      </Button>
    </div>
  )
}

// ─── Weekly Debrief ───────────────────────────────────────────────────────────

function WeeklyDebrief() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DebriefResult | null>(null)
  const [error, setError] = useState("")

  const handleDebrief = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/ai/debrief")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = result
    ? result.score >= 70 ? "text-emerald-400" : result.score >= 40 ? "text-amber-400" : "text-red-400"
    : ""

  return (
    <div className="space-y-4">
      {!result ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <Calendar className="h-6 w-6 text-white/30" />
          </div>
          <h3 className="mb-1 text-sm font-semibold text-white">Weekly Review</h3>
          <p className="mb-6 max-w-xs text-sm text-white/40">
            AI looks at your last 7 days — what you completed, what slipped, and what to focus on next week.
          </p>
          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
          <Button
            onClick={handleDebrief}
            disabled={loading}
            className="gap-2 bg-violet-600 text-white hover:bg-violet-500"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> Generate This Week&apos;s Debrief</>}
          </Button>
          {loading && <p className="mt-3 text-xs text-white/30">Reading your week...</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Score + headline */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-white/40">Week Score</p>
              <span className={cn("text-3xl font-bold", scoreColor)}>{result.score}</span>
            </div>
            <p className="text-sm font-medium text-white">{result.headline}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Wins */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-emerald-400/70">Wins</p>
              {result.wins.length > 0 ? (
                <ul className="space-y-1.5">
                  {result.wins.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />{w}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-white/30">Nothing logged yet</p>}
            </div>

            {/* Slipped */}
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-orange-400/70">Slipped</p>
              {result.slipped.length > 0 ? (
                <ul className="space-y-1.5">
                  {result.slipped.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-orange-400" />{s}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-white/30">Nothing slipped</p>}
            </div>
          </div>

          {/* Pattern */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-widest text-blue-400/60">Pattern Noticed</p>
            <p className="text-sm text-white/65">{result.pattern}</p>
          </div>

          {/* Next week focus */}
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-widest text-violet-400/60">Next Week Focus</p>
            <p className="text-sm text-white/65">{result.nextWeekFocus}</p>
          </div>

          {/* Insight */}
          <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <p className="mb-0.5 text-[11px] font-medium uppercase tracking-widest text-amber-400/60">Insight</p>
              <p className="text-sm text-white/65">{result.insight}</p>
            </div>
          </div>

          <Button variant="ghost" onClick={() => setResult(null)} className="w-full text-xs text-white/30 hover:text-white/60">
            Regenerate
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Study Planner ────────────────────────────────────────────────────────────

interface WeekPlan {
  week: number
  phase: string
  focus: string
  topics: string[]
  dailyTasks: string[]
  weeklyGoal: string
}

interface StudyPlanResult {
  overview: string
  isAchievable: boolean
  achievabilityNote: string
  weeklyPlan: WeekPlan[]
  dailySchedule: { morning: string; afternoon: string; evening: string }
  milestones: Array<{ label: string; week: number; description: string }>
  examTips: string[]
  resources: string[]
}

const timeframes = ["2 weeks", "1 month", "6 weeks", "2 months", "3 months", "6 months"]
const hourOptions = ["1", "2", "3", "4", "5+"]

const inputCls =
  "w-full rounded-lg border border-white/[0.07] bg-white/4 px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none transition focus:border-violet-500/40 focus:bg-white/[0.07]"
const selectCls =
  "w-full rounded-lg border border-white/[0.07] bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-white outline-none"

function StudyPlanner() {
  const [form, setForm] = useState({
    exam: "",
    target: "",
    timeframe: "2 months",
    hoursPerDay: "2",
    weakAreas: "",
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<StudyPlanResult | null>(null)
  const [error, setError] = useState("")
  const [expandedWeek, setExpandedWeek] = useState<number | null>(0)
  const [savingGoal, setSavingGoal] = useState(false)

  const handleGenerate = async () => {
    if (!form.exam.trim() || !form.target.trim()) return
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch("/api/ai/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      setExpandedWeek(0)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAsGoal = async () => {
    if (!result) return
    setSavingGoal(true)
    try {
      const goalRes = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${form.exam} — ${form.target}`,
          description: result.overview,
          type: "LEARNING",
          priority: "HIGH",
        }),
      })
      if (!goalRes.ok) throw new Error("Failed to create goal")
      const goal = await goalRes.json()

      // Each task gets its own specific day: Week N, Task I → today + (N-1)*7 + I days
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      await Promise.all(
        result.weeklyPlan.flatMap((week) =>
          (week.dailyTasks ?? []).slice(0, 3).map((rawTitle, taskIndex) => {
            const title = rawTitle.replace(/^Day\s+\d+[:\-.]?\s*/i, "").trim()
            const weekNum = typeof week.week === "number" ? week.week : 1
            const taskDate = new Date(today)
            taskDate.setDate(today.getDate() + (weekNum - 1) * 7 + taskIndex)
            return fetch("/api/tasks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title,
                priority: "HIGH",
                goalId: goal.id,
                category: form.exam,
                startDate: taskDate.toISOString(),
                dueDate: taskDate.toISOString(), // single specific day, not a range
              }),
            })
          })
        )
      )
      // Save the study plan as an analysis linked to this goal so 👁 can show it
      await fetch("/api/ai/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "STUDY_PLAN",
          prompt: `${form.exam} — ${form.target}`,
          response: result,
          goalId: goal.id,
        }),
      })

      toast.success("Study plan saved as goal with tasks!")
    } catch {
      toast.error("Failed to save goal")
    } finally {
      setSavingGoal(false)
    }
  }

  if (result) {
    return (
      <div className="space-y-4">
        {/* Achievability */}
        <div className={cn(
          "rounded-xl border p-4",
          result.isAchievable
            ? "border-emerald-500/20 bg-emerald-500/5"
            : "border-orange-500/20 bg-orange-500/5"
        )}>
          <div className="flex items-center gap-2 mb-1.5">
            {result.isAchievable
              ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              : <AlertTriangle className="h-4 w-4 text-orange-400" />
            }
            <span className={cn("text-sm font-semibold", result.isAchievable ? "text-emerald-400" : "text-orange-400")}>
              {result.isAchievable ? "Achievable Goal" : "Challenging Timeline"}
            </span>
          </div>
          <p className="text-sm text-white/60">{result.achievabilityNote}</p>
        </div>

        {/* Overview */}
        <div className="rounded-xl border border-white/6 bg-white/2 p-4">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-widest text-white/35">Plan Overview</p>
          <p className="text-sm leading-relaxed text-white/70">{result.overview}</p>
        </div>

        {/* Daily schedule */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Morning", value: result.dailySchedule.morning, color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Afternoon", value: result.dailySchedule.afternoon, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Evening", value: result.dailySchedule.evening, color: "text-violet-400", bg: "bg-violet-500/10" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={cn("rounded-xl border border-white/6 p-3", bg)}>
              <p className={cn("mb-1.5 text-[10px] font-semibold uppercase tracking-widest", color)}>{label}</p>
              <p className="text-xs text-white/65 leading-relaxed">{value}</p>
            </div>
          ))}
        </div>

        {/* Weekly plan */}
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-white/35">Week-by-Week Roadmap</p>
          <div className="space-y-2">
            {result.weeklyPlan.map((week, i) => (
              <div key={i} className="rounded-xl border border-white/6 bg-white/2">
                <button
                  onClick={() => setExpandedWeek(expandedWeek === i ? null : i)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600/20 text-[11px] font-bold text-violet-400">
                      {week.week}
                    </span>
                    <div>
                      <span className="text-sm font-medium text-white">{week.focus}</span>
                      <span className="ml-2 text-[11px] text-white/30">{week.phase}</span>
                    </div>
                  </div>
                  {expandedWeek === i
                    ? <ChevronUp className="h-3.5 w-3.5 text-white/30" />
                    : <ChevronDown className="h-3.5 w-3.5 text-white/30" />}
                </button>
                {expandedWeek === i && (
                  <div className="border-t border-white/6 px-4 pb-4 pt-3 space-y-3">
                    <div>
                      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-white/30">Topics</p>
                      <div className="flex flex-wrap gap-1.5">
                        {week.topics.map((t, j) => (
                          <span key={j} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/60">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-white/30">Daily Tasks</p>
                      <ul className="space-y-1">
                        {week.dailyTasks.map((task, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-white/60">
                            <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400/50" />{task}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-3 py-2">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-emerald-400/60 mb-0.5">Week Goal</p>
                      <p className="text-xs text-white/60">{week.weeklyGoal}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Milestones */}
        {result.milestones.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-white/35">Key Milestones</p>
            <div className="space-y-2">
              {result.milestones.map((m, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-white/6 bg-white/2 p-3">
                  <Target className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                  <div>
                    <p className="text-sm font-medium text-white">{m.label}</p>
                    <p className="text-xs text-white/40">Week {m.week} · {m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips + Resources */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/6 bg-white/2 p-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-white/35">Exam Tips</p>
            <ul className="space-y-1.5">
              {result.examTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                  <span className="text-violet-400 mt-0.5">✦</span>{tip}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-white/6 bg-white/2 p-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-white/35">Resources</p>
            <ul className="space-y-1.5">
              {result.resources.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                  <BookOpen className="mt-0.5 h-3 w-3 shrink-0 text-blue-400" />{r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleSaveAsGoal}
            disabled={savingGoal}
            className="flex-1 gap-1.5 bg-violet-600 text-white hover:bg-violet-500"
          >
            {savingGoal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
            {savingGoal ? "Saving..." : "Save as Goal + Tasks"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setResult(null)}
            className="text-white/30 hover:text-white/60"
          >
            New Plan
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/40">
        Enter your exam and target — AI builds a complete week-by-week study plan with daily tasks, milestones, and exam-specific tips.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Exam / Goal</label>
          <input
            value={form.exam}
            onChange={(e) => setForm({ ...form, exam: e.target.value })}
            placeholder="e.g. IELTS, SAT, AWS exam, German B2"
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Target Score / Level</label>
          <input
            value={form.target}
            onChange={(e) => setForm({ ...form, target: e.target.value })}
            placeholder="e.g. Band 7.5, 1400+, Pass, B2"
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Available Time</label>
          <select value={form.timeframe} onChange={(e) => setForm({ ...form, timeframe: e.target.value })} className={selectCls}>
            {timeframes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Study Hours / Day</label>
          <select value={form.hoursPerDay} onChange={(e) => setForm({ ...form, hoursPerDay: e.target.value })} className={selectCls}>
            {hourOptions.map((h) => <option key={h} value={h}>{h} hour{h !== "1" ? "s" : ""}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Weak Areas (optional)</label>
        <textarea
          value={form.weakAreas}
          onChange={(e) => setForm({ ...form, weakAreas: e.target.value })}
          rows={2}
          placeholder="e.g. Reading comprehension, algebra, speaking fluency..."
          className={cn(inputCls, "resize-none")}
        />
      </div>

      {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}

      <Button
        onClick={handleGenerate}
        disabled={!form.exam.trim() || !form.target.trim() || loading}
        className="w-full gap-2 bg-violet-600 text-white hover:bg-violet-500"
      >
        {loading
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Building your plan...</>
          : <><BookOpen className="h-4 w-4" /> Generate Study Plan</>
        }
      </Button>
      {loading && (
        <p className="text-center text-xs text-white/30">Cortex is building your personalized roadmap — ~10 seconds</p>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

type Tab = "decision" | "debrief" | "coach" | "study"

export function AIHubClient() {
  const [tab, setTab] = useState<Tab>("decision")

  const tabs: { id: Tab; icon: typeof Scale; label: string }[] = [
    { id: "decision", icon: Scale, label: "Decision" },
    { id: "debrief", icon: TrendingUp, label: "Debrief" },
    { id: "study", icon: BookOpen, label: "Study Planner" },
    { id: "coach", icon: MessageSquare, label: "Coach" },
  ]

  return (
    <div className="min-h-full p-4 lg:p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20">
          <Sparkles className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">AI Tools</h1>
          <p className="text-sm text-white/40">Powered by Gemini 2.5 Flash</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium transition-colors sm:flex-row sm:gap-2 sm:text-sm",
              tab === id ? "bg-violet-600 text-white" : "text-white/40 hover:text-white/70"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className={tab === "coach" ? "w-full max-w-3xl" : "max-w-2xl"}>
        {tab === "decision" && <DecisionAnalysis />}
        {tab === "debrief" && <WeeklyDebrief />}
        {tab === "study" && <StudyPlanner />}
        {tab === "coach" && <CoachChat />}
      </div>
    </div>
  )
}
