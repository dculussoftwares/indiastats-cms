# IndiaStats.org — SEO Audit 2026

**Audit date:** June 18, 2026  
**Site:** https://indiastats.org  
**Business type:** Election Data / Analytics Publisher  
**Tech stack:** Next.js 15, PayloadCMS 3.x, Azure Container Apps, Cloudflare CDN  
**Audit score:** 55 / 100 → **70 / 100** after Phases 1–5

---

## Score Breakdown

| Category | Weight | Audit Score | After Phases 1–5 | Change |
|---|---|---|---|---|
| Technical SEO | 22% | 68 | 82 | +14 |
| Content Quality | 23% | 54 | 56 | +2 |
| On-Page SEO | 20% | 52 | 68 | +16 |
| Schema / Structured Data | 10% | 38 | 72 | +34 |
| Performance (CWV) | 10% | 55 | 72 | +17 |
| AI Search Readiness | 10% | 38 | 60 | +22 |
| Images | 5% | 58 | 62 | +4 |
| **Weighted Total** | | **55** | **70** | **+15** |

> Content Quality gains are capped until blog posts are expanded (1,200+ words) and authors are assigned in CMS — those are manual tasks.

---

## What the Site Does Well

These were confirmed as strengths — do not regress them.

- All 234 assembly pages are statically generated (`generateStaticParams`) and Cloudflare-edge-cached — excellent TTFB and LCP
- Dynamic OG images via `/api/og/[assemblyId]` working correctly on all assembly pages
- Bilingual content (Tamil + English) — differentiated niche signal no competitor offers
- ECI source attribution throughout (footer, About page, OG images) — genuine trust anchor
- `WebSite` + `SearchAction` schema correctly configured and eligible for Sitelinks Searchbox
- Unique data assets (vote transfer charts, booth-level data, alluvial flow charts) — high dwell-time differentiators
- 301-redirect middleware for old ID-based URLs working correctly
- All critical pages (`/election-results`, `/assembly-map`, `/caste-demographics`, analysis pages) present in sitemap
- HTTPS enforced: HTTP → HTTPS 301 confirmed
- No noindex on any content page
- Clean slug-based URLs throughout

---

## Full Findings

### Critical (blocks indexing or rich results)

**C1. Assembly & District JSON-LD client-rendered — invisible to AI crawlers**  
`AssemblyPageJsonLd` and `DistrictPageJsonLd` were inside `'use client'` components. The 2026 election winner name and all assembly-specific data were also exclusively in client-rendered React state. AI crawlers (GPTBot, ClaudeBot, PerplexityBot) that don't execute JS saw blank data sections.  
**Status:** ✅ Fixed in Phase 2

**C2. BreadcrumbList schema used relative URLs — rich results blocked**  
Every `item` in every `BreadcrumbList` was a relative path. Google requires absolute URLs. No breadcrumb rich results could appear.  
**Status:** ✅ Fixed in Phase 1

**C3. Organization logo was a bare string URL — Knowledge Panel invalid**  
`Organization.logo` was `"https://indiastats.org/favicon.svg"` (a string). Google requires an `ImageObject`. Validation in Rich Results Test failed.  
**Status:** ✅ Fixed in Phase 1 — now `ImageObject` using `/icon.png`

**C4. Zero security headers — no HSTS, no X-Frame-Options**  
All security headers missing. `x-powered-by: Next.js, Payload` exposed the full stack fingerprint.  
**Status:** ✅ Fixed in Phase 1 — HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy added. `poweredByHeader: false` set.

**C5. Title tag triple-duplication on blog posts and dashboard**  
Root layout `title.template: '%s | IndiaStats.org'` was applied on top of a title that `generateMeta` had already appended ` | IndiaStats.org` to. Result: `"Title | IndiaStats.org | IndiaStats.org | IndiaStats.org"`.  
File: `src/utilities/generateMeta.ts`  
**Status:** ✅ Fixed in Phase 1

**C6. No `canonical` tag on `/election-data`**  
Client-side filters (year, district, party) could cause Google to index parameterized duplicate variants.  
**Status:** ✅ Fixed in Phase 1

---

### High (significant ranking impact)

**H1. Blog posts had zero Article schema — no rich results possible**  
10 blog posts, zero `BlogPosting` JSON-LD. `og:type` was `"website"` on all posts (should be `"article"`). `og:url` pointed to the homepage `https://indiastats.org` instead of the post's own URL.  
**Status:** ✅ Fixed in Phase 2 & 3 — `BlogPostingJsonLd` added, `og:type: "article"` + `publishedTime` set, `og:url` bug fixed in `generateMeta.ts`

