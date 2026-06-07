import { unstable_cache } from "next/cache"
import { db } from "./db"

const FIVE_MIN = 300

// ─── Goals ────────────────────────────────────────────────────────────────────

export const getGoals = (userId: string) =>
  unstable_cache(
    () => db.goal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    ["goals", userId],
    { tags: [`goals-${userId}`], revalidate: FIVE_MIN }
  )()

export const getActiveGoals = (userId: string) =>
  unstable_cache(
    () => db.goal.findMany({
      where: { userId, status: "ACTIVE" },
      select: { id: true, title: true },
    }),
    ["active-goals", userId],
    { tags: [`goals-${userId}`], revalidate: FIVE_MIN }
  )()

export const getGoalAnalyses = (userId: string) =>
  unstable_cache(
    () => db.aIAnalysis.findMany({
      where: { userId, goalId: { not: null }, type: { in: ["GOAL_DECOMPOSITION", "STUDY_PLAN"] } },
      select: { goalId: true },
      distinct: ["goalId"],
    }),
    ["goal-analyses", userId],
    { tags: [`goals-${userId}`], revalidate: FIVE_MIN }
  )()

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const getTasks = (userId: string) =>
  unstable_cache(
    () => db.task.findMany({
      where: { userId },
      include: { goal: { select: { id: true, title: true } } },
      orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
    }),
    ["tasks", userId],
    { tags: [`tasks-${userId}`], revalidate: FIVE_MIN }
  )()

export const getActiveTasks = (userId: string) =>
  unstable_cache(
    () => db.task.findMany({
      where: { userId, completed: false },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    ["active-tasks", userId],
    { tags: [`tasks-${userId}`], revalidate: FIVE_MIN }
  )()

export const getAllTasksAnalytics = (userId: string) =>
  unstable_cache(
    () => db.task.findMany({
      where: { userId },
      select: { id: true, completed: true, goalId: true, updatedAt: true, dueDate: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    ["tasks-analytics", userId],
    { tags: [`tasks-${userId}`], revalidate: FIVE_MIN }
  )()

// ─── Focus ────────────────────────────────────────────────────────────────────

export const getFocusLogs = (userId: string) =>
  unstable_cache(
    () => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return db.focusLog.findMany({
        where: { userId, createdAt: { gte: weekAgo } },
        orderBy: { createdAt: "desc" },
      })
    },
    ["focus-logs", userId],
    { tags: [`focus-${userId}`], revalidate: FIVE_MIN }
  )()

export const getFocusLogsAnalytics = (userId: string) =>
  unstable_cache(
    () => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return db.focusLog.findMany({
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: "desc" },
      })
    },
    ["focus-logs-analytics", userId],
    { tags: [`focus-${userId}`], revalidate: FIVE_MIN }
  )()

export const getAllGoalsAnalytics = (userId: string) =>
  unstable_cache(
    () => db.goal.findMany({
      where: { userId },
      select: { id: true, title: true, progress: true, status: true, type: true },
      orderBy: { createdAt: "desc" },
    }),
    ["goals-analytics", userId],
    { tags: [`goals-${userId}`], revalidate: FIVE_MIN }
  )()
