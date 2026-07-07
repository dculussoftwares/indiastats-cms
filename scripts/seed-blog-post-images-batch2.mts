/**
 * Fetch a Pexels image for each batch-2 post and attach it as heroImage + meta image.
 *
 * Run with:
 *   DOTENV_CONFIG_PATH=.env.local pnpm exec tsx scripts/seed-blog-post-images-batch2.mts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { tnPosts } from './data/tn-posts-batch2'
import { upPosts } from './data/up-posts-batch2'

const PEXELS_API_KEY = process.env.PEXELS_API_KEY
if (!PEXELS_API_KEY) {
  throw new Error('PEXELS_API_KEY not set — add it to .env.local')
}

const POST_QUERIES: Record<string, string> = Object.fromEntries(
  [...tnPosts, ...upPosts].map((p) => [p.slug, p.pexelsQuery]),
)

interface PexelsPhoto {
  id: number
  src: { large2x: string; large: string; original: string }
  photographer: string
  url: string
}

async function searchPexels(query: string): Promise<PexelsPhoto | null> {
  const encoded = encodeURIComponent(query)
  const url = `https://api.pexels.com/v1/search?query=${encoded}&per_page=5&orientation=landscape`
  const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY! } })
  if (!res.ok) {
    console.error(`  Pexels API error ${res.status} for query: ${query}`)
    return null
  }
  const data = (await res.json()) as { photos: PexelsPhoto[] }
  return data.photos?.[0] ?? null
}

async function downloadImage(imageUrl: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error(`Failed to download image: ${res.status} ${imageUrl}`)
  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  return { buffer, mimeType: contentType.split(';')[0].trim() }
}

function mimeToExt(mime: string): string {
  const map: Record<string, string> = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
  return map[mime] ?? 'jpg'
}

async function main() {
  console.log('Connecting to Payload...')
  const payload = await getPayload({ config })

  const postsResult = await payload.find({
    collection: 'posts',
    where: { slug: { in: Object.keys(POST_QUERIES) } },
    limit: 30,
    depth: 0,
  })

  console.log(`\nFound ${postsResult.docs.length} posts to process.\n`)

  for (const post of postsResult.docs) {
    const slug = post.slug as string
    const query = POST_QUERIES[slug]
    if (!query) continue
    if (post.heroImage) {
      console.log(`  - Skipping (already has image): ${post.title}`)
      continue
    }

    console.log(`  -> Processing: ${post.title}`)
    console.log(`    Query: "${query}"`)

    const photo = await searchPexels(query)
    if (!photo) {
      console.log(`    x No Pexels result found`)
      continue
    }
    console.log(`    Found: photo ${photo.id} by ${photo.photographer}`)

    let buffer: Buffer
    let mimeType: string
    try {
      ;({ buffer, mimeType } = await downloadImage(photo.src.large2x || photo.src.large))
      console.log(`    Downloaded: ${(buffer.byteLength / 1024).toFixed(0)} KB`)
    } catch (err) {
      console.error(`    x Download failed: ${err}`)
      continue
    }

    const ext = mimeToExt(mimeType)
    const filename = `blog-${slug}-pexels-${photo.id}.${ext}`
    const altText = `${query} — photo by ${photo.photographer} on Pexels`

    let mediaDoc: any
    try {
      mediaDoc = await payload.create({
        collection: 'media',
        context: { disableRevalidate: true },
        data: { alt: altText },
        file: { data: buffer, mimetype: mimeType, name: filename, size: buffer.byteLength },
      })
      console.log(`    Uploaded media ID: ${mediaDoc.id}`)
    } catch (err) {
      console.error(`    x Media upload failed: ${err}`)
      continue
    }

    try {
      await payload.update({
        collection: 'posts',
        id: post.id,
        context: { disableRevalidate: true },
        data: { heroImage: mediaDoc.id, meta: { ...(post.meta as object), image: mediaDoc.id } } as any,
      })
      console.log(`    OK Post updated with hero image`)
    } catch (err) {
      console.error(`    x Post update failed: ${err}`)
    }

    // Pexels rate limit: 200 requests/hour on the free tier
    await new Promise((r) => setTimeout(r, 700))
  }

  console.log('\nDone.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
