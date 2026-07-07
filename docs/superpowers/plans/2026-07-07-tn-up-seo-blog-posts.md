# TN + UP SEO Blog Post Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish 24 new data-grounded blog posts (12 Tamil Nadu, 12 Uttar Pradesh) to grow organic traffic and AdSense in-article revenue.

**Architecture:** Two content-authoring tasks (one per state) each produce a data-only TypeScript module of 12 posts, validated for shape. A merge/seed script creates all 24 as published Payload posts. A Pexels-based image script attaches a hero image + SEO meta image to each.

**Tech Stack:** PayloadCMS 3.x local API, `tsx` scripts, Pexels API v1, existing lexical richText post format.

## Global Constraints

- Spec doc: `docs/superpowers/specs/2026-07-07-tn-up-seo-blog-posts-design.md` — read it before starting.
- Run all DB-touching scripts with `DOTENV_CONFIG_PATH=.env.local pnpm exec tsx <path>`.
- No task may call `payload.create`/`payload.update` except the seed script (Task 6).
- No task may hardcode the Pexels API key — always `process.env.PEXELS_API_KEY`.
- Cite only these verified numbers (do not invent others):
  - **TN 2026 (declared, 234/234)**: TVK 108, DMK 59, AIADMK 47, INC 5, PMK 4, CPI 2, CPI(M) 2, VCK 2, IUML 2, AMMK 1, DMDK 1, BJP 1. Majority = 118. TVK is the single largest party but short of a majority — never state who forms the government.
  - **UP seat tallies**: 2012 SP 224 / BSP 80 / BJP 47 / INC 28 / RLD 9. 2017 BJP 312 / SP 47 / BSP 19 / ApnaDal(S) 9 / INC 7. 2022 BJP 256 / SP 111 / ApnaDal(S) 12 / RLD 8 / NISHAD 6 / SBSP 6 / BSP 1.
  - UP per-assembly voter/turnout figures are all `0` in the DB (upload in progress) — never cite precise per-constituency UP voter numbers. Safe aggregates: `15+ crore` voters, `1.7 lakh+` booths, 403 assemblies, 75 districts.
- Existing 10 TN posts and 4 categories (`Election Analysis`, `Data Insights`, `Constituency Guide`, `Political History`) already exist — reuse the categories, do not create new ones.
- Existing slugs to never collide with: `2021-tamil-nadu-election-results-dmk-landslide`, `2016-tamil-nadu-election-aiadmk-jayalalithaa`, `sc-st-reserved-constituencies-tamil-nadu`, `tamil-nadu-voter-demographics-2024`, `chennai-assembly-constituencies-guide`, `tamil-nadu-electoral-zones-explained`, `dmk-vs-aiadmk-50-year-rivalry-tamil-nadu`, `coimbatore-kongu-belt-tamil-nadu-elections`, `how-to-read-tamil-nadu-election-data-guide`, `tamil-nadu-2026-assembly-election-preview`.

---

### Task 1: Shared lexical helpers + Pexels env var

**Files:**
- Create: `scripts/data/lexical-helpers.ts`
- Modify: `.env.example`
- Modify: `.env.local` (orchestrator-only step — contains a live secret, do not delegate to a subagent)

**Interfaces:**
- Produces (consumed by Tasks 2, 3, 6):
  ```ts
  export type LexicalNode = Record<string, unknown>
  export function text(content: string, bold?: boolean): LexicalNode
  export function paragraph(...children: LexicalNode[]): LexicalNode
  export function heading(tag: 'h2' | 'h3', content: string): LexicalNode
  export function listItem(content: string): LexicalNode
  export function bulletList(items: string[]): LexicalNode
  export function richText(children: LexicalNode[]): { root: Record<string, unknown> }
  export interface BlogPostSeed {
    title: string
    slug: string
    metaTitle: string
    metaDescription: string
    content: ReturnType<typeof richText>
    pexelsQuery: string
    categories: string[] // subset of the 4 existing category titles
  }
  ```

- [ ] **Step 1: Create the shared helpers file**