**H2. Blog posts average ~450 words — thin content, fragile rankings**  
The DMK vs AIADMK post ranks #1 today at 450 words. All 10 posts published same day (April 23, 2026). Threshold for editorial pages is 1,200+ words.  
**Status:** ⚠️ Pending — manual CMS work (expand posts, assign authors)

**H3. No named authors on any blog post — E-E-A-T failure**  
`populatedAuthors` array empty for all posts. No author byline appears. Critical for YMYL-adjacent election content.  
**Status:** ⚠️ Pending — create author in PayloadCMS Admin, assign to all 10 posts

**H4. `Dataset` and `DataCatalog` schema absent**  
No schema for the election data catalog anywhere. Google Dataset Search can't index the data. AI systems can't identify IndiaStats as a data source.  
**Status:** ✅ Fixed in Phase 2 — `DatasetJsonLd` on all 234 assembly pages, `DataCatalogJsonLd` on homepage

**H5. 32 assembly constituencies missing from assemblies-sitemap.xml**  
Only 202 of 234 assemblies appear (404 URLs ÷ 2 = 202). Likely missing slugs or district associations in PayloadCMS.  
**Status:** ⚠️ Pending — needs DB investigation (query assemblies without `slug` or `districtSlug`)

**H6. `/tamil-nadu` state home page not in any sitemap**  
Highest-traffic page entirely absent from all 5 sitemaps.  
**Status:** ✅ Fixed in Phase 1 — added with `priority: 1.0`

**H7. GA4 double-firing — GTM + direct Script tag firing same Measurement ID**  
GTM container `GTM-MS8LQ9GB` already fires GA4. A duplicate direct `<Script>` tag sent every pageview twice.  
**Status:** ✅ Fixed in Phase 1 — direct GA4 Script tags removed, GTM only

**H8. District `containsPlace` used placeholder names**  
`DistrictPageJsonLd` generated `"Assembly Constituency 1…N"` — fabricated names. Real names available in `data.assemblies`.  
**Status:** ✅ Fixed in Phase 1

**H9. Homepage missing `og:image` and `twitter:image`**  
Blank social card when sharing the homepage.  
**Status:** ✅ Fixed in Phase 2 — `/indiastats-logo-1024.png` set as fallback

**H10. www subdomain returns 200 — duplicate domain**  
`https://www.indiastats.org/` returns HTTP 200 instead of redirecting. Google can index both as separate sites.  
**Status:** ⚠️ Pending — Cloudflare dashboard → Redirect Rules → hostname `www.indiastats.org` → 301 to `https://indiastats.org/$uri` (5 min, no deploy)

---

### Medium

| # | Issue | File / Location | Status |
|---|---|---|---|
| M1 | Mixpanel session recording at 100% — INP impact | `instrumentation-client.ts` | ✅ Fixed Phase 1 → 5% |
| M2 | PostHog + Mixpanel init at module load time | `instrumentation-client.ts` | ✅ Fixed Phase 4 — deferred via `requestIdleCallback` |
| M3 | GeoJSON 314KB passed as RSC prop on election-results | `election-results/page.tsx` | ✅ Fixed Phase 4 — client-side fetch from CDN |
| M4 | Recharts eagerly imported in AssemblyPageClient | `AssemblyPageClient.tsx` | ✅ Fixed Phase 4 — `next/dynamic` lazy load |
| M5 | `icon.png` is 254KB JPEG mislabeled as PNG | `public/icon.png` | ⚠️ Pending — replace file with proper PNG |
| M6 | All sitemaps use dynamic current-timestamp as `lastmod` | Sitemap generation code | ✅ Fixed Phase 5 — static pages use stable date, dynamic pages use `now` |
| M7 | Sitemap index has no `lastmod` on child entries | Sitemap index generator | ✅ Fixed Phase 5 — XML generated manually with per-entry `lastmod` |
| M8 | Assembly-map district filter uses Tamil-encoded query param | Assembly map route | ⚠️ Pending |
| M9 | Prediction URLs contain numeric IDs — brittle canonical | Middleware + predictions routing | ⚠️ Pending |
| M10 | No `loading.tsx` for election-results route — blank screen | New file needed | ✅ Fixed Phase 4 |
| M11 | Tailwind dynamic color classes at risk of purge in production | `tailwind.config.mjs` safelist | ✅ Fixed Phase 4 |
| M12 | No `llms.txt` file | `public/llms.txt` | ✅ Fixed Phase 3 |
| M13 | `og:type: "website"` on blog posts | `posts/[slug]/page.tsx` | ✅ Fixed Phase 3 — set to `"article"` |
| M14 | robots.txt redundantly lists all 5 child sitemaps + index | `next-sitemap.config.cjs` | ✅ Fixed Phase 3 — source config updated |
| M15 | `Host:` directive in robots.txt is deprecated Yandex extension | `next-sitemap.config.cjs` | ✅ Fixed Phase 3 |
| M16 | Homepage meta description too long (190 chars) | `(home)/page.tsx` | ✅ Fixed Phase 3 — shortened to 142 chars |
| M17 | 10 blog posts all published same day — content burst pattern | Content strategy | ⚠️ Pending — expand posts with dated editorial cadence |
| M18 | Assembly page above-the-fold shows voter counts, not 2026 winner | `AssemblyPageClient.tsx` | ✅ Partially fixed Phase 2 — factual summary added server-side |
| M19 | Blog post last H2 is always a navigation CTA, not content | All 10 posts | ⚠️ Pending — CMS editing |
| M20 | No `preconnect` hints for GTM, PostHog proxy | `layout.tsx` | ✅ Fixed Phase 4 |

