import posthog from 'posthog-js'
import mixpanel from 'mixpanel-browser'

// Track Mixpanel initialization state
let mixpanelReady = false

function initPostHog() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://t.indiastats.org',
    defaults: '2026-01-30',
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') ph.opt_out_capturing()
    },
    capture_pageview: true,
    capture_pageleave: true,
    respect_dnt: true,
    disable_session_recording: process.env.NODE_ENV === 'development',
  })
}

function initMixpanel() {
  if (!process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) return
  mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN, {
    debug: process.env.NODE_ENV === 'development',
    track_pageview: true,
    persistence: 'localStorage',
    autocapture: true,
    record_sessions_percent: 5,
    record_mask_text_class: '',
    record_mask_text_selector: '',
    loaded: () => {
      mixpanelReady = true
      if (process.env.NODE_ENV === 'development') console.log('[Mixpanel] Initialized')
    },
  })
}

// Defer both SDKs until the browser is idle so they don't compete with
// React hydration on the main thread (INP improvement ~150-400ms).
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => { initPostHog(); initMixpanel() })
  } else {
    // Safari fallback — defer by one task after hydration
    setTimeout(() => { initPostHog(); initMixpanel() }, 0)
  }
}

export { posthog, mixpanel, mixpanelReady }
