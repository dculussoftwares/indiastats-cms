'use client'

import Clarity from '@microsoft/clarity'

/**
 * Clarity Tracking Utilities
 * Provides methods to track custom events, set dimensions, and identify users
 */

// Check if Clarity is initialized and available
const isClarityReady = () => {
    return (
        typeof window !== 'undefined' &&
        process.env.NODE_ENV === 'production' &&
        typeof (window as unknown as { clarity?: unknown }).clarity === 'function'
    )
}

/**
 * Track a custom event
 * Use for specific user actions like clicks, submissions, etc.
 */
export const trackEvent = (eventName: string) => {
    if (isClarityReady()) {
        try {
            Clarity.event(eventName)
        } catch {
            // Silently fail if Clarity is not ready
        }
    }
}

/**
 * Set a custom dimension/tag for the session
 * Use to add context like which assembly/district is being viewed
 */
export const setDimension = (key: string, value: string) => {
    if (isClarityReady()) {
        try {
            Clarity.setTag(key, value)
        } catch {
            // Silently fail if Clarity is not ready
        }
    }
}

/**
 * Identify a user (for admin users)
 * Links multiple sessions to the same user
 */
export const identifyUser = (userId: string, sessionId?: string, pageId?: string) => {
    if (isClarityReady()) {
        try {
            Clarity.identify(userId, sessionId, pageId)
        } catch {
            // Silently fail if Clarity is not ready
        }
    }
}

/**
 * Upgrade session priority (for important flows or errors)
 * Ensures this session is prioritized in Clarity dashboard
 */
export const upgradeSession = (reason: string) => {
    if (isClarityReady()) {
        try {
            Clarity.upgrade(reason)
        } catch {
            // Silently fail if Clarity is not ready
        }
    }
}

/**
 * Mark user consent for GDPR compliance
 * Call when user accepts cookies/tracking
 */
export const grantConsent = () => {
    if (isClarityReady()) {
        try {
            Clarity.consent()
        } catch {
            // Silently fail if Clarity is not ready
        }
    }
}

// ============================================
// Pre-defined tracking functions for IndiaStats
// ============================================

// Page view tracking
export const trackPageView = (pageType: string, pageId?: string) => {
    setDimension('page_type', pageType)
    if (pageId) {
        setDimension('page_id', pageId)
    }
    trackEvent(`view_${pageType}`)
}

// Assembly tracking
export const trackAssemblyView = (assemblyId: string, assemblyName: string, districtName: string) => {
    setDimension('assembly_id', assemblyId)
    setDimension('assembly_name', assemblyName)
    setDimension('district_name', districtName)
    trackEvent('view_assembly')
}

// District tracking
export const trackDistrictView = (districtId: string, districtName: string) => {
    setDimension('district_id', districtId)
    setDimension('district_name', districtName)
    trackEvent('view_district')
}

// Search tracking
export const trackSearch = (searchType: 'assembly' | 'district', query: string, resultCount: number) => {
    setDimension('search_type', searchType)
    setDimension('search_query', query)
    setDimension('search_result_count', String(resultCount))
    trackEvent(`search_${searchType}`)
}

// Search result click
export const trackSearchResultClick = (searchType: 'assembly' | 'district', resultId: string) => {
    setDimension('clicked_result_id', resultId)
    trackEvent(`click_search_result_${searchType}`)
}

// Social share tracking
export const trackShare = (platform: 'twitter' | 'instagram' | 'copy_link', contentType: string) => {
    setDimension('share_platform', platform)
    setDimension('share_content_type', contentType)
    trackEvent(`share_${platform}`)
}

// Quick View modal tracking
export const trackQuickViewOpen = (assemblyId: string) => {
    setDimension('quick_view_assembly', assemblyId)
    trackEvent('open_quick_view')
}

export const trackQuickViewDownload = (assemblyId: string) => {
    setDimension('download_assembly', assemblyId)
    trackEvent('download_quick_view')
}

// Theme tracking
export const trackThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setDimension('theme_preference', theme)
    trackEvent('change_theme')
}

// Map interaction tracking
export const trackMapInteraction = (action: 'zoom' | 'pan' | 'click_constituency' | 'select_year', details?: string) => {
    if (details) {
        setDimension('map_action_details', details)
    }
    trackEvent(`map_${action}`)
}

// Election year selection tracking
export const trackElectionYearSelect = (year: string, mapMode: 'solo' | 'compare') => {
    setDimension('election_year', year)
    setDimension('map_mode', mapMode)
    trackEvent('select_election_year')
}

// Error tracking
export const trackError = (errorType: string, errorMessage?: string) => {
    setDimension('error_type', errorType)
    if (errorMessage) {
        setDimension('error_message', errorMessage.substring(0, 100)) // Limit length
    }
    upgradeSession(errorType) // Prioritize error sessions
    trackEvent(`error_${errorType}`)
}

// 404 page tracking
export const track404 = (attemptedUrl: string) => {
    setDimension('attempted_url', attemptedUrl)
    upgradeSession('404_error')
    trackEvent('page_not_found')
}

// Navigation tracking
export const trackNavigation = (from: string, to: string) => {
    setDimension('nav_from', from)
    setDimension('nav_to', to)
    trackEvent('navigate')
}

// Footer link clicks
export const trackFooterClick = (linkName: string) => {
    setDimension('footer_link', linkName)
    trackEvent('click_footer_link')
}

// External link clicks
export const trackExternalLink = (url: string) => {
    setDimension('external_url', url)
    trackEvent('click_external_link')
}
