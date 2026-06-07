import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/sign-in")
  return <AppShell user={{ ...session.user, plan: session.user.plan }}>{children}</AppShell>
}
