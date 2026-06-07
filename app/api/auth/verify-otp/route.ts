import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const { email, otp } = await req.json()

  if (!email || !otp)
    return NextResponse.json({ error: "Email and code required" }, { status: 400 })

  const record = await db.verificationToken.findFirst({
    where: { identifier: email },
  })

  if (!record || record.token !== otp)
    return NextResponse.json({ error: "Invalid code" }, { status: 400 })

  if (record.expires < new Date())
    return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 400 })

  // Mark email as verified
  await db.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  })

  // Clean up token
  await db.verificationToken.deleteMany({ where: { identifier: email } })

  return NextResponse.json({ message: "Email verified" })
}
