import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const logs = await db.focusLog.findMany({
    where: { userId: session.user.id, createdAt: { gte: weekAgo } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(logs)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { energy, focus, stress, duration, taskTitle, notes } = await req.json()

  const log = await db.focusLog.create({
    data: {
      energy: Math.min(10, Math.max(1, energy)),
      focus: Math.min(10, Math.max(1, focus)),
      stress: Math.min(10, Math.max(1, stress)),
      duration: duration ?? 25,
      taskTitle: taskTitle || null,
      notes: notes || null,
      userId: session.user.id,
    },
  })

  revalidateTag(`focus-${session.user.id}`, "max")
  return NextResponse.json(log, { status: 201 })
}
