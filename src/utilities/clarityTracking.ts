'use client'

import Clarity from '@microsoft/clarity'

/**
 * Clarity Tracking Utilities
 * Provides methods to track custom events, set dimensions, and identify users
 */

// Check if Clarity is initialized and available
const isClarityReady = () => {
    return (
        typeof window !== 'undefined' &&
        process.env.NODE_ENV === 'production' &&
        typeof (window as unknown as { clarity?: unknown }).clarity === 'function'
    )
}

/**
 * Track a custom event
 * Use for specific user actions like clicks, submissions, etc.
 */
export const trackEvent = (eventName: string) => {
    if (isClarityReady()) {
        try {
            Clarity.event(eventName)
        } catch {
            // Silently fail if Clarity is not ready
        }
    }
}

/**
 * Set a custom dimension/tag for the session
 * Use to add context like which assembly/district is being viewed
 */
export const setDimension = (key: string, value: string) => {
    if (isClarityReady()) {
        try {
            Clarity.setTag(key, value)
        } catch {
            // Silently fail if Clarity is not ready
        }
    }
}

/**
 * Identify a user (for admin users)
 * Links multiple sessions to the same user
 */
export const identifyUser = (userId: string, sessionId?: string, pageId?: string) => {
    if (isClarityReady()) {
        try {
            Clarity.identify(userId, sessionId, pageId)
        } catch {
            // Silently fail if Clarity is not ready
        }
    }
}

/**
 * Upgrade session priority (for important flows or errors)
 * Ensures this session is prioritized in Clarity dashboard
 */
export const upgradeSession = (reason: string) => {
    if (isClarityReady()) {
        try {
            Clarity.upgrade(reason)
        } catch {
            // Silently fail if Clarity is not ready
        }
    }
}

/**
 * Mark user consent for GDPR compliance
 * Call when user accepts cookies/tracking
 */
export const grantConsent = () => {
    if (isClarityReady()) {
        try {
            Clarity.consent()
        } catch {
            // Silently fail if Clarity is not ready
        }
    }
}

