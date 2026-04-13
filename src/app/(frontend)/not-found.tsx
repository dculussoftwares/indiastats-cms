'use client'
import Link from 'next/link'
import React, { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { pageViews, PAGE_NAMES } from '@/analytics'

export default function NotFound() {
  useEffect(() => {
    pageViews.notFoundPageViewed({
      page_name: PAGE_NAMES.NOT_FOUND,
      page_type: 'error',
      page_url: window.location.href,
      page_path: window.location.pathname,
    })
  }, [])

  return (
    <div className="container py-28">
      <div className="prose max-w-none">
        <h1 style={{ marginBottom: 0 }}>404</h1>
        <p className="mb-4">This page could not be found.</p>
      </div>
      <Button asChild variant="default">
        <Link href="/">Go home</Link>
      </Button>
    </div>
  )
}
