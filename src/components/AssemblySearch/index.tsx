'use client'
import * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronRight, Search } from 'lucide-react'
import {
  trackSearch,
  trackSearchResultClick,
  trackViewAssembly,
  trackButtonClick,
} from '@/utilities/analytics'

export interface District {
  districtId: string
  districtSlug: string
  districtName: string
}

export interface Assembly {
  assemblyId: string
  assemblySlug: string
  districtId: string
  districtSlug: string
  districtName: string
  name: string
}

interface AssemblySearchProps {
  assemblies: Assembly[]
  districts?: District[] // Optional: pass districts directly from server
  onSearch?: (district: District, assembly: Assembly) => void
}

const LOCAL_STORAGE_DISTRICT_KEY = 'assembly-search:districtId'
const LOCAL_STORAGE_ASSEMBLY_KEY = 'assembly-search:assemblyId'

export const AssemblySearch: React.FC<AssemblySearchProps> = ({
  assemblies,
  districts,
  onSearch,
}) => {
  const router = useRouter()
  const hasHydratedRef = useRef(false)

  // Use passed districts or derive from assemblies as fallback
  const allDistricts: District[] = useMemo(() => {
    if (districts && districts.length > 0) {
      return districts
    }
    // Fallback: derive districts from assemblies
    return Array.from(
      new Map(
        assemblies.map((assembly) => [
          assembly.districtId || assembly.districtName,
          {
            districtId: assembly.districtId || assembly.districtName,
            districtName: assembly.districtName,
          },
        ]),
      ).values(),
    )
  }, [assemblies, districts])

  const [selectedDistrict, setSelectedDistrict] = useState<District | undefined>(undefined)
  const [selectedAssembly, setSelectedAssembly] = useState<Assembly | undefined>(undefined)
  const [districtQuery, setDistrictQuery] = useState('')
  const [assemblyQuery, setAssemblyQuery] = useState('')
  const [directAssemblyQuery, setDirectAssemblyQuery] = useState('')
  const [isDistrictOpen, setIsDistrictOpen] = useState(false)
  const [isAssemblyOpen, setIsAssemblyOpen] = useState(false)
  const [isDirectOpen, setIsDirectOpen] = useState(false)

  // Filter districts
  const filteredDistricts = useMemo(() => {
    if (!districtQuery) return allDistricts
    return allDistricts.filter((d) =>
      d.districtName.toLowerCase().includes(districtQuery.toLowerCase()),
    )
  }, [allDistricts, districtQuery])

  // Filter assemblies in selected district
  const filteredAssemblies = useMemo(() => {
    if (!selectedDistrict) return []
    // Match by districtName since assemblies may not have districtId
    const districtAssemblies = assemblies.filter(
      (a) =>
        a.districtName === selectedDistrict.districtName ||
        (a.districtId && a.districtId === selectedDistrict.districtId),
    )
    if (!assemblyQuery) return districtAssemblies
    return districtAssemblies.filter((a) =>
      a.name.toLowerCase().includes(assemblyQuery.toLowerCase()),
    )
  }, [assemblies, selectedDistrict, assemblyQuery])

  // Filter all assemblies for direct search
  const filteredAllAssemblies = useMemo(() => {
    if (!directAssemblyQuery) return assemblies.slice(0, 20) // Show first 20 by default
    return assemblies.filter((a) =>
      a.name.toLowerCase().includes(directAssemblyQuery.toLowerCase()),
    )
  }, [assemblies, directAssemblyQuery])

  // Hydrate from localStorage
  useEffect(() => {
    if (hasHydratedRef.current || typeof window === 'undefined') return
    if (allDistricts.length === 0) return

    const storedAssemblyId = window.localStorage.getItem(LOCAL_STORAGE_ASSEMBLY_KEY)
    const storedDistrictId = window.localStorage.getItem(LOCAL_STORAGE_DISTRICT_KEY)

    let initialAssembly = storedAssemblyId
      ? assemblies.find((a) => a.assemblyId === storedAssemblyId)
      : undefined

    let initialDistrict = storedDistrictId
      ? allDistricts.find((d) => d.districtId === storedDistrictId)
      : undefined

    if (
      initialAssembly &&
      (!initialDistrict || initialAssembly.districtId !== initialDistrict.districtId)
    ) {
      initialDistrict = allDistricts.find((d) => d.districtId === initialAssembly?.districtId)
    }

    if (!initialDistrict) {
      initialDistrict = allDistricts[0]
    }

    setSelectedDistrict(initialDistrict)
    setDistrictQuery(initialDistrict.districtName)

    if (
      initialAssembly &&
      initialDistrict &&
      initialAssembly.districtId === initialDistrict.districtId
    ) {
      setSelectedAssembly(initialAssembly)
      setAssemblyQuery(initialAssembly.name)
    }

    hasHydratedRef.current = true
  }, [assemblies, allDistricts])

  // Update assembly when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setSelectedAssembly(undefined)
      setAssemblyQuery('')
      return
    }

    const assembliesInDistrict = assemblies.filter(
      (a) => a.districtId === selectedDistrict.districtId,
    )

    if (assembliesInDistrict.length > 0) {
      if (!selectedAssembly || selectedAssembly.districtId !== selectedDistrict.districtId) {
        setSelectedAssembly(assembliesInDistrict[0])
        setAssemblyQuery(assembliesInDistrict[0].name)
      }
    }
  }, [selectedDistrict, assemblies])

  // Persist to localStorage
  useEffect(() => {
    if (!hasHydratedRef.current || typeof window === 'undefined') return

    if (selectedDistrict) {
      window.localStorage.setItem(LOCAL_STORAGE_DISTRICT_KEY, selectedDistrict.districtId)
    } else {
      window.localStorage.removeItem(LOCAL_STORAGE_DISTRICT_KEY)
    }
  }, [selectedDistrict?.districtId])

  useEffect(() => {
    if (!hasHydratedRef.current || typeof window === 'undefined') return

    if (selectedAssembly) {
      window.localStorage.setItem(LOCAL_STORAGE_ASSEMBLY_KEY, selectedAssembly.assemblyId)
    } else {
      window.localStorage.removeItem(LOCAL_STORAGE_ASSEMBLY_KEY)
    }
  }, [selectedAssembly?.assemblyId])

  const handleDistrictSelect = (district: District) => {
    setSelectedDistrict(district)
    setDistrictQuery(district.districtName)
    setIsDistrictOpen(false)

    // Auto-select first assembly for this district
    const districtAssemblies = assemblies.filter(
      (a) =>
        a.districtName === district.districtName ||
        (a.districtId && a.districtId === district.districtId),
    )
    if (districtAssemblies.length > 0) {
      setSelectedAssembly(districtAssemblies[0])
      setAssemblyQuery(districtAssemblies[0].name)
    } else {
      setSelectedAssembly(undefined)
      setAssemblyQuery('')
    }
  }

  const handleAssemblySelect = (assembly: Assembly) => {
    setSelectedAssembly(assembly)
    setAssemblyQuery(assembly.name)
    setIsAssemblyOpen(false)
    trackSearchResultClick(assembly.assemblyId, assembly.name, 'assembly')
  }

  const handleDirectAssemblySelect = (assembly: Assembly) => {
    // Create district from assembly data
    const district: District = {
      districtId: assembly.districtId,
      districtName: assembly.districtName,
    }
    setSelectedDistrict(district)
    setDistrictQuery(assembly.districtName)
    setSelectedAssembly(assembly)
    setAssemblyQuery(assembly.name)
    setDirectAssemblyQuery(assembly.name)
    setIsDirectOpen(false)
    // Unified analytics tracking
    trackSearch(assembly.name, 1, 'direct')
    trackSearchResultClick(assembly.assemblyId, assembly.name, 'assembly')
  }

  const handleSearchClick = () => {
    if (selectedDistrict && selectedAssembly) {
      trackViewAssembly(
        selectedAssembly.assemblyId,
        selectedAssembly.name,
        selectedDistrict.districtName,
      )
      trackButtonClick('View Assembly', { assembly_id: selectedAssembly.assemblyId })
      router.push(
        `/tamil-nadu/assembly/${selectedDistrict.districtSlug}/${selectedAssembly.assemblySlug}`,
      )
      if (onSearch) {
        onSearch(selectedDistrict, selectedAssembly)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Assembly Search</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* District Selection */}
        <div className="space-y-2">
          <Label htmlFor="district-select">Select District</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="district-select"
              placeholder="Search districts..."
              value={districtQuery}
              onChange={(e) => {
                setDistrictQuery(e.target.value)
                setIsDistrictOpen(true)
              }}
              onFocus={() => {
                setDistrictQuery('')
                setIsDistrictOpen(true)
              }}
              className="pl-9"
            />
            {isDistrictOpen && filteredDistricts.length > 0 && (
              <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
                {filteredDistricts.map((district) => (
                  <div
                    key={district.districtId}
                    className={`cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground ${
                      selectedDistrict?.districtId === district.districtId ? 'bg-accent' : ''
                    }`}
                    onClick={() => handleDistrictSelect(district)}
                  >
                    {district.districtName}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assembly Selection */}
        <div className="space-y-2">
          <Label htmlFor="assembly-select">Select Assembly</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="assembly-select"
              placeholder="Search assemblies..."
              value={assemblyQuery}
              onChange={(e) => {
                setAssemblyQuery(e.target.value)
                setIsAssemblyOpen(true)
              }}
              onFocus={() => {
                setAssemblyQuery('')
                setIsAssemblyOpen(true)
              }}
              disabled={!selectedDistrict}
              className="pl-9"
            />
            {isAssemblyOpen && filteredAssemblies.length > 0 && (
              <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
                {filteredAssemblies.map((assembly) => (
                  <div
                    key={assembly.assemblyId}
                    className={`cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground ${
                      selectedAssembly?.assemblyId === assembly.assemblyId ? 'bg-accent' : ''
                    }`}
                    onClick={() => handleAssemblySelect(assembly)}
                  >
                    {assembly.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Direct Assembly Search */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or search directly</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="direct-assembly">Search Assembly Directly</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="direct-assembly"
              placeholder="Search all assemblies..."
              value={directAssemblyQuery}
              onChange={(e) => {
                setDirectAssemblyQuery(e.target.value)
                setIsDirectOpen(true)
              }}
              onFocus={() => setIsDirectOpen(true)}
              className="pl-9"
            />
            {isDirectOpen && filteredAllAssemblies.length > 0 && (
              <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
                {filteredAllAssemblies.map((assembly) => (
                  <div
                    key={assembly.assemblyId}
                    className={`cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground ${
                      selectedAssembly?.assemblyId === assembly.assemblyId ? 'bg-accent' : ''
                    }`}
                    onClick={() => handleDirectAssemblySelect(assembly)}
                  >
                    <div>{assembly.name}</div>
                    <div className="text-xs text-muted-foreground">{assembly.districtName}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleSearchClick}
          disabled={!selectedDistrict || !selectedAssembly}
          className="w-full sm:w-auto"
        >
          View Assembly
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

export default AssemblySearch
