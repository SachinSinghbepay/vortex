# Cortex — AI Cognitive Operating System

An AI-powered productivity SaaS that goes beyond a simple task manager. Cortex combines goal decomposition, deep work tracking, decision intelligence, and weekly AI debriefs into a single cohesive system.

Built as a portfolio-grade full-stack product — designed to look and feel like a real startup, not a tutorial app.

---

## Features

### Core
- **Authentication** — Email/password with OTP email verification via Resend
- **Dashboard** — Streak tracking, AI "Most Important Task" widget, Procrastination Radar, goal/task overview, daily quote
- **Goals** — Create, track, and decompose goals with AI-generated milestone roadmaps
- **Tasks** — Priority levels, due dates, categories, goal linking, and AI subtask breakdown
- **Focus Tracker** — Pomodoro-style timer with post-session energy/focus/stress logging
- **Analytics** — Burnout risk score, completion rates, focus time charts, goal progress tracking
- **Settings** — Inline profile editing, notification preferences, account management

### AI Tools (AI Hub)
- **Goal Decomposer** — Breaks any goal into structured milestones, tasks, and a realistic timeline
- **Study Planner** — Takes an exam and deadline, produces a week-by-week study roadmap
- **Decision Analysis** — Frames a decision with pros, cons, risk assessment, and a clear recommendation
- **Weekly Debrief** — Auto-generates a Sunday review: what moved, what slipped, what to prioritize
- **AI Coach** — Chat interface grounded in your actual goals and task history

### UX
- Framer Motion page transitions and staggered card entrances
- Skeleton loaders on every route
- Server-side caching with `unstable_cache` and tag-based invalidation
- Toast notifications via Sonner
- Fully dark-themed, responsive design

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.1.7 (App Router, Turbopack) |
| Language | TypeScript 5.9 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion 12 |
| Database | PostgreSQL via [Neon](https://neon.tech) |
| ORM | Prisma 6 |
| Auth | NextAuth v4 + Prisma adapter |
| AI | Google Gemini (`@google/generative-ai`) |
| Email | Resend |
| Icons | Lucide React |
| Toasts | Sonner |
| Deploy | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 20+
- A PostgreSQL database (Neon recommended)
- Google Gemini API key
- Resend API key + verified sender domain

### 1. Clone and install

```bash
git clone https://github.com/SachinSinghbepay/vortex.git
cd vortex/next-app
npm install
```

### 2. Set up environment variables

Create `.env` in the `next-app` directory:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# AI
GOOGLE_AI_KEY="your-gemini-api-key"

# Email (Resend)
RESEND_API_KEY="re_..."
RESEND_FROM="Cortex <hello@yourdomain.com>"
```

### 3. Set up the database

```bash
npx prisma generate
npx prisma db push
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
next-app/
├── app/
│   ├── (app)/              # Authenticated routes
│   │   ├── dashboard/
│   │   ├── goals/
│   │   ├── tasks/
│   │   ├── focus/
│   │   ├── analytics/
│   │   ├── ai/
│   │   └── settings/
│   ├── api/                # API route handlers
│   │   ├── ai/             # AI endpoints (decompose, coach, debrief, etc.)
│   │   ├── goals/
│   │   ├── tasks/
│   │   ├── focus/
│   │   └── user/
│   └── (auth)/             # Sign in / register pages
├── components/
│   ├── ai/                 # AI Hub client components
│   ├── dashboard/
│   ├── goals/
│   ├── tasks/
│   ├── focus/
│   ├── analytics/
│   ├── settings/
│   └── ui/                 # Shared primitives
├── lib/
│   ├── queries.ts          # Cached DB queries (unstable_cache)
│   ├── prisma.ts
│   └── auth.ts
└── prisma/
    └── schema.prisma
```

---

## Scripts

```bash
npm run dev        # Start dev server with Turbopack
npm run build      # Production build
npm run typecheck  # Run tsc --noEmit
npm run lint       # ESLint
npm run format     # Prettier
```

---

## Database Schema

Core models: `User`, `Goal`, `Task`, `FocusLog`, `AIAnalysis`

Run `npx prisma studio` to browse your data locally.

---

## License

MIT
