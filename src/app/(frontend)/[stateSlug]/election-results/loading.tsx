import { Skeleton } from '@/components/ui/skeleton'

export default function ElectionResultsLoading() {
  return (
    <div className="relative h-screen overflow-hidden bg-background flex flex-col">
      {/* Scoreboard header skeleton */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-2 ml-auto">
          <Skeleton className="h-7 w-20 rounded" />
          <Skeleton className="h-7 w-20 rounded" />
          <Skeleton className="h-7 w-20 rounded" />
        </div>
      </div>
      {/* Map area skeleton */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Skeleton className="h-[60vh] w-[80vw] rounded-lg mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    </div>
  )
}
