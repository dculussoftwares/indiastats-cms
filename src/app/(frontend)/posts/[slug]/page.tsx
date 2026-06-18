import type { Metadata } from 'next'

import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import RichText from '@/components/RichText'

import type { Post } from '@/payload-types'

import { PostHero } from '@/heros/PostHero'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { BlogPostingJsonLd } from '@/components/seo/JsonLd'
import { getServerSideURL } from '@/utilities/getURL'

// Force dynamic rendering - Payload CMS requires database at runtime
export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Post({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/posts/' + decodedSlug
  const post = await queryPostBySlug({ slug: decodedSlug })

  if (!post) return <PayloadRedirects url={url} />

  const baseUrl = getServerSideURL()
  const postUrl = `${baseUrl}/posts/${decodedSlug}`
  const metaImage = post.meta?.image
  const imageUrl =
    metaImage && typeof metaImage === 'object' && 'url' in metaImage
      ? `${baseUrl}${(metaImage as any).sizes?.og?.url ?? (metaImage as any).url}`
      : `${baseUrl}/indiastats-logo-1024.png`

  return (
    <article className="pt-16 pb-16">
      <BlogPostingJsonLd
        title={post.title}
        description={post.meta?.description}
        url={postUrl}
        datePublished={(post as any).publishedAt || post.createdAt}
        dateModified={post.updatedAt}
        imageUrl={imageUrl}
      />
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <PostHero post={post} />

      <div className="flex flex-col items-center gap-4 pt-8">
        <div className="container">
          <RichText className="max-w-[48rem] mx-auto" data={post.content} enableGutter={false} />
          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <RelatedPosts
              className="mt-12 max-w-[52rem] lg:grid lg:grid-cols-subgrid col-start-1 col-span-3 grid-rows-[2fr]"
              docs={post.relatedPosts.filter((post) => typeof post === 'object')}
            />
          )}
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const post = await queryPostBySlug({ slug: decodedSlug })

  const base = await generateMeta({ doc: post, path: `/posts/${decodedSlug}` })

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: 'article',
      ...(post?.createdAt && { publishedTime: post.createdAt }),
      ...(post?.updatedAt && { modifiedTime: post.updatedAt }),
    },
  }
}

const queryPostBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})
