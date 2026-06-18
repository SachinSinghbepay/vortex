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

  const serialized = tasks.map(({ startDate, dueDate, recurrenceEndDate, createdAt, updatedAt, ...rest }) => ({
    ...rest,
    startDate: startDate?.toISOString() ?? null,
    dueDate: dueDate?.toISOString() ?? null,
    recurrenceEndDate: recurrenceEndDate?.toISOString() ?? null,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  }))

  return <TasksClient initialTasks={serialized} goals={goals} />
}
