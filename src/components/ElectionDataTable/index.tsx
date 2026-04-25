'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
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
import { trackViewed, trackClicked, getPageContext, setPageContext, PAGE_NAMES } from '@/analytics'
import {
  Download,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

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
  assemblySlug: string
  districtId: string
  districtSlug: string
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

const columnHelper = createColumnHelper<AssemblyElectionData>()

// Party Badge Component
function PartyBadge({ candidate }: { candidate: CandidateData | undefined }) {
  if (!candidate) return null

  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex items-center justify-center w-2 h-8 rounded-sm shrink-0"
        style={{ backgroundColor: getPartyColor(candidate.party) }}
      />
      <div>
        <div className="font-medium">{candidate.name}</div>
        <div className="text-xs text-muted-foreground">
          <span
            className="inline-block px-1.5 py-0.5 rounded text-white text-[10px] font-semibold mr-1"
            style={{ backgroundColor: getPartyColor(candidate.party) }}
          >
            {candidate.party}
          </span>
          {candidate.votes.toLocaleString()}
        </div>
      </div>
    </div>
  )
}

// Sort Header Component
function SortableHeader({ column, children }: { column: any; children: React.ReactNode }) {
  const isSorted = column.getIsSorted()

  return (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors"
      onClick={() => column.toggleSorting()}
    >
      {children}
      {isSorted === 'asc' ? (
        <ChevronUp className="w-4 h-4" />
      ) : isSorted === 'desc' ? (
        <ChevronDown className="w-4 h-4" />
      ) : (
        <ChevronsUpDown className="w-4 h-4 opacity-50" />
      )}
    </button>
  )
}

