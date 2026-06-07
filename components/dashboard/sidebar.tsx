"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  Brain,
  LayoutDashboard,
  Target,
  CheckSquare,
  Zap,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/ui/theme-toggle"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/goals", icon: Target, label: "Goals" },
  { href: "/tasks", icon: CheckSquare, label: "Tasks" },
  { href: "/focus", icon: Zap, label: "Focus" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/ai", icon: Sparkles, label: "AI Tools" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

interface SidebarProps {
  user: { name?: string | null; email?: string | null; plan?: string }
  onNavigate?: () => void
}

export function Sidebar({ user, onNavigate }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-background">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-indigo-600">
          <Brain className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="flex-1 text-sm font-semibold text-foreground">Cortex</span>
        <ThemeToggle />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-violet-600/15 text-violet-700 dark:bg-violet-600/20 dark:text-violet-300"
                  : "text-foreground/50 hover:bg-foreground/5 hover:text-foreground/80"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-border p-3">
        <div className="mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-600 text-[10px] font-semibold text-white">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs font-medium text-foreground/80">{user.name ?? "User"}</p>
              {user.plan === "PRO" && (
                <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-violet-600/25 px-1.5 py-0.5 text-[9px] font-medium text-violet-400">
                  <Sparkles className="h-2.5 w-2.5" /> Pro
                </span>
              )}
            </div>
            <p className="truncate text-[10px] text-foreground/30">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/sign-in" })}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/30 transition-colors hover:bg-foreground/5 hover:text-foreground/60"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
