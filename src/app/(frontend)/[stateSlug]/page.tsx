import { redirect } from 'next/navigation'

interface StatePageProps {
  params: Promise<{
    stateSlug: string
  }>
}

export default async function StatePage({ params }: StatePageProps) {
  const { stateSlug } = await params

  // Redirect to dashboard for the state
  redirect(`/${stateSlug}/dashboard`)
}
