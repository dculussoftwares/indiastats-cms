/**
 * Core Analytics Tracker
 * Manages event tracking, validation, and provider delegation
 */

'use client'

import { posthog, mixpanel, mixpanelReady } from '@/instrumentation-client'
import { trackEvent, setDimension } from '@/utilities/clarityTracking'
import type { UniversalEventProperties, EventProperties, AnalyticsProvider } from './types'

// GA4 Measurement ID from environment
const GA_ID = process.env.NEXT_PUBLIC_GA_ID
const isDev = typeof window !== 'undefined' && process.env.NODE_ENV === 'development'

// ============================================
// Page Context Management
// ============================================

let currentPageContext: Partial<UniversalEventProperties> = {}

export const setPageContext = (context: Partial<UniversalEventProperties>) => {
  currentPageContext = {
    ...currentPageContext,
    ...context,
  }

  if (isDev) {
    console.log('[Analytics] Page context updated:', currentPageContext)
  }
}

export const getPageContext = (): Partial<UniversalEventProperties> => {
  return { ...currentPageContext }
}

export const clearPageContext = () => {
  currentPageContext = {}
}

// ============================================
// Event Name Normalization
// ============================================

/**
 * Convert event name to snake_case format
 * Handles both space-separated and camelCase inputs
 */
export const normalizeEventName = (eventName: string): string => {
  return eventName
    .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase to snake_case
    .replace(/\s+/g, '_') // spaces to underscores
    .toLowerCase()
}

// ============================================
// Property Normalization & Validation
// ============================================

/**
 * Normalize and validate event properties
 */
export const normalizeProperties = (properties?: Record<string, unknown>): Record<string, unknown> => {
  if (!properties) return {}

  // Ensure universal properties are included
  const normalized: Record<string, unknown> = {
    ...currentPageContext,
    ...properties,
  }

  // Ensure required page_name is present
  if (!normalized.page_name) {
    if (isDev) {
      console.warn('[Analytics] Missing required property: page_name')
    }
  }

  // Filter out undefined/null values
  return Object.entries(normalized).reduce(
    (acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value
      }
      return acc
    },
    {} as Record<string, unknown>,
  )
}

// ============================================
// Provider Registration
// ============================================

const providers: AnalyticsProvider[] = []

export const registerProvider = (provider: AnalyticsProvider) => {
  providers.push(provider)
  if (isDev) {
    console.log(`[Analytics] Provider registered: ${provider.name}`)
  }
}

export const getProviders = (): AnalyticsProvider[] => {
  return providers
}

// ============================================
// Core Tracking Function
// ============================================

/**
 * Track an event across all providers
 * Handles normalization, validation, and provider delegation
 */
export const track = (eventName: string, properties?: Record<string, unknown>) => {
  try {
    // Normalize event name to snake_case
    const normalizedEventName = normalizeEventName(eventName)

    // Normalize and validate properties
    const normalizedProperties = normalizeProperties(properties)

    if (isDev) {
      console.log('[Analytics] Tracking event:', {
        eventName: normalizedEventName,
        properties: normalizedProperties,
      })
    }

    // Track with all registered providers
    providers.forEach((provider) => {
      try {
        provider.track(normalizedEventName, normalizedProperties)
      } catch (error) {
        if (isDev) {
          console.error(`[Analytics] Error tracking with ${provider.name}:`, error)
        }
      }
    })

    // Legacy provider support (backward compatibility)
    trackWithLegacyProviders(normalizedEventName, normalizedProperties)
  } catch (error) {
    if (isDev) {
      console.error('[Analytics] Tracking error:', error)
    }
  }
}

// ============================================
// Legacy Provider Support
// ============================================

/**
 * Track with platforms not yet migrated to new provider system
 */
const trackWithLegacyProviders = (eventName: string, properties: Record<string, unknown>) => {
  // PostHog
  if (posthog && typeof posthog.capture === 'function') {
    try {
      posthog.capture(eventName, properties)
    } catch {
      // Silently fail
    }
  }

  // Mixpanel
  if (mixpanelReady && mixpanel && typeof mixpanel.track === 'function') {
    try {
      mixpanel.track(eventName, properties)
    } catch (error) {
      if (isDev) {
        console.error('[Analytics] Mixpanel error:', error)
      }
    }
  }

  // Clarity (event only, no properties support)
  try {
    trackEvent(eventName)
  } catch {
    // Silently fail
  }

  // Google Analytics 4
  if (GA_ID && typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', eventName, properties)
    } catch {
      // Silently fail
    }
  }
}

// ============================================
// User Identification
// ============================================

export const identify = (userId: string, properties?: Record<string, unknown>) => {
  try {
    const normalizedProperties = properties ? normalizeProperties(properties) : undefined

    // Legacy support
    if (posthog && typeof posthog.identify === 'function') {
      posthog.identify(userId, normalizedProperties)
    }

    if (mixpanel && typeof mixpanel.identify === 'function') {
      mixpanel.identify(userId)
      if (normalizedProperties && mixpanel.people?.set) {
        mixpanel.people.set(normalizedProperties)
      }
    }

    // New provider support
    providers.forEach((provider) => {
      if (provider.identify) {
        try {
          provider.identify(userId, normalizedProperties)
        } catch (error) {
          if (isDev) {
            console.error(`[Analytics] Error identifying with ${provider.name}:`, error)
          }
        }
      }
    })
  } catch (error) {
    if (isDev) {
      console.error('[Analytics] Identification error:', error)
    }
  }
}

// ============================================
// User Properties
// ============================================

export const setUserProperties = (properties: Record<string, unknown>) => {
  try {
    const normalizedProperties = normalizeProperties(properties)

    // Legacy support
    if (posthog?.people?.set) {
      posthog.people.set(normalizedProperties)
    }

    if (mixpanel?.people?.set) {
      mixpanel.people.set(normalizedProperties)
    }

    // New provider support
    providers.forEach((provider) => {
      if (provider.setUserProperties) {
        try {
          provider.setUserProperties(normalizedProperties)
        } catch (error) {
          if (isDev) {
            console.error(`[Analytics] Error setting user properties on ${provider.name}:`, error)
          }
        }
      }
    })
  } catch (error) {
    if (isDev) {
      console.error('[Analytics] Set user properties error:', error)
    }
  }
}

// ============================================
// Window Types
// ============================================

declare global {
  interface Window {
    gtag?: (command: string, ...args: any[]) => void
    dataLayer?: any[]
  }
}
