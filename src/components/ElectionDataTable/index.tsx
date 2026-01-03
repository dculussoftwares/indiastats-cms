'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { exportToExcel, flattenElectionDataForExcel } from '@/utilities/excelExport'
import { getPartyColor } from '@/lib/partyColors'
import { Download, ChevronUp, ChevronDown, Loader2 } from 'lucide-react'

interface CandidateData {
  name: string
  party: string
  votes: number
  rank: number
}

interface AssemblyElectionData {
  acName: string
  acNo: number | null
  assemblyId: string
  districtName: string
  electionYear: number
  totalElectors: number | null
  totalVotes: number | null
  pollPercent: number | null
  candidates: CandidateData[]
  margin: number | null
  marginPercent: number | null
}

interface ElectionDataTableResponse {
  data: AssemblyElectionData[]
  filters: {
    districts: string[]
    years: number[]
    parties: string[]
  }
  totalRecords: number
}

type SortField =
  | 'acNo'
  | 'acName'
  | 'districtName'
  | 'electionYear'
  | 'totalElectors'
  | 'totalVotes'
  | 'margin'
  | 'marginPercent'
type SortDirection = 'asc' | 'desc'

export function ElectionDataTable() {
  const [data, setData] = useState<AssemblyElectionData[]>([])
  const [filters, setFilters] = useState<{
    districts: string[]
    years: number[]
    parties: string[]
  }>({ districts: [], years: [], parties: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state - default to latest election year (2021)
  const [selectedYear, setSelectedYear] = useState<string>('2021')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all')
  const [selectedParty, setSelectedParty] = useState<string>('all')

  // Sort state
  const [sortField, setSortField] = useState<SortField>('acNo')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Fetch data on mount and when year filter changes
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (selectedYear !== 'all') {
          params.set('year', selectedYear)
        }
        const response = await fetch(`/api/election-data-table?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch data')
        }
        const result: ElectionDataTableResponse = await response.json()
        setData(result.data)
        setFilters(result.filters)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedYear])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedDistrict, selectedParty, sortField, sortDirection])

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...data]

    // Apply district filter
    if (selectedDistrict !== 'all') {
      filtered = filtered.filter((row) => row.districtName === selectedDistrict)
    }

    // Apply party filter (by winner's party)
    if (selectedParty !== 'all') {
      filtered = filtered.filter(
        (row) => row.candidates.length > 0 && row.candidates[0].party === selectedParty,
      )
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any
      let bVal: any

      switch (sortField) {
        case 'acNo':
          aVal = a.acNo || 0
          bVal = b.acNo || 0
          break
        case 'acName':
          aVal = a.acName.toLowerCase()
          bVal = b.acName.toLowerCase()
          break
        case 'districtName':
          aVal = a.districtName.toLowerCase()
          bVal = b.districtName.toLowerCase()
          break
        case 'electionYear':
          aVal = a.electionYear
          bVal = b.electionYear
          break
        case 'totalElectors':
          aVal = a.totalElectors || 0
          bVal = b.totalElectors || 0
          break
        case 'totalVotes':
          aVal = a.totalVotes || 0
          bVal = b.totalVotes || 0
          break
        case 'margin':
          aVal = a.margin || 0
          bVal = b.margin || 0
          break
        case 'marginPercent':
          aVal = a.marginPercent || 0
          bVal = b.marginPercent || 0
          break
        default:
          aVal = 0
          bVal = 0
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    })

    return filtered
  }, [data, selectedDistrict, selectedParty, sortField, sortDirection])

  // Paginate
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredAndSortedData.slice(start, start + pageSize)
  }, [filteredAndSortedData, currentPage, pageSize])

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize)

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Sort indicator
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ChevronUp className="inline w-4 h-4" />
    ) : (
      <ChevronDown className="inline w-4 h-4" />
    )
  }

  // Handle export
  const handleExport = () => {
    const flatData = flattenElectionDataForExcel(filteredAndSortedData)
    const yearLabel = selectedYear === 'all' ? 'AllYears' : selectedYear
    const districtLabel = selectedDistrict === 'all' ? '' : `_${selectedDistrict}`
    exportToExcel(flatData, {
      filename: `TN_Election_Data_${yearLabel}${districtLabel}`,
      sheetName: 'Election Data',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading election data...</span>
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">Error: {error}</div>
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end p-4 bg-muted/30 rounded-lg">
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Election Year</label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {filters.years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">District</label>
          <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Districts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {filters.districts.map((district) => (
                <SelectItem key={district} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Winner Party</label>
          <Select value={selectedParty} onValueChange={setSelectedParty}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Parties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Parties</SelectItem>
              {filters.parties.map((party) => (
                <SelectItem key={party} value={party}>
                  {party}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />

        <Button onClick={handleExport} className="gap-2">
          <Download className="w-4 h-4" />
          Export to Excel
        </Button>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {paginatedData.length} of {filteredAndSortedData.length} records
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort('acNo')}
              >
                AC No <SortIndicator field="acNo" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort('acName')}
              >
                AC Name <SortIndicator field="acName" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort('districtName')}
              >
                District <SortIndicator field="districtName" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort('electionYear')}
              >
                Year <SortIndicator field="electionYear" />
              </TableHead>
              <TableHead>Winner</TableHead>
              <TableHead>Runner-up</TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-muted"
                onClick={() => handleSort('totalElectors')}
              >
                Electors <SortIndicator field="totalElectors" />
              </TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-muted"
                onClick={() => handleSort('totalVotes')}
              >
                Votes <SortIndicator field="totalVotes" />
              </TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-muted"
                onClick={() => handleSort('margin')}
              >
                Margin <SortIndicator field="margin" />
              </TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-muted"
                onClick={() => handleSort('marginPercent')}
              >
                Margin % <SortIndicator field="marginPercent" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, idx) => {
              const winner = row.candidates[0]
              const runnerUp = row.candidates[1]
              return (
                <TableRow key={`${row.assemblyId}-${row.electionYear}-${idx}`}>
                  <TableCell className="font-medium">{row.acNo}</TableCell>
                  <TableCell>{row.acName}</TableCell>
                  <TableCell>{row.districtName}</TableCell>
                  <TableCell>{row.electionYear}</TableCell>
                  <TableCell>
                    {winner && (
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center justify-center w-2 h-8 rounded-sm shrink-0"
                          style={{ backgroundColor: getPartyColor(winner.party) }}
                        />
                        <div>
                          <div className="font-medium">{winner.name}</div>
                          <div className="text-xs text-muted-foreground">
                            <span
                              className="inline-block px-1.5 py-0.5 rounded text-white text-[10px] font-semibold mr-1"
                              style={{ backgroundColor: getPartyColor(winner.party) }}
                            >
                              {winner.party}
                            </span>
                            {winner.votes.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {runnerUp && (
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center justify-center w-2 h-8 rounded-sm shrink-0"
                          style={{ backgroundColor: getPartyColor(runnerUp.party) }}
                        />
                        <div>
                          <div className="font-medium">{runnerUp.name}</div>
                          <div className="text-xs text-muted-foreground">
                            <span
                              className="inline-block px-1.5 py-0.5 rounded text-white text-[10px] font-semibold mr-1"
                              style={{ backgroundColor: getPartyColor(runnerUp.party) }}
                            >
                              {runnerUp.party}
                            </span>
                            {runnerUp.votes.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.totalElectors?.toLocaleString() ?? '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.totalVotes?.toLocaleString() ?? '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {row.margin?.toLocaleString() ?? '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.marginPercent != null ? `${row.marginPercent}%` : '-'}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
