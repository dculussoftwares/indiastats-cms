'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Search, MapPin, Building2, FileText, Clock, X } from 'lucide-react'
import { useDebounce } from '@/utilities/useDebounce'
import { trackClicked, getPageContext } from '@/analytics'

// Types for search results
interface SearchResult {
  id: string
  title: string
  subtitle?: string
  category: 'assembly' | 'district' | 'post'
  url: string
}

interface SearchResults {
  assemblies: SearchResult[]
  districts: SearchResult[]
  posts: SearchResult[]
}

// Recent searches utilities
const RECENT_SEARCHES_KEY = 'indiastats:recent-searches'
const MAX_RECENT_SEARCHES = 8

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function addRecentSearch(query: string): void {
  if (!query.trim()) return
  const recent = getRecentSearches().filter((q) => q !== query)
  recent.unshift(query)
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT_SEARCHES)))
}

function clearRecentSearches(): void {
  localStorage.removeItem(RECENT_SEARCHES_KEY)
}

// Category config
const categoryConfig = {
  assembly: { icon: MapPin, label: 'Assemblies', color: 'text-red-500' },
  district: { icon: Building2, label: 'Districts', color: 'text-blue-500' },
  post: { icon: FileText, label: 'Posts', color: 'text-green-500' },
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const debouncedQuery = useDebounce(query, 300)

  // Load recent searches on mount
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches())
    }
  }, [isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults(null)
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Global ESC key listener - works even when input doesn't have focus
  useEffect(() => {
    if (!isOpen) return

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [isOpen, onClose])

  // Search when query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null)
      setLoading(false)
      return
    }

    const search = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setResults(data)
          setSelectedIndex(0)
        }
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setLoading(false)
      }
    }

    search()
  }, [debouncedQuery])

  // Flatten results for keyboard navigation
  const allResults: SearchResult[] = React.useMemo(() => {
    if (!results) return []
    return [...results.assemblies, ...results.districts, ...results.posts]
  }, [results])

  // Navigate to result
  const navigateToResult = useCallback(
    (result: SearchResult) => {
      addRecentSearch(query)
      const pageContext = getPageContext()
      // Track as search result click
      trackClicked({ name: 'search_result',
        page_name: pageContext.page_name || 'Search',
        search_query: query,
        result_id: result.id,
        result_name: result.title,
        result_type: result.category,
        result_position: 1,
        search_type: 'command_palette',
      })
      onClose()
      // Use window.location for more reliable navigation
      window.location.href = result.url
    },
    [query, onClose],
  )

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (allResults[selectedIndex]) {
            navigateToResult(allResults[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    },
    [allResults, selectedIndex, onClose, navigateToResult],
  )

  // Handle result click
  const handleResultClick = useCallback(
    (result: SearchResult) => {
      navigateToResult(result)
    },
    [navigateToResult],
  )

  // Handle recent search click
  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery)
    inputRef.current?.focus()
  }

  // Handle clear recent searches
  const handleClearRecent = () => {
    clearRecentSearches()
    setRecentSearches([])
  }

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && allResults.length > 0) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      selectedElement?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex, allResults.length])

  if (!isOpen) return null

  const showRecentSearches = !query.trim() && recentSearches.length > 0

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal - Centered */}
      <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[10vh] px-4">
        <div
          className="relative w-full max-w-xl overflow-hidden rounded-lg border-t-4 border-red-600 bg-white shadow-2xl dark:bg-[#1a1a2e]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            type="button"
            aria-label="Close search"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Search Input */}
          <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-4 pr-12 dark:border-gray-700">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search assemblies, districts, posts..."
              className="flex-1 bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                type="button"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
            <span className="hidden text-xs text-gray-400 sm:inline">ESC to close</span>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
              </div>
            )}

            {/* Recent Searches */}
            {showRecentSearches && !loading && (
              <div className="p-2">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Recent Searches
                  </span>
                  <button
                    onClick={handleClearRecent}
                    className="text-xs text-red-600 hover:underline"
                    type="button"
                  >
                    Clear all
                  </button>
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="flex w-full items-center gap-3 rounded px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                    type="button"
                  >
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{search}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Search Results */}
            {!loading && results && !showRecentSearches && (
              <div className="p-2">
                {allResults.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-gray-500">No results found for &ldquo;{query}&rdquo;</p>
                    <p className="mt-1 text-sm text-gray-400">Try different keywords</p>
                  </div>
                ) : (
                  <>
                    {/* Assemblies */}
                    {results.assemblies.length > 0 && (
                      <ResultGroup
                        category="assembly"
                        results={results.assemblies}
                        selectedIndex={selectedIndex}
                        startIndex={0}
                        onSelect={handleResultClick}
                        onHover={setSelectedIndex}
                      />
                    )}

                    {/* Districts */}
                    {results.districts.length > 0 && (
                      <ResultGroup
                        category="district"
                        results={results.districts}
                        selectedIndex={selectedIndex}
                        startIndex={results.assemblies.length}
                        onSelect={handleResultClick}
                        onHover={setSelectedIndex}
                      />
                    )}

                    {/* Posts */}
                    {results.posts.length > 0 && (
                      <ResultGroup
                        category="post"
                        results={results.posts}
                        selectedIndex={selectedIndex}
                        startIndex={results.assemblies.length + results.districts.length}
                        onSelect={handleResultClick}
                        onHover={setSelectedIndex}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {/* Empty State */}
            {!query.trim() && !showRecentSearches && !loading && (
              <div className="py-12 text-center">
                <Search className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="text-gray-500">Search assemblies, districts, and posts</p>
                <p className="mt-2 text-sm text-gray-400">
                  Use{' '}
                  <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">
                    ↑↓
                  </kbd>{' '}
                  to navigate,{' '}
                  <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">
                    Enter
                  </kbd>{' '}
                  to select
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Result Group Component
interface ResultGroupProps {
  category: 'assembly' | 'district' | 'post'
  results: SearchResult[]
  selectedIndex: number
  startIndex: number
  onSelect: (result: SearchResult) => void
  onHover: (index: number) => void
}

function ResultGroup({
  category,
  results,
  selectedIndex,
  startIndex,
  onSelect,
  onHover,
}: ResultGroupProps) {
  const config = categoryConfig[category]
  const Icon = config.icon

  return (
    <div className="mb-2">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {config.label}
      </div>
      {results.map((result, index) => {
        const globalIndex = startIndex + index
        const isSelected = selectedIndex === globalIndex

        return (
          <a
            key={result.id}
            href={result.url}
            data-index={globalIndex}
            onClick={() => {
              // Track before navigation
              onSelect(result)
            }}
            onMouseEnter={() => onHover(globalIndex)}
            className={`flex w-full items-center gap-3 rounded px-3 py-3 text-left no-underline transition-colors ${
              isSelected ? 'bg-red-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Icon className={`h-5 w-5 flex-shrink-0 ${isSelected ? 'text-white' : config.color}`} />
            <div className="min-w-0 flex-1">
              <div
                className={`truncate font-medium ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}
              >
                {result.title}
              </div>
              {result.subtitle && (
                <div
                  className={`truncate text-sm ${isSelected ? 'text-red-100' : 'text-gray-500'}`}
                >
                  {result.subtitle}
                </div>
              )}
            </div>
            {isSelected && <span className="text-sm text-red-100">↵</span>}
          </a>
        )
      })}
    </div>
  )
}

export default CommandPalette
