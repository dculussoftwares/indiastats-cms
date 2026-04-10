/**
 * Analytics Module
 * Standardized analytics tracking for India Stats CMS
 *
 * Usage:
 * ```typescript
 * import { events, setPageContext } from '@/analytics'
 *
 * // Set page context (done once per page)
 * setPageContext({ page_name: 'Assembly Detail', page_url: location.href })
 *
 * // Track events
 * events.assembly.viewed({ assembly_id: 'ac001', assembly_name: 'Chennai South' })
 * events.search.performed({ search_query: 'Chennai', results_count: 5 })
 * events.ui.buttonClicked({ button_name: 'download', button_label: 'Download' })
 * ```
 */

'use client'

// Core tracking
export { track, setPageContext, getPageContext, clearPageContext, normalizeEventName, normalizeProperties, identify, setUserProperties, registerProvider } from './tracker'

// Events - namespaced exports
export {
  assembly,
  search,
  ui,
  errors,
  pageViews,
} from './events'

// Event types
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
} from './types'

// Types
export type {
  AnalyticsProvider,
} from './types'

// Constants
export {
  PAGE_NAMES,
  EVENT_NAMES,
  BUTTON_NAMES,
  SHARE_PLATFORMS,
  SEARCH_TYPES,
  ERROR_TYPES,
  ERROR_SEVERITY,
  THEMES,
  CONTENT_TYPES,
  LINK_LOCATIONS,
} from './constants'

export type {
  PageName,
  EventName,
  ButtonName,
  SharePlatform,
  SearchType,
  ErrorType,
  ErrorSeverity,
  Theme,
  ContentType,
  LinkLocation,
} from './constants'
