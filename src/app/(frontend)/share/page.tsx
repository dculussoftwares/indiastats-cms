import type { Metadata } from 'next'
import { SharePageClient } from './SharePageClient'

export const metadata: Metadata = {
  title: 'Share Links | IndiaStats.org',
  description: 'Generate personalised share links for friends and track which source drives the most visits.',
  robots: { index: false, follow: false },
}

export default function SharePage() {
  return <SharePageClient />
}