```ts
// scripts/data/lexical-helpers.ts
export type LexicalNode = Record<string, unknown>

export function text(content: string, bold = false): LexicalNode {
  return { type: 'text', text: content, format: bold ? 1 : 0, version: 1 }
}

export function paragraph(...children: LexicalNode[]): LexicalNode {
  return { type: 'paragraph', children, direction: 'ltr', format: '', indent: 0, version: 1 }
}

export function heading(tag: 'h2' | 'h3', content: string): LexicalNode {
  return {
    type: 'heading',
    tag,
    children: [text(content)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

export function listItem(content: string): LexicalNode {
  return {
    type: 'listitem',
    children: [text(content)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    value: 1,
  }
}

export function bulletList(items: string[]): LexicalNode {
  return {
    type: 'list',
    listType: 'bullet',
    children: items.map(listItem),
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    start: 1,
    tag: 'ul',
  }
}

export function richText(children: LexicalNode[]) {
  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

export interface BlogPostSeed {
  title: string
  slug: string
  metaTitle: string
  metaDescription: string
  content: ReturnType<typeof richText>
  pexelsQuery: string
  categories: string[]
}
```

- [ ] **Step 2: Add the Pexels key placeholder to `.env.example`**

Append this line (after the AdSense lines):

```
# Pexels API key for blog post hero images (get one free at pexels.com/api)
PEXELS_API_KEY=
```

- [ ] **Step 3: Add the real key to `.env.local` (orchestrator only)**

Append `PEXELS_API_KEY=<the key the user provided>` to `.env.local`. Do not print the key value in any tool output or commit message. `.env.local` is gitignored (`.gitignore:33`) so this is never committed.

- [ ] **Step 4: Verify the helpers file compiles**

Run: `pnpm exec tsc --noEmit scripts/data/lexical-helpers.ts --esModuleInterop --skipLibCheck`
Expected: no output (success)

- [ ] **Step 5: Commit**

```bash
git add scripts/data/lexical-helpers.ts .env.example
git commit -m "feat(blog): add shared lexical helpers and Pexels env var placeholder"
```

---

### Task 2: Tamil Nadu post content (12 posts)

**Files:**
- Create: `scripts/data/tn-posts-batch2.ts`
- Create (temporary, delete before finishing): any `scripts/_tmp_*.mts` read-only query scripts

**Interfaces:**
- Consumes: `BlogPostSeed`, `text`, `paragraph`, `heading`, `bulletList`, `richText` from `scripts/data/lexical-helpers.ts` (Task 1).
- Produces (consumed by Task 4): `export const tnPosts: BlogPostSeed[]` — exactly 12 entries.

**Context:** IndiaStats.org just gained real data for the 2026 Tamil Nadu assembly election (234/234 declared). Write 12 BBC-News-style articles (see `CLAUDE.md` design principles — clear, minimal, no marketing fluff, `h2`/`h3` structure, bullet lists for data) of roughly 600-900 words each, covering:

1. Flagship result overview — TVK's 108-seat debut, full context of what happened.
2. 2021-vs-2026 seat swing across all major parties.
3. DMK's collapse: 133 seats (2021) → 59 (2026).
4. AIADMK's continued decline: 136 (2016) → 66 (2021) → 47 (2026).
5. District/zone breakdown of where TVK won (query the DB — see below).
6. Closest-margin contests / biggest upsets in 2026 (query the DB for margins).
7. Fate of the minor/allied parties (PMK, VCK, CPI, CPI(M), INC, IUML, AMMK, DMDK, BJP — 1-5 seats each).
8. What "108 short of 118" means for government formation — framed as an open question. Explain the majority math; do not assert who forms the government.
9. Reserved constituency (SC/ST) results in 2026 (query the DB, cross-reference with the existing `sc-st-reserved-constituencies-tamil-nadu` post's fact that there are 43 reserved seats: 42 SC + 1 ST... actually verify the real split via the `assemblies` collection's `voters.isReservedAc` field rather than assuming).
10. Chennai's 2026 verdict (16 constituencies).
11. Kongu belt's 2026 verdict (Coimbatore/Erode/Tiruppur/Salem/Namakkal).
12. Turnout trends: 2021 vs 2026.

Use only the verified TN numbers in the Global Constraints section above for state-wide tallies. For district/zone/margin/reserved-seat specifics, query the live DB read-only:

```bash
DOTENV_CONFIG_PATH=.env.local pnpm exec tsx scripts/_tmp_tn_query.mts
```

