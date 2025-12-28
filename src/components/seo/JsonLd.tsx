'use client'

import { useEffect } from 'react'

// Types for structured data
interface OrganizationSchema {
  '@context': 'https://schema.org'
  '@type': 'Organization'
  name: string
  url: string
  logo?: string
  sameAs?: string[]
  description?: string
}

interface WebsiteSchema {
  '@context': 'https://schema.org'
  '@type': 'WebSite'
  name: string
  url: string
  potentialAction?: {
    '@type': 'SearchAction'
    target: string
    'query-input': string
  }
}

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbSchema {
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  itemListElement: {
    '@type': 'ListItem'
    position: number
    name: string
    item: string
  }[]
}

interface GovernmentServiceSchema {
  '@context': 'https://schema.org'
  '@type': 'GovernmentService'
  name: string
  description: string
  serviceType: string
  areaServed: {
    '@type': 'AdministrativeArea'
    name: string
  }
  provider?: {
    '@type': 'Organization'
    name: string
    url: string
  }
}

// Default organization data
const ORGANIZATION_DATA: OrganizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'IndiaStats.org',
  url: 'https://indiastats.org',
  logo: 'https://indiastats.org/favicon.svg',
  description:
    'Comprehensive election data, voter statistics, and political insights for Tamil Nadu assembly constituencies.',
  sameAs: ['https://twitter.com/IndiaStatsOrg'],
}

// Default website data
const WEBSITE_DATA: WebsiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'IndiaStats.org',
  url: 'https://indiastats.org',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://indiastats.org/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

/**
 * Component to inject JSON-LD structured data into the page
 */
export function JsonLd({ data }: { data: object }) {
  useEffect(() => {
    const typeValue = (data as { '@type'?: string })['@type'] || 'unknown'
    // Check if script already exists
    const existingScript = document.querySelector(
      `script[type="application/ld+json"][data-id="${JSON.stringify(typeValue)}"]`,
    )
    if (existingScript) {
      existingScript.innerHTML = JSON.stringify(data)
      return
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-id', JSON.stringify(typeValue))
    script.innerHTML = JSON.stringify(data)
    document.head.appendChild(script)

    return () => {
      script.remove()
    }
  }, [data])

  return null
}

/**
 * Organization schema for the site
 */
export function OrganizationJsonLd() {
  return <JsonLd data={ORGANIZATION_DATA} />
}

/**
 * Website schema with search action
 */
export function WebsiteJsonLd() {
  return <JsonLd data={WEBSITE_DATA} />
}

/**
 * Breadcrumb schema component
 */
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const data: BreadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return <JsonLd data={data} />
}

/**
 * Government Service schema for election data pages
 */
export function GovernmentServiceJsonLd({
  name,
  description,
  areaName,
}: {
  name: string
  description: string
  areaName: string
}) {
  const data: GovernmentServiceSchema = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name,
    description,
    serviceType: 'Election Statistics',
    areaServed: {
      '@type': 'AdministrativeArea',
      name: areaName,
    },
    provider: {
      '@type': 'Organization',
      name: 'IndiaStats.org',
      url: 'https://indiastats.org',
    },
  }

  return <JsonLd data={data} />
}

/**
 * Assembly page structured data
 */
export function AssemblyPageJsonLd({
  assemblyName,
  districtName,
  description,
  url,
}: {
  assemblyName: string
  districtName: string
  description: string
  url: string
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${assemblyName} Assembly - Election Data`,
    description,
    url,
    isPartOf: {
      '@type': 'WebSite',
      name: 'IndiaStats.org',
      url: 'https://indiastats.org',
    },
    about: {
      '@type': 'AdministrativeArea',
      name: assemblyName,
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: districtName,
        containedInPlace: {
          '@type': 'State',
          name: 'Tamil Nadu',
          containedInPlace: {
            '@type': 'Country',
            name: 'India',
          },
        },
      },
    },
  }

  return <JsonLd data={data} />
}

/**
 * District page structured data
 */
export function DistrictPageJsonLd({
  districtName,
  description,
  url,
  assemblyCount,
}: {
  districtName: string
  description: string
  url: string
  assemblyCount: number
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${districtName} District - Election Data`,
    description,
    url,
    isPartOf: {
      '@type': 'WebSite',
      name: 'IndiaStats.org',
      url: 'https://indiastats.org',
    },
    about: {
      '@type': 'AdministrativeArea',
      name: districtName,
      containedInPlace: {
        '@type': 'State',
        name: 'Tamil Nadu',
      },
      containsPlace: Array.from({ length: assemblyCount }, (_, i) => ({
        '@type': 'AdministrativeArea',
        name: `Assembly Constituency ${i + 1}`,
      })),
    },
  }

  return <JsonLd data={data} />
}
