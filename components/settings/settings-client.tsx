"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Sparkles, Check, User, Mail, Calendar, Shield, Pencil, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/ui/page-transition"

interface Props {
  user: {
    id: string
    name: string | null
    email: string | null
    plan: "FREE" | "PRO"
    createdAt: string
    emailNotifications: boolean
  }
}

const proFeatures = [
  "Unlimited AI goal decomposition",
  "Reality check & burnout detection",
  "Daily Most Important Task (MIT)",
  "Decision analysis tool",
  "AI study planner",
  "Weekly AI debrief",
  "Goal–task alignment score",
  "Procrastination radar",
]

const freeFeatures = [
  "Unlimited goals & tasks",
  "Dashboard & analytics",
  "Focus tracking",
  "5 AI requests / month",
]

const inputCls =
  "w-full rounded-lg border border-white/[0.07] bg-white/4 px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none transition focus:border-violet-500/40 focus:bg-white/[0.07]"

export function SettingsClient({ user }: Props) {
  const [plan, setPlan] = useState<"FREE" | "PRO">(user.plan)
  const [upgrading, setUpgrading] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications)
  const [savingNotif, setSavingNotif] = useState(false)
  const router = useRouter()

  // Profile editing
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(user.name ?? "")
  const [savingName, setSavingName] = useState(false)

  // Account deletion
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleting, setDeleting] = useState(false)

  const handleSaveName = async () => {
    if (!name.trim()) return
    setSavingName(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        setEditingName(false)
        router.refresh()
        toast.success("Name updated")
      } else {
        toast.error("Failed to update name")
      }
    } finally {
      setSavingName(false)
    }
  }

  const handleNotificationToggle = async () => {
    const next = !emailNotifications
    setEmailNotifications(next)
    setSavingNotif(true)
    try {
      await fetch("/api/user/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailNotifications: next }),
      })
      toast.success(next ? "Morning briefs enabled" : "Morning briefs disabled")
    } finally {
      setSavingNotif(false)
    }
  }

  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      const res = await fetch("/api/user/upgrade", { method: "POST" })
      if (res.ok) {
        setPlan("PRO")
        router.refresh()
        toast.success("You're on Pro!", { description: "All AI features are now unlocked." })
      }
    } finally {
      setUpgrading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" })
      if (res.ok) {
        toast.success("Account deleted")
        await signOut({ callbackUrl: "/" })
      } else {
        toast.error("Failed to delete account")
      }
    } finally {
      setDeleting(false)
    }
  }

  const displayName = name || user.name || "No name"

  return (
    <PageTransition className="min-h-full p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="mt-0.5 text-sm text-white/40">Manage your account and plan</p>
      </div>

      <div className="max-w-2xl space-y-6">

        {/* Profile */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/70">Profile</h2>
            {!editingName && (
              <button
                onClick={() => setEditingName(true)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/35 transition hover:bg-white/5 hover:text-white/60"
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
            )}
          </div>

          {editingName ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">Display Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  placeholder="Your name"
                  autoFocus
                  className={inputCls}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveName}
                  disabled={!name.trim() || savingName}
                  className="gap-1.5 bg-violet-600 text-white hover:bg-violet-500"
                >
                  {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Save
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setEditingName(false); setName(user.name ?? "") }}
                  className="text-white/40 hover:text-white/70"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600/80 text-sm font-semibold text-white">
                  {displayName[0]?.toUpperCase() ?? "U"}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{displayName}</p>
                  <p className="text-xs text-white/35">{user.email}</p>
                </div>
                {plan === "PRO" && (
                  <span className="ml-auto flex items-center gap-1 rounded-full bg-violet-600/20 px-2.5 py-0.5 text-[11px] font-medium text-violet-300">
                    <Sparkles className="h-3 w-3" /> Pro
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1 text-xs text-white/35">
                <div className="flex items-center gap-2"><User className="h-3.5 w-3.5" />{displayName}</div>
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{user.email}</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </div>
                <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5" />{plan === "PRO" ? "Pro plan" : "Free plan"}</div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="mb-1 text-sm font-semibold text-white/70">Morning Brief</h2>
          <p className="mb-4 text-xs text-white/35">
            Get a daily email at 8am with your most important task, streak, and a motivational quote.
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">{emailNotifications ? "Enabled" : "Disabled"}</p>
              <p className="text-xs text-white/35">Sent to {user.email}</p>
            </div>
            <button
              onClick={handleNotificationToggle}
              disabled={savingNotif}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors focus:outline-none",
                emailNotifications ? "bg-violet-600" : "bg-white/10"
              )}
            >
              <span className={cn(
                "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                emailNotifications ? "translate-x-5" : "translate-x-0"
              )} />
            </button>
          </div>
        </div>

        {/* Plan */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="mb-4 text-sm font-semibold text-white/70">Plan</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={cn(
              "rounded-xl border p-5 transition",
              plan === "FREE" ? "border-white/15 bg-white/[0.04]" : "border-white/[0.06]"
            )}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Free</p>
                {plan === "FREE" && (
                  <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/40">Current</span>
                )}
              </div>
              <p className="mb-4 text-2xl font-bold text-white">$0</p>
              <ul className="space-y-2">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-white/50">
                    <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-white/30" />{f}
                  </li>
                ))}
              </ul>
            </div>

            <div className={cn(
              "rounded-xl border p-5 transition",
              plan === "PRO" ? "border-violet-500/40 bg-violet-500/5" : "border-violet-500/20 bg-violet-500/3"
            )}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Pro</p>
                {plan === "PRO" ? (
                  <span className="flex items-center gap-1 rounded-full bg-violet-600/30 px-2 py-0.5 text-[10px] text-violet-300">
                    <Sparkles className="h-2.5 w-2.5" /> Active
                  </span>
                ) : (
                  <span className="rounded-full border border-violet-500/30 px-2 py-0.5 text-[10px] text-violet-400">$12/mo</span>
                )}
              </div>
              <p className="mb-4 text-2xl font-bold text-white">
                {plan === "PRO" ? "Active" : "$12"}
                {plan !== "PRO" && <span className="text-sm font-normal text-white/40">/mo</span>}
              </p>
              <ul className="mb-5 space-y-2">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-white/60">
                    <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-violet-400" />{f}
                  </li>
                ))}
              </ul>
              {plan !== "PRO" && (
                <Button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="w-full gap-1.5 bg-violet-600 text-white hover:bg-violet-500"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {upgrading ? "Activating..." : "Upgrade to Pro"}
                </Button>
              )}
            </div>
          </div>
          {plan === "PRO" && (
            <p className="mt-4 text-center text-xs text-white/25">You&apos;re on the Pro plan. All AI features are unlocked.</p>
          )}
        </div>

        {/* Danger zone */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/2 p-6">
          <h2 className="mb-1 text-sm font-semibold text-red-400">Danger Zone</h2>
          <p className="mb-4 text-xs text-white/35">
            Permanently delete your account and all your data. This cannot be undone.
          </p>
          <Button
            variant="ghost"
            onClick={() => setShowDeleteModal(true)}
            className="gap-1.5 border border-red-500/25 text-red-400 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Delete Account
          </Button>
        </div>

      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteConfirm("") }}
        title="Delete Account"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
            <p className="text-sm text-red-300">
              This will permanently delete your account, all goals, tasks, focus logs, and AI analyses. There is no way to recover this data.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-widest text-white/35">
              Type <span className="text-white/60">delete my account</span> to confirm
            </label>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="delete my account"
              className={inputCls}
            />
          </div>
          <Button
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== "delete my account" || deleting}
            className="w-full gap-1.5 bg-red-600 text-white hover:bg-red-500 disabled:opacity-40"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            {deleting ? "Deleting..." : "Permanently Delete Account"}
          </Button>
        </div>
      </Modal>
    </PageTransition>
  )
}
