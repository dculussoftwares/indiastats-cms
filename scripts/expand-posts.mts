/**
 * Push the rewritten content for two already-published posts:
 *  - dmk-vs-aiadmk-50-year-rivalry-tamil-nadu: expanded 450 -> 1,500+ words,
 *    and its "every CM since 1967" framing corrected for the 2026 TVK result.
 *  - tamil-nadu-2026-assembly-election-preview: converted from a pre-election
 *    preview into a results piece (the election it previewed has concluded),
 *    expanded to 1,500+ words. Slug is left unchanged to preserve backlinks.
 *
 * scripts/seed-blog-posts.mts only creates posts that don't already exist, so
 * this script updates the two live posts in place using the same content
 * definitions (imported from there, not duplicated).
 *
 * Run with:
 *   DOTENV_CONFIG_PATH=.env.local pnpm exec tsx scripts/expand-posts.mts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { posts } from './seed-blog-posts.mts'

const TARGET_SLUGS = [
  'dmk-vs-aiadmk-50-year-rivalry-tamil-nadu',
  'tamil-nadu-2026-assembly-election-preview',
]

async function main() {
  const payload = await getPayload({ config })

  for (const slug of TARGET_SLUGS) {
    const source = posts.find((p) => p.slug === slug)
    if (!source) {
      console.log(`  - No content definition found for: ${slug}`)
      continue
    }

    const existing = await payload.find({
      collection: 'posts',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    const post = existing.docs[0]
    if (!post) {
      console.log(`  - Not found in DB, skipping: ${slug}`)
      continue
    }

    await payload.update({
      collection: 'posts',
      id: post.id,
      context: { disableRevalidate: true },
      data: {
        title: source.title,
        content: source.content,
        meta: {
          title: source.metaTitle,
          description: source.metaDescription,
        },
      } as any,
    })

    console.log(`  + Updated: ${slug}`)
  }

  console.log('\nDone.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
