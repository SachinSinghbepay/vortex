"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useRouter, usePathname } from "next/navigation"
import { X } from "lucide-react"

const TOUR_KEY = "cortex-tour-v1"

type Step = {
  id: string
  title: string
  body: string
  side: "bottom" | "top" | "right" | "left"
  align?: "start" | "end" | "center"
}

const STEPS: Step[] = [
  {
    id: "tour-greeting",
    title: "Welcome to Cortex",
    body: "This is your command centre — goals, tasks, streak, and AI insights all in one place.",
    side: "bottom", align: "start",
  },
  {
    id: "tour-streak",
    title: "Your streak",
    body: "Tracks consecutive days you've completed at least one task. Don't break the chain!",
    side: "bottom", align: "end",
  },
  {
    id: "tour-mit",
    title: "AI focus pick",
    body: "Click this to get your AI-recommended most important task for today.",
    side: "bottom", align: "start",
  },
  {
    id: "tour-stats",
    title: "Daily snapshot",
    body: "Active goals, tasks due today, completion rate, and focus score at a glance.",
    side: "bottom", align: "start",
  },
  {
    id: "tour-tasks-today",
    title: "Today's tasks",
    body: "Your highest-priority tasks due today. Completing these keeps your streak alive.",
    side: "top", align: "start",
  },
  {
    id: "tour-goals-list",
    title: "Active goals",
    body: "Your goals with progress bars. Every completed task moves these forward.",
    side: "top", align: "start",
  },
  {
    id: "tour-nav-goals",
    title: "Goals",
    body: "Set big goals, break them into milestones, and let Cortex build a schedule around them.",
    side: "right", align: "start",
  },
  {
    id: "tour-nav-tasks",
    title: "Tasks",
    body: "Create one-time or recurring tasks, linked to goals for real momentum.",
    side: "right", align: "start",
  },
  {
    id: "tour-nav-focus",
    title: "Focus mode",
    body: "Deep work sessions. Energy, focus, and stress are logged to track burnout over time.",
    side: "right", align: "start",
  },
  {
    id: "tour-nav-analytics",
    title: "Analytics",
    body: "Productivity trends, streak history, burnout risk, and goal-task alignment.",
    side: "right", align: "start",
  },
  {
    id: "tour-nav-ai",
    title: "AI Tools",
    body: "Weekly debrief, procrastination analysis, and personalised scheduling — all AI-powered.",
    side: "right", align: "start",
  },
]

const PAD = 8   // highlight padding around element
const GAP = 12  // gap between highlight and popover

function getPopoverStyle(rect: DOMRect, side: Step["side"], align: Step["align"]) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const PW = 300 // approx popover width

  let top: number | undefined, bottom: number | undefined
  let left: number | undefined, right: number | undefined

  if (side === "bottom") {
    top = rect.bottom + PAD + GAP
    if (align === "end")   left = Math.min(rect.right - PW, vw - PW - 12)
    else                   left = Math.max(12, rect.left - PAD)
  } else if (side === "top") {
    bottom = vh - (rect.top - PAD - GAP)
    if (align === "end")   left = Math.min(rect.right - PW, vw - PW - 12)
    else                   left = Math.max(12, rect.left - PAD)
  } else if (side === "right") {
    left = rect.right + PAD + GAP
    top  = Math.max(12, rect.top - PAD)
  } else {
    right = vw - (rect.left - PAD - GAP)
    top   = Math.max(12, rect.top - PAD)
  }

  return {
    position: "fixed" as const,
    zIndex: 10001,
    top, bottom, left, right,
    width: PW,
    maxWidth: `calc(100vw - 24px)`,
  }
}

export function DashboardTour() {
  const router = useRouter()
  const pathname = usePathname()
  const [stepIdx, setStepIdx] = useState<number | null>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (localStorage.getItem(TOUR_KEY)) return
    // If not on dashboard, navigate there first — tour elements only exist on that page
    if (pathname !== "/dashboard") {
      router.push("/dashboard")
      return
    }
    const t = setTimeout(() => setStepIdx(0), 500)
    return () => clearTimeout(t)
  }, [pathname])

  useEffect(() => {
    if (stepIdx === null) return
    const el = document.getElementById(STEPS[stepIdx].id)
    if (!el) { advance(); return }
    el.scrollIntoView({ behavior: "smooth", block: "nearest" })
    // slight delay so scroll settles before reading rect
    const t = setTimeout(() => setRect(el.getBoundingClientRect()), 80)
    return () => clearTimeout(t)
  }, [stepIdx])

  function advance() {
    if (stepIdx === null) return
    if (stepIdx >= STEPS.length - 1) finish()
    else setStepIdx(stepIdx + 1)
  }
  function back() { if (stepIdx !== null && stepIdx > 0) setStepIdx(stepIdx - 1) }
  function finish() { localStorage.setItem(TOUR_KEY, "1"); setStepIdx(null) }

  if (stepIdx === null || rect === null) return null

  const step = STEPS[stepIdx]
  const isLast = stepIdx === STEPS.length - 1

  return createPortal(
    <>
      {/* Dim overlay */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none" }}
      />
      {/* Spotlight cutout via box-shadow */}
      <div
        onClick={advance}
        style={{
          position: "fixed",
          zIndex: 10000,
          top:    rect.top    - PAD,
          left:   rect.left   - PAD,
          width:  rect.width  + PAD * 2,
          height: rect.height + PAD * 2,
          borderRadius: 10,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
          outline: "2px solid rgba(124,58,237,0.8)",
          cursor: "pointer",
        }}
      />
      {/* Popover */}
      <div style={getPopoverStyle(rect, step.side, step.align)}>
        <div style={{
          background: "#1a1a1f",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14,
          padding: "16px 18px",
          boxShadow: "0 20px 48px rgba(0,0,0,0.6)",
          color: "#fff",
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, flex: 1 }}>{step.title}</p>
            <button
              onClick={finish}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: "0 0 0 8px", lineHeight: 1 }}
            >
              <X size={14} />
            </button>
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 14 }}>{step.body}</p>
          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{stepIdx + 1} / {STEPS.length}</span>
            <div style={{ display: "flex", gap: 8 }}>
              {stepIdx > 0 && (
                <button onClick={back} style={{
                  fontSize: 12, padding: "5px 12px", borderRadius: 8, cursor: "pointer",
                  background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)",
                }}>← Back</button>
              )}
              <button onClick={isLast ? finish : advance} style={{
                fontSize: 12, padding: "5px 14px", borderRadius: 8, cursor: "pointer",
                background: "#7c3aed", border: "none", color: "#fff", fontWeight: 500,
              }}>{isLast ? "Let's go!" : "Next →"}</button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
