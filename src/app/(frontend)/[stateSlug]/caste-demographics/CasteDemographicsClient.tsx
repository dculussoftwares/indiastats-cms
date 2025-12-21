'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ArrowLeft, Search, Users, TrendingUp, MapPin, Filter } from 'lucide-react'

interface CasteData {
  id: string
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

const RANK_COLORS = [
  { bg: '#3b82f6', text: 'text-blue-600' },
  { bg: '#10b981', text: 'text-emerald-600' },
  { bg: '#f59e0b', text: 'text-amber-600' },
  { bg: '#ef4444', text: 'text-red-500' },
  { bg: '#8b5cf6', text: 'text-violet-600' },
]

interface CasteDemographicsClientProps {
  stateSlug: string
}

export function CasteDemographicsClient({ stateSlug }: CasteDemographicsClientProps) {
  const [allData, setAllData] = React.useState<CasteData[]>([])
  const [filteredData, setFilteredData] = React.useState<CasteData[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [casteFilter, setCasteFilter] = React.useState('')
  const [sortBy, setSortBy] = React.useState<'assembly' | 'percentage'>('assembly')

  // Statistics
  const [stats, setStats] = React.useState<{
    totalAssemblies: number
    topCastes: Array<{ caste: string; count: number; avgPercentage: number }>
    uniqueCastes: number
  } | null>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/caste-data?all=true')
        if (response.ok) {
          const result = await response.json()
          setAllData(result.assemblies || [])
          setFilteredData(result.assemblies || [])

          // Calculate statistics
          const casteCount: Record<string, { count: number; totalPercentage: number }> = {}
          result.assemblies.forEach((a: CasteData) => {
            const castes = [
              { caste: a.rank1Caste, pct: a.rank1Percentage },
              { caste: a.rank2Caste, pct: a.rank2Percentage },
              { caste: a.rank3Caste, pct: a.rank3Percentage },
              { caste: a.rank4Caste, pct: a.rank4Percentage },
              { caste: a.rank5Caste, pct: a.rank5Percentage },
            ]
            castes.forEach(({ caste, pct }) => {
              if (caste && pct) {
                if (!casteCount[caste]) {
                  casteCount[caste] = { count: 0, totalPercentage: 0 }
                }
                casteCount[caste].count++
                casteCount[caste].totalPercentage += pct
              }
            })
          })

          const topCastes = Object.entries(casteCount)
            .map(([caste, data]) => ({
              caste,
              count: data.count,
              avgPercentage: Math.round(data.totalPercentage / data.count),
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)

          setStats({
            totalAssemblies: result.assemblies.length,
            topCastes,
            uniqueCastes: Object.keys(casteCount).length,
          })
        }
      } catch (error) {
        console.error('Failed to fetch caste data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter data when search or caste filter changes
  React.useEffect(() => {
    let filtered = allData

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.assemblyName.toLowerCase().includes(query) ||
          a.assemblyId.toLowerCase().includes(query),
      )
    }

    if (casteFilter) {
      const caste = casteFilter.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.rank1Caste?.toLowerCase().includes(caste) ||
          a.rank2Caste?.toLowerCase().includes(caste) ||
          a.rank3Caste?.toLowerCase().includes(caste) ||
          a.rank4Caste?.toLowerCase().includes(caste) ||
          a.rank5Caste?.toLowerCase().includes(caste),
      )
    }

    // Sort
    if (sortBy === 'percentage') {
      filtered = [...filtered].sort((a, b) => (b.rank1Percentage || 0) - (a.rank1Percentage || 0))
    } else {
      filtered = [...filtered].sort((a, b) => a.assemblyName.localeCompare(b.assemblyName))
    }

    setFilteredData(filtered)
  }, [allData, searchQuery, casteFilter, sortBy])

  const getEnglishName = (name: string) => {
    if (name.includes('/')) {
      return name.split('/')[1].trim()
    }
    return name
  }

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

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="container py-8">
        {/* Back Button */}
        <div className="mb-4">
          <Link href={`/${stateSlug}/dashboard`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Hero Header */}
        <div className="mb-8">
          <div className="border-l-4 border-red-600 pl-4 py-2">
            <h1 className="text-3xl font-bold text-foreground">Caste Demographics</h1>
            <p className="text-muted-foreground text-sm">
              Explore caste composition across all 234 Tamil Nadu assembly constituencies
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <section className="mb-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-2.5 rounded-lg">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalAssemblies}</p>
                      <p className="text-xs text-muted-foreground">Total Assemblies</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-lg">
                      <Users className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.uniqueCastes}</p>
                      <p className="text-xs text-muted-foreground">Unique Communities</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.topCastes[0]?.caste || '-'}</p>
                      <p className="text-xs text-muted-foreground">
                        Most Represented ({stats.topCastes[0]?.count} constituencies)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Top 10 Castes */}
        {stats && (
          <section className="mb-8">
            <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
              Top 10 Communities by Presence
            </h2>
            <Card>
              <CardContent className="pt-4">
                <div className="grid gap-2">
                  {stats.topCastes.map((caste, idx) => (
                    <div
                      key={caste.caste}
                      className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-500 w-6">{idx + 1}</span>
                        <button
                          onClick={() => setCasteFilter(caste.caste)}
                          className="text-sm font-medium hover:text-blue-600 hover:underline"
                        >
                          {caste.caste}
                        </button>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-muted-foreground">{caste.count} assemblies</span>
                        <span className="font-bold text-blue-600">Avg {caste.avgPercentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Search and Filter */}
        <section className="mb-6">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            All Assemblies ({filteredData.length})
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by assembly name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Filter by caste name..."
                value={casteFilter}
                onChange={(e) => setCasteFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'assembly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('assembly')}
              >
                A-Z
              </Button>
              <Button
                variant={sortBy === 'percentage' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('percentage')}
              >
                By %
              </Button>
              {casteFilter && (
                <Button variant="ghost" size="sm" onClick={() => setCasteFilter('')}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Full Table */}
        <Card>
          <CardContent className="pt-4">
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
                    <th className="hidden md:table-cell text-left py-2 px-2 font-semibold text-red-500">
                      4th
                    </th>
                    <th className="hidden md:table-cell text-left py-2 px-2 font-semibold text-violet-600">
                      5th
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((assembly, index) => (
                    <tr
                      key={assembly.id || `${assembly.assemblyId}-${index}`}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-2 px-2 font-medium text-xs">
                        <Link
                          href={`/${stateSlug}/assembly-map?ac=${assembly.assemblyId.replace('ac', '')}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {getEnglishName(assembly.assemblyName)}
                        </Link>
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
                      <td className="hidden md:table-cell py-2 px-2">
                        {renderCasteCell(assembly.rank4Caste, assembly.rank4Percentage, 3)}
                      </td>
                      <td className="hidden md:table-cell py-2 px-2">
                        {renderCasteCell(assembly.rank5Caste, assembly.rank5Percentage, 4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No assemblies found matching your search criteria.
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-4">
              Hover over any caste to see full name. Based on estimated census data.
            </p>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
