"use client"

import { useState } from "react"
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"

interface Props {
  open: boolean
  onClose: () => void
  task: string
  onSave: (subtasks: string[]) => void
}

export function BreakdownModal({ open, onClose, task, onSave }: Props) {
  const [loading, setLoading] = useState(false)
  const [subtasks, setSubtasks] = useState<string[] | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const handleBreakdown = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/ai/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSubtasks(data.subtasks)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    if (subtasks) {
      onSave(subtasks)
      setSaved(true)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Break Down Task">
      <div className="space-y-4">
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-4 py-3">
          <p className="text-xs text-white/40">Breaking down</p>
          <p className="mt-0.5 text-sm font-medium text-white">{task}</p>
        </div>

        {!subtasks ? (
          <>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button
              onClick={handleBreakdown}
              disabled={loading}
              className="w-full gap-2 bg-violet-600 text-white hover:bg-violet-500"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Thinking...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Break It Down</>
              )}
            </Button>
          </>
        ) : (
          <>
            <ul className="space-y-2">
              {subtasks.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-violet-500/40 text-[10px] font-medium text-violet-400">
                    {i + 1}
                  </div>
                  <span className="text-sm text-white/70">{s}</span>
                </li>
              ))}
            </ul>

            {saved ? (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Subtasks added to your task list
              </div>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1 bg-violet-600 text-white hover:bg-violet-500">
                  Add to Tasks
                </Button>
                <Button variant="ghost" onClick={() => setSubtasks(null)} className="text-white/40">
                  Regenerate
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
