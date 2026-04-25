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
    <nav className="flex gap-3 items-center">
      {navItems.map(({ link }, i) => {
        return <CMSLink key={i} {...link} appearance="link" />
      })}

      {/* GitHub Star Button */}
      <a
        href="https://github.com/dculussoftwares/indiastats-cms"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
        aria-label="Star on GitHub"
      >
        <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current shrink-0" aria-hidden="true">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
        </svg>
        <span className="hidden sm:inline">Star</span>
      </a>

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
