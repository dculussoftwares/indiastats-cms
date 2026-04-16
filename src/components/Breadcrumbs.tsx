import React from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { BreadcrumbJsonLd } from './seo/JsonLd'

export interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const allItems = [
    { name: 'Home', url: '/' },
    ...items,
  ]

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <BreadcrumbJsonLd items={allItems} />
      <ol className="flex flex-wrap items-center text-sm text-muted-foreground">
        {allItems.map((item, index) => (
          <li key={item.url} className="flex items-center">
            {index > 0 && <ChevronRight className="mx-2 h-4 w-4 shrink-0" />}
            {index === allItems.length - 1 ? (
              <span className="font-medium text-foreground truncate max-w-[200px] md:max-w-none" aria-current="page">
                {item.name}
              </span>
            ) : (
              <Link
                href={item.url}
                className="hover:text-foreground transition-colors flex items-center"
              >
                {index === 0 && <Home className="h-4 w-4 mr-1" />}
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
