'use client'

import { posthog, mixpanel } from '@/instrumentation-client'
import { trackEvent, setDimension } from '@/utilities/clarityTracking'

/**
 * Unified Analytics Utility
 * Sends events to PostHog, Mixpanel, and Clarity simultaneously
 */

// ============================================
// Core Tracking Functions
// ============================================

/**
 * Track an event across all analytics platforms
 */
export const track = (eventName: string, properties?: Record<string, unknown>) => {
    // PostHog
    if (posthog && typeof posthog.capture === 'function') {
        try {
            posthog.capture(eventName, properties)
        } catch {
            // Silently fail if PostHog is not ready
        }
    }

    // Mixpanel
    if (mixpanel && typeof mixpanel.track === 'function') {
        try {
            mixpanel.track(eventName, properties)
        } catch {
            // Silently fail if Mixpanel is not ready
        }
    }

    // Clarity (event only, no properties support)
    try {
        trackEvent(eventName.toLowerCase().replace(/\s+/g, '_'))
    } catch {
        // Silently fail if Clarity is not ready
    }
}

/**
 * Set user properties across all platforms
 */
export const setUserProperties = (properties: Record<string, unknown>) => {
    // PostHog
    if (posthog && posthog.people && typeof posthog.people.set === 'function') {
        try {
            posthog.people.set(properties)
        } catch {
            // Silently fail
        }
    }

    // Mixpanel
    if (mixpanel && mixpanel.people && typeof mixpanel.people.set === 'function') {
        try {
            mixpanel.people.set(properties)
        } catch {
            // Silently fail
        }
    }

    // Clarity - set each property as a dimension
    Object.entries(properties).forEach(([key, value]) => {
        if (typeof value === 'string') {
            try {
                setDimension(key, value)
            } catch {
                // Silently fail
            }
        }
    })
}

/**
 * Identify a user across all platforms
 */
export const identify = (userId: string, properties?: Record<string, unknown>) => {
    // PostHog
    if (posthog && typeof posthog.identify === 'function') {
        try {
            posthog.identify(userId, properties)
        } catch {
            // Silently fail
        }
    }

    // Mixpanel
    if (mixpanel && typeof mixpanel.identify === 'function') {
        try {
            mixpanel.identify(userId)
            if (properties && mixpanel.people && typeof mixpanel.people.set === 'function') {
                mixpanel.people.set(properties)
            }
        } catch {
            // Silently fail
        }
    }
}

// ============================================
// Pre-defined Button Events for IndiaStats
// ============================================

/**
 * Track button click with consistent naming
 */
export const trackButtonClick = (buttonName: string, properties?: Record<string, unknown>) => {
    track('Button Click', {
        button_name: buttonName,
        ...properties,
    })
}

// View Assembly Button
export const trackViewAssembly = (assemblyId: string, assemblyName: string, districtName: string) => {
    track('View Assembly', {
        assembly_id: assemblyId,
        assembly_name: assemblyName,
        district_name: districtName,
    })
}

// Quick View Modal
export const trackQuickViewOpen = (assemblyId: string, assemblyName: string) => {
    track('Quick View Open', {
        assembly_id: assemblyId,
        assembly_name: assemblyName,
    })
}

export const trackQuickViewDownload = (assemblyId: string, assemblyName: string) => {
    track('Quick View Download', {
        assembly_id: assemblyId,
        assembly_name: assemblyName,
    })
}

// Share Events
export const trackShare = (platform: 'twitter' | 'instagram' | 'copy_link', contentType: string, contentId?: string) => {
    track('Share', {
        platform,
        content_type: contentType,
        content_id: contentId,
    })
}

// Search Events
export const trackSearch = (searchQuery: string, resultsCount: number, searchType: 'assembly' | 'district' | 'direct') => {
    track('Search', {
        search_query: searchQuery,
        results_count: resultsCount,
        search_type: searchType,
    })
}

export const trackSearchResultClick = (resultId: string, resultName: string, searchType: string) => {
    track('Search Result Click', {
        result_id: resultId,
        result_name: resultName,
        search_type: searchType,
    })
}

// Theme Change
export const trackThemeChange = (theme: 'light' | 'dark' | 'system') => {
    track('Theme Change', {
        theme,
    })
}

// Map Interactions
export const trackMapInteraction = (action: 'zoom' | 'pan' | 'click_constituency' | 'select_year', details?: Record<string, unknown>) => {
    track('Map Interaction', {
        action,
        ...details,
    })
}

// Election Year Selection
export const trackElectionYearSelect = (year: string, mode: 'solo' | 'compare') => {
    track('Election Year Select', {
        year,
        mode,
    })
}

// Navigation
export const trackNavigation = (from: string, to: string) => {
    track('Navigation', {
        from_page: from,
        to_page: to,
    })
}

// Error Tracking
export const trackError = (errorType: string, errorMessage?: string, pageUrl?: string) => {
    track('Error', {
        error_type: errorType,
        error_message: errorMessage,
        page_url: pageUrl,
    })
}

// Page View (for manual use if needed)
export const trackPageView = (pageName: string, pageUrl: string, properties?: Record<string, unknown>) => {
    track('Page View', {
        page_name: pageName,
        page_url: pageUrl,
        ...properties,
    })
}
