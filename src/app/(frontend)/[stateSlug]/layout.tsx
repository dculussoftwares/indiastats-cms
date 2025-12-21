import { notFound } from 'next/navigation'
import { getStateBySlug } from '@/config/states'
import { StateProvider } from '@/components/providers/StateProvider'

interface StateLayoutProps {
  children: React.ReactNode
  params: Promise<{
    stateSlug: string
  }>
}

export default async function StateLayout({ children, params }: StateLayoutProps) {
  const { stateSlug } = await params

  // Validate state slug
  const stateConfig = getStateBySlug(stateSlug)

  if (!stateConfig) {
    notFound()
  }

  return <StateProvider state={stateConfig}>{children}</StateProvider>
}
