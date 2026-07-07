# TN + UP SEO Blog Post Expansion — Design

## Goal

Grow organic traffic and AdSense in-article revenue by publishing 24 new data-grounded
blog posts: 12 on Tamil Nadu's real 2026 assembly election result (TVK's debut), and 12
on Uttar Pradesh's 2012–2022 election history. Post pages already render an AdSense
in-article unit (`src/app/(frontend)/posts/[slug]/page.tsx:71`), so publishing more posts
is directly ad-revenue-additive with no extra plumbing.

## Background

- 10 Tamil Nadu posts already exist (published, with hero images), seeded by
  `scripts/seed-blog-posts.mts` + `scripts/seed-blog-post-images.mts`. They cover 2021/2016
  results, demographics, zones, DMK-AIADMK rivalry, and a now-stale "2026 election preview."
- Uttar Pradesh was added as a second state (403 assemblies, 75 districts,
  `src/config/states/uttar-pradesh.ts`) but has zero blog posts.
- The DB already contains the **real, declared 2026 Tamil Nadu election result**
  (`live-election-results` collection, 234/234 declared): TVK 108 seats, DMK 59,
  AIADMK 47, INC 5, PMK 4, CPI 2, CPI(M) 2, VCK 2, IUML 2, AMMK 1, DMDK 1, BJP 1.
  TVK (Tamilaga Vettri Kazhagam) is Vijay's party, contesting its first election —
  this is a large, currently under-covered SEO opportunity. Majority mark is 118, so
  TVK is the single largest party but short of a majority; the DB does not say who
  forms the government, so posts must not assert that.
- UP `election-history` seat tallies are verified accurate against public record:
  2012 SP 224/BSP 80/BJP 47/INC 28; 2017 BJP 312/SP 47/BSP 19; 2022 BJP 256/SP 111/others
  small. UP per-assembly `voters` and `totalVoters` fields are all `0` — that data upload
  is still in progress — so posts must not cite precise per-constituency UP voter/turnout
  figures. State-level aggregates already exist in config (`voterCountLabel: '15+ crore'`,
  `boothCountLabel: '1.7 lakh+'`) and are safe to use.

## Architecture

Two parallel content-writing agents (one per state) each produce a **data-only TypeScript
module** — no direct DB writes. Shape mirrors the existing `posts` array in
`scripts/seed-blog-posts.mts`: `{ title, slug, metaTitle, metaDescription, content,
pexelsQuery }` per post, built with the same lexical richText helpers
(`text`/`paragraph`/`heading`/`bulletList`/`richText`) already defined in that file.

Each agent:
- Has Bash/Read/Write access, runs read-only `tsx` scripts against the dev DB
  (`DOTENV_CONFIG_PATH=.env.local pnpm exec tsx <tmp-script>`, deleting temp scripts after)
  to pull real numbers for its 12 topics — margins, district/zone breakdowns, reserved-seat
  results, etc.
- Is given the pre-verified top-line numbers above directly, so nothing is hallucinated.
- Must not call `payload.create`/`payload.update` — output is a reviewable file only.
- Follows the BBC News-style tone already established in `seed-blog-posts.mts` (~600-900
  words per post, `h2`/`h3` headings, bullet lists for data, no marketing fluff).

After both agents return, I (main thread):
1. Spot-check generated numbers against the verified figures above.
2. Merge into `scripts/seed-blog-posts-batch2.mts` (creates posts, `_status: 'published'`,
   reusing the 4 existing categories — Election Analysis, Data Insights, Constituency
   Guide, Political History).
3. Write `scripts/seed-blog-post-images-batch2.mts` — same shape as
   `seed-blog-post-images.mts` but against the Pexels API
   (`https://api.pexels.com/v1/search`, `Authorization` header), reading
   `process.env.PEXELS_API_KEY` (added to `.env.local`, gitignored — never hardcoded in a
   committed script, unlike the existing Pixabay key).
4. Run both scripts, verify final post count and that a few pages render.

## Topics

**Tamil Nadu (12)** — all grounded in the real 2026 result: flagship result overview;
2021-vs-2026 seat swing; DMK's collapse (133→59); AIADMK's continued decline
(136→66→47); district/zone breakdown of TVK's wins; closest-margin contests; fate of
minor allies (PMK/VCK/CPI/CPI(M)/INC/IUML/AMMK/DMDK/BJP, one seat each in most cases);
what "108 short of 118" means for government formation (framed as an open question, not
asserted); reserved-constituency (SC/ST) results; Chennai's 2026 verdict; Kongu belt's
2026 verdict; turnout trends 2021 vs 2026.

**Uttar Pradesh (12)** — 2022 result (BJP's second majority under Yogi Adityanath); 2017
landslide (BJP 312/403); 2012 SP wave under Akhilesh Yadav; BSP's collapse (80→19→1
seats across 2012/2017/2022); 2022 BJP-vs-SP head-to-head; beginner's guide to UP's 403
constituencies; UP's 75 districts and political regions; caste-politics explainer
(Yadav-Muslim, Jatav-Dalit, non-Yadav OBC consolidation); Yogi Adityanath profile;
smaller parties (RLD/NISHAD/ApnaDal(S)) and alliance math; Western UP vs Purvanchal as
distinct battlegrounds; UP 2027 preview built on the 2012–22 trend line.

No new collections, fields, or UI changes — this is a content + script task only.

## Guardrails

- Cite only DB-verified numbers or well-established public facts (same standard the
  original 10 TN posts used for Stalin/Jayalalithaa bios).
- No claim about who forms the next TN government.
- No precise per-constituency UP voter/turnout numbers.
- Pexels key never committed to git.
- The existing stale "2026 election preview" post is left untouched (explicit user
  decision — accepted the SEO/trust risk of a superseded preview post remaining live).
- All 24 posts publish immediately on creation (explicit user decision, matches how the
  original 10 were seeded).

## Testing / Verification

- After seeding: confirm `payload.find({ collection: 'posts' })` shows 34 total
  (10 existing + 24 new), all `published`, all with `heroImage` set.
- Spot-check 2-3 posts per state via `pnpm dev` in a browser: renders, ad slot present,
  meta title/description populated, no broken lexical content.
- `pnpm lint` on the new scripts.
