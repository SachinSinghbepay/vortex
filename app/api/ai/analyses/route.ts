import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { type, prompt, response, goalId } = await req.json()
  if (!type || !response) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const analysis = await db.aIAnalysis.create({
    data: {
      type,
      prompt: prompt ?? "",
      response: typeof response === "string" ? response : JSON.stringify(response),
      goalId: goalId ?? null,
      userId: session.user.id,
    },
  })

  return NextResponse.json(analysis)
}
