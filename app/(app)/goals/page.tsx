import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getGoals, getGoalAnalyses } from "@/lib/queries"
import { GoalsClient } from "@/components/goals/goals-client"

export default async function GoalsPage() {
  const session = await getServerSession(authOptions)
  const userId = session!.user.id

  const [goals, analyses] = await Promise.all([
    getGoals(userId),
    getGoalAnalyses(userId),
  ])

  const analysedGoalIds = new Set(analyses.map((a) => a.goalId!))

  const serialized = goals.map((g) => ({
    ...g,
    deadline: g.deadline ? new Date(g.deadline).toISOString() : null,
    createdAt: new Date(g.createdAt).toISOString(),
    updatedAt: new Date(g.updatedAt).toISOString(),
    hasAnalysis: analysedGoalIds.has(g.id),
  }))

  return <GoalsClient initialGoals={serialized} />
}
