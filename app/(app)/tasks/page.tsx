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
    startDate: startDate ? new Date(startDate).toISOString() : null,
    dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : null,
    createdAt: new Date(createdAt).toISOString(),
    updatedAt: new Date(updatedAt).toISOString(),
  }))

  return <TasksClient initialTasks={serialized} goals={goals} />
}
