import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="min-h-full p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile card */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
          <Skeleton className="h-4 w-16" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>

        {/* Notifications card */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-full" />
          <div className="flex items-center justify-between pt-1">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        </div>

        {/* Plan card */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
          <Skeleton className="h-4 w-12" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] p-5 space-y-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-20" />
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-3 w-full" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
