'use client'

import { useEffect } from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function StateError({ error, reset }: Props) {
  useEffect(() => {
    console.error('State page error:', error)
  }, [error])

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="border-l-4 border-red-600 pl-3 mb-6 inline-block text-left">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        We could not load this page. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
