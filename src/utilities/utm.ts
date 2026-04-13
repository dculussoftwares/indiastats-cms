/**
 * UTM Tracking Utilities
 *
 * Use these to build shareable URLs with source tracking,
 * and to parse UTM params from the current page URL.
 *
 * How it works:
 *  1. You share a link with UTM params (e.g. ?utm_source=whatsapp&utm_medium=social)
 *  2. When a visitor lands, UTMs are captured from the URL and stored in sessionStorage
 *  3. Every analytics event (PostHog, GA4, Mixpanel) automatically gets the source attached
 *  4. You can compare sources in PostHog/GA4 to see which drives the most visits
 */

export interface UTMParams {
  utm_source?: string // Where: twitter, whatsapp, telegram, facebook, newsletter
  utm_medium?: string // How: social, email, referral, cpc
  utm_campaign?: string // What campaign: election-2026, weekly-update
  utm_content?: string // Which link variant: hero-button, sidebar-link
  utm_term?: string // Optional keyword
}

const SESSION_KEY = 'indiastats_utm'

// ─── Predefined presets for each sharing channel ───────────────────────────

export const SHARE_PRESETS: Record<string, UTMParams> = {
  twitter: {
    utm_source: 'twitter',
    utm_medium: 'social',
    utm_campaign: 'organic',
  },
  whatsapp: {
    utm_source: 'whatsapp',
    utm_medium: 'social',
    utm_campaign: 'organic',
  },
  telegram: {
    utm_source: 'telegram',
    utm_medium: 'social',
    utm_campaign: 'organic',
  },
  facebook: {
    utm_source: 'facebook',
    utm_medium: 'social',
    utm_campaign: 'organic',
  },
  instagram: {
    utm_source: 'instagram',
    utm_medium: 'social',
    utm_campaign: 'organic',
  },
  linkedin: {
    utm_source: 'linkedin',
    utm_medium: 'social',
    utm_campaign: 'organic',
  },
  newsletter: {
    utm_source: 'newsletter',
    utm_medium: 'email',
    utm_campaign: 'weekly',
  },
  youtube: {
    utm_source: 'youtube',
    utm_medium: 'video',
    utm_campaign: 'organic',
  },
}

// ─── Build a URL with UTM params ────────────────────────────────────────────

/**
 * Build a shareable URL with UTM tracking params.
 *
 * @example
 * buildUTMUrl('https://indiastats.org/tamil-nadu', 'whatsapp')
 * // → 'https://indiastats.org/tamil-nadu?utm_source=whatsapp&utm_medium=social&utm_campaign=organic'
 *
 * buildUTMUrl('https://indiastats.org/tamil-nadu', { utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'april-2026' })
 */
export function buildUTMUrl(baseUrl: string, source: string | UTMParams, overrides?: UTMParams): string {
  const preset = typeof source === 'string' ? (SHARE_PRESETS[source] ?? { utm_source: source, utm_medium: 'social' }) : source
  const params: UTMParams = { ...preset, ...overrides }

  const url = new URL(baseUrl)
  if (params.utm_source) url.searchParams.set('utm_source', params.utm_source)
  if (params.utm_medium) url.searchParams.set('utm_medium', params.utm_medium)
  if (params.utm_campaign) url.searchParams.set('utm_campaign', params.utm_campaign)
  if (params.utm_content) url.searchParams.set('utm_content', params.utm_content)
  if (params.utm_term) url.searchParams.set('utm_term', params.utm_term)

  return url.toString()
}

/**
 * Generate all channel links for a given base URL at once.
 *
 * @example
 * const links = buildAllShareLinks('https://indiastats.org/tamil-nadu')
 * links.whatsapp // → 'https://indiastats.org/tamil-nadu?utm_source=whatsapp&...'
 */
export function buildAllShareLinks(
  baseUrl: string,
  campaign?: string,
): Record<string, string> {
  const links: Record<string, string> = {}
  for (const [channel, preset] of Object.entries(SHARE_PRESETS)) {
    links[channel] = buildUTMUrl(baseUrl, {
      ...preset,
      ...(campaign ? { utm_campaign: campaign } : {}),
    })
  }
  return links
}

/**
 * Build a personalised share link for a specific friend + channel.
 * The friend's name appears as `utm_content` so GA4 shows it
 * under Acquisition → Traffic acquisition → Content.
 *
 * @example
 * buildFriendShareLink('https://indiastats.org/tamil-nadu', 'Ravi', 'whatsapp')
 * // → 'https://indiastats.org/tamil-nadu?utm_source=whatsapp&utm_medium=social&utm_campaign=organic&utm_content=ravi'
 */
export function buildFriendShareLink(
  baseUrl: string,
  friendName: string,
  channel: string,
  campaign?: string,
): string {
  const slug = friendName.trim().toLowerCase().replace(/\s+/g, '_')
  return buildUTMUrl(baseUrl, channel, {
    utm_content: slug,
    ...(campaign ? { utm_campaign: campaign } : {}),
  })
}

/**
 * Build links for a friend across all channels at once.
 */
export function buildFriendAllChannelLinks(
  baseUrl: string,
  friendName: string,
  campaign?: string,
): Record<string, string> {
  const links: Record<string, string> = {}
  for (const channel of Object.keys(SHARE_PRESETS)) {
    links[channel] = buildFriendShareLink(baseUrl, friendName, channel, campaign)
  }
  return links
}

// ─── Parse UTM params from URL ──────────────────────────────────────────────

/**
 * Extract UTM params from a URL search string.
 * Returns only the params that are actually present.
 */
export function parseUTMParams(search: string): UTMParams {
  const params = new URLSearchParams(search)
  const result: UTMParams = {}

  const src = params.get('utm_source')
  const medium = params.get('utm_medium')
  const campaign = params.get('utm_campaign')
  const content = params.get('utm_content')
  const term = params.get('utm_term')

  if (src) result.utm_source = src
  if (medium) result.utm_medium = medium
  if (campaign) result.utm_campaign = campaign
  if (content) result.utm_content = content
  if (term) result.utm_term = term

  return result
}

/** Returns true if there are any UTM params in the given search string */
export function hasUTMParams(search: string): boolean {
  const params = new URLSearchParams(search)
  return ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].some(
    (key) => params.has(key),
  )
}

// ─── Session-level attribution ──────────────────────────────────────────────
// UTMs from the landing URL are persisted in sessionStorage so they flow
// through to every page event during the same browser session.

/**
 * Save UTM params to sessionStorage. Call this on landing.
 */
export function saveUTMToSession(params: UTMParams): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(params))
}

/**
 * Load the last-captured UTM params from sessionStorage.
 * Used to attach source attribution to events on subsequent pages.
 */
export function loadUTMFromSession(): UTMParams {
  if (typeof sessionStorage === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as UTMParams) : {}
  } catch {
    return {}
  }
}

/**
 * Get current UTMs: from URL first, fall back to sessionStorage.
 * This is the main function to call on every page.
 */
export function getCurrentUTM(search: string = typeof window !== 'undefined' ? window.location.search : ''): UTMParams {
  if (hasUTMParams(search)) {
    const params = parseUTMParams(search)
    saveUTMToSession(params) // refresh session attribution
    return params
  }
  return loadUTMFromSession()
}
