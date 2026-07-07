// scripts/data/validate-batch2.mts
import { tnPosts } from './tn-posts-batch2'
import { upPosts } from './up-posts-batch2'

const EXISTING_SLUGS = new Set([
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
])

const all = [...tnPosts, ...upPosts]
if (tnPosts.length !== 12) throw new Error(`expected 12 TN posts, got ${tnPosts.length}`)
if (upPosts.length !== 12) throw new Error(`expected 12 UP posts, got ${upPosts.length}`)

const seen = new Set<string>()
for (const p of all) {
  if (EXISTING_SLUGS.has(p.slug)) throw new Error(`slug collides with existing post: ${p.slug}`)
  if (seen.has(p.slug)) throw new Error(`duplicate slug across batch: ${p.slug}`)
  seen.add(p.slug)
}

console.log(`OK: ${all.length} posts total, all slugs unique and non-colliding`)
process.exit(0)
