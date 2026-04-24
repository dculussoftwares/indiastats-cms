/**
 * Fetch a Pixabay image for each blog post and attach it as heroImage + meta image.
 * Downloads images locally (Pixabay forbids hotlinking).
 *
 * Run with:
 *   DOTENV_CONFIG_PATH=.env.local pnpm exec tsx scripts/seed-blog-post-images.mts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const PIXABAY_API_KEY = '7018013-f403d1a6c0a87fe4ef5249b7e'

// ---------------------------------------------------------------------------
// Per-post search queries (tuned for best image match)
// ---------------------------------------------------------------------------
const POST_QUERIES: Record<string, string> = {
  '2021-tamil-nadu-election-results-dmk-landslide': 'India election voting booth',
  '2016-tamil-nadu-election-aiadmk-jayalalithaa': 'India parliament democracy',
  'sc-st-reserved-constituencies-tamil-nadu': 'India rural village community',
  'tamil-nadu-voter-demographics-2024': 'India voters election crowd',
  'chennai-assembly-constituencies-guide': 'Chennai India city skyline',
  'tamil-nadu-electoral-zones-explained': 'India map regions geography',
  'dmk-vs-aiadmk-50-year-rivalry-tamil-nadu': 'India politics rally crowd',
  'coimbatore-kongu-belt-tamil-nadu-elections': 'Coimbatore India textile industry',
  'how-to-read-tamil-nadu-election-data-guide': 'data analysis computer chart',
  'tamil-nadu-2026-assembly-election-preview': 'India election ballot democracy',
}

// ---------------------------------------------------------------------------
// Pixabay: search and return best image hit
// ---------------------------------------------------------------------------
interface PixabayHit {
  id: number
  largeImageURL: string
  webformatURL: string
  tags: string
  user: string
  pageURL: string
}

async function searchPixabay(query: string): Promise<PixabayHit | null> {
  const encoded = encodeURIComponent(query)
  const url =
    `https://pixabay.com/api/?key=${PIXABAY_API_KEY}` +
    `&q=${encoded}&image_type=photo&orientation=horizontal` +
    `&safesearch=true&order=popular&per_page=5&min_width=1000`

  const res = await fetch(url)
  if (!res.ok) {
    console.error(`  Pixabay API error ${res.status} for query: ${query}`)
    return null
  }

  const data = (await res.json()) as { hits: PixabayHit[] }
  return data.hits?.[0] ?? null
}

// ---------------------------------------------------------------------------
// Download image → Buffer
// ---------------------------------------------------------------------------
async function downloadImage(imageUrl: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error(`Failed to download image: ${res.status} ${imageUrl}`)
  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const mimeType = contentType.split(';')[0].trim()
  return { buffer, mimeType }
}

function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }
  return map[mime] ?? 'jpg'
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Connecting to Payload...')
  const payload = await getPayload({ config })

  // Fetch all 10 seeded posts
  const postsResult = await payload.find({
    collection: 'posts',
    where: { slug: { in: Object.keys(POST_QUERIES) } },
    limit: 20,
    depth: 0,
  })

  console.log(`\nFound ${postsResult.docs.length} posts to process.\n`)

  for (const post of postsResult.docs) {
    const slug = post.slug as string
    const query = POST_QUERIES[slug]

    if (!query) {
      console.log(`  ⚠  No query mapped for slug: ${slug}`)
      continue
    }

    // Skip if heroImage already set
    if (post.heroImage) {
      console.log(`  - Skipping (already has image): ${post.title}`)
      continue
    }

    console.log(`  → Processing: ${post.title}`)
    console.log(`    Query: "${query}"`)

    // 1. Search Pixabay
    const hit = await searchPixabay(query)
    if (!hit) {
      console.log(`    ✗ No Pixabay result found`)
      continue
    }
    console.log(`    Found: "${hit.tags}" by ${hit.user}`)

    // 2. Download image (use largeImageURL = 1280px max, best quality for hero)
    const downloadUrl = hit.largeImageURL || hit.webformatURL
    let buffer: Buffer
    let mimeType: string
    try {
      ;({ buffer, mimeType } = await downloadImage(downloadUrl))
      console.log(`    Downloaded: ${(buffer.byteLength / 1024).toFixed(0)} KB`)
    } catch (err) {
      console.error(`    ✗ Download failed: ${err}`)
      continue
    }

    // 3. Upload to Payload media collection
    const ext = mimeToExt(mimeType)
    const filename = `blog-${slug}-pixabay-${hit.id}.${ext}`
    const altText = `${hit.tags} — photo by ${hit.user} on Pixabay`

    let mediaDoc: any
    try {
      mediaDoc = await payload.create({
        collection: 'media',
        context: { disableRevalidate: true },
        data: {
          alt: altText,
        },
        file: {
          data: buffer,
          mimetype: mimeType,
          name: filename,
          size: buffer.byteLength,
        },
      })
      console.log(`    Uploaded media ID: ${mediaDoc.id}`)
    } catch (err) {
      console.error(`    ✗ Media upload failed: ${err}`)
      continue
    }

    // 4. Update post: set heroImage and meta.image
    try {
      await payload.update({
        collection: 'posts',
        id: post.id,
        context: { disableRevalidate: true },
        data: {
          heroImage: mediaDoc.id,
          meta: {
            ...(post.meta as object),
            image: mediaDoc.id,
          },
        } as any,
      })
      console.log(`    ✓ Post updated with hero image`)
    } catch (err) {
      console.error(`    ✗ Post update failed: ${err}`)
    }

    // Small delay to respect Pixabay rate limit (100 req/60s)
    await new Promise((r) => setTimeout(r, 700))
  }

  console.log('\nDone.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
