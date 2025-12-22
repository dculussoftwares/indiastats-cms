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
  casteData: CasteData | null
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

export function CasteDemographicsCard({ casteData }: CasteDemographicsCardProps) {
  // Pure display component - no fetch logic
  if (!casteData) {
    return null
  }

  // Build caste entries
  const castes = [
    { name: casteData.rank1Caste, percentage: casteData.rank1Percentage },
    { name: casteData.rank2Caste, percentage: casteData.rank2Percentage },
    { name: casteData.rank3Caste, percentage: casteData.rank3Percentage },
    { name: casteData.rank4Caste, percentage: casteData.rank4Percentage },
    { name: casteData.rank5Caste, percentage: casteData.rank5Percentage },
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
