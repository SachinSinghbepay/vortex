import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const goals = await db.goal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(goals)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title, description, deadline, priority, type } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 })

  const goal = await db.goal.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      deadline: deadline ? new Date(deadline) : null,
      priority: priority || "MEDIUM",
      type: type || "PERSONAL",
      userId: session.user.id,
    },
  })

  revalidateTag(`goals-${session.user.id}`, "max")
  return NextResponse.json(goal, { status: 201 })
}
