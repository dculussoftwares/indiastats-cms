/**
 * OpenPanel analytics provider (self-hosted).
 *
 * Browser traffic goes through a first-party path on our own domain: a
 * Cloudflare Worker serves `/_e/*` on indiastats.org and forwards to the
 * OpenPanel API, so there is no Next.js proxy route and no third-party host.
 *
 * The SDK script + init snippet are rendered by `src/providers/OpenPanel`.
 * This module is the bridge from the standard analytics layer
 * (`events.{namespace}.{action}()` → `track()`) to `window.op`, so every
 * existing event reaches OpenPanel with the same snake_case name and properties.
 *
 * Without NEXT_PUBLIC_OPENPANEL_CLIENT_ID (or outside production) everything
 * here is a silent no-op.
 */

import type { AnalyticsProvider } from '../types'

export const OPENPANEL_CLIENT_ID = process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID
export const OPENPANEL_API_URL = '/_e'
export const OPENPANEL_SCRIPT_URL = '/_e/op1.js'

/** Same gating as Clarity/PostHog: production only, and only when configured. */
export const isOpenPanelEnabled = (): boolean =>
  Boolean(OPENPANEL_CLIENT_ID) && process.env.NODE_ENV === 'production'

/**
 * Do-Not-Track check, mirroring PostHog's `respect_dnt: true`.
 * Kept as a self-contained function so its source can also be inlined as the
 * OpenPanel SDK `filter` (which drops every event, incl. screen views).
 */
export function openPanelAllowed(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { msDoNotTrack?: string }
  const w = window as Window & { doNotTrack?: string }
  const dnt = nav.doNotTrack || nav.msDoNotTrack || w.doNotTrack
  return !(dnt === '1' || dnt === 'yes')
}

/** Options shared by the <OpenPanelComponent> init snippet and the queue stub below. */
export const OPENPANEL_OPTIONS = {
  apiUrl: OPENPANEL_API_URL,
  trackScreenViews: true,
  trackOutgoingLinks: true,
  trackAttributes: true,
} as const

/** JS source passed to the SDK's `filter` option (evaluated in the browser). */
export const OPENPANEL_DNT_FILTER = `function(){var n=window.navigator,d=n.doNotTrack||n.msDoNotTrack||window.doNotTrack;return!(d==='1'||d==='yes')}`

type OpQueue = ((...args: unknown[]) => void) & { q?: unknown[][] }

// `window.op` is typed by @openpanel/web as always present; at runtime it only
// exists once the snippet (or our stub) has run, so access it loosely here.
const opWindow = () => window as unknown as { op?: OpQueue }

/**
 * Return `window.op`. If the SDK snippet hasn't run yet (events fired during
 * hydration), create the same queueing stub the official init snippet creates,
 * seeded with `init` as its FIRST entry — op1.js builds the client from the
 * first queued item and replays the rest. When the official snippet runs later
 * it reuses this stub (`window.op = window.op || ...`) and its own extra `init`
 * call is a no-op in the SDK.
 */
const getOp = (): OpQueue | undefined => {
  if (typeof window === 'undefined') return undefined
  const w = opWindow()
  if (!w.op) {
    const queue: unknown[][] = [
      ['init', { ...OPENPANEL_OPTIONS, clientId: OPENPANEL_CLIENT_ID, sdk: 'nextjs', filter: openPanelAllowed }],
    ]
    w.op = new Proxy(
      function (...args: unknown[]) {
        if (args.length) queue.push(args)
      } as OpQueue,
      {
        get: (_target, prop) =>
          prop === 'q' ? queue : (...args: unknown[]) => queue.push([prop, ...args]),
        has: (_target, prop) => prop === 'q',
      },
    )
  }
  return w.op
}

export const openPanelProvider: AnalyticsProvider = {
  name: 'OpenPanel',
  track: (eventName, properties) => {
    if (!isOpenPanelEnabled() || !openPanelAllowed()) return
    getOp()?.('track', eventName, properties ?? {})
  },
  identify: (userId, properties) => {
    if (!isOpenPanelEnabled() || !openPanelAllowed()) return
    getOp()?.('identify', { profileId: userId, ...(properties ? { properties } : {}) })
  },
}
