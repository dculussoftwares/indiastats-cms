'use client'

import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
}

export const Logo = (props: Props) => {
  const { className } = props

  // Always use dark mode colors since header is always dark
  const barColor = '#be1f1f' // BBC Red from your CSS
  const textColor = '#ffffff' // White for dark header
  const orgColor = '#9ca3af' // Light gray for .org

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      {/* Bar Chart Icon */}
      <svg
        width="28"
        height="24"
        viewBox="0 0 28 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Three ascending bars */}
        <rect x="0" y="14" width="6" height="10" rx="1" fill={barColor} />
        <rect x="9" y="8" width="6" height="16" rx="1" fill={barColor} />
        <rect x="18" y="2" width="6" height="22" rx="1" fill={barColor} />
      </svg>

      {/* Text */}
      <span
        className="font-bold text-lg tracking-tight whitespace-nowrap"
        style={{ color: textColor }}
      >
        IndiaStats
        <span className="font-normal" style={{ color: orgColor }}>
          .org
        </span>
      </span>
    </div>
  )
}
