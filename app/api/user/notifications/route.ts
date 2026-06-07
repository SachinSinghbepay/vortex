import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { emailNotifications } = await req.json()

  await db.user.update({
    where: { id: session.user.id },
    data: { emailNotifications },
  })

  return NextResponse.json({ emailNotifications })
}
