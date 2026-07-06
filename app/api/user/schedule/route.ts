import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { schedule: true },
  })

  try {
    return NextResponse.json(JSON.parse(user?.schedule ?? "{}"))
  } catch {
    return NextResponse.json({})
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  await db.user.update({
    where: { id: session.user.id },
    data: { schedule: JSON.stringify(body) },
  })

  return NextResponse.json({ ok: true })
}
