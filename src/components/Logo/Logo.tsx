'use client'

import clsx from 'clsx'
import React from 'react'
import { useTheme } from '@/providers/Theme'

interface Props {
  className?: string
  variant?: 'auto' | 'light' | 'dark' // light = dark bg (white text), dark = light bg (dark text)
}

export const Logo = (props: Props) => {
  const { className, variant = 'auto' } = props
  const { theme } = useTheme()

  // BBC Red for bars (stays same in both modes)
  const barColor = '#be1f1f'

  // Determine if we need light text (for dark backgrounds) or dark text (for light backgrounds)
  let useLightText: boolean
  if (variant === 'auto') {
    useLightText = theme === 'dark'
  } else {
    useLightText = variant === 'light' // light variant = dark background = light text
  }

  const textColor = useLightText ? '#ffffff' : '#1a1a1a'
  const orgColor = useLightText ? '#9ca3af' : '#6b7280'

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

      {/* Text - theme-aware colors */}
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
