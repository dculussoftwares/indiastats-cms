import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { ElectionDataTable } from '@/components/ElectionDataTable'

export const metadata: Metadata = {
  title: 'Tamil Nadu Election Data | IndiaStats',
  description:
    'Explore comprehensive Tamil Nadu election data. Filter by year, district, and party. Download as Excel.',
  openGraph: {
    title: 'Tamil Nadu Election Data | IndiaStats',
    description:
      'Explore comprehensive Tamil Nadu election data. Filter by year, district, and party. Download as Excel.',
  },
}

export default function ElectionDataPage() {
  return (
    <main className="container py-8 min-h-screen">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Tamil Nadu Election Data</h1>
          <p className="text-muted-foreground">
            Comprehensive election results from 1952 to 2021. Filter by year, district, or winning
            party. Export data to Excel for your analysis.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading election data...</span>
            </div>
          }
        >
          <ElectionDataTable />
        </Suspense>
      </div>
    </main>
  )
}
