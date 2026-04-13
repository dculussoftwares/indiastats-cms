'use client'

import { useEffect } from 'react'
import { setPageContext } from '@/analytics'
import { getCurrentUTM } from '@/utilities/utm'

/**
 * UTMCapture
 *
 * Drop this anywhere in the layout tree (client-side).
 * On every mount it reads UTM params from the URL (or sessionStorage fallback)
 * and injects them into the shared analytics page context.
 * This means every subsequent event tracked on that page will automatically
 * carry utm_source / utm_medium / utm_campaign — no per-page changes needed.
 */
export function UTMCapture() {
  useEffect(() => {
    const utm = getCurrentUTM(window.location.search)

    if (Object.keys(utm).length > 0) {
      setPageContext(utm)
    }
  }, [])

  return null
}
