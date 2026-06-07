import Link from "next/link"
import {
  Brain,
  Target,
  Zap,
  BarChart3,
  Shield,
  BookOpen,
  ArrowRight,
  Check,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { cn } from "@/lib/utils"

// ─── Navbar ──────────────────────────────────────────────────────────────────

function Navbar({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#030303]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
            <Brain className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">Cortex</span>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          <a href="#features" className="text-sm text-white/50 transition hover:text-white/80">Features</a>
          <a href="#how-it-works" className="text-sm text-white/50 transition hover:text-white/80">How it works</a>
          <a href="#pricing" className="text-sm text-white/50 transition hover:text-white/80">Pricing</a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button size="sm" className="bg-violet-600 text-white hover:bg-violet-500">
                Go to dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm text-white/50 transition hover:text-white/80">
                Sign in
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="bg-violet-600 text-white hover:bg-violet-500">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-14 text-center">
      {/* Background orbs */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute -left-40 top-1/2 h-80 w-80 rounded-full bg-indigo-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-violet-800/10 blur-[100px]" />

      {/* Badge */}
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5">
        <Sparkles className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-xs font-medium text-violet-300">AI-Powered Cognitive OS</span>
      </div>

      {/* Headline */}
      <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
        Your goals deserve{" "}
        <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          an actual plan.
        </span>
      </h1>

      <p className="mx-auto mt-6 max-w-xl text-base text-white/50 sm:text-lg">
        Cortex turns vague ambitions into structured roadmaps, checks your plans for burnout, and tells you
        exactly what to work on — based on your energy and what actually matters.
      </p>

      {/* CTAs */}
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link href="/sign-up">
          <Button className="h-11 gap-2 bg-violet-600 px-6 text-white shadow-lg shadow-violet-900/40 hover:bg-violet-500">
            Start for free <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <a href="#how-it-works">
          <Button variant="ghost" className="h-11 px-6 text-white/50 hover:text-white/80">
            See how it works
          </Button>
        </a>
      </div>

      <p className="mt-4 text-xs text-white/25">No credit card required</p>

      {/* App mockup */}
      <div className="relative mx-auto mt-16 w-full max-w-4xl">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-violet-500/10 to-transparent blur-2xl" />
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d0d] shadow-2xl shadow-black/60">
          {/* Browser bar */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
            </div>
            <div className="mx-auto flex h-5 w-48 items-center justify-center rounded-md bg-white/5 text-[10px] text-white/20">
              cortex.app/dashboard
            </div>
          </div>

          <div className="flex h-72">
            {/* Sidebar */}
            <div className="w-44 border-r border-white/[0.05] p-3">
              <div className="mb-4 flex items-center gap-2 px-2 py-1">
                <div className="h-5 w-5 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600" />
                <div className="h-3 w-12 rounded bg-white/20" />
              </div>
              {["Dashboard", "Goals", "Tasks", "Focus", "Analytics"].map((item, i) => (
                <div
                  key={item}
                  className={cn(
                    "mb-0.5 flex items-center gap-2 rounded-lg px-2 py-1.5",
                    i === 0 && "bg-white/[0.07]"
                  )}
                >
                  <div className={cn("h-3 w-3 rounded bg-white/10", i === 0 && "bg-violet-400/50")} />
                  <div className={cn("h-2.5 rounded bg-white/10", i === 0 ? "w-16 bg-white/30" : "w-12")} />
                </div>
              ))}
            </div>

            {/* Main area */}
            <div className="flex-1 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="mb-1 h-4 w-36 rounded bg-white/20" />
                  <div className="h-2.5 w-24 rounded bg-white/10" />
                </div>
              </div>

              {/* Stat cards */}
              <div className="mb-5 grid grid-cols-4 gap-3">
                {[
                  { color: "bg-violet-500/20", w: "w-8" },
                  { color: "bg-blue-500/20", w: "w-6" },
                  { color: "bg-emerald-500/20", w: "w-10" },
                  { color: "bg-amber-500/20", w: "w-7" },
                ].map((card, i) => (
                  <div key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="h-2 w-12 rounded bg-white/10" />
                      <div className={cn("h-5 w-5 rounded-lg", card.color)} />
                    </div>
                    <div className={cn("h-5 rounded bg-white/20", card.w)} />
                  </div>
                ))}
              </div>

              {/* Content rows */}
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                    <div className="mb-3 h-2.5 w-16 rounded bg-white/15" />
                    <div className="space-y-2">
                      {[0, 1, 2].map((j) => (
                        <div key={j} className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400/60" />
                          <div className={cn("h-2 rounded bg-white/10", j === 0 ? "w-full" : j === 1 ? "w-4/5" : "w-3/5")} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Problem ──────────────────────────────────────────────────────────────────

function Problem() {
  const pains = [
    {
      icon: "📋",
      title: "You have tasks, not progress",
      desc: "Every app lets you add infinite tasks. None of them tell you if those tasks actually move your goals forward.",
    },
    {
      icon: "🔥",
      title: "You plan to burn out",
      desc: "\"I'll study 10 hours a day\" sounds motivating. It lasts 3 days. No app warns you before you crash.",
    },
    {
      icon: "🌀",
      title: "You're busy, not productive",
      desc: "You close 20 tasks and feel nothing changed. Because they weren't connected to anything that matters.",
    },
  ]

  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-violet-400">The problem</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Every productivity app fails you the same way.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/50">
            They store your tasks. They don't help you think.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {pains.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
            >
              <div className="mb-4 text-3xl">{icon}</div>
              <h3 className="mb-2 text-sm font-semibold text-white">{title}</h3>
              <p className="text-sm text-white/40">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

function Features() {
  const features = [
    {
      icon: Target,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      title: "AI Goal Decomposition",
      desc: "Type any goal. Cortex breaks it into milestones, weekly tasks, and daily actions with realistic timelines.",
      tag: "Core",
    },
    {
      icon: Shield,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      title: "Reality Check",
      desc: "Before you commit to a schedule, Cortex analyzes it for burnout risk and suggests a plan you can actually sustain.",
      tag: "Unique",
    },
    {
      icon: Zap,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      title: "Energy-Based Scheduling",
      desc: "Log how you feel each day. Cortex matches your task list to your energy — deep work when sharp, easy tasks when drained.",
      tag: "Unique",
    },
    {
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      title: "Goal–Task Alignment",
      desc: "See what % of your week actually moved your goals forward. Busts the illusion of being busy.",
      tag: "Unique",
    },
    {
      icon: BarChart3,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      title: "Smart Analytics",
      desc: "Productivity streaks, completion trends, focus patterns, and burnout risk — all surfaced automatically.",
      tag: "Analytics",
    },
    {
      icon: BookOpen,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      title: "AI Study Planner",
      desc: "Tell Cortex your exam, target score, and available time. Get a structured study roadmap built around your weak areas.",
      tag: "AI",
    },
  ]

  return (
    <section id="features" className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-violet-400">Features</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Everything a thinking person needs.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/50">
            Not a feature list. A system — where everything is connected to your actual goals.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, color, bg, title, desc, tag }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:border-white/10 hover:bg-white/[0.04]"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className={cn("rounded-xl p-2.5", bg)}>
                  <Icon className={cn("h-5 w-5", color)} />
                </div>
                {tag === "Unique" && (
                  <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400">
                    Unique
                  </span>
                )}
              </div>
              <h3 className="mb-2 text-sm font-semibold text-white">{title}</h3>
              <p className="text-sm leading-relaxed text-white/40">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Set your goals",
      desc: "Add what you want to achieve — learn a skill, hit a fitness target, ace an exam. Set a deadline and priority.",
      color: "text-violet-400",
    },
    {
      number: "02",
      title: "AI builds your roadmap",
      desc: "Cortex breaks each goal into milestones, weekly targets, and daily tasks. It checks your plan for burnout before you start.",
      color: "text-indigo-400",
    },
    {
      number: "03",
      title: "Work smarter every day",
      desc: "Each morning, Cortex tells you the one most important thing to work on. Energy tracking adapts your schedule in real time.",
      color: "text-blue-400",
    },
  ]

  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-violet-400">How it works</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            From vague idea to daily action in minutes.
          </h2>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          {/* Connector line */}
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent md:block" />

          {steps.map(({ number, title, desc, color }) => (
            <div key={number} className="relative text-center">
              <div className={cn("mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-lg font-bold", color)}>
                {number}
              </div>
              <h3 className="mb-2 text-sm font-semibold text-white">{title}</h3>
              <p className="text-sm text-white/40">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function Testimonials() {
  const reviews = [
    {
      name: "Aisha Okonkwo",
      role: "Medical student",
      avatar: "AO",
      text: "The reality check feature is what got me. I planned to study 9 hours a day before my boards. Cortex flagged it immediately and built me a schedule I could actually follow. I passed.",
    },
    {
      name: "Marcus Chen",
      role: "Software engineer",
      avatar: "MC",
      text: "I've tried Notion, Todoist, TickTick. They all let me collect tasks forever. Cortex is the first app that made me ask — do these tasks actually matter to my goals?",
    },
    {
      name: "Priya Sharma",
      role: "Freelance designer",
      avatar: "PS",
      text: "The daily MIT feature changed how I start my mornings. I open Cortex, it tells me the one thing that matters, and I do that first. It sounds simple but it works.",
    },
  ]

  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-violet-400">What people say</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Built for people who mean it.</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {reviews.map(({ name, role, avatar, text }) => (
            <div key={name} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="mb-4 flex">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
              <p className="mb-6 text-sm leading-relaxed text-white/60">&ldquo;{text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white">
                  {avatar}
                </div>
                <div>
                  <p className="text-xs font-medium text-white/80">{name}</p>
                  <p className="text-[10px] text-white/35">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      desc: "For individuals getting started",
      features: [
        "Unlimited goals & tasks",
        "Dashboard & analytics",
        "Basic focus tracking",
        "5 AI requests / month",
      ],
      cta: "Get started",
      href: "/sign-up",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$12",
      period: "/mo",
      desc: "For people serious about execution",
      features: [
        "Everything in Free",
        "Unlimited AI goal decomposition",
        "Reality check & burnout detection",
        "Decision analysis tool",
        "AI study planner",
        "Weekly AI debrief",
        "Priority support",
      ],
      cta: "Start free trial",
      href: "/sign-up",
      highlight: true,
    },
  ]

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-violet-400">Pricing</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Simple, honest pricing.</h2>
          <p className="mt-4 text-white/50">Start free. Upgrade when you need the AI.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map(({ name, price, period, desc, features, cta, href, highlight }) => (
            <div
              key={name}
              className={cn(
                "relative rounded-2xl border p-8",
                highlight
                  ? "border-violet-500/40 bg-violet-500/5"
                  : "border-white/[0.06] bg-white/[0.02]"
              )}
            >
              {highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full border border-violet-500/30 bg-violet-600 px-3 py-0.5 text-[11px] font-medium text-white">
                    Most popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className="mb-1 text-sm font-medium text-white/60">{name}</p>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-white">{price}</span>
                  {period && <span className="mb-1 text-white/40">{period}</span>}
                </div>
                <p className="mt-1 text-sm text-white/40">{desc}</p>
              </div>

              <ul className="mb-8 space-y-3">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/60">
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-violet-400" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link href={href}>
                <Button
                  className={cn(
                    "w-full",
                    highlight
                      ? "bg-violet-600 text-white hover:bg-violet-500"
                      : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="py-24 px-6">
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-violet-500/20 bg-violet-500/5 p-12 text-center">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-indigo-600/10" />
        <div className="relative">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-900/40">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <h2 className="mb-4 text-3xl font-bold text-white">
            Start thinking clearly today.
          </h2>
          <p className="mx-auto mb-8 max-w-md text-white/50">
            Your goals are waiting. Set up your workspace in under 2 minutes — no credit card required.
          </p>
          <Link href="/sign-up">
            <Button className="h-11 gap-2 bg-violet-600 px-8 text-white shadow-lg shadow-violet-900/40 hover:bg-violet-500">
              Get started free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
            <Brain className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm font-semibold text-white/60">Cortex</span>
        </div>
        <p className="text-xs text-white/25">
          © {new Date().getFullYear()} Cortex. Built to help you actually finish things.
        </p>
        <div className="flex gap-4 text-xs text-white/30">
          <Link href="/sign-in" className="hover:text-white/60 transition">Sign in</Link>
          <Link href="/sign-up" className="hover:text-white/60 transition">Sign up</Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function LandingPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="min-h-screen bg-[#030303]">
      <Navbar isLoggedIn={isLoggedIn} />
      <Hero />
      <Problem />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  )
}
