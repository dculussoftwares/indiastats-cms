import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description:
    'IndiaStats.org - Comprehensive election data, voter statistics, and political insights for Indian assembly constituencies.',
  images: [
    {
      url: `${getServerSideURL()}/indiastats-logo-1024.png`,
    },
  ],
  siteName: 'IndiaStats.org',
  title: 'IndiaStats.org',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
