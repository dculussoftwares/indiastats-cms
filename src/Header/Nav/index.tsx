'use client'

import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { SearchIcon } from 'lucide-react'
import { useCommandPalette } from '@/providers/CommandPalette'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []
  const { open } = useCommandPalette()

  return (
    <nav className="flex gap-4 items-center">
      {navItems.map(({ link }, i) => {
        return <CMSLink key={i} {...link} appearance="link" />
      })}
      {/* Search Button - Prominent white design */}
      <button
        onClick={open}
        className="group flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        aria-label="Search (⌘K)"
      >
        <SearchIcon className="h-4 w-4 text-gray-500 group-hover:text-red-600 transition-colors" />
        <span className="text-sm font-medium text-gray-600 hidden sm:inline">
          Search assemblies...
        </span>
        <kbd className="hidden sm:flex items-center gap-0.5 rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </button>
    </nav>
  )
}
