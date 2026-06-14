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

  await db.task.updateMany({
    where: { id, userId: session.user.id },
    data: {
      ...(body.completed !== undefined && { completed: body.completed }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.dueDate !== undefined && {
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      }),
      ...(body.recurrenceEndDate !== undefined && {
        recurrenceEndDate: body.recurrenceEndDate ? new Date(body.recurrenceEndDate) : null,
      }),
    },
  })

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
