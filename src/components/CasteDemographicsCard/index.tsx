'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'

interface CasteData {
  assemblyId: string
  assemblyName: string
  rank1Caste: string | null
  rank1Percentage: number | null
  rank2Caste: string | null
  rank2Percentage: number | null
  rank3Caste: string | null
  rank3Percentage: number | null
  rank4Caste: string | null
  rank4Percentage: number | null
  rank5Caste: string | null
  rank5Percentage: number | null
}

interface CasteDemographicsCardProps {
  assemblyId: string
}

// Colors for different castes
const CASTE_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#6b7280', // gray (others)
]

export function CasteDemographicsCard({ assemblyId }: CasteDemographicsCardProps) {
  const [data, setData] = React.useState<CasteData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/caste-data?assemblyId=${assemblyId}`)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        } else {
          setError('Caste data not available')
        }
      } catch {
        setError('Failed to load caste data')
      } finally {
        setIsLoading(false)
      }
    }

    if (assemblyId) {
      fetchData()
    }
  }, [assemblyId])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/5" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return null
  }

  // Build caste entries
  const castes = [
    { name: data.rank1Caste, percentage: data.rank1Percentage },
    { name: data.rank2Caste, percentage: data.rank2Percentage },
    { name: data.rank3Caste, percentage: data.rank3Percentage },
    { name: data.rank4Caste, percentage: data.rank4Percentage },
    { name: data.rank5Caste, percentage: data.rank5Percentage },
  ].filter((c) => c.name && c.percentage)

  // Calculate others
  const totalKnown = castes.reduce((sum, c) => sum + (c.percentage || 0), 0)
  const others = 100 - totalKnown

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          Caste Demographics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {castes.map((caste, index) => (
          <div key={caste.name} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                {caste.name}
              </span>
              <span className="font-bold" style={{ color: CASTE_COLORS[index] }}>
                {caste.percentage}%
              </span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${caste.percentage}%`,
                  backgroundColor: CASTE_COLORS[index],
                }}
              />
            </div>
          </div>
        ))}

        {/* Others */}
        {others > 0 && (
          <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-500">Others</span>
              <span className="font-bold text-gray-500">{others.toFixed(0)}%</span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gray-400" style={{ width: `${others}%` }} />
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">Based on estimated caste census data</p>
      </CardContent>
    </Card>
  )
}

export default CasteDemographicsCard
