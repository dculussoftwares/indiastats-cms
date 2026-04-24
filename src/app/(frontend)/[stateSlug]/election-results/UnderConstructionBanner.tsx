'use client'

import React, { useState } from 'react'
import { Construction, X } from 'lucide-react'

export function UnderConstructionBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="absolute top-0 inset-x-0 z-[2000] flex items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950 shadow-lg">
      <div className="flex items-center gap-2">
        <Construction className="h-4 w-4 shrink-0" />
        <span>
          <strong>Under Construction</strong> — This page shows dummy data and is still being built.
          Live results will appear here on election day.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 hover:bg-amber-600/30 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
