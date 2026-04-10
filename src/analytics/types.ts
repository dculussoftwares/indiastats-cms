/**
 * Analytics Types & Interfaces
 * Defines all types for standardized event tracking
 */

// ============================================
// Universal Event Properties
// ============================================

export interface UniversalEventProperties {
  /** Page identifier (required) */
  page_name: string
  /** Current page URL (required) */
  page_url?: string
  /** URL path only (required) */
  page_path?: string

  /** User/session context */
  user_id?: string
  session_id?: string

  /** Timestamp */
  timestamp?: number

  /** Navigation context */
  referrer_url?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string

  /** Device/browser context */
  locale?: string
  user_agent?: string
}

// ============================================
// Page View Events
// ============================================

export interface PageViewProperties extends UniversalEventProperties {
  page_type: 'homepage' | 'assembly' | 'district' | 'search' | 'error' | 'other'
  page_title?: string
}

// ============================================
// Assembly Events
// ============================================

export interface AssemblyViewedProperties extends UniversalEventProperties {
  assembly_id: string
  assembly_name: string
  assembly_number?: number
  district_id?: string
  district_name: string
  is_reserved?: boolean
}

export interface QuickViewProperties extends UniversalEventProperties {
  assembly_id: string
  assembly_name: string
  district_name?: string
  action: 'open' | 'download' | 'share'
}

export interface AssemblyComparedProperties extends UniversalEventProperties {
  assembly_id: string
  assembly_name: string
  years_compared: number[]
  total_elections: number
}

// ============================================
// Search Events
// ============================================

export interface SearchPerformedProperties extends UniversalEventProperties {
  search_query: string
  search_type: 'assembly' | 'district' | 'direct'
  results_count: number
  search_timestamp?: number
  is_refined_search?: boolean
}

export interface SearchResultClickedProperties extends UniversalEventProperties {
  search_query: string
  result_id: string
  result_name: string
  result_type: 'assembly' | 'district'
  result_position: number
  search_type: 'assembly' | 'district' | 'direct'
}

// ============================================
// Share Events
// ============================================

export interface ShareInitiatedProperties extends UniversalEventProperties {
  share_platform: 'twitter' | 'instagram' | 'copy_link'
  content_type: 'quick_view' | 'assembly_page' | 'election_data'
  content_id?: string
  is_successful?: boolean
}

// ============================================
// UI Events
// ============================================

export interface ButtonClickedProperties extends UniversalEventProperties {
  button_name: string
  button_label?: string
  button_location?: string
  element_id?: string
  context?: Record<string, unknown>
}

export interface ThemeChangedProperties extends UniversalEventProperties {
  theme: 'light' | 'dark' | 'system'
  previous_theme?: 'light' | 'dark' | 'system'
}

// ============================================
// Election/Map Events
// ============================================

export interface MapInteractionProperties extends UniversalEventProperties {
  action: 'zoom' | 'pan' | 'click_constituency'
  zoom_level?: number
  selected_year?: number
  selected_constituency?: string
}

export interface ElectionYearSelectedProperties extends UniversalEventProperties {
  selected_year: number
  mode: 'solo' | 'compare'
  compared_years?: number[]
}

// ============================================
// Error Events
// ============================================

export interface ErrorOccurredProperties extends UniversalEventProperties {
  error_type: string
  error_message: string
  error_stack?: string
  component_name?: string
  error_severity: 'low' | 'medium' | 'high' | 'critical'
  is_user_action_error?: boolean
}

export interface NotFoundProperties extends UniversalEventProperties {
  attempted_url: string
  referrer?: string
}

// ============================================
// User Interaction Events
// ============================================

export interface NavigationOccurredProperties extends UniversalEventProperties {
  from_page: string
  to_page: string
  navigation_type?: 'link_click' | 'button_click' | 'back_button' | 'programmatic'
}

export interface LinkClickedProperties extends UniversalEventProperties {
  link_url: string
  link_text?: string
  link_location?: string
  is_external?: boolean
}

// ============================================
// Generic Event Type
// ============================================

export type EventProperties = UniversalEventProperties & Record<string, unknown>

// ============================================
// Event Handler Type
// ============================================

export type EventHandler = (properties: EventProperties) => void

// ============================================
// Analytics Provider Interface
// ============================================

export interface AnalyticsProvider {
  name: string
  track: (eventName: string, properties?: Record<string, unknown>) => void
  identify?: (userId: string, properties?: Record<string, unknown>) => void
  setUserProperties?: (properties: Record<string, unknown>) => void
  setPageContext?: (pageContext: Partial<UniversalEventProperties>) => void
}
