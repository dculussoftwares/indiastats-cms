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
}): Promise<Metadata> => {
  const { doc } = args

  const docMeta = doc?.meta as
    | {
        title?: string | null
        image?: (number | null) | Media
        description?: string | null
        keywords?: string | null
      }
    | undefined

  const ogImage = getImageURL(docMeta?.image)

  const title = docMeta?.title ? docMeta?.title + ' | IndiaStats.org' : 'IndiaStats.org'

  return {
    description: docMeta?.description,
    keywords: docMeta?.keywords,
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
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
    }),
    title,
  }
}