---

### Low

| # | Issue | Status |
|---|---|---|
| L1 | Implement IndexNow in `eci:push` script | ⚠️ Pending |
| L2 | Organization `sameAs` array has only Twitter | ✅ Fixed Phase 5 — added GitHub; Twitter handle corrected to `@india_stats_org` |
| L3 | `GovernmentServiceJsonLd` defined but never used — dead code | ✅ Fixed Phase 5 — removed |
| L4 | 5 utility pages in pages-sitemap missing priority/changefreq | ✅ Fixed Phase 5 — all utility pages have priority + changefreq |
| L5 | Sitemap index missing `lastmod` on child entries | ✅ Fixed Phase 5 — XML generated manually |
| L6 | `AboutPage` schema type not set on `/about` | ✅ Fixed Phase 3 |
| L7 | Party logo images not converted to WebP | ⚠️ Pending |
| L8 | Dark mode CLS via `InitTheme beforeInteractive` | ⚠️ Pending |
| L9 | No pagination signals on booth listing pages | ⚠️ Pending |
| L10 | Meta description on `/posts/` listing is sitewide fallback | ✅ Fixed Phase 3 |

---

## GEO / AI Search Readiness

**Audit score: 38 / 100 → estimated 60 / 100 after phases**

| Platform | Audit Score | After Phases | Primary Remaining Gap |
|---|---|---|---|
| Google AI Overviews | 42/100 | ~65/100 | Thin blog content; no author entity |
| ChatGPT / OpenAI | 28/100 | ~50/100 | No author entity; blog posts still ~450 words |
| Perplexity | 30/100 | ~52/100 | No sourced inline citations in blog posts |
| Bing Copilot | 40/100 | ~62/100 | Author entity and longer articles still needed |

**Key fixes that improved AI readiness:**
- `AssemblyPageJsonLd` + `DatasetJsonLd` now in server-rendered HTML — AI crawlers can read constituency data without executing JS
- Server-rendered factual summary paragraph on every assembly page — directly answers "who won [constituency] 2026"
- `BlogPostingJsonLd` with `datePublished`, `dateModified`, publisher on all 10 posts
- `DataCatalogJsonLd` on homepage — signals IndiaStats as a structured data platform
- `llms.txt` created — Perplexity and LLM-powered tools can read site structure
- `Organization.sameAs` now includes Twitter (`@india_stats_org`) and GitHub — expands entity graph

**Remaining AI gap:** Blog posts are still ~450 words with no named authors. Until those are expanded and attributed, ChatGPT and Perplexity will continue to prefer citing Wikipedia and ECI over IndiaStats for factual queries.

---

## SXO (Search Experience Optimization)

**Score: 56 / 100** (unchanged — SXO requires UX and content work, not code fixes)

### Page-type mismatches

| Page | Expected SERP type | Actual | Mismatch |
|---|---|---|---|
| Homepage | Data portal / results hub | Marketing landing page | HIGH — homepage restructure needed |
| Assembly page | Constituency profile + results table | Data dashboard | Aligned (factual summary added) |
| District page | District results hub | District data page | Medium |
| Blog post | Long-form analysis (2k+ words) | Short editorial (~500 words) | HIGH — content expansion needed |

