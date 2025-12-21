'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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

interface CasteComparisonTableProps {
  districtName: string
}

const RANK_COLORS = [
  { bg: '#3b82f6', text: 'text-blue-600' }, // Rank 1
  { bg: '#10b981', text: 'text-emerald-600' }, // Rank 2
  { bg: '#f59e0b', text: 'text-amber-600' }, // Rank 3
  { bg: '#ef4444', text: 'text-red-500' }, // Rank 4
  { bg: '#8b5cf6', text: 'text-violet-600' }, // Rank 5
]

export function CasteComparisonTable({ districtName }: CasteComparisonTableProps) {
  const [assemblies, setAssemblies] = React.useState<CasteData[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Extract English district name if bilingual
        const englishName = districtName.includes('/')
          ? districtName.split('/')[1].trim()
          : districtName

        const response = await fetch(
          `/api/caste-data?districtName=${encodeURIComponent(englishName)}`,
        )
        if (response.ok) {
          const result = await response.json()
          setAssemblies(result.assemblies || [])
        } else {
          setError('Caste data not available')
        }
      } catch {
        setError('Failed to load caste data')
      } finally {
        setIsLoading(false)
      }
    }

    if (districtName) {
      fetchData()
    }
  }, [districtName])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || assemblies.length === 0) {
    return null
  }

  // Helper to extract English name
  const getEnglishName = (name: string) => {
    if (name.includes('/')) {
      return name.split('/')[1].trim()
    }
    return name
  }

  // Helper to render caste cell with Shadcn tooltip
  const renderCasteCell = (caste: string | null, percentage: number | null, colorIndex: number) => {
    if (!caste) return <span className="text-gray-400">-</span>

    const color = RANK_COLORS[colorIndex]

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-help">
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: color.bg }}
            />
            <span className="truncate max-w-[80px] text-xs">{caste}</span>
            <span className={`${color.text} font-bold text-xs flex-shrink-0`}>{percentage}%</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="font-semibold">{caste}</p>
          <p className="text-xs text-muted-foreground">{percentage}% of population</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Caste Demographics by Assembly
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                    Assembly
                  </th>
                  <th className="text-left py-2 px-2 font-semibold text-blue-600">1st</th>
                  <th className="text-left py-2 px-2 font-semibold text-emerald-600">2nd</th>
                  <th className="text-left py-2 px-2 font-semibold text-amber-600">3rd</th>
                  <th className="text-left py-2 px-2 font-semibold text-red-500">4th</th>
                  <th className="text-left py-2 px-2 font-semibold text-violet-600">5th</th>
                </tr>
              </thead>
              <tbody>
                {assemblies.map((assembly) => (
                  <tr
                    key={assembly.assemblyId}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-2 px-2 font-medium text-xs">
                      {getEnglishName(assembly.assemblyName)}
                    </td>
                    <td className="py-2 px-2">
                      {renderCasteCell(assembly.rank1Caste, assembly.rank1Percentage, 0)}
                    </td>
                    <td className="py-2 px-2">
                      {renderCasteCell(assembly.rank2Caste, assembly.rank2Percentage, 1)}
                    </td>
                    <td className="py-2 px-2">
                      {renderCasteCell(assembly.rank3Caste, assembly.rank3Percentage, 2)}
                    </td>
                    <td className="py-2 px-2">
                      {renderCasteCell(assembly.rank4Caste, assembly.rank4Percentage, 3)}
                    </td>
                    <td className="py-2 px-2">
                      {renderCasteCell(assembly.rank5Caste, assembly.rank5Percentage, 4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Hover over any caste to see full name. Based on estimated census data for{' '}
            {assemblies.length} assemblies.
          </p>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

export default CasteComparisonTable
