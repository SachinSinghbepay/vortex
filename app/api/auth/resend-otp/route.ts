import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resend, FROM_EMAIL } from "@/lib/resend"
import { otpEmailHtml } from "@/lib/email-templates"

export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

  const user = await db.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ error: "No account found" }, { status: 404 })
  if (user.emailVerified) return NextResponse.json({ error: "Email already verified" }, { status: 400 })

  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  await db.verificationToken.deleteMany({ where: { identifier: email } })
  await db.verificationToken.create({
    data: {
      identifier: email,
      token: otp,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    },
  })

  if (resend) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${otp} is your Cortex verification code`,
      html: otpEmailHtml(user.name?.split(" ")[0] ?? "there", otp),
    })
  }

  return NextResponse.json({ message: "Code sent" })
}