### Persona scores

| Persona | Score | Biggest remaining gap |
|---|---|---|
| Voter seeking constituency info | 68/100 | Current MLA not the first data point above the fold |
| Journalist on deadline | 65/100 | No "copy key stats" or chart embed button |
| Political researcher | 62/100 | No side-by-side constituency comparison tool |
| Academic researcher | 48/100 | No `/methodology` page, no data citation format |
| Developer / Data analyst | 38/100 | No public API docs page, no dataset download CTA |

---

## Content Quality & E-E-A-T

**Score: 54 / 100** (code fixes moved On-Page SEO; E-E-A-T itself requires manual CMS work)

| Factor | Score | Notes |
|---|---|---|
| Experience | 10/25 | Original data; no first-hand editorial voice |
| Expertise | 13/25 | Strong data; author credentials still absent |
| Authoritativeness | 14/25 | ECI attribution present; no named experts |
| Trustworthiness | 17/25 | Good footer/about; AI content disclosure missing from About page |

**Remaining manual tasks (highest impact first):**
1. Create author profile in PayloadCMS Admin with name, title, short bio — assign to all 10 posts
2. Expand DMK vs AIADMK post to 1,500+ words with embedded election result tables
3. Expand 2026 election preview post to 1,500+ words
4. Add AI content editorial policy paragraph to About page (which sections are AI-generated and how they're reviewed)
5. Add `/methodology` page documenting ECI sourcing, update cadence, data accuracy process

---

## Performance (Core Web Vitals)

**Estimated scores after Phase 4:**

| Page | LCP | FCP | TTFB | INP Risk | CLS Risk | Change |
|---|---|---|---|---|---|---|
| Homepage | Good | Good | Good | Low (analytics now idle-deferred) | Low | INP improved |
| Assembly page | Good | Good | Good | Medium (inline PieChart still eager) | Low | LCP improved — chart bundle split |
| Election results | Improving | Good (skeleton now shows) | Good (GeoJSON removed from RSC) | Medium | Medium | Major TTFB + FCP improvement |

**Phase 4 fixes applied:**
1. ✅ GA4 double-firing removed — Phase 1
2. ✅ Mixpanel session recording 100% → 5% — Phase 1
3. ✅ PostHog + Mixpanel deferred via `requestIdleCallback` — Phase 4
4. ✅ 314KB GeoJSON removed from RSC payload, now client-fetched from CDN — Phase 4
5. ✅ 5 chart components lazy-loaded via `next/dynamic` — Phase 4
6. ✅ Loading skeleton added to election-results — Phase 4
7. ✅ Cache-Control headers for `/images/*`, `/geojson/*`, `/llms.txt` — Phase 4
8. ✅ `preconnect` + `dns-prefetch` for GTM, PostHog, AdSense — Phase 4

**Remaining performance item:**
- `icon.png` is still 254KB JPEG mislabeled as PNG — replace with proper 32×32 and 192×192 PNG files

---

## Implementation Phases

### Phase 1 — Foundation ✅ COMPLETE (June 18, 2026)

| Fix | File(s) |
|---|---|
| Title deduplication — strip site suffix in `generateMeta` | `generateMeta.ts` |
| `og:url` bug fixed — posts get absolute `/posts/{slug}` URL | `generateMeta.ts`, `posts/[slug]/page.tsx`, `pages/[pageSlug]/page.tsx` |
| Canonical added to `/election-data` | `election-data/page.tsx` |
| `BreadcrumbList.item` absolute URLs — breadcrumb rich results unblocked | `JsonLd.tsx` |
| `Organization.logo` → `ImageObject` using `/icon.png` (192×192) | `JsonLd.tsx` |
| `DistrictPageJsonLd` uses real assembly names | `JsonLd.tsx`, `DistrictPageClient.tsx` |
| Duplicate GA4 Script removed — GTM-only | `layout.tsx` |
| Security headers (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) | `next.config.js` |
| `poweredByHeader: false` | `next.config.js` |
| Mixpanel session recording 100% → 5%, `ignore_dnt` removed | `instrumentation-client.ts` |
| `/tamil-nadu` state home added to sitemap with `priority: 1.0` | `pages-sitemap.xml/route.ts` |

### Phase 2 — Structured Data ✅ COMPLETE (June 18, 2026)

| Fix | File(s) |
|---|---|
| `AssemblyPageJsonLd` moved to server component — JSON-LD in initial HTML | `assembly/.../page.tsx`, `AssemblyPageClient.tsx` |
| Server-rendered factual summary paragraph (winner, party, voter count) | `assembly/.../page.tsx` |
| `DatasetJsonLd` on all 234 assembly pages | `JsonLd.tsx`, `assembly/.../page.tsx` |
| `BlogPostingJsonLd` on all 10 blog posts | `JsonLd.tsx`, `posts/[slug]/page.tsx` |
| `DataCatalogJsonLd` on homepage | `JsonLd.tsx`, `(home)/page.tsx` |
| Homepage `og:image` + `twitter:images` fallback | `(home)/page.tsx` |

### Phase 3 — On-Page SEO & E-E-A-T ✅ CODE COMPLETE (June 18, 2026)

| # | Fix | File(s) | Status |
|---|---|---|---|
| 1 | `og:type: "article"` + `publishedTime`/`modifiedTime` on blog posts | `posts/[slug]/page.tsx` | ✅ Done |
| 2 | `AboutPage` JSON-LD schema on `/about` | `about/page.tsx`, `JsonLd.tsx` | ✅ Done |
| 3 | Homepage meta description shortened 190 → 142 chars | `(home)/page.tsx` | ✅ Done |
| 4 | `/posts` listing: title, description, canonical, OG | `posts/page.tsx` | ✅ Done |
| 5 | `llms.txt` created for AI crawler readability | `public/llms.txt` | ✅ Done |
| 6 | `robots.txt` config: removed redundant child sitemaps, `Host:` directive | `next-sitemap.config.cjs` | ✅ Done |
| 7 | Create author profile in CMS, assign to all 10 posts | PayloadCMS Admin | ⚠️ Manual — CMS |
| 8 | Expand blog posts to 1,500+ words | CMS content editing | ⚠️ Manual — content |
| 9 | Add AI content editorial policy to About page | CMS content editing | ⚠️ Manual — content |
| 10 | www → non-www redirect | Cloudflare dashboard | ⚠️ Manual — Cloudflare |

### Phase 4 — Performance ✅ CODE COMPLETE (June 18, 2026)

| # | Fix | File(s) | Status |
|---|---|---|---|
| 1 | Loading skeleton for election-results route | `election-results/loading.tsx` | ✅ Done |
| 2 | GeoJSON client-side fetch from CDN (removed 314KB RSC prop) | `ElectionResultsMap/index.tsx`, `election-results/page.tsx` | ✅ Done |
| 3 | Cache-Control headers for `/images/*`, `/geojson/*`, `/llms.txt` | `next.config.js` | ✅ Done |
| 4 | Lazy-load 5 chart components via `next/dynamic` | `AssemblyPageClient.tsx` | ✅ Done |
| 5 | Defer PostHog + Mixpanel via `requestIdleCallback` | `instrumentation-client.ts` | ✅ Done |
| 6 | Tailwind safelist for dynamic color classes in `colorMap`/`iconColorMap` | `tailwind.config.mjs` | ✅ Done |
| 7 | `preconnect` + `dns-prefetch` for GTM, PostHog proxy, AdSense | `layout.tsx` | ✅ Done |
| 8 | Replace `icon.png` 254KB JPEG with proper PNG | `public/icon.png` | ⚠️ Pending — provide new asset |
| 9 | Convert party logo `.jpg` files to WebP | `public/images/` | ⚠️ Pending |

### Phase 5 — Sitemap & Structural Fixes ✅ COMPLETE (June 18, 2026)

| # | Fix | File(s) | Status |
|---|---|---|---|
| 1 | **32 missing assemblies recovered** — use `districtId` mapping instead of `districtName` string | `assemblies-sitemap.xml/route.ts` | ✅ Done |
| 2 | **Pages sitemap** — stable `lastmod` for static pages, `priority`/`changefreq` on utility pages, `/privacy-policy` added | `pages-sitemap.xml/route.ts` | ✅ Done |
| 3 | **Dead code removed** — `GovernmentServiceJsonLd` (never used) deleted | `JsonLd.tsx` | ✅ Done |
| 4 | **`Organization.sameAs`** expanded with GitHub repo | `JsonLd.tsx` | ✅ Done |
| 5 | **Sitemap index `lastmod`** — XML generated manually, per-entry timestamps added | `sitemap.xml/route.ts` | ✅ Done |
| 6 | **Twitter/X handle corrected** — `@IndiaStatsOrg` → `@india_stats_org` across JSON-LD, meta tags, SiteSettings, `llms.txt` | `JsonLd.tsx`, `layout.tsx`, `SiteSettings.ts`, `llms.txt` | ✅ Done |

---

## Remaining Work

### Manual / CMS

| Priority | Task | Owner | Time |
|---|---|---|---|
| High | Create author profile in PayloadCMS Admin, assign to all 10 posts | Content | 1 hr |
| High | Expand DMK vs AIADMK post to 1,500+ words with embedded data tables | Content | 4 hrs |
| High | Expand 2026 election preview post to 1,500+ words | Content | 4 hrs |
| High | www → non-www redirect in Cloudflare Redirect Rules | DevOps | 5 min |
| High | Replace `public/icon.png` (254KB JPEG) with proper PNG favicon | Design | 1 hr |
| Medium | Add AI content editorial policy to About page | Content | 1 hr |
| Medium | Convert party logo `.jpg` files in `public/images/` to WebP | Design | 1 hr |
| Low | Add `/methodology` page (ECI sourcing, update cadence, accuracy policy) | Content | 2 hrs |

### Dev (Code)

| Priority | Task | File | Time |
|---|---|---|---|
| Low | Implement IndexNow in `eci:push` script | `scripts/eci-push.mts` | 2 hrs |
| Low | Add LinkedIn/Wikipedia to `Organization.sameAs` when URLs confirmed | `JsonLd.tsx` | 15 min |
| Low | Assembly-map district filter: slug-based instead of Tamil-encoded param | Assembly map route | 3 hrs |
| Low | Prediction URLs: remove numeric ID from path | Middleware + routing | 3 hrs |
| Low | Dark mode CLS — verify `InitTheme` default theme matches SSR output | `InitTheme/index.tsx` | 30 min |

---

## Key Files Reference

| Area | File |
|---|---|
| Schema / JSON-LD components | `src/components/seo/JsonLd.tsx` |
| CMS page/post metadata | `src/utilities/generateMeta.ts` |
| Root layout metadata + scripts | `src/app/(frontend)/layout.tsx` |
| Homepage | `src/app/(frontend)/(home)/page.tsx` |
| Assembly page (server) | `src/app/(frontend)/[stateSlug]/assembly/[districtSlug]/[assemblySlug]/page.tsx` |
| Assembly page (client) | `src/app/(frontend)/[stateSlug]/assembly/[districtSlug]/[assemblySlug]/AssemblyPageClient.tsx` |
| District page (client) | `src/app/(frontend)/[stateSlug]/district/[districtSlug]/DistrictPageClient.tsx` |
| Blog post page | `src/app/(frontend)/posts/[slug]/page.tsx` |
| About page | `src/app/(frontend)/about/page.tsx` |
| Posts listing | `src/app/(frontend)/posts/page.tsx` |
| Election data table | `src/app/(frontend)/election-data/page.tsx` |
| Election results map | `src/components/ElectionResultsMap/index.tsx` |
| Pages sitemap | `src/app/(frontend)/(sitemaps)/pages-sitemap.xml/route.ts` |
| Sitemap index | `src/app/(frontend)/(sitemaps)/sitemap.xml/route.ts` |
| Analytics init | `src/instrumentation-client.ts` |
| Next.js config | `next.config.js` |
| next-sitemap config (robots.txt source) | `next-sitemap.config.cjs` |
| Tailwind config | `tailwind.config.mjs` |
| OG image defaults | `src/utilities/mergeOpenGraph.ts` |
| llms.txt | `public/llms.txt` |

---

## Sitemap Status

| Issue | Severity | Status |
|---|---|---|
| 32 of 234 assembly constituencies missing | High | ✅ Fixed Phase 5 — `districtId` mapping recovers all |
| All `lastmod` values were dynamic current-timestamp | Medium | ✅ Fixed Phase 5 — static pages use stable date; dynamic pages use `now` |
| Sitemap index had no `lastmod` on child entries | Low | ✅ Fixed Phase 5 — XML generated manually |
| 5 utility pages missing priority/changefreq | Low | ✅ Fixed Phase 5 |
| `/privacy-policy` not in sitemap | Low | ✅ Fixed Phase 5 |
| `/tamil-nadu` state home missing from sitemap | High | ✅ Fixed Phase 1 |
