/**
 * Error Events
 * Events related to errors, exceptions, and error boundaries
 */

import { track } from '../tracker'
import type { ErrorOccurredProperties, NotFoundProperties } from '../types'

// ============================================
// Error Tracking
// ============================================

/**
 * Track when an error occurs in the application
 */
export const occurred = (properties: ErrorOccurredProperties) => {
  track('error_occurred', {
    error_type: properties.error_type,
    error_message: properties.error_message,
    error_stack: properties.error_stack?.substring(0, 100), // Limit length
    component_name: properties.component_name,
    error_severity: properties.error_severity,
    is_user_action_error: properties.is_user_action_error ?? false,
    page_name: properties.page_name,
    page_url: properties.page_url,
  })
}

/**
 * Track network errors (fetch failures, timeouts, etc.)
 */
export const networkError = (
  properties: ErrorOccurredProperties & {
    endpoint?: string
    http_status?: number
    retry_count?: number
  },
) => {
  track('error_network', {
    error_type: 'network_error',
    error_message: properties.error_message,
    endpoint: properties.endpoint,
    http_status: properties.http_status,
    retry_count: properties.retry_count ?? 0,
    error_severity: properties.error_severity,
    page_name: properties.page_name,
  })
}

/**
 * Track validation errors
 */
export const validationError = (
  properties: ErrorOccurredProperties & {
    form_name?: string
    field_name?: string
    validation_type?: string
  },
) => {
  track('error_validation', {
    error_message: properties.error_message,
    form_name: properties.form_name,
    field_name: properties.field_name,
    validation_type: properties.validation_type,
    page_name: properties.page_name,
  })
}

/**
 * Track parsing/format errors
 */
export const parsingError = (
  properties: ErrorOccurredProperties & {
    data_source?: string
    expected_format?: string
  },
) => {
  track('error_parsing', {
    error_message: properties.error_message,
    data_source: properties.data_source,
    expected_format: properties.expected_format,
    error_severity: properties.error_severity,
    page_name: properties.page_name,
  })
}

// ============================================
// 404 Not Found
// ============================================

/**
 * Track 404 page not found errors
 */
export const notFound = (properties: NotFoundProperties) => {
  track('error_404_not_found', {
    attempted_url: properties.attempted_url,
    referrer: properties.referrer,
    page_name: properties.page_name,
  })
}

// ============================================
// Error Boundary
// ============================================

/**
 * Track when error boundary catches an error
 */
export const boundaryTriggered = (
  properties: ErrorOccurredProperties & {
    boundary_name?: string
    fallback_rendered?: boolean
  },
) => {
  track('error_boundary_triggered', {
    error_type: properties.error_type,
    error_message: properties.error_message,
    boundary_name: properties.boundary_name,
    fallback_rendered: properties.fallback_rendered ?? false,
    component_name: properties.component_name,
    error_severity: 'high', // Error boundaries are always high severity
    page_name: properties.page_name,
  })
}

/**
 * Track unhandled promise rejections
 */
export const unhandledRejection = (
  properties: ErrorOccurredProperties & {
    promise_reason?: string
  },
) => {
  track('error_unhandled_rejection', {
    error_message: properties.error_message,
    promise_reason: properties.promise_reason,
    error_severity: properties.error_severity,
    page_name: properties.page_name,
  })
}

// ============================================
// Export namespace
// ============================================

export const errors = {
  occurred,
  networkError,
  validationError,
  parsingError,
  notFound,
  boundaryTriggered,
  unhandledRejection,
}
