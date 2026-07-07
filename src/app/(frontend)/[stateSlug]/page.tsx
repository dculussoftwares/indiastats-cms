import { permanentRedirect, notFound } from 'next/navigation'
import { getStateBySlug } from '@/config/states'

interface StatePageProps {
  params: Promise<{
    stateSlug: string
  }>
}

export default async function StatePage({ params }: StatePageProps) {
  const { stateSlug } = await params

  // Unknown states must return a real 404, not a redirect chain into an
  // empty dashboard — Google reports those as "Soft 404".
  if (!getStateBySlug(stateSlug)) {
    notFound()
  }

  // 308 (permanent) instead of 307 (temporary) so Google consolidates
  // ranking signals onto /dashboard and stops re-crawling this URL.
  permanentRedirect(`/${stateSlug}/dashboard`)
}
