import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { SettingsClient } from "@/components/settings/settings-client"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  const user = await db.user.findUnique({
    where: { id: session!.user.id },
    select: { id: true, name: true, email: true, plan: true, createdAt: true, emailNotifications: true },
  })

  return <SettingsClient user={{ ...user!, createdAt: user!.createdAt.toISOString() }} />
}
