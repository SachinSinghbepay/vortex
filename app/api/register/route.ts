import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { resend, FROM_EMAIL } from "@/lib/resend"
import { otpEmailHtml } from "@/lib/email-templates"

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function sendOTP(email: string, name: string) {
  const otp = generateOTP()

  // Remove any existing tokens for this email
  await db.verificationToken.deleteMany({ where: { identifier: email } })

  // Store new OTP (expires in 10 minutes)
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
      html: otpEmailHtml(name.split(" ")[0], otp),
    })
  }
}

export async function POST(req: Request) {
  const { name, email, password } = await req.json()

  if (!name || !email || !password)
    return NextResponse.json({ error: "All fields are required" }, { status: 400 })

  if (password.length < 8)
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })

  const existing = await db.user.findUnique({ where: { email } })

  if (existing) {
    if (existing.emailVerified) {
      // Verified account — real "already in use" error
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }
    // Unverified account — update password and resend OTP
    const hashed = await bcrypt.hash(password, 12)
    await db.user.update({
      where: { email },
      data: { name, password: hashed },
    })
    await sendOTP(email, name)
    return NextResponse.json({ message: "Verification code resent" }, { status: 200 })
  }

  // New user
  const hashed = await bcrypt.hash(password, 12)
  await db.user.create({ data: { name, email, password: hashed } })
  await sendOTP(email, name)

  return NextResponse.json({ message: "Account created" }, { status: 201 })
}
