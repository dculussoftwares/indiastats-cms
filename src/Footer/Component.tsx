import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import type { Footer } from '@/payload-types'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'

const POLICY_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
]

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()

  const navItems = footerData?.navItems || []

  return (
    <footer className="mt-auto border-t border-border bg-black dark:bg-card text-white">
      <div className="container py-8 gap-8 flex flex-col md:flex-row md:justify-between">
        <Link className="flex items-center" href="/">
          <Logo variant="light" />
        </Link>

        <div className="flex flex-col-reverse items-start md:flex-row gap-4 md:items-center">
          <ThemeSelector />
          <nav className="flex flex-col md:flex-row gap-4">
            {navItems.map(({ link }, i) => {
              return <CMSLink className="text-white" key={i} {...link} />
            })}
          </nav>
        </div>
      </div>

      {/* Policy links — always present regardless of CMS nav */}
      <div className="border-t border-white/10">
        <div className="container py-4 flex flex-wrap gap-x-6 gap-y-2 justify-between items-center">
          <p className="text-white/50 text-xs">
            © {new Date().getFullYear()} IndiaStats.org. Data sourced from the Election Commission
            of India.
          </p>
          <nav className="flex flex-wrap gap-x-5 gap-y-1">
            {POLICY_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-white/60 hover:text-white text-xs transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
