"use client"

import { useState } from "react"
import { Shield, Loader2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RealityCheckResult {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  burnoutScore: number
  issues: string[]
  verdict: string
  suggestedSchedule: string
  psychologyNote: string
  isDoable: boolean
}

const riskConfig = {
  LOW: { label: "Low Risk", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  MEDIUM: { label: "Medium Risk", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  HIGH: { label: "High Risk", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  CRITICAL: { label: "Critical", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
}

export function RealityCheckModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [plan, setPlan] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RealityCheckResult | null>(null)
  const [error, setError] = useState("")

  const handleCheck = async () => {
    if (!plan.trim()) return
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch("/api/ai/reality-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
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

  const risk = result ? riskConfig[result.riskLevel] : null

  return (
    <Modal open={open} onClose={onClose} title="AI Reality Check">
      <div className="space-y-4">
        {!result ? (
          <>
            <p className="text-sm text-white/40">
              Describe your plan. AI will tell you honestly if it's sustainable or headed for burnout.
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">
                Your Plan
              </label>
              <textarea
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                rows={4}
                placeholder={`e.g. "I'll study 10 hours every day for the next 2 months to pass my exam"`}
                className="w-full resize-none rounded-lg border border-white/[0.07] bg-white/4 px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none transition focus:border-violet-500/40"
              />
            </div>
            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                {error}
              </p>
            )}
            <Button
              onClick={handleCheck}
              disabled={!plan.trim() || loading}
              className="w-full gap-2 bg-violet-600 text-white hover:bg-violet-500"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analysing...</>
              ) : (
                <><Shield className="h-4 w-4" /> Check My Plan</>
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            {/* Risk banner */}
            <div className={cn("flex items-center gap-3 rounded-xl border p-4", risk?.bg, risk?.border)}>
              {result.isDoable ? (
                <CheckCircle2 className={cn("h-5 w-5 shrink-0", risk?.color)} />
              ) : (
                <XCircle className={cn("h-5 w-5 shrink-0", risk?.color)} />
              )}
              <div>
                <p className={cn("text-sm font-semibold", risk?.color)}>{risk?.label}</p>
                <p className="text-xs text-white/50">{result.verdict}</p>
              </div>
              <div className="ml-auto text-right">
                <p className={cn("text-2xl font-bold", risk?.color)}>{result.burnoutScore}</p>
                <p className="text-[10px] text-white/30">burnout risk</p>
              </div>
            </div>

            {/* Issues */}
            {result.issues.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-white/35">Issues Found</p>
                <ul className="space-y-1.5">
                  {result.issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested schedule */}
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-emerald-400/60">
                Suggested Instead
              </p>
              <p className="text-xs leading-relaxed text-white/60">{result.suggestedSchedule}</p>
            </div>

            {/* Psychology note */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-white/25">
                Why This Happens
              </p>
              <p className="text-xs leading-relaxed text-white/45">{result.psychologyNote}</p>
            </div>

            <Button
              variant="ghost"
              onClick={() => { setResult(null); setPlan("") }}
              className="w-full text-xs text-white/30 hover:text-white/60"
            >
              Check a different plan
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
