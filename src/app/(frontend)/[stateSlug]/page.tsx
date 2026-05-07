import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

interface StatePageProps {
  params: Promise<{
    stateSlug: string
  }>
}

// This page only redirects — tell search engines not to index it
export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: { index: false, follow: true },
  }
}

export default async function StatePage({ params }: StatePageProps) {
  const { stateSlug } = await params

  // Redirect to dashboard for the state
  redirect(`/${stateSlug}/dashboard`)
}
