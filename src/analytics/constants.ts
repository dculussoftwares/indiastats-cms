/**
 * Analytics Constants
 * Centralized definitions for page names, event names, and other constants
 */

// ============================================
// Page Names
// ============================================

export const PAGE_NAMES = {
  HOMEPAGE: 'Homepage',
  ASSEMBLY_DETAIL: 'Assembly Detail',
  ASSEMBLY_MAP: 'Assembly Map',
  DISTRICT_DETAIL: 'District Detail',
  SEARCH_RESULTS: 'Search Results',
  ELECTION_DATA: 'Election Data',
  CASTE_DEMOGRAPHICS: 'Caste Demographics',
  DASHBOARD: 'Dashboard',
  BOOTHS: 'Booths',
  BOOTH_DETAIL: 'Booth Detail',
  POSTS: 'Blog Posts',
  POST_DETAIL: 'Blog Post Detail',
  PAGES: 'Custom Pages',
  PRIVACY_POLICY: 'Privacy Policy',
  NOT_FOUND: '404 Not Found',
  ELECTION_PREDICTIONS: 'Election Predictions',
  ELECTION_RESULTS: 'Election Results',
  ELECTION_ANALYSIS: 'Election Analysis',
  SHARE: 'Share',
} as const

// ============================================
// Event Names
// ============================================

export const EVENT_NAMES = {
  // Page views
  PAGE_VIEW: 'page_view',
  PAGE_VIEW_HOMEPAGE: 'page_view_homepage',
  PAGE_VIEW_ASSEMBLY: 'page_view_assembly',
  PAGE_VIEW_DISTRICT: 'page_view_district',
  PAGE_VIEW_SEARCH: 'page_view_search',
  PAGE_VIEW_ELECTION_DATA: 'page_view_election_data',
  PAGE_VIEW_CASTE_DEMOGRAPHICS: 'page_view_caste_demographics',
  PAGE_VIEW_DASHBOARD: 'page_view_dashboard',
  PAGE_VIEW_BOOTHS: 'page_view_booths',
  PAGE_VIEW_BOOTH_DETAIL: 'page_view_booth_detail',
  PAGE_VIEW_404: 'page_view_404',

  // Assembly events
  ASSEMBLY_VIEWED: 'assembly_viewed',
  ASSEMBLY_DEMOGRAPHICS_VIEWED: 'assembly_demographics_viewed',
  QUICK_VIEW_OPENED: 'quick_view_opened',
  QUICK_VIEW_DOWNLOADED: 'quick_view_downloaded',
  ASSEMBLY_ELECTION_COMPARED: 'assembly_election_compared',
  ASSEMBLY_ELECTION_YEAR_SELECTED: 'assembly_election_year_selected',

  // Search events
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_REFINED: 'search_refined',
  SEARCH_RESULT_CLICKED: 'search_result_clicked',
  SEARCH_RESULTS_VIEWED: 'search_results_viewed',
  SEARCH_FILTER_APPLIED: 'search_filter_applied',
  SEARCH_CLEARED: 'search_cleared',

  // UI events
  BUTTON_CLICKED: 'button_clicked',
  COMMAND_PALETTE_OPENED: 'command_palette_opened',
  COMMAND_PALETTE_COMMAND_EXECUTED: 'command_palette_command_executed',
  THEME_CHANGED: 'theme_changed',
  NAVIGATION_OCCURRED: 'navigation_occurred',
  LINK_CLICKED: 'link_clicked',
  FOOTER_LINK_CLICKED: 'footer_link_clicked',
  EXTERNAL_LINK_CLICKED: 'external_link_clicked',
  SHARE_INITIATED: 'share_initiated',
  SHARE_COMPLETED: 'share_completed',
  FORM_SUBMITTED: 'form_submitted',
  FORM_FIELD_CHANGED: 'form_field_changed',

  // Prediction events
  PREDICTION_PAGE_VIEWED: 'prediction_page_viewed',
  PREDICTION_HIGHLIGHT_CLICKED: 'prediction_highlight_clicked',
  PREDICTION_VIEW_MODE_CHANGED: 'prediction_view_mode_changed',
  PREDICTION_PREDICTOR_CHANGED: 'prediction_predictor_changed',

  // Error events
  ERROR_OCCURRED: 'error_occurred',
  ERROR_NETWORK: 'error_network',
  ERROR_VALIDATION: 'error_validation',
  ERROR_PARSING: 'error_parsing',
  ERROR_404_NOT_FOUND: 'error_404_not_found',
  ERROR_BOUNDARY_TRIGGERED: 'error_boundary_triggered',
  ERROR_UNHANDLED_REJECTION: 'error_unhandled_rejection',
} as const

// ============================================
// Button Names
// ============================================

export const BUTTON_NAMES = {
  VIEW_ASSEMBLY: 'view_assembly',
  QUICK_VIEW: 'quick_view',
  DOWNLOAD_QUICK_VIEW: 'download_quick_view',
  SHARE: 'share',
  SEARCH: 'search',
  SEARCH_DIRECT: 'search_direct',
  FILTER: 'filter',
  CLEAR_FILTER: 'clear_filter',
  COMMAND_PALETTE: 'command_palette',
  THEME_TOGGLE: 'theme_toggle',
} as const

// ============================================
// Share Platforms
// ============================================

export const SHARE_PLATFORMS = {
  TWITTER: 'twitter',
  INSTAGRAM: 'instagram',
  COPY_LINK: 'copy_link',
} as const

// ============================================
// Search Types
// ============================================

export const SEARCH_TYPES = {
  ASSEMBLY: 'assembly',
  DISTRICT: 'district',
  DIRECT: 'direct',
} as const

// ============================================
// Error Types
// ============================================

export const ERROR_TYPES = {
  NETWORK_ERROR: 'network_error',
  VALIDATION_ERROR: 'validation_error',
  PARSING_ERROR: 'parsing_error',
  NOT_FOUND: 'not_found',
  BOUNDARY_ERROR: 'boundary_error',
  UNHANDLED_REJECTION: 'unhandled_rejection',
} as const

// ============================================
// Error Severity Levels
// ============================================

export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const

// ============================================
// Theme Options
// ============================================

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const

// ============================================
// Content Types
// ============================================

export const CONTENT_TYPES = {
  QUICK_VIEW: 'quick_view',
  ASSEMBLY_PAGE: 'assembly_page',
  ELECTION_DATA: 'election_data',
} as const

// ============================================
// Link Locations
// ============================================

export const LINK_LOCATIONS = {
  HEADER: 'header',
  FOOTER: 'footer',
  MODAL: 'modal',
  SIDEBAR: 'sidebar',
  INLINE: 'inline',
} as const

// ============================================
// Type Helpers
// ============================================

export type PageName = (typeof PAGE_NAMES)[keyof typeof PAGE_NAMES]
export type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES]
export type ButtonName = (typeof BUTTON_NAMES)[keyof typeof BUTTON_NAMES]
export type SharePlatform = (typeof SHARE_PLATFORMS)[keyof typeof SHARE_PLATFORMS]
export type SearchType = (typeof SEARCH_TYPES)[keyof typeof SEARCH_TYPES]
export type ErrorType = (typeof ERROR_TYPES)[keyof typeof ERROR_TYPES]
export type ErrorSeverity = (typeof ERROR_SEVERITY)[keyof typeof ERROR_SEVERITY]
export type Theme = (typeof THEMES)[keyof typeof THEMES]
export type ContentType = (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES]
export type LinkLocation = (typeof LINK_LOCATIONS)[keyof typeof LINK_LOCATIONS]
