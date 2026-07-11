import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const updateData: Record<string, unknown> = {
    ...(body.completed !== undefined && { completed: body.completed }),
    ...(body.title !== undefined && { title: body.title }),
    ...(body.priority !== undefined && { priority: body.priority }),
    ...(body.category !== undefined && { category: body.category || null }),
    ...(body.goalId !== undefined && { goalId: body.goalId || null }),
    ...(body.recurrence !== undefined && { recurrence: body.recurrence }),
    ...(body.startDate !== undefined && {
      startDate: body.startDate ? new Date(body.startDate) : null,
    }),
    ...(body.dueDate !== undefined && {
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    }),
    ...(body.recurrenceEndDate !== undefined && {
      recurrenceEndDate: body.recurrenceEndDate ? new Date(body.recurrenceEndDate) : null,
    }),
    ...(body.skippedDates !== undefined && { skippedDates: body.skippedDates }),
    ...(body.customDates !== undefined && { customDates: body.customDates }),
    ...(body.completedSections !== undefined && { completedSections: body.completedSections }),
  }

  // completionLogDate: append today's actual date to completionLog (separate from occurrence date)
  if (body.completionLogDate) {
    const current = await db.task.findFirst({
      where: { id, userId: session.user.id },
      select: { completionLog: true },
    })
    if (current) {
      let log: string[] = []
      try { log = JSON.parse(current.completionLog ?? "[]") } catch { /* empty */ }
      if (!log.includes(body.completionLogDate)) log.push(body.completionLogDate)
      updateData.completionLog = JSON.stringify(log)
    }
  }

  await db.task.updateMany({ where: { id, userId: session.user.id }, data: updateData })

  revalidateTag(`tasks-${session.user.id}`, "max")
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.task.deleteMany({ where: { id, userId: session.user.id } })

  revalidateTag(`tasks-${session.user.id}`, "max")
  return NextResponse.json({ ok: true })
}
