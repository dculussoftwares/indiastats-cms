import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * Middleware to handle backwards-compatible redirects from old ID-based URLs
 * to new slug-based URLs and fix misrouted state paths.
 */

const DEFAULT_STATE_SLUG = 'tamil-nadu'

// Regex patterns to detect old ID-based URLs
const OLD_ASSEMBLY_URL_PATTERN = /^\/([^/]+)\/assembly\/((?:up-)?dt\d+)\/((?:up-)?ac\d+)(\/.*)?$/
const OLD_DISTRICT_URL_PATTERN = /^\/([^/]+)\/district\/((?:up-)?dt\d+)(\/.*)?$/
const OLD_ASSEMBLY_NO_STATE_PATTERN = /^\/assembly\/((?:up-)?dt\d+)\/((?:up-)?ac\d+)(\/.*)?$/
const OLD_DISTRICT_NO_STATE_PATTERN = /^\/district\/((?:up-)?dt\d+)(\/.*)?$/

// Cache for ID to slug mappings
let districtIdToSlug: Map<string, string> | null = null
let assemblyIdToSlug: Map<string, string> | null = null

async function loadSlugMappings() {
  if (districtIdToSlug && assemblyIdToSlug) {
    return
  }

  try {
    const baseUrl = getServerSideURL()
    const [districtRes, assemblyRes] = await Promise.all([
      fetch(`${baseUrl}/api/slug-mappings?type=districts`, { cache: 'force-cache' }),
      fetch(`${baseUrl}/api/slug-mappings?type=assemblies`, { cache: 'force-cache' }),
    ])

    if (districtRes.ok) {
      const data = await districtRes.json()
      districtIdToSlug = new Map(Object.entries(data.mappings || {}))
    } else {
      districtIdToSlug = new Map()
    }

    if (assemblyRes.ok) {
      const data = await assemblyRes.json()
      assemblyIdToSlug = new Map(Object.entries(data.mappings || {}))
    } else {
      assemblyIdToSlug = new Map()
    }
  } catch (error) {
    console.error('Failed to load slug mappings:', error)
    districtIdToSlug = new Map()
    assemblyIdToSlug = new Map()
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Auto-redirect UP URLs that were mistakenly indexed with /tamil-nadu/ prefix
  if (
    pathname.startsWith('/tamil-nadu/assembly/up-') ||
    pathname.startsWith('/tamil-nadu/district/up-')
  ) {
    const correctedPath = pathname.replace('/tamil-nadu/', '/uttar-pradesh/')
    const newUrl = new URL(correctedPath, request.url)
    newUrl.search = request.nextUrl.search
    return NextResponse.redirect(newUrl, { status: 301 })
  }

  // 2. Handle old URLs missing stateSlug prefix entirely (e.g. /assembly/dt13/ac123/booths)
  const assemblyNoStateMatch = pathname.match(OLD_ASSEMBLY_NO_STATE_PATTERN)
  if (assemblyNoStateMatch) {
    const [, districtId, assemblyId, rest = ''] = assemblyNoStateMatch
    await loadSlugMappings()
    const isUp = districtId.startsWith('up-') || assemblyId.startsWith('up-')
    const stateSlug = isUp ? 'uttar-pradesh' : DEFAULT_STATE_SLUG
    const districtSlug = districtIdToSlug?.get(districtId)
    const assemblySlug = assemblyIdToSlug?.get(assemblyId)

    if (districtSlug && assemblySlug) {
      const newUrl = new URL(
        `/${stateSlug}/assembly/${districtSlug}/${assemblySlug}${rest}`,
        request.url,
      )
      newUrl.search = request.nextUrl.search
      return NextResponse.redirect(newUrl, { status: 301 })
    }
  }

  const districtNoStateMatch = pathname.match(OLD_DISTRICT_NO_STATE_PATTERN)
  if (districtNoStateMatch) {
    const [, districtId, rest = ''] = districtNoStateMatch
    await loadSlugMappings()
    const isUp = districtId.startsWith('up-')
    const stateSlug = isUp ? 'uttar-pradesh' : DEFAULT_STATE_SLUG
    const districtSlug = districtIdToSlug?.get(districtId)

    if (districtSlug) {
      const newUrl = new URL(
        `/${stateSlug}/district/${districtSlug}${rest}`,
        request.url,
      )
      newUrl.search = request.nextUrl.search
      return NextResponse.redirect(newUrl, { status: 301 })
    }
  }

  // 3. Handle old ID-based assembly URLs (e.g. /tamil-nadu/assembly/dt1/ac045)
  const assemblyMatch = pathname.match(OLD_ASSEMBLY_URL_PATTERN)
  if (assemblyMatch) {
    const [, stateSlug, districtId, assemblyId, rest = ''] = assemblyMatch
    await loadSlugMappings()
    const districtSlug = districtIdToSlug?.get(districtId)
    const assemblySlug = assemblyIdToSlug?.get(assemblyId)

    if (districtSlug && assemblySlug) {
      const targetState = (assemblyId.startsWith('up-') || districtId.startsWith('up-')) ? 'uttar-pradesh' : stateSlug
      const newUrl = new URL(
        `/${targetState}/assembly/${districtSlug}/${assemblySlug}${rest}`,
        request.url,
      )
      newUrl.search = request.nextUrl.search
      return NextResponse.redirect(newUrl, { status: 301 })
    }
  }

  // 4. Handle old ID-based district URLs (e.g. /tamil-nadu/district/dt1)
  const districtMatch = pathname.match(OLD_DISTRICT_URL_PATTERN)
  if (districtMatch) {
    const [, stateSlug, districtId, rest = ''] = districtMatch
    await loadSlugMappings()
    const districtSlug = districtIdToSlug?.get(districtId)

    if (districtSlug) {
      const targetState = districtId.startsWith('up-') ? 'uttar-pradesh' : stateSlug
      const newUrl = new URL(
        `/${targetState}/district/${districtSlug}${rest}`,
        request.url,
      )
      newUrl.search = request.nextUrl.search
      return NextResponse.redirect(newUrl, { status: 301 })
    }
  }

  return NextResponse.next()
}

export const config = {
  // Correct Next.js matcher syntax to intercept assembly and district paths
  matcher: [
    '/:stateSlug/assembly/:path*',
    '/:stateSlug/district/:path*',
    '/assembly/:path*',
    '/district/:path*',
  ],
}
