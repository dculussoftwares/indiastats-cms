'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  // Check if we're on the homepage
  const isHomepage = pathname === '/'

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  return (
    <header
      className={`sticky top-0 z-[1100] border-t-4 border-red-600 shadow-sm ${
        isHomepage ? 'bg-[#1a1a2e]' : 'bg-background'
      }`}
      {...(theme ? { 'data-theme': theme } : {})}
    >
      <div className="container py-6 flex justify-between">
        <Link href="/">
          <Logo variant={isHomepage ? 'light' : 'auto'} />
        </Link>
        <HeaderNav data={data} />
      </div>
    </header>
  )
}
