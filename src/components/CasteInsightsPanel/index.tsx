'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, MapPin } from 'lucide-react'

// Caste color palette (same as AssemblyMap)
const CASTE_COLORS: Record<string, string> = {
  Vanniars: '#3b82f6',
  Muslims: '#8b5cf6',
  Paraiyar: '#06b6d4',
  'Adhi dravidar': '#ec4899',
  'Nadar (Non Christian)': '#f43f5e',
  'Nadar (Christian)': '#f472b6',
  Nadar: '#ef4444',
  'Vellala Gounders': '#6366f1',
  Vellalar: '#818cf8',
  Mudaliyar: '#a855f7',
  Mukulathor: '#0ea5e9',
  Meenavar: '#7c3aed',
  Udayar: '#2563eb',
  'Nayar/Malayali': '#0891b2',
  Chettiar: '#9333ea',
  Arunthathiyar: '#e11d48',
  'Devendra kula vellalar': '#1d4ed8',
  Mutharaiyar: '#7e22ce',
  Naidu: '#0369a1',
  Okaligar: '#be185d',
  Padugar: '#4338ca',
  Pallar: '#0f766e',
  Pillaimar: '#6d28d9',
  'Scheduled tribes': '#854d0e',
  Sourashtra: '#9f1239',
  Ambalam: '#1e40af',
  _default: '#64748b',
}

function getCasteColor(casteName: string | null): string {
  if (!casteName) return CASTE_COLORS['_default']
  return CASTE_COLORS[casteName] || CASTE_COLORS['_default']
}

interface CasteInsightsPanelProps {
  isVisible: boolean
  casteDataMap: Record<
    string,
    {
      caste: string | null
      percentage: number
      rank2Caste?: string | null
      rank2Percentage?: number
      rank3Caste?: string | null
      rank3Percentage?: number
      rank4Caste?: string | null
      rank4Percentage?: number
      rank5Caste?: string | null
      rank5Percentage?: number
    }
  >
  onCasteClick?: (casteName: string) => void
  selectedCaste?: string | null
}

export function CasteInsightsPanel({
  isVisible,
  casteDataMap,
  onCasteClick,
  selectedCaste,
}: CasteInsightsPanelProps) {
  const casteStats = React.useMemo(() => {
    if (!casteDataMap || Object.keys(casteDataMap).length === 0) return []

    // Calculate stats: count of assemblies where each caste is dominant
    const casteCount: Record<string, { count: number; totalPercentage: number }> = {}

    Object.values(casteDataMap).forEach((data) => {
      if (data.caste) {
        if (!casteCount[data.caste]) {
          casteCount[data.caste] = { count: 0, totalPercentage: 0 }
        }
        casteCount[data.caste].count++
        casteCount[data.caste].totalPercentage += data.percentage || 0
      }
    })

    return Object.entries(casteCount)
      .map(([caste, stats]) => ({
        caste,
        count: stats.count,
        avgPercentage: Math.round(stats.totalPercentage / stats.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [casteDataMap])

  if (!isVisible) return null

  const totalAssemblies = Object.keys(casteDataMap).length

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Caste Demographics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            {totalAssemblies} assemblies with {casteStats.length} unique dominant castes
          </span>
        </div>

        {/* Top 10 Dominant Castes */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Top Dominant Castes by Assemblies</h4>
          <div className="space-y-1.5">
            {casteStats.map((casteData, idx) => {
              const color = getCasteColor(casteData.caste)
              const isSelected = selectedCaste === casteData.caste
              const percentage = (casteData.count / totalAssemblies) * 100

              return (
                <button
                  key={casteData.caste}
                  onClick={() => onCasteClick?.(casteData.caste)}
                  className={`w-full text-left transition-all ${
                    isSelected
                      ? 'ring-2 ring-primary ring-offset-1'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm p-2 rounded">
                    <span className="text-xs font-bold text-gray-400 w-5">{idx + 1}</span>
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="flex-1 font-medium truncate" title={casteData.caste}>
                      {casteData.caste}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {casteData.count} ({Math.round(percentage)}%)
                    </span>
                    <span className="text-xs font-semibold text-primary shrink-0">
                      ~{casteData.avgPercentage}%
                    </span>
                  </div>
                  {/* Mini progress bar */}
                  <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mx-2 mb-1">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="border-t pt-3 text-xs text-muted-foreground">
          <p>
            <strong>Count</strong> = Assemblies where this caste is dominant
          </p>
          <p>
            <strong>~%</strong> = Average population share when dominant
          </p>
          {onCasteClick && <p className="text-primary mt-1">Click a caste to filter the map</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export default CasteInsightsPanel
