// Types for structured data
interface ImageObject {
  '@type': 'ImageObject'
  url: string
  width: number
  height: number
}

interface OrganizationSchema {
  '@context': 'https://schema.org'
  '@type': 'Organization'
  '@id'?: string
  name: string
  url: string
  logo?: ImageObject
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

// Default organization data
const ORGANIZATION_DATA: OrganizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://indiastats.org/#organization',
  name: 'IndiaStats.org',
  url: 'https://indiastats.org',
  logo: {
    '@type': 'ImageObject',
    url: 'https://indiastats.org/icon.png',
    width: 192,
    height: 192,
  },
  description:
    'Comprehensive election data, voter statistics, and political insights for Indian assembly constituencies.',
  sameAs: [
    'https://x.com/india_stats_org',
    'https://github.com/dculussoftwares/indiastats-cms',
  ],
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
  const typeValue = (data as { '@type'?: string })['@type'] || 'unknown'
  // Create a safe ID for the data-id attribute (no special characters)
  const safeId = typeValue.replace(/[^a-zA-Z0-9]/g, '-')

  return (
    <script
      type="application/ld+json"
      data-id={safeId}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
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
const BASE_URL = 'https://indiastats.org'

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const data: BreadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      // Ensure absolute URLs — Google requires them for breadcrumb rich results
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
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
  stateName = 'Tamil Nadu',
}: {
  assemblyName: string
  districtName: string
  description: string
  url: string
  stateName?: string
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
          '@type': 'AdministrativeArea',
          name: stateName,
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
  assemblies,
  stateName = 'Tamil Nadu',
}: {
  districtName: string
  description: string
  url: string
  assemblies: { name: string }[]
  stateName?: string
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
        '@type': 'AdministrativeArea',
        name: stateName,
      },
      containsPlace: assemblies.map((a) => ({
        '@type': 'AdministrativeArea',
        name: a.name,
      })),
    },
  }

  return <JsonLd data={data} />
}

/**
 * AboutPage schema for the /about page
 */
export function WebPageJsonLd({
  name,
  description,
  url,
}: {
  name: string
  description: string
  url: string
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url,
    isPartOf: {
      '@type': 'WebSite',
      name: 'IndiaStats.org',
      url: BASE_URL,
    },
  }

  return <JsonLd data={data} />
}

export function AboutPageJsonLd({
  description,
  url,
}: {
  description: string
  url: string
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About IndiaStats.org',
    description,
    url,
    mainEntity: {
      '@type': 'Organization',
      name: 'IndiaStats.org',
      url: BASE_URL,
      description:
        'Comprehensive election data, voter statistics, and political insights for Tamil Nadu assembly constituencies.',
      foundingLocation: {
        '@type': 'Place',
        name: 'Tamil Nadu, India',
      },
      knowsAbout: [
        'Tamil Nadu elections',
        'Indian assembly elections',
        'Voter data',
        'Election Commission of India',
        'Political analytics',
      ],
    },
  }

  return <JsonLd data={data} />
}

/**
 * BlogPosting schema for blog post pages
 */
export function BlogPostingJsonLd({
  title,
  description,
  url,
  datePublished,
  dateModified,
  imageUrl,
  author,
}: {
  title: string
  description?: string | null
  url: string
  datePublished: string
  dateModified: string
  imageUrl?: string | null
  author?: { name?: string | null; jobTitle?: string | null; bio?: string | null } | null
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    ...(description && { description }),
    url,
    datePublished,
    dateModified,
    author: author?.name
      ? {
          '@type': 'Person',
          name: author.name,
          ...(author.jobTitle && { jobTitle: author.jobTitle }),
          ...(author.bio && { description: author.bio }),
          worksFor: {
            '@type': 'Organization',
            name: 'IndiaStats.org',
            url: BASE_URL,
          },
        }
      : {
          '@type': 'Organization',
          name: 'IndiaStats.org',
          url: BASE_URL,
        },
    publisher: {
      '@type': 'Organization',
      name: 'IndiaStats.org',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/icon.png`,
        width: 192,
        height: 192,
      },
    },
    ...(imageUrl && {
      image: {
        '@type': 'ImageObject',
        url: imageUrl,
        width: imageUrl.includes('indiastats-logo') ? 1024 : 1200,
        height: imageUrl.includes('indiastats-logo') ? 1024 : 630,
      },
    }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'IndiaStats.org',
      url: BASE_URL,
    },
  }

  return <JsonLd data={data} />
}

/**
 * Dataset schema for assembly and district data pages
 */
export function DatasetJsonLd({
  name,
  description,
  url,
  temporalCoverage,
  assemblyName,
  districtName,
  stateName = 'Tamil Nadu',
}: {
  name: string
  description: string
  url: string
  temporalCoverage: string
  assemblyName: string
  districtName: string
  stateName?: string
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name,
    description,
    url,
    creator: {
      '@type': 'Organization',
      name: 'IndiaStats.org',
      url: BASE_URL,
    },
    license: `${BASE_URL}/terms`,
    temporalCoverage,
    // Google's Dataset spec expects spatialCoverage to be a Place (or Text),
    // not an AdministrativeArea. Keep the region hierarchy via containedInPlace.
    spatialCoverage: {
      '@type': 'Place',
      name: `${assemblyName}, ${districtName}, ${stateName}, India`,
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: districtName,
        containedInPlace: {
          '@type': 'AdministrativeArea',
          name: stateName,
          containedInPlace: { '@type': 'Country', name: 'India' },
        },
      },
    },
    variableMeasured: [
      'Registered voters',
      'Votes polled',
      'Candidate vote shares',
      'Booth-level voter data',
      'Constituency MLA history',
    ],
    measurementTechnique: 'Election Commission of India official results',
    // Catalog membership must use includedInDataCatalog (expects DataCatalog).
    // Dataset.isPartOf would require another Dataset, which Google rejects here.
    includedInDataCatalog: {
      '@type': 'DataCatalog',
      name: 'IndiaStats.org Election Data Catalog',
      url: BASE_URL,
    },
  }

  return <JsonLd data={data} />
}

/**
 * DataCatalog schema for the homepage
 */
export function DataCatalogJsonLd({
  totalAssemblies,
  totalBooths,
}: {
  totalAssemblies: number
  totalBooths: number
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'DataCatalog',
    name: 'IndiaStats.org — India Election Data Catalog',
    description: `Comprehensive election data covering ${totalAssemblies} Tamil Nadu assembly constituencies, 38 districts, ${totalBooths.toLocaleString()}+ polling booths. Includes MLA history, voter statistics, and caste demographics.`,
    url: BASE_URL,
    publisher: {
      '@type': 'Organization',
      name: 'IndiaStats.org',
      url: BASE_URL,
    },
    spatialCoverage: {
      '@type': 'Place',
      name: 'Tamil Nadu, India',
      containedInPlace: { '@type': 'AdministrativeArea', name: 'India' },
    },
    temporalCoverage: '1967/2026',
    keywords: [
      'Tamil Nadu elections',
      'assembly constituency data',
      'voter statistics',
      'MLA history',
      'India election data',
    ],
    license: `${BASE_URL}/terms`,
  }

  return <JsonLd data={data} />
}
