import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const analysis = await db.aIAnalysis.findFirst({
    where: {
      goalId: id,
      userId: session.user.id,
      type: { in: ["GOAL_DECOMPOSITION", "STUDY_PLAN"] },
    },
    orderBy: { createdAt: "desc" },
  })

  if (!analysis) return NextResponse.json({ error: "No analysis found" }, { status: 404 })

  return NextResponse.json({ _type: analysis.type, ...JSON.parse(analysis.response) })
}
