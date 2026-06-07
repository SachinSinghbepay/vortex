import { Skeleton } from "@/components/ui/skeleton"

export default function TasksLoading() {
  return (
    <div className="min-h-full p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-1">
        {[48, 56, 64, 72].map((w, i) => (
          <Skeleton key={i} className="h-8" style={{ width: w }} />
        ))}
      </div>

      {/* Task list */}
      <div className="rounded-xl border border-white/[0.06] divide-y divide-white/[0.04]">
        {/* Group header */}
        <div className="px-4 py-2">
          <Skeleton className="h-3 w-16" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="h-4 w-4 flex-shrink-0 rounded-full" />
            <Skeleton className="h-1.5 w-1.5 flex-shrink-0 rounded-full" />
            <Skeleton className="h-4 flex-1" style={{ maxWidth: `${40 + (i % 5) * 10}%` }} />
            <Skeleton className="h-4 w-16 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
