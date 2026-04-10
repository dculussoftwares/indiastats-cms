'use client'

/**
 * DEPRECATED: Analytics Utilities
 *
 * This file is kept for backward compatibility.
 *
 * New code should use the standardized analytics from '@/analytics' instead:
 *
 * @example
 * import { events, setPageContext } from '@/analytics'
 *
 * // Set page context once
 * setPageContext({ page_name: 'Assembly Detail', page_url: location.href })
 *
 * // Use typed event functions
 * events.assembly.viewed({ assembly_id: 'ac001', ... })
 * events.ui.buttonClicked({ button_name: 'download', ... })
 */

import { track as coreTrack, setPageContext } from '@/analytics/tracker'
import { normalizeEventName, normalizeProperties } from '@/analytics/tracker'

// ============================================
// Backward Compatibility Re-exports
// ============================================

/**
 * @deprecated Use '@/analytics' instead. Track an event across all analytics platforms.
 */
export const track = (eventName: string, properties?: Record<string, unknown>) => {
    const normalizedEventName = normalizeEventName(eventName)
    const normalizedProperties = normalizeProperties(properties)
    coreTrack(normalizedEventName, normalizedProperties)
}

/**
 * @deprecated Use '@/analytics/tracker' instead.
 */
export const setUserProperties = (properties: Record<string, unknown>) => {
    const { setUserProperties: setCoreUserProperties } = require('@/analytics/tracker')
    setCoreUserProperties(properties)
}

/**
 * @deprecated Use '@/analytics/tracker' instead.
 */
export const identify = (userId: string, properties?: Record<string, unknown>) => {
    const { identify: coreIdentify } = require('@/analytics/tracker')
    coreIdentify(userId, properties)
}

// ============================================
// Backward Compatibility Wrapper Functions
// ============================================

/**
 * @deprecated Use 'events.ui.buttonClicked()' instead
 */
export const trackButtonClick = (buttonName: string, properties?: Record<string, unknown>) => {
    track('button_clicked', {
        button_name: buttonName,
        ...properties,
    })
}

/**
 * @deprecated Use 'events.assembly.viewed()' instead
 */
export const trackViewAssembly = (assemblyId: string, assemblyName: string, districtName: string) => {
    track('assembly_viewed', {
        assembly_id: assemblyId,
        assembly_name: assemblyName,
        district_name: districtName,
    })
}

/**
 * @deprecated Use 'events.assembly.quickViewOpened()' instead
 */
export const trackQuickViewOpen = (assemblyId: string, assemblyName: string) => {
    track('quick_view_opened', {
        assembly_id: assemblyId,
        assembly_name: assemblyName,
    })
}

/**
 * @deprecated Use 'events.assembly.quickViewDownloaded()' instead
 */
export const trackQuickViewDownload = (assemblyId: string, assemblyName: string) => {
    track('quick_view_downloaded', {
        assembly_id: assemblyId,
        assembly_name: assemblyName,
    })
}

/**
 * @deprecated Use 'events.ui.shareInitiated()' instead
 */
export const trackShare = (platform: 'twitter' | 'instagram' | 'copy_link', contentType: string, contentId?: string) => {
    track('share_initiated', {
        share_platform: platform,
        content_type: contentType,
        content_id: contentId,
    })
}

/**
 * @deprecated Use 'events.search.performed()' instead
 */
export const trackSearch = (searchQuery: string, resultsCount: number, searchType: 'assembly' | 'district' | 'direct') => {
    track('search_performed', {
        search_query: searchQuery,
        results_count: resultsCount,
        search_type: searchType,
    })
}

/**
 * @deprecated Use 'events.search.resultClicked()' instead
 */
export const trackSearchResultClick = (resultId: string, resultName: string, searchType: string) => {
    track('search_result_clicked', {
        result_id: resultId,
        result_name: resultName,
        search_type: searchType,
    })
}

/**
 * @deprecated Use 'events.ui.themeChanged()' instead
 */
export const trackThemeChange = (theme: 'light' | 'dark' | 'system') => {
    track('theme_changed', {
        theme,
    })
}

/**
 * @deprecated Use 'events.ui.linkClicked()' or map-specific events instead
 */
export const trackMapInteraction = (action: 'zoom' | 'pan' | 'click_constituency' | 'select_year', details?: Record<string, unknown>) => {
    track(`map_${action}`, {
        action,
        ...details,
    })
}

/**
 * @deprecated Use 'events.assembly.electionYearSelected()' instead
 */
export const trackElectionYearSelect = (year: string, mode: 'solo' | 'compare') => {
    track('assembly_election_year_selected', {
        selected_year: year,
        mode,
    })
}

/**
 * @deprecated Use 'events.ui.navigationOccurred()' instead
 */
export const trackNavigation = (from: string, to: string) => {
    track('navigation_occurred', {
        from_page: from,
        to_page: to,
    })
}

/**
 * @deprecated Use 'events.errors.occurred()' instead
 */
export const trackError = (errorType: string, errorMessage?: string, pageUrl?: string) => {
    track('error_occurred', {
        error_type: errorType,
        error_message: errorMessage,
        page_url: pageUrl,
    })
}

/**
 * @deprecated Use 'events.pageViews.viewed()' instead
 */
export const trackPageView = (pageName: string, pageUrl: string, properties?: Record<string, unknown>) => {
    setPageContext({
        page_name: pageName,
        page_url: pageUrl,
    })
    track('page_view', {
        page_name: pageName,
        page_url: pageUrl,
        ...properties,
    })
}

declare global {
    interface Window {
        gtag?: (command: string, ...args: any[]) => void
        dataLayer?: any[]
    }
}
