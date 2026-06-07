import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getActiveTasks, getFocusLogs } from "@/lib/queries"
import { FocusClient } from "@/components/focus/focus-client"

export default async function FocusPage() {
  const session = await getServerSession(authOptions)
  const userId = session!.user.id

  const [tasks, logs] = await Promise.all([
    getActiveTasks(userId),
    getFocusLogs(userId),
  ])

  const serialized = logs.map((l) => ({ ...l, createdAt: new Date(l.createdAt).toISOString() }))

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const weekLogs = serialized.filter((l) => new Date(l.createdAt) < todayStart)
  const weeklyMinutes = weekLogs.reduce((s, l) => s + l.duration, 0)

  return (
    <FocusClient
      tasks={tasks}
      recentLogs={serialized}
      weeklyMinutes={weeklyMinutes}
      weeklyCount={weekLogs.length}
    />
  )
}
