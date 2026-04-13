/**
 * Analytics Events Index
 * Centralized export for all standardized event tracking functions
 */

export { trackViewed } from './viewed'
export { trackClicked } from './clicked'
export { trackImpression } from './impression'
export type { ViewedEvent } from './viewed'
export type { ClickedEvent } from './clicked'
export type { ImpressionEvent } from './impression'

// Re-export types
export type {
  AssemblyViewedProperties,
  QuickViewProperties,
  SearchPerformedProperties,
  SearchResultClickedProperties,
  ButtonClickedProperties,
  ThemeChangedProperties,
  NavigationOccurredProperties,
  LinkClickedProperties,
  ShareInitiatedProperties,
  ErrorOccurredProperties,
  NotFoundProperties,
  PageViewProperties,
  UniversalEventProperties,
  EventProperties,
} from '../types'

/**
 * Namespace for all analytics events
 *
 * @example
 * import { viewed, clicked, impression } from '@/analytics'
 *
 * // Page views
 * viewed.assemblyPage({ assembly_id: 'ac001', assembly_name: 'Chennai South', ... })
 * viewed.homePage({ page_url: '...' })
 *
 * @example
 * // User interactions
 * clicked.button({ page_name: 'Assembly', button_name: 'download', ... })
 * clicked.searchResult({ search_query: 'Chennai', result_id: 'ac001', ... })
 * clicked.share({ share_platform: 'twitter', content_type: 'assembly', ... })
 *
 * @example
 * // Passive displays
 * impression.searchResults({ search_query: 'Chennai', results_count: 5, ... })
 */
