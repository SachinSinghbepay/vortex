"use client"

import { useState } from "react"
import { Menu, Brain } from "lucide-react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { cn } from "@/lib/utils"

interface AppShellProps {
  user: { name?: string | null; email?: string | null; plan?: string }
  children: React.ReactNode
}

export function AppShell({ user, children }: AppShellProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — fixed drawer on mobile, static on desktop */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
          "md:relative md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <Sidebar user={user} onNavigate={() => setOpen(false)} />
      </div>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 md:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-1.5 text-foreground/50 transition hover:bg-foreground/5 hover:text-foreground/80"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-indigo-600">
              <Brain className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">Cortex</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
