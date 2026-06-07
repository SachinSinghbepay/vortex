import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resend, FROM_EMAIL } from "@/lib/resend"
import { getDailyQuote } from "@/lib/quotes"
import { morningBriefHtml, progressReportHtml } from "@/lib/email-templates"

// Vercel cron hits GET /api/email/morning-brief daily at 8am UTC
export async function GET(req: Request) {
  // Allow Authorization header (Vercel cron) OR ?secret= query param (manual testing)
  const { searchParams } = new URL(req.url)
  const authHeader = req.headers.get("authorization")
  const querySecret = searchParams.get("secret")
  if (process.env.CRON_SECRET) {
    const validHeader = authHeader === `Bearer ${process.env.CRON_SECRET}`
    const validQuery = querySecret === process.env.CRON_SECRET
    if (!validHeader && !validQuery) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  if (!resend) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 })
  }

  const users = await db.user.findMany({
    where: { emailNotifications: true, email: { not: null } },
    select: { id: true, name: true, email: true, createdAt: true },
  })

  if (users.length === 0) {
    return NextResponse.json({ sent: 0, message: "No users with email notifications enabled" })
  }

  const quote = getDailyQuote()
  const today = new Date()
  const sent: string[] = []
  const failed: string[] = []

  for (const user of users) {
    try {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const sixtyDaysAgo = new Date(today)
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

      const [pendingTasks, activeGoals, focusLogs, completedTasksForStreak, focusLogsForStreak] =
        await Promise.all([
          db.task.findMany({
            where: { userId: user.id, completed: false },
            orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
            take: 1,
          }),
          db.goal.findMany({
            where: { userId: user.id, status: "ACTIVE" },
            select: { title: true, progress: true },
            take: 3,
          }),
          db.focusLog.findMany({
            where: { userId: user.id, createdAt: { gte: weekAgo } },
            select: { duration: true },
          }),
          db.task.findMany({
            where: { userId: user.id, completed: true, updatedAt: { gte: sixtyDaysAgo } },
            select: { updatedAt: true },
          }),
          db.focusLog.findMany({
            where: { userId: user.id, createdAt: { gte: sixtyDaysAgo } },
            select: { createdAt: true },
          }),
        ])

      // Compute streak
      const activityDates = new Set<string>()
      completedTasksForStreak.forEach((t) => activityDates.add(t.updatedAt.toISOString().slice(0, 10)))
      focusLogsForStreak.forEach((f) => activityDates.add(f.createdAt.toISOString().slice(0, 10)))

      let streak = 0
      for (let i = 0; i < 60; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        if (activityDates.has(d.toISOString().slice(0, 10))) streak++
        else break
      }

      const mit = pendingTasks[0]?.title ?? "Set your focus for today in Cortex"
      const weeklyFocusMin = focusLogs.reduce((s, l) => s + l.duration, 0)
      const firstName = user.name?.split(" ")[0] ?? "there"

      // Check if 30-day report should be sent
      const daysSinceJoined = Math.floor((today.getTime() - user.createdAt.getTime()) / 86400000)

      if (daysSinceJoined >= 30 && daysSinceJoined <= 31) {
        // Send 30-day report instead
        const [allCompleted, allGoals] = await Promise.all([
          db.task.count({ where: { userId: user.id, completed: true } }),
          db.goal.findMany({ where: { userId: user.id }, select: { status: true, title: true } }),
        ])
        const allFocusLogs = await db.focusLog.findMany({
          where: { userId: user.id },
          select: { duration: true },
        })
        const totalFocusHours = Math.round(
          allFocusLogs.reduce((s, l) => s + l.duration, 0) / 60
        )

        await resend.emails.send({
          from: FROM_EMAIL,
          to: user.email!,
          subject: `Your 30-day Cortex report 🎉 — ${firstName}, here's what you built`,
          html: progressReportHtml({
            name: firstName,
            tasksCompleted: allCompleted,
            goalsCreated: allGoals.length,
            goalsCompleted: allGoals.filter((g) => g.status === "COMPLETED").length,
            focusHours: totalFocusHours,
            streak,
            topGoal: activeGoals[0]?.title ?? null,
          }),
        })
      } else {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: user.email!,
          subject: `${streak > 0 ? `🔥 Day ${streak} — ` : ""}Good morning, ${firstName} — your focus for today`,
          html: morningBriefHtml({ name: firstName, streak, mit, goals: activeGoals, weeklyFocusMin, quote }),
        })
      }

      sent.push(user.email!)
    } catch (err) {
      console.error(`Failed to send to ${user.email}:`, err)
      failed.push(user.email!)
    }
  }

  return NextResponse.json({ sent: sent.length, failed: failed.length, emails: sent })
}
