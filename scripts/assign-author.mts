/**
 * Create the IndiaStats editorial-team author profile and assign it to the
 * 10 original blog posts (seeded by scripts/seed-blog-posts.mts), which
 * currently have no byline — an E-E-A-T gap flagged in docs/SEO_AUDIT_2026.md (H3).
 *
 * Run with:
 *   DOTENV_CONFIG_PATH=.env.local pnpm exec tsx scripts/assign-author.mts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const AUTHOR = {
  name: 'IndiaStats Editorial Team',
  jobTitle: 'Data & Research Desk',
  bio: 'Our editorial team compiles and verifies election data directly from Election Commission of India (ECI) sources, cross-checking every figure before publication.',
}

const POST_SLUGS = [
  '2021-tamil-nadu-election-results-dmk-landslide',
  '2016-tamil-nadu-election-aiadmk-jayalalithaa',
  'sc-st-reserved-constituencies-tamil-nadu',
  'tamil-nadu-voter-demographics-2024',
  'chennai-assembly-constituencies-guide',
  'tamil-nadu-electoral-zones-explained',
  'dmk-vs-aiadmk-50-year-rivalry-tamil-nadu',
  'coimbatore-kongu-belt-tamil-nadu-elections',
  'how-to-read-tamil-nadu-election-data-guide',
  'tamil-nadu-2026-assembly-election-preview',
]

async function main() {
  const payload = await getPayload({ config })

  console.log('Finding or creating author...')
  const existing = await payload.find({
    collection: 'authors',
    where: { name: { equals: AUTHOR.name } },
    limit: 1,
  })

  const authorDoc =
    existing.docs[0] ??
    (await payload.create({
      collection: 'authors',
      data: AUTHOR,
    }))

  console.log(`Author ready: ${authorDoc.name} (id: ${authorDoc.id})`)

  let updated = 0
  let skipped = 0

  for (const slug of POST_SLUGS) {
    const result = await payload.find({
      collection: 'posts',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    const post = result.docs[0]
    if (!post) {
      console.log(`  - Not found, skipping: ${slug}`)
      skipped++
      continue
    }

    const hasAuthors = Array.isArray(post.authors) && post.authors.length > 0
    if (hasAuthors) {
      console.log(`  - Already has authors, skipping: ${slug}`)
      skipped++
      continue
    }

    await payload.update({
      collection: 'posts',
      id: post.id,
      context: { disableRevalidate: true },
      data: { authors: [authorDoc.id] },
    })

    console.log(`  + Assigned author: ${slug}`)
    updated++
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
