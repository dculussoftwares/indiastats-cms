import posthog from 'posthog-js'

// Initialize PostHog for client-side analytics
// Only initialize in production and if the key is available
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
        // Disable in development
        loaded: (posthog) => {
            if (process.env.NODE_ENV === 'development') {
                posthog.opt_out_capturing()
            }
        },
        // Capture pageviews automatically
        capture_pageview: true,
        // Capture page leaves
        capture_pageleave: true,
        // Respect Do Not Track
        respect_dnt: true,
        // Disable session recording in development
        disable_session_recording: process.env.NODE_ENV === 'development',
    })
}

export { posthog }
