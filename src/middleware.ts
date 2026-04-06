import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware to handle backwards-compatible redirects from old ID-based URLs
 * to new slug-based URLs.
 * 
 * Old format: /tamil-nadu/assembly/dt1/ac008/booths
 * New format: /tamil-nadu/assembly/tiruvallur/ambattur/booths
 * 
 * Also handles district URLs:
 * Old format: /tamil-nadu/district/dt1
 * New format: /tamil-nadu/district/tiruvallur
 */

// Regex patterns to detect old ID-based URLs
const OLD_ASSEMBLY_URL_PATTERN = /^\/([^/]+)\/assembly\/(dt\d+)\/(ac\d+)(\/.*)?$/
const OLD_DISTRICT_URL_PATTERN = /^\/([^/]+)\/district\/(dt\d+)(\/.*)?$/

// Cache for ID to slug mappings (populated on first request)
let districtIdToSlug: Map<string, string> | null = null
let assemblyIdToSlug: Map<string, string> | null = null

async function loadSlugMappings() {
    if (districtIdToSlug && assemblyIdToSlug) {
        return
    }

    try {
        // Fetch from internal API endpoints
        const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

        // Load district mappings
        const districtRes = await fetch(`${baseUrl}/api/slug-mappings?type=districts`, {
            cache: 'force-cache',
        })
        if (districtRes.ok) {
            const data = await districtRes.json()
            districtIdToSlug = new Map(Object.entries(data.mappings || {}))
        } else {
            districtIdToSlug = new Map()
        }

        // Load assembly mappings
        const assemblyRes = await fetch(`${baseUrl}/api/slug-mappings?type=assemblies`, {
            cache: 'force-cache',
        })
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

    // Check if this is an old assembly URL
    const assemblyMatch = pathname.match(OLD_ASSEMBLY_URL_PATTERN)
    if (assemblyMatch) {
        const [, stateSlug, districtId, assemblyId, rest = ''] = assemblyMatch

        await loadSlugMappings()

        const districtSlug = districtIdToSlug?.get(districtId)
        const assemblySlug = assemblyIdToSlug?.get(assemblyId)

        if (districtSlug && assemblySlug) {
            const newUrl = new URL(
                `/${stateSlug}/assembly/${districtSlug}/${assemblySlug}${rest}`,
                request.url
            )
            // Preserve query parameters
            newUrl.search = request.nextUrl.search

            return NextResponse.redirect(newUrl, { status: 301 })
        }
    }

    // Check if this is an old district URL
    const districtMatch = pathname.match(OLD_DISTRICT_URL_PATTERN)
    if (districtMatch) {
        const [, stateSlug, districtId, rest = ''] = districtMatch

        await loadSlugMappings()

        const districtSlug = districtIdToSlug?.get(districtId)

        if (districtSlug) {
            const newUrl = new URL(
                `/${stateSlug}/district/${districtSlug}${rest}`,
                request.url
            )
            // Preserve query parameters
            newUrl.search = request.nextUrl.search

            return NextResponse.redirect(newUrl, { status: 301 })
        }
    }

    return NextResponse.next()
}

export const config = {
    // Only run middleware on frontend routes that might contain old IDs
    matcher: [
        '/:stateSlug/assembly/dt:districtNum/:path*',
        '/:stateSlug/district/dt:districtNum/:path*',
    ],
}
