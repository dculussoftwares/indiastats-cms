'use client'

import { useEffect } from 'react'
import Clarity from '@microsoft/clarity'

export function ClarityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID

    // Only initialize in production with a valid Clarity ID
    if (process.env.NODE_ENV === 'production' && clarityId) {
      Clarity.init(clarityId)
    }
  }, [])

  return <>{children}</>
}
