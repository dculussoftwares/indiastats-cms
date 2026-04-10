/**
 * Analytics Events Index
 * Centralized export for all standardized event tracking functions
 */

// Export namespaces with explicit names to avoid conflicts
export { assembly } from './assembly'
export { search } from './search'
export { ui } from './ui'
export { errors } from './errors'
export { pageViews } from './pageViews'

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
 * import { assembly, search, ui, errors, pageViews } from '@/analytics/events'
 *
 * // Assembly events
 * assembly.viewed({ page_name: 'Assembly', assembly_id: 'ac001', ... })
 *
 * @example
 * // Search events
 * search.performed({ page_name: 'Homepage', search_query: 'Chennai', ... })
 *
 * @example
 * // UI events
 * ui.buttonClicked({ page_name: 'Assembly', button_name: 'download', ... })
 *
 * @example
 * // Error events
 * errors.occurred({ page_name: 'Assembly', error_type: 'network', ... })
 *
 * @example
 * // Page view events
 * pageViews.assemblyPageViewed({ page_name: 'Assembly', assembly_id: 'ac001', ... })
 */
