'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

interface AdSlotProps {
  /** AdSense ad unit slot ID (create in AdSense → Ads → By ad unit). */
  slot: string | undefined
  /** 'in-article' renders a fluid native unit that blends with content. */
  layout?: 'in-article'
  className?: string
}

/**
 * Manual AdSense ad unit. Complements Auto ads — manual in-content units on
 * long data pages typically lift page RPM 30–60% because Auto ads is
 * conservative about inserting into chart-heavy layouts.
 *
 * Renders nothing when the client ID or slot ID is missing, so it is safe to
 * ship before the ad units are created in the AdSense dashboard.
 */
export function AdSlot({ slot, layout, className }: AdSlotProps) {
  const insRef = useRef<HTMLModElement>(null)
  const pushed = useRef(false)
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID

  useEffect(() => {
    if (!client || !slot || pushed.current) return
    // Skip if AdSense already filled this element (Strict Mode double-invoke,
    // fast refresh, or bfcache restore).
    if (insRef.current?.getAttribute('data-ad-status')) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch {
      // adsbygoogle.js blocked or not yet loaded — fail silently.
    }
  }, [client, slot])

  if (!client || !slot) return null

  return (
    <ins
      ref={insRef}
      className={`adsbygoogle block ${className ?? ''}`}
      style={{ display: 'block', minHeight: 120 }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={layout === 'in-article' ? 'fluid' : 'auto'}
      {...(layout === 'in-article' ? { 'data-ad-layout': 'in-article' } : {})}
      data-full-width-responsive="true"
    />
  )
}
