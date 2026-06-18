/**
 * ElectionAnalysisMap — SSR-safe re-export.
 *
 * The actual implementation lives in MapInner.tsx and is loaded exclusively
 * on the client via dynamic(..., { ssr: false }), which prevents React hydration
 * mismatches caused by Leaflet's browser-only APIs.
 */
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type { ElectionAnalysisMapProps } from './MapInner'

export type { ElectionAnalysisMapProps }

// Skeleton shown while the map JS bundle loads
function MapSkeleton() {
  return (
    <div className="relative rounded border border-border overflow-hidden bg-white dark:bg-gray-950">
      <Skeleton className="h-[480px] w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Loading map…</span>
      </Skeleton>
      <Skeleton className="border-t border-border px-4 py-3 h-10 bg-gray-50 dark:bg-gray-900" />
      <Skeleton className="border-t border-border px-4 py-3 h-12 bg-red-50/50 dark:bg-red-950/10" />
    </div>
  )
}

export const ElectionAnalysisMap = dynamic(
  () => import('./MapInner').then((m) => m.ElectionAnalysisMapInner),
  {
    ssr: false,
    loading: MapSkeleton,
  },
)

export default ElectionAnalysisMap
