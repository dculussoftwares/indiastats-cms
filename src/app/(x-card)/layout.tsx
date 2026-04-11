import { GeistSans } from 'geist/font/sans'
import { cn } from '@/utilities/ui'

export default function XCardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={cn(GeistSans.variable)} lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f1f5f9' }}>
        {children}
      </body>
    </html>
  )
}
