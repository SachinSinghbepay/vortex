"use client"

import { useState } from "react"
import { Sparkles, Loader2, ChevronDown, ChevronUp, Clock, Zap, CheckCircle2, Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Milestone {
  title: string
  duration: string
  description: string
  tasks: string[]
}

interface DecomposeResult {
  milestones: Milestone[]
  weeklyHours: number
  difficulty: "Easy" | "Medium" | "Hard" | "Very Hard"
  tips: string[]
  realisticAssessment: string
}

interface Props {
  open: boolean
  onClose: () => void
  goal: {
    id?: string
    title: string
    description?: string | null
    deadline?: string | null
    type: string
  }
  onSaveTasks?: (tasks: string[], milestoneTitle: string, milestoneIndex: number) => void
  onDecomposed?: () => void
}

const difficultyColor: Record<string, string> = {
  Easy: "text-emerald-400 bg-emerald-500/10",
  Medium: "text-amber-400 bg-amber-500/10",
  Hard: "text-orange-400 bg-orange-500/10",
  "Very Hard": "text-red-400 bg-red-500/10",
}

export function DecomposeModal({ open, onClose, goal, onSaveTasks, onDecomposed }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DecomposeResult | null>(null)
  const [error, setError] = useState("")
  const [expanded, setExpanded] = useState<number | null>(0)
  const [saved, setSaved] = useState<number[]>([])
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!result) return
    const text = [
      `=== AI Goal Decomposition: ${goal.title} ===`,
      `Difficulty: ${result.difficulty} | ${result.weeklyHours}h/week`,
      `\nAssessment:\n${result.realisticAssessment}`,
      `\nROADMAP:`,
      ...result.milestones.map((m, i) =>
        `\nPhase ${i + 1}: ${m.title} (${m.duration})\n${m.description}\nTasks:\n${m.tasks.map(t => `  • ${t}`).join("\n")}`
      ),
      `\nTIPS:\n${result.tips.map(t => `• ${t}`).join("\n")}`,
    ].join("\n")
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toast.success("Copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDecompose = async () => {
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch("/api/ai/decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goal),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      setExpanded(0)
      onDecomposed?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTasks = (i: number, tasks: string[], milestoneTitle: string) => {
    onSaveTasks?.(tasks, milestoneTitle, i)
    setSaved((p) => [...p, i])
  }

  return (
    <Modal open={open} onClose={onClose} title="AI Goal Decomposition">
      <div className="space-y-4">
        {/* Goal preview */}
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-4 py-3">
          <p className="text-xs text-white/40">Breaking down</p>
          <p className="mt-0.5 text-sm font-medium text-white">{goal.title}</p>
        </div>

        {!result && (
          <>
            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                {error}
              </p>
            )}
            <Button
              onClick={handleDecompose}
              disabled={loading}
              className="w-full gap-2 bg-violet-600 text-white hover:bg-violet-500"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Roadmap
                </>
              )}
            </Button>
            {loading && (
              <p className="text-center text-xs text-white/30">
                Cortex is building your roadmap — usually takes 5-10 seconds
              </p>
            )}
          </>
        )}

        {result && (
          <div className="space-y-4">
            {/* Stats row */}
            <div className="flex gap-3">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <Clock className="h-3.5 w-3.5 text-white/30" />
                <span className="text-xs text-white/60">{result.weeklyHours}h/week</span>
              </div>
              <div className={cn("flex flex-1 items-center justify-center rounded-lg px-3 py-2 text-xs font-medium", difficultyColor[result.difficulty] ?? "text-white/40 bg-white/5")}>
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                {result.difficulty}
              </div>
            </div>

            {/* Assessment */}
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3">
              <p className="text-xs leading-relaxed text-violet-300">{result.realisticAssessment}</p>
            </div>

            {/* Milestones */}
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-widest text-white/35">Roadmap</p>
              {result.milestones.map((m, i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <button
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <div>
                      <span className="text-sm font-medium text-white">{m.title}</span>
                      <span className="ml-2 text-xs text-white/35">{m.duration}</span>
                    </div>
                    {expanded === i ? (
                      <ChevronUp className="h-3.5 w-3.5 text-white/30" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-white/30" />
                    )}
                  </button>

                  {expanded === i && (
                    <div className="border-t border-white/[0.05] px-4 pb-4 pt-3">
                      <p className="mb-3 text-xs text-white/45">{m.description}</p>
                      <ul className="mb-3 space-y-1.5">
                        {m.tasks.map((task, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-white/60">
                            <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400/60" />
                            {task}
                          </li>
                        ))}
                      </ul>
                      {onSaveTasks && (
                        <Button
                          size="sm"
                          onClick={() => handleSaveTasks(i, m.tasks, m.title)}
                          disabled={saved.includes(i)}
                          variant="ghost"
                          className="h-7 gap-1.5 text-xs text-violet-400 hover:text-violet-300"
                        >
                          {saved.includes(i) ? (
                            <><CheckCircle2 className="h-3 w-3" /> Saved to Tasks</>
                          ) : (
                            <>+ Add to Tasks</>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Tips */}
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-white/35">Tips</p>
              <ul className="space-y-1.5">
                {result.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                    <span className="mt-0.5 text-violet-400">✦</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              variant="ghost"
              onClick={() => { setResult(null); setSaved([]) }}
              className="flex-1 text-xs text-white/30 hover:text-white/60"
            >
              Generate again
            </Button>
            <Button
              variant="ghost"
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
