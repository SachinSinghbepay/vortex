import { redirect } from "next/navigation"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")

  if (!token) redirect("/sign-in?error=invalid-token")

  const record = await db.verificationToken.findUnique({ where: { token: token! } })

  if (!record) redirect("/sign-in?error=invalid-token")
  if (record.expires < new Date()) redirect("/sign-in?error=token-expired")

  await db.user.update({
    where: { email: record.identifier },
    data: { emailVerified: new Date() },
  })

  await db.verificationToken.delete({ where: { token: token! } })

  redirect("/dashboard?verified=1")
}
