/**
 * Seed 24 blog posts (12 TN 2026 election, 12 UP election history) for IndiaStats.org.
 *
 * Run with:
 *   DOTENV_CONFIG_PATH=.env.local pnpm exec tsx scripts/seed-blog-posts-batch2.mts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { tnPosts } from './data/tn-posts-batch2'
import { upPosts } from './data/up-posts-batch2'

async function main() {
  console.log('Connecting to Payload...')
  const payload = await getPayload({ config })

  const allPosts = [...tnPosts, ...upPosts]

  console.log('\nResolving categories...')
  const categoryTitles = ['Election Analysis', 'Data Insights', 'Constituency Guide', 'Political History']
  const categoryIds: Record<string, number> = {}
  for (const title of categoryTitles) {
    const slug = title.toLowerCase().replace(/\s+/g, '-')
    const existing = await payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1 })
    if (existing.docs[0]) {
      categoryIds[title] = existing.docs[0].id as number
    } else {
      const created = await payload.create({ collection: 'categories', data: { title, slug } })
      categoryIds[title] = created.id as number
      console.log(`  + Created category: ${title}`)
    }
  }

  console.log('\nCreating posts...')
  let created = 0
  let skipped = 0

  for (const post of allPosts) {
    const existing = await payload.find({ collection: 'posts', where: { slug: { equals: post.slug } }, limit: 1 })
    if (existing.docs[0]) {
      console.log(`  - Skipping (already exists): ${post.title}`)
      skipped++
      continue
    }

    const categories = post.categories.map((t) => categoryIds[t]).filter(Boolean)

    await payload.create({
      collection: 'posts',
      context: { disableRevalidate: true },
      data: {
        title: post.title,
        slug: post.slug,
        content: post.content,
        _status: 'published',
        categories,
        meta: {
          title: post.metaTitle,
          description: post.metaDescription,
        },
      } as any,
    })

    console.log(`  + Created: ${post.title}`)
    created++
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
