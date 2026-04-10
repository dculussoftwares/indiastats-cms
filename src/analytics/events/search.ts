/**
 * Search Events
 * Events related to searching for assemblies, districts, and navigating results
 */

import { track } from '../tracker'
import type { SearchPerformedProperties, SearchResultClickedProperties } from '../types'

// ============================================
// Search Performed
// ============================================

/**
 * Track when user performs a search
 */
export const performed = (properties: SearchPerformedProperties) => {
  track('search_performed', {
    search_query: properties.search_query,
    search_type: properties.search_type,
    results_count: properties.results_count,
    is_refined_search: properties.is_refined_search ?? false,
    page_name: properties.page_name,
    page_url: properties.page_url,
  })
}

/**
 * Track when user refines/modifies their search
 */
export const refined = (properties: SearchPerformedProperties) => {
  track('search_refined', {
    search_query: properties.search_query,
    search_type: properties.search_type,
    results_count: properties.results_count,
    page_name: properties.page_name,
  })
}

// ============================================
// Search Results
// ============================================

/**
 * Track when user clicks on a search result
 */
export const resultClicked = (properties: SearchResultClickedProperties) => {
  track('search_result_clicked', {
    search_query: properties.search_query,
    result_id: properties.result_id,
    result_name: properties.result_name,
    result_type: properties.result_type,
    result_position: properties.result_position,
    search_type: properties.search_type,
    page_name: properties.page_name,
  })
}

/**
 * Track when user views search results (no click)
 */
export const resultsViewed = (properties: SearchPerformedProperties) => {
  track('search_results_viewed', {
    search_query: properties.search_query,
    search_type: properties.search_type,
    results_count: properties.results_count,
    page_name: properties.page_name,
  })
}

// ============================================
// Search Filters
// ============================================

/**
 * Track when user applies or changes search filters
 */
export const filterApplied = (
  properties: SearchPerformedProperties & {
    filter_name: string
    filter_value: string
  },
) => {
  track('search_filter_applied', {
    search_type: properties.search_type,
    filter_name: properties.filter_name,
    filter_value: properties.filter_value,
    results_count: properties.results_count,
    page_name: properties.page_name,
  })
}

/**
 * Track when user clears search
 */
export const cleared = (
  properties: SearchPerformedProperties & {
    had_results?: boolean
  },
) => {
  track('search_cleared', {
    search_type: properties.search_type,
    had_results: properties.had_results ?? false,
    page_name: properties.page_name,
  })
}

// ============================================
// Export namespace
// ============================================

export const search = {
  performed,
  refined,
  resultClicked,
  resultsViewed,
  filterApplied,
  cleared,
}
