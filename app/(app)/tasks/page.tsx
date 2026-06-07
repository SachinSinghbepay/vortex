import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTasks, getActiveGoals } from "@/lib/queries"
import { TasksClient } from "@/components/tasks/tasks-client"

export default async function TasksPage() {
  const session = await getServerSession(authOptions)
  const userId = session!.user.id

  const [tasks, goals] = await Promise.all([
    getTasks(userId),
    getActiveGoals(userId),
  ])

  const serialized = tasks.map((t) => ({
    ...t,
    startDate: t.startDate ? new Date(t.startDate).toISOString() : null,
    dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
    createdAt: new Date(t.createdAt).toISOString(),
    updatedAt: new Date(t.updatedAt).toISOString(),
  }))

  return <TasksClient initialTasks={serialized} goals={goals} />
}
