import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/indiastats-logo-1024.png'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
  path?: string
}): Promise<Metadata> => {
  const { doc, path } = args

  const docMeta = doc?.meta as
    | {
        title?: string | null
        image?: (number | null) | Media
        description?: string | null
        keywords?: string | null
      }
    | undefined

  const ogImage = getImageURL(docMeta?.image)

  // Do not append site name — root layout title template adds it automatically.
  // Returning the bare title prevents triple-duplication like "Title | IndiaStats.org | IndiaStats.org".
  const title = docMeta?.title || 'IndiaStats.org'

  const serverUrl = getServerSideURL()
  const canonicalUrl = path ? `${serverUrl}${path}` : undefined

  return {
    description: docMeta?.description,
    keywords: docMeta?.keywords,
    ...(canonicalUrl && { alternates: { canonical: canonicalUrl } }),
    openGraph: mergeOpenGraph({
      description: docMeta?.description || '',
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      ...(canonicalUrl && { url: canonicalUrl }),
    }),
    title,
  }
}
