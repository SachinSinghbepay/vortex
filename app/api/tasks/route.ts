import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const tasks = await db.task.findMany({
    where: { userId: session.user.id },
    include: { goal: { select: { id: true, title: true } } },
    orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
  })

  return NextResponse.json(tasks)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title, priority, dueDate, startDate, category, goalId, recurrence, recurrenceEndDate } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 })

  const task = await db.task.create({
    data: {
      title: title.trim(),
      priority: priority || "MEDIUM",
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      category: category || null,
      goalId: goalId || null,
      recurrence: recurrence || "NONE",
      recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
      userId: session.user.id,
    },
    include: { goal: { select: { id: true, title: true } } },
  })

  revalidateTag(`tasks-${session.user.id}`, "max")
  return NextResponse.json(task, { status: 201 })
}
