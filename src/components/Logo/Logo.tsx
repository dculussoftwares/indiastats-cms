'use client'

import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
}

export const Logo = (props: Props) => {
  const { className } = props

  // BBC Red for bars, dark text for light header background
  const barColor = '#be1f1f' // BBC Red from your CSS
  const textColor = '#1a1a1a' // Dark text for white header
  const orgColor = '#6b7280' // Gray for .org

  return (
    <div className={clsx('flex items-end gap-[2px]', className)}>
      {/* Bar Chart Icon - 18px height to match capital letter height */}
      <svg
        width="20"
        height="18"
        viewBox="0 0 20 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Three ascending bars - tallest bar = 18px (full height), matches capital I */}
        <rect x="0" y="11" width="5" height="7" rx="0.5" fill={barColor} />
        <rect x="7" y="5" width="5" height="13" rx="0.5" fill={barColor} />
        <rect x="14" y="0" width="5" height="18" rx="0.5" fill={barColor} />
      </svg>

      {/* Text - pull up to align with bars (remove descender space) */}
      <span
        className="font-bold text-lg whitespace-nowrap"
        style={{
          color: textColor,
          lineHeight: '1',
          display: 'block',
          transform: 'translateY(3px)',
        }}
      >
        IndiaStats
        <span className="font-normal" style={{ color: orgColor }}>
          .org
        </span>
      </span>
    </div>
  )
}
