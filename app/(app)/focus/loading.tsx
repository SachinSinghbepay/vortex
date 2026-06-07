import { Skeleton } from "@/components/ui/skeleton"

export default function FocusLoading() {
  return (
    <div className="min-h-full p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Stats strip */}
      <div className="mb-8 grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/6 bg-white/2 p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Timer skeleton */}
        <div className="flex flex-col items-center rounded-2xl border border-white/6 bg-white/2 p-8 gap-6">
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-14" />
            ))}
          </div>
          <Skeleton className="h-32 w-32 rounded-full" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Logs skeleton */}
        <div className="rounded-2xl border border-white/6 bg-white/2 p-6 space-y-3">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
