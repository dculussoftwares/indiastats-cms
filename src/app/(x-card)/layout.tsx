import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { cn } from '@/utilities/ui'

// These pages exist only as render targets for social-card screenshots.
// Keep them out of the index — they're thin duplicates of assembly pages.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function XCardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={cn(GeistSans.variable)} lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f1f5f9' }}>
        {children}
      </body>
    </html>
  )
}
