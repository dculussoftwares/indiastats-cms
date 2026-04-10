/**
 * Page View Events
 * Events related to page views and page-level tracking
 */

import { track, setPageContext } from '../tracker'
import type { PageViewProperties, AssemblyViewedProperties } from '../types'

// ============================================
// Generic Page Views
// ============================================

/**
 * Track generic page view
 */
export const viewed = (properties: PageViewProperties) => {
  // Set page context for subsequent events
  setPageContext({
    page_name: properties.page_name,
    page_url: properties.page_url,
    page_path: properties.page_path,
  })

  track('page_view', {
    page_type: properties.page_type,
    page_title: properties.page_title,
    page_name: properties.page_name,
    page_url: properties.page_url,
    page_path: properties.page_path,
    referrer_url: properties.referrer_url,
  })
}

// ============================================
// Specific Page Views
// ============================================

/**
 * Track homepage view
 */
export const homePageViewed = (properties: Omit<PageViewProperties, 'page_type'>) => {
  setPageContext({
    page_name: 'Homepage',
    page_url: properties.page_url,
    page_path: '/',
  })

  track('page_view_homepage', {
    page_name: 'Homepage',
    page_url: properties.page_url,
    page_path: '/',
  })
}

/**
 * Track assembly detail page view
 */
export const assemblyPageViewed = (properties: AssemblyViewedProperties) => {
  setPageContext({
    page_name: 'Assembly Detail',
    page_url: properties.page_url,
    page_path: properties.page_path,
  })

  track('page_view_assembly', {
    page_name: 'Assembly Detail',
    page_url: properties.page_url,
    page_path: properties.page_path,
    assembly_id: properties.assembly_id,
    assembly_name: properties.assembly_name,
    district_name: properties.district_name,
  })
}

/**
 * Track district detail page view
 */
export const districtPageViewed = (
  properties: PageViewProperties & {
    district_id: string
    district_name: string
    assembly_count?: number
  },
) => {
  setPageContext({
    page_name: 'District Detail',
    page_url: properties.page_url,
    page_path: properties.page_path,
  })

  track('page_view_district', {
    page_name: 'District Detail',
    page_url: properties.page_url,
    page_path: properties.page_path,
    district_id: properties.district_id,
    district_name: properties.district_name,
    assembly_count: properties.assembly_count,
  })
}

/**
 * Track search results page view
 */
export const searchPageViewed = (
  properties: PageViewProperties & {
    search_query?: string
    results_count?: number
  },
) => {
  setPageContext({
    page_name: 'Search Results',
    page_url: properties.page_url,
    page_path: properties.page_path,
  })

  track('page_view_search', {
    page_name: 'Search Results',
    page_url: properties.page_url,
    page_path: properties.page_path,
    search_query: properties.search_query,
    results_count: properties.results_count,
  })
}

/**
 * Track election data page view
 */
export const electionDataPageViewed = (properties: PageViewProperties) => {
  setPageContext({
    page_name: 'Election Data',
    page_url: properties.page_url,
    page_path: properties.page_path,
  })

  track('page_view_election_data', {
    page_name: 'Election Data',
    page_url: properties.page_url,
    page_path: properties.page_path,
  })
}

/**
 * Track caste demographics page view
 */
export const casteDemographicsPageViewed = (properties: PageViewProperties) => {
  setPageContext({
    page_name: 'Caste Demographics',
    page_url: properties.page_url,
    page_path: properties.page_path,
  })

  track('page_view_caste_demographics', {
    page_name: 'Caste Demographics',
    page_url: properties.page_url,
    page_path: properties.page_path,
  })
}

/**
 * Track dashboard page view
 */
export const dashboardPageViewed = (properties: PageViewProperties) => {
  setPageContext({
    page_name: 'Dashboard',
    page_url: properties.page_url,
    page_path: properties.page_path,
  })

  track('page_view_dashboard', {
    page_name: 'Dashboard',
    page_url: properties.page_url,
    page_path: properties.page_path,
  })
}

/**
 * Track booths page view
 */
export const boothsPageViewed = (
  properties: PageViewProperties & {
    assembly_id?: string
    booth_count?: number
  },
) => {
  setPageContext({
    page_name: 'Booths',
    page_url: properties.page_url,
    page_path: properties.page_path,
  })

  track('page_view_booths', {
    page_name: 'Booths',
    page_url: properties.page_url,
    page_path: properties.page_path,
    assembly_id: properties.assembly_id,
    booth_count: properties.booth_count,
  })
}

/**
 * Track booth detail page view
 */
export const boothDetailPageViewed = (
  properties: PageViewProperties & {
    booth_id: string
    assembly_id?: string
  },
) => {
  setPageContext({
    page_name: 'Booth Detail',
    page_url: properties.page_url,
    page_path: properties.page_path,
  })

  track('page_view_booth_detail', {
    page_name: 'Booth Detail',
    page_url: properties.page_url,
    page_path: properties.page_path,
    booth_id: properties.booth_id,
    assembly_id: properties.assembly_id,
  })
}

/**
 * Track 404 page view
 */
export const notFoundPageViewed = (properties: PageViewProperties) => {
  setPageContext({
    page_name: '404 Not Found',
    page_url: properties.page_url,
    page_path: properties.page_path,
  })

  track('page_view_404', {
    page_name: '404 Not Found',
    page_url: properties.page_url,
    page_path: properties.page_path,
    attempted_path: properties.page_path,
  })
}

/**
 * Track custom/blog page view
 */
export const customPageViewed = (
  properties: PageViewProperties & {
    page_slug?: string
    post_slug?: string
  },
) => {
  setPageContext({
    page_name: properties.page_name,
    page_url: properties.page_url,
    page_path: properties.page_path,
  })

  track('page_view_custom', {
    page_name: properties.page_name,
    page_url: properties.page_url,
    page_path: properties.page_path,
    page_slug: properties.page_slug,
    post_slug: properties.post_slug,
  })
}

// ============================================
// Export namespace
// ============================================

export const pageViews = {
  viewed,
  homePageViewed,
  assemblyPageViewed,
  districtPageViewed,
  searchPageViewed,
  electionDataPageViewed,
  casteDemographicsPageViewed,
  dashboardPageViewed,
  boothsPageViewed,
  boothDetailPageViewed,
  notFoundPageViewed,
  customPageViewed,
}
