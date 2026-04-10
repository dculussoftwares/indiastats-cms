/**
 * Assembly Events
 * Events related to assembly detail pages, quick views, and comparisons
 */

import { track } from '../tracker'
import type {
  AssemblyViewedProperties,
  QuickViewProperties,
  AssemblyComparedProperties,
} from '../types'

// ============================================
// Assembly Viewing
// ============================================

/**
 * Track when user views an assembly detail page
 */
export const viewed = (properties: AssemblyViewedProperties) => {
  track('assembly_viewed', {
    assembly_id: properties.assembly_id,
    assembly_name: properties.assembly_name,
    assembly_number: properties.assembly_number,
    district_id: properties.district_id,
    district_name: properties.district_name,
    is_reserved: properties.is_reserved,
    page_name: properties.page_name,
    page_url: properties.page_url,
    page_path: properties.page_path,
    referrer_url: properties.referrer_url,
  })
}

/**
 * Track when user views assembly demographics
 */
export const demographicsViewed = (properties: AssemblyViewedProperties) => {
  track('assembly_demographics_viewed', {
    assembly_id: properties.assembly_id,
    assembly_name: properties.assembly_name,
    district_name: properties.district_name,
    page_name: properties.page_name,
  })
}

// ============================================
// Quick View Modal
// ============================================

/**
 * Track when user opens quick view modal
 */
export const quickViewOpened = (properties: QuickViewProperties) => {
  track('quick_view_opened', {
    assembly_id: properties.assembly_id,
    assembly_name: properties.assembly_name,
    district_name: properties.district_name,
    page_name: properties.page_name,
  })
}

/**
 * Track when user downloads quick view card as image
 */
export const quickViewDownloaded = (properties: QuickViewProperties) => {
  track('quick_view_downloaded', {
    assembly_id: properties.assembly_id,
    assembly_name: properties.assembly_name,
    district_name: properties.district_name,
    page_name: properties.page_name,
  })
}

// ============================================
// Election Comparison
// ============================================

/**
 * Track when user compares election results for years
 */
export const electionCompared = (properties: AssemblyComparedProperties) => {
  track('assembly_election_compared', {
    assembly_id: properties.assembly_id,
    assembly_name: properties.assembly_name,
    years_compared: properties.years_compared,
    total_elections: properties.total_elections,
    page_name: properties.page_name,
  })
}

/**
 * Track when user selects specific election year
 */
export const electionYearSelected = (
  properties: AssemblyViewedProperties & { year: number; mode: 'solo' | 'compare' },
) => {
  track('assembly_election_year_selected', {
    assembly_id: properties.assembly_id,
    assembly_name: properties.assembly_name,
    selected_year: properties.year,
    mode: properties.mode,
    page_name: properties.page_name,
  })
}

// ============================================
// Export namespace
// ============================================

export const assembly = {
  viewed,
  demographicsViewed,
  quickViewOpened,
  quickViewDownloaded,
  electionCompared,
  electionYearSelected,
}
