import React from 'react'
import { cn } from '@/utilities/ui'

interface SkeletonProps {
  className?: string
  children?: React.ReactNode
}

export function Skeleton({ className, children }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-gray-200 dark:bg-gray-800',
        className,
      )}
    >
      {children}
    </div>
  )
}