Query the `live-election-results` collection (`stateCode: 'TN'`, `year: 2026`) for `assemblyId`, `assemblyName`, `districtName`, `parties[]` (sorted by `votes` desc — first entry is the winner, second is runner-up for margin calculation), and the `assemblies` collection (`stateCode: 'TN'`) for `districtName` and `voters.isReservedAc` to cross-reference. Delete the temp query script(s) when done — do not leave them in `scripts/`.

- [ ] **Step 1: Write read-only query scripts as needed and note the real figures you'll cite (district winners, margins, reserved-seat results, turnout) before drafting prose**

- [ ] **Step 2: Write `scripts/data/tn-posts-batch2.ts`**

Export shape (one entry shown as a template — write all 12 following this shape, using real content per the topic list above):

```ts
// scripts/data/tn-posts-batch2.ts
import { BlogPostSeed, text, paragraph, heading, bulletList, richText } from './lexical-helpers'

export const tnPosts: BlogPostSeed[] = [
  {
    title: '2026 Tamil Nadu Election Result: TVK\'s Historic Debut',
    slug: '2026-tamil-nadu-election-result-tvk-debut',
    metaTitle: '2026 Tamil Nadu Election Result — TVK Wins 108 Seats | IndiaStats.org',
    metaDescription:
      'TVK, contesting its first election, won 108 of 234 seats in the 2026 Tamil Nadu assembly election — the single largest party. Full result breakdown.',
    content: richText([
      paragraph(text('...')),
      heading('h2', '...'),
      // ...full ~700-word article
    ]),
    pexelsQuery: 'India election ballot box',
    categories: ['Election Analysis'],
  },
  // ... 11 more entries
]
```

- [ ] **Step 3: Validate the array shape**

```bash
DOTENV_CONFIG_PATH=.env.local pnpm exec tsx -e "
import { tnPosts } from './scripts/data/tn-posts-batch2'
const existingSlugs = new Set(['2021-tamil-nadu-election-results-dmk-landslide','2016-tamil-nadu-election-aiadmk-jayalalithaa','sc-st-reserved-constituencies-tamil-nadu','tamil-nadu-voter-demographics-2024','chennai-assembly-constituencies-guide','tamil-nadu-electoral-zones-explained','dmk-vs-aiadmk-50-year-rivalry-tamil-nadu','coimbatore-kongu-belt-tamil-nadu-elections','how-to-read-tamil-nadu-election-data-guide','tamil-nadu-2026-assembly-election-preview'])
if (tnPosts.length !== 12) throw new Error('expected 12 posts, got ' + tnPosts.length)
const slugs = new Set<string>()
for (const p of tnPosts) {
  if (!p.title || !p.slug || !p.metaTitle || !p.metaDescription || !p.pexelsQuery) throw new Error('missing field on ' + p.slug)
  if (p.metaDescription.length > 165) throw new Error('metaDescription too long: ' + p.slug)
  if (existingSlugs.has(p.slug)) throw new Error('slug collides with existing post: ' + p.slug)
  if (slugs.has(p.slug)) throw new Error('duplicate slug in batch: ' + p.slug)
  slugs.add(p.slug)
  if (!p.categories.every(c => ['Election Analysis','Data Insights','Constituency Guide','Political History'].includes(c))) throw new Error('invalid category on ' + p.slug)
  if ((p.content as any).root.children.length === 0) throw new Error('empty content: ' + p.slug)
}
console.log('OK: 12 valid TN posts, slugs unique')
"
```
Expected: `OK: 12 valid TN posts, slugs unique`

- [ ] **Step 4: Delete any temp query scripts**

```bash
rm -f scripts/_tmp_tn_query.mts
```

- [ ] **Step 5: Commit**

```bash
git add scripts/data/tn-posts-batch2.ts
git commit -m "feat(blog): add 12 Tamil Nadu 2026 election post drafts"
```

---

### Task 3: Uttar Pradesh post content (12 posts)

**Files:**
- Create: `scripts/data/up-posts-batch2.ts`
- Create (temporary, delete before finishing): any `scripts/_tmp_*.mts` read-only query scripts

**Interfaces:**
- Consumes: same as Task 2, from `scripts/data/lexical-helpers.ts`.
- Produces (consumed by Task 4): `export const upPosts: BlogPostSeed[]` — exactly 12 entries.

**Context:** Uttar Pradesh (403 assemblies, 75 districts, `src/config/states/uttar-pradesh.ts`) has zero blog posts. Write 12 BBC-News-style articles (~600-900 words each) covering:

1. UP 2022 result: BJP's second consecutive majority under Yogi Adityanath (256 seats).
2. UP 2017 landslide: BJP wins 312 of 403 seats.
3. UP 2012: the Samajwadi wave under Akhilesh Yadav (SP 224 seats).
4. BSP's collapse: 80 seats (2012) → 19 (2017) → 1 (2022) — Mayawati's decline.
5. 2022 BJP-vs-SP head-to-head (256 vs 111).
6. Beginner's guide to UP's 403 assembly constituencies (mirror the existing TN beginner's-guide post's structure and tone).
7. UP's 75 districts and political regions (Purvanchal, Awadh, Bundelkhand, Western UP).
8. Caste politics in Uttar Pradesh: Yadav-Muslim (SP base), Jatav-Dalit (BSP base), non-Yadav OBC and non-Jatav Dalit consolidation toward BJP.
9. Yogi Adityanath profile: UP's Chief Minister since 2017.
10. Smaller parties and alliance math: RLD, NISHAD Party, Apna Dal (Soneylal).
11. Western UP vs Purvanchal as distinct electoral battlegrounds.
12. UP 2027 election preview, built on the 2012-2022 trend line (next election is due 2027, following the 2012/2017/2022 cycle).

Use only the verified UP seat tallies in the Global Constraints section for state-wide numbers. Never cite precise per-constituency UP voter/turnout figures (they're `0` in the DB — data upload in progress). For district-level party performance (e.g. district winners by year), you may query the live DB read-only the same way as Task 2, using the `election-history` collection (`stateCode: 'UP'`, filter `electionYear`, group by `assemblyId`, winner = highest `candidateVotes`, field name is `candidateParty` not `partyAbbr`). Delete temp query scripts when done.

- [ ] **Step 1: Write read-only query scripts as needed for district-level specifics, note the real figures**

- [ ] **Step 2: Write `scripts/data/up-posts-batch2.ts`** (same shape as Task 2's file, importing from `./lexical-helpers`, 12 entries, `pexelsQuery` using generic stock-photo terms like `'India rural landscape'`, `'Uttar Pradesh Ganges river'`, `'India political rally crowd'`)

- [ ] **Step 3: Validate the array shape**

```bash
DOTENV_CONFIG_PATH=.env.local pnpm exec tsx -e "
import { upPosts } from './scripts/data/up-posts-batch2'
if (upPosts.length !== 12) throw new Error('expected 12 posts, got ' + upPosts.length)
const slugs = new Set<string>()
for (const p of upPosts) {
  if (!p.title || !p.slug || !p.metaTitle || !p.metaDescription || !p.pexelsQuery) throw new Error('missing field on ' + p.slug)
  if (p.metaDescription.length > 165) throw new Error('metaDescription too long: ' + p.slug)
  if (slugs.has(p.slug)) throw new Error('duplicate slug in batch: ' + p.slug)
  slugs.add(p.slug)
  if (!p.categories.every(c => ['Election Analysis','Data Insights','Constituency Guide','Political History'].includes(c))) throw new Error('invalid category on ' + p.slug)
  if ((p.content as any).root.children.length === 0) throw new Error('empty content: ' + p.slug)
}
console.log('OK: 12 valid UP posts, slugs unique')
"
```
Expected: `OK: 12 valid UP posts, slugs unique`

- [ ] **Step 4: Delete any temp query scripts**

```bash
rm -f scripts/_tmp_up_query.mts
```

- [ ] **Step 5: Commit**

```bash
git add scripts/data/up-posts-batch2.ts
git commit -m "feat(blog): add 12 Uttar Pradesh election history post drafts"
```

---

### Task 4: Cross-batch validation

**Files:**
- Create: `scripts/data/validate-batch2.mts`

**Interfaces:**
- Consumes: `tnPosts` from `scripts/data/tn-posts-batch2.ts` (Task 2), `upPosts` from `scripts/data/up-posts-batch2.ts` (Task 3).
- Produces: nothing (validation-only script, run in Task 4 and reusable by Task 6).

- [ ] **Step 1: Write the cross-batch validation script**

```ts
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
```

- [ ] **Step 2: Run it**

```bash
pnpm exec tsx scripts/data/validate-batch2.mts
```
Expected: `OK: 24 posts total, all slugs unique and non-colliding`

- [ ] **Step 3: Commit**

```bash
git add scripts/data/validate-batch2.mts
git commit -m "test(blog): add cross-batch slug validation for TN+UP post drafts"
```

---

### Task 5: Seed script — create the 24 posts

**Files:**
- Create: `scripts/seed-blog-posts-batch2.mts`

**Interfaces:**
- Consumes: `tnPosts`, `upPosts` from Tasks 2/3; validation logic pattern from Task 4.
- Produces: 24 new documents in the `posts` collection, `_status: 'published'`.

- [ ] **Step 1: Write the seed script**

```ts
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
```

- [ ] **Step 2: Run it**

```bash
DOTENV_CONFIG_PATH=.env.local pnpm exec tsx scripts/seed-blog-posts-batch2.mts
```
Expected: `Done. Created: 24, Skipped: 0`

- [ ] **Step 3: Verify total post count**

```bash
DOTENV_CONFIG_PATH=.env.local pnpm exec tsx -e "
import { getPayload } from 'payload'
import config from './src/payload.config'
getPayload({ config }).then(async (payload) => {
  const r = await payload.find({ collection: 'posts', limit: 1 })
  console.log('Total posts:', r.totalDocs)
  process.exit(0)
})
"
```
Expected: `Total posts: 34`

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-blog-posts-batch2.mts
git commit -m "feat(blog): seed script for TN+UP batch 2 posts"
```

---

### Task 6: Pexels image script — attach hero images

**Files:**
- Create: `scripts/seed-blog-post-images-batch2.mts`

**Interfaces:**
- Consumes: `tnPosts`, `upPosts` (for the `slug → pexelsQuery` mapping), `PEXELS_API_KEY` env var (Task 1).
- Produces: `heroImage` and `meta.image` set on all 24 posts from Task 5.

- [ ] **Step 1: Write the image script**

```ts
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
```

- [ ] **Step 2: Run it**

```bash
DOTENV_CONFIG_PATH=.env.local pnpm exec tsx scripts/seed-blog-post-images-batch2.mts
```
Expected: 24 lines ending in `OK Post updated with hero image`, then `Done.`

- [ ] **Step 3: Verify all 24 have hero images**

```bash
DOTENV_CONFIG_PATH=.env.local pnpm exec tsx -e "
import { getPayload } from 'payload'
import config from './src/payload.config'
import { tnPosts } from './scripts/data/tn-posts-batch2'
import { upPosts } from './scripts/data/up-posts-batch2'
getPayload({ config }).then(async (payload) => {
  const slugs = [...tnPosts, ...upPosts].map(p => p.slug)
  const r = await payload.find({ collection: 'posts', where: { slug: { in: slugs } }, limit: 30, depth: 0 })
  const missing = r.docs.filter((d: any) => !d.heroImage)
  console.log('Missing hero image:', missing.length, missing.map((d: any) => d.slug))
  process.exit(0)
})
"
```
Expected: `Missing hero image: 0 []`

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-blog-post-images-batch2.mts
git commit -m "feat(blog): Pexels image script for TN+UP batch 2 posts"
```

---

### Task 7: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Lint the new scripts**

```bash
pnpm lint
```
Expected: no errors in `scripts/data/*.ts` or `scripts/seed-blog-posts-batch2.mts` / `scripts/seed-blog-post-images-batch2.mts`

- [ ] **Step 2: Start the dev server**

```bash
pnpm dev
```

- [ ] **Step 3: Spot-check 3 posts in the browser**

Visit `http://localhost:3010/posts/2026-tamil-nadu-election-result-tvk-debut`, one other TN post, and one UP post (use the slugs from `scripts/data/tn-posts-batch2.ts` / `up-posts-batch2.ts`). For each, confirm: hero image renders, title/content render without broken lexical nodes, the AdSense in-article slot placeholder appears below the content, and `/posts` listing page shows all 34 posts paginated correctly.

- [ ] **Step 4: Spot-check facts against the Global Constraints numbers**

Open the TN "flagship result" post and the UP "2022 result" post; confirm the seat numbers stated (TVK 108/DMK 59/AIADMK 47 for TN; BJP 256/SP 111 for UP) match the Global Constraints section exactly.

- [ ] **Step 5: Stop the dev server** (Ctrl+C)

No commit for this task — verification only.