export function ElectionDataTable() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    setPageContext({
      page_name: PAGE_NAMES.ELECTION_DATA,
      page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    })
    trackViewed({
      name: 'election_data_page',
      page_name: PAGE_NAMES.ELECTION_DATA,
      page_type: 'other',
      page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    })
  }, [])

  const [data, setData] = useState<AssemblyElectionData[]>([])
  const [availableFilters, setAvailableFilters] = useState<{
    districts: string[]
    years: number[]
    parties: string[]
  }>({ districts: [], years: [], parties: [] })
  // Store initial year list separately (never gets overwritten after first load)
  const [initialYears, setInitialYears] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state — initialised from URL search params
  const [selectedYear, setSelectedYear] = useState<string>(() => searchParams.get('year') ?? '2021')
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    () => searchParams.get('district') ?? 'all',
  )
  const [selectedParty, setSelectedParty] = useState<string>(
    () => searchParams.get('party') ?? 'all',
  )

  // Helper: push filter changes to URL without adding history entries
  const updateURL = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === 'all') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  // TanStack Table State — initialised from URL search params
  const [sorting, setSorting] = useState<SortingState>(() => {
    const sortBy = searchParams.get('sortBy')
    const sortDir = searchParams.get('sortDir')
    if (sortBy) return [{ id: sortBy, desc: sortDir === 'desc' }]
    return [{ id: 'acNo', desc: false }]
  })
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Sync sorting changes to URL
  const handleSortingChange: React.Dispatch<React.SetStateAction<SortingState>> = useCallback(
    (updaterOrValue) => {
      setSorting((prev) => {
        const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue
        if (next.length === 0) {
          updateURL({ sortBy: 'all', sortDir: 'all' })
        } else {
          updateURL({ sortBy: next[0].id, sortDir: next[0].desc ? 'desc' : 'asc' })
        }
        return next
      })
    },
    [updateURL],
  )

  // Define columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('acNo', {
        header: ({ column }) => <SortableHeader column={column}>AC No</SortableHeader>,
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
        sortingFn: 'basic',
      }),
      columnHelper.accessor('acName', {
        header: ({ column }) => <SortableHeader column={column}>AC Name</SortableHeader>,
        cell: (info) => {
          const row = info.row.original
          const url = `/tamil-nadu/assembly/${row.districtSlug}/${row.assemblySlug}`
          return (
            <Link
              href={url}
              className="text-primary hover:underline font-medium inline-flex items-center gap-1"
              onClick={() => {
                const pageContext = getPageContext()
                trackClicked({
                  name: 'link',
                  page_name: pageContext.page_name || 'Election Data',
                  link_name: 'view_assembly',
                  link_location: 'data_table',
                })
              }}
            >
              {info.getValue()}
              <ExternalLink className="h-3 w-3 opacity-50" />
            </Link>
          )
        },
        sortingFn: 'text',
      }),
      columnHelper.accessor('districtName', {
        header: ({ column }) => <SortableHeader column={column}>District</SortableHeader>,
        cell: (info) => {
          const row = info.row.original
          const url = `/tamil-nadu/district/${row.districtSlug}`
          return (
            <Link
              href={url}
              className="text-primary hover:underline inline-flex items-center gap-1"
              onClick={() => {
                const pageContext = getPageContext()
                trackClicked({
                  name: 'link',
                  page_name: pageContext.page_name || 'Election Data',
                  link_name: 'view_district',
                  link_location: 'data_table',
                })
              }}
            >
              {info.getValue()}
              <ExternalLink className="h-3 w-3 opacity-50" />
            </Link>
          )
        },
        sortingFn: 'text',
      }),
      columnHelper.accessor('electionYear', {
        header: ({ column }) => <SortableHeader column={column}>Year</SortableHeader>,
        cell: (info) => info.getValue(),
        sortingFn: 'basic',
      }),
      columnHelper.accessor((row) => row.candidates[0], {
        id: 'winner',
        header: 'Winner',
        cell: (info) => <PartyBadge candidate={info.getValue()} />,
        enableSorting: false,
      }),
      columnHelper.accessor((row) => row.candidates[1], {
        id: 'runnerUp',
        header: 'Runner-up',
        cell: (info) => <PartyBadge candidate={info.getValue()} />,
        enableSorting: false,
      }),
      columnHelper.accessor((row) => row.candidates[2], {
        id: 'runnerUp2',
        header: '2nd Runner-up',
        cell: (info) => <PartyBadge candidate={info.getValue()} />,
        enableSorting: false,
      }),
      columnHelper.accessor('totalElectors', {
        header: ({ column }) => (
          <div className="text-right">
            <SortableHeader column={column}>Electors</SortableHeader>
          </div>
        ),
        cell: (info) => (
          <div className="text-right">{info.getValue()?.toLocaleString() ?? '-'}</div>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('totalVotes', {
        header: ({ column }) => (
          <div className="text-right">
            <SortableHeader column={column}>Votes</SortableHeader>
          </div>
        ),
        cell: (info) => (
          <div className="text-right">{info.getValue()?.toLocaleString() ?? '-'}</div>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('margin', {
        header: ({ column }) => (
          <div className="text-right">
            <SortableHeader column={column}>Margin</SortableHeader>
          </div>
        ),
        cell: (info) => (
          <div className="text-right font-medium">{info.getValue()?.toLocaleString() ?? '-'}</div>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('marginPercent', {
        header: ({ column }) => (
          <div className="text-right">
            <SortableHeader column={column}>Margin %</SortableHeader>
          </div>
        ),
        cell: (info) => {
          const value = info.getValue()
          return <div className="text-right">{value != null ? `${value}%` : '-'}</div>
        },
        sortingFn: 'basic',
      }),
    ],
    [],
  )

  // Fetch initial years list once on mount
  useEffect(() => {
    async function fetchInitialYears() {
      try {
        // Fetch without year filter to get all available years
        const response = await fetch('/api/election-data-table')
        if (response.ok) {
          const result: ElectionDataTableResponse = await response.json()
          setInitialYears(result.filters.years)
        }
      } catch {
        // Silently fail, years will be empty
      }
    }
    fetchInitialYears()
  }, [])

  // Fetch data when year filter changes
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
        // Only update districts and parties from filtered response, not years
        setAvailableFilters({
          districts: result.filters.districts,
          years: result.filters.years, // This is still set but we use initialYears for dropdown
          parties: result.filters.parties,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedYear])

  // Filter data based on district and party selections
  const filteredData = useMemo(() => {
    let filtered = [...data]

    if (selectedDistrict !== 'all') {
      filtered = filtered.filter((row) => row.districtName === selectedDistrict)
    }

    if (selectedParty !== 'all') {
      filtered = filtered.filter(
        (row) => row.candidates.length > 0 && row.candidates[0].party === selectedParty,
      )
    }

    return filtered
  }, [data, selectedDistrict, selectedParty])

  // Initialize table
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  })

  // Handle export
  const handleExport = () => {
    // Track export action
    const pageContext = getPageContext()
    trackClicked({
      name: 'button',
      page_name: pageContext.page_name || 'Election Data',
      button_name: 'export_to_excel',
      button_label: 'Export',
    })

    const flatData = flattenElectionDataForExcel(filteredData)
    const yearLabel = selectedYear === 'all' ? 'AllYears' : selectedYear
    const districtLabel = selectedDistrict === 'all' ? '' : `_${selectedDistrict}`
    exportToExcel(flatData, {
      filename: `TN_Election_Data_${yearLabel}${districtLabel}`,
      sheetName: 'Election Data',
    })
  }

  // Handle filter changes with tracking
  const handleYearChange = (value: string) => {
    const pageContext = getPageContext()
    trackClicked({
      name: 'search_filter',
      page_name: pageContext.page_name || 'Election Data',
      filter_name: 'year',
      filter_value: value,
    })
    setSelectedYear(value)
    updateURL({ year: value })
  }

  const handleDistrictChange = (value: string) => {
    const pageContext = getPageContext()
    trackClicked({
      name: 'search_filter',
      page_name: pageContext.page_name || 'Election Data',
      filter_name: 'district',
      filter_value: value,
    })
    setSelectedDistrict(value)
    updateURL({ district: value })
  }

  const handlePartyChange = (value: string) => {
    const pageContext = getPageContext()
    trackClicked({
      name: 'search_filter',
      page_name: pageContext.page_name || 'Election Data',
      filter_name: 'party',
      filter_value: value,
    })
    setSelectedParty(value)
    updateURL({ party: value })
  }

  // Track X contact link click
  const handleXLinkClick = () => {
    const pageContext = getPageContext()
    trackClicked({
      name: 'link',
      page_name: pageContext.page_name || 'Election Data',
      link_name: 'x_contact',
      link_location: 'data_table_footer',
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
      <div className="flex flex-wrap gap-3 md:gap-4 items-end p-4 bg-muted/30 rounded-lg">
        <div className="space-y-1 w-full sm:w-auto">
          <label className="text-sm font-medium text-muted-foreground">Election Year</label>
          <Select value={selectedYear} onValueChange={handleYearChange}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {initialYears.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 w-full sm:w-auto">
          <label className="text-sm font-medium text-muted-foreground">District</label>
          <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Districts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {availableFilters.districts.map((district) => (
                <SelectItem key={district} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 w-full sm:w-auto">
          <label className="text-sm font-medium text-muted-foreground">Winner Party</label>
          <Select value={selectedParty} onValueChange={handlePartyChange}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="All Parties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Parties</SelectItem>
              {availableFilters.parties.map((party) => (
                <SelectItem key={party} value={party}>
                  {party}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="hidden md:flex flex-1" />

        <div className="flex flex-col w-full sm:w-auto items-stretch sm:items-end gap-1 mt-2 sm:mt-0">
          <Button
            onClick={handleExport}
            className="gap-2 w-full sm:w-auto"
            disabled={selectedDistrict === 'all'}
            title={
              selectedDistrict === 'all'
                ? 'Please select a specific district to export'
                : 'Export filtered data to Excel'
            }
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </Button>
          {selectedDistrict === 'all' && (
            <div className="flex flex-col items-center sm:items-end gap-0.5 text-center sm:text-right">
              <span className="text-xs text-muted-foreground">
                Select a district to enable export
              </span>
              <a
                href="https://x.com/india_stats_org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                onClick={handleXLinkClick}
              >
                Contact <span className="font-semibold">@india_stats_org</span> for full data
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {table.getRowModel().rows.length} of {filteredData.length} records
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
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
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
