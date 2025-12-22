'use client'

import clsx from 'clsx'
import React from 'react'
import { useTheme } from '@/providers/Theme'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props
  const { theme } = useTheme()

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  // Use dark logo for dark theme, light logo for light theme
  const logoSrc = theme === 'dark' ? '/images/logo-dark.png' : '/images/logo-light.png'

  return (
    /* eslint-disable @next/next/no-img-element */
    <img
      alt="IndiaStats.org Logo"
      width={193}
      height={34}
      loading={loading}
      fetchPriority={priority}
      decoding="async"
      className={clsx('max-w-[9.375rem] w-full h-[34px] object-contain', className)}
      src={logoSrc}
    />
  )
}
