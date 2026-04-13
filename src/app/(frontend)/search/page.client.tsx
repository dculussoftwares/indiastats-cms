'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect } from 'react'
import { trackViewed, PAGE_NAMES } from '@/analytics'

const PageClient: React.FC = () => {
  /* Force the header to be dark mode while we have an image behind it */
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('light')
  }, [setHeaderTheme])

  useEffect(() => {
    trackViewed({ name: 'search_page',
      page_name: PAGE_NAMES.SEARCH_RESULTS,
      page_type: 'search',
      page_url: window.location.href,
      page_path: window.location.pathname,
    })
  }, [])

  return <React.Fragment />
}

export default PageClient
