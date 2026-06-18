# IndiaStats.org — SEO Audit 2026

**Audit date:** June 18, 2026  
**Site:** https://indiastats.org  
**Business type:** Election Data / Analytics Publisher  
**Tech stack:** Next.js 15, PayloadCMS 3.x, Azure Container Apps, Cloudflare CDN  
**Overall health score:** 55 / 100

---

## Score Breakdown

| Category | Weight | Score | Status |
|---|---|---|---|
| Technical SEO | 22% | 68 | Pass with issues |
| Content Quality | 23% | 54 | Needs work |
| On-Page SEO | 20% | 52 | Needs work |
| Schema / Structured Data | 10% | 38 | Fail |
| Performance (CWV) | 10% | 55 | Needs work |
| AI Search Readiness | 10% | 38 | Fail |
| Images | 5% | 58 | Needs work |

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
**Status:** Fixed in Phase 2

**C2. BreadcrumbList schema used relative URLs — rich results blocked**  
Every `item` in every `BreadcrumbList` was a relative path. Google requires absolute URLs. No breadcrumb rich results could appear.  
**Status:** Fixed in Phase 1

**C3. Organization logo was a bare string URL — Knowledge Panel invalid**  
`Organization.logo` was `"https://indiastats.org/favicon.svg"` (a string). Google requires an `ImageObject`. Validation in Rich Results Test failed.  
**Status:** Fixed in Phase 1 — now `ImageObject` using `/icon.png`

**C4. Zero security headers — no HSTS, no X-Frame-Options**  
All security headers missing. `x-powered-by: Next.js, Payload` exposed the full stack fingerprint.  
**Status:** Fixed in Phase 1 — HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy added. `poweredByHeader: false` set.

**C5. Title tag triple-duplication on blog posts and dashboard**  
Root layout `title.template: '%s | IndiaStats.org'` was applied on top of a title that `generateMeta` had already appended ` | IndiaStats.org` to. Result: `"Title | IndiaStats.org | IndiaStats.org | IndiaStats.org"`.  
File: `src/utilities/generateMeta.ts`  
**Status:** Fixed in Phase 1

**C6. No `canonical` tag on `/election-data`**  
Client-side filters (year, district, party) could cause Google to index parameterized duplicate variants.  
**Status:** Fixed in Phase 1

---

### High (significant ranking impact)

**H1. Blog posts had zero Article schema — no rich results possible**  
10 blog posts, zero `BlogPosting` JSON-LD. `og:type` was `"website"` on all posts (should be `"article"`). `og:url` pointed to the homepage `https://indiastats.org` instead of the post's own URL.  
**Status:** Fixed in Phase 2 — `BlogPostingJsonLd` added, `og:url` bug fixed in `generateMeta.ts`

**H2. Blog posts average ~450 words — thin content, fragile rankings**  
The DMK vs AIADMK post ranks #1 today at 450 words. All 10 posts published same day (April 23, 2026). Threshold for editorial pages is 1,200+ words.  
**Status:** Pending Phase 3 (content work)

**H3. No named authors on any blog post — E-E-A-T failure**  
`populatedAuthors` array empty for all posts. No author byline appears. Critical for YMYL-adjacent election content.  
**Status:** Pending Phase 3

**H4. `Dataset` and `DataCatalog` schema absent**  
No schema for the election data catalog anywhere. Google Dataset Search can't index the data. AI systems can't identify IndiaStats as a data source.  
**Status:** Fixed in Phase 2 — `DatasetJsonLd` on all assembly pages, `DataCatalogJsonLd` on homepage

**H5. 32 assembly constituencies missing from assemblies-sitemap.xml**  
Only 202 of 234 assemblies appear (404 URLs ÷ 2 = 202). Likely missing slugs or district associations in PayloadCMS.  
**Status:** Pending — needs DB investigation

**H6. `/tamil-nadu` state home page not in any sitemap**  
Highest-traffic page entirely absent from all 5 sitemaps.  
**Status:** Fixed in Phase 1 — added with `priority: 1.0`

**H7. GA4 double-firing — GTM + direct Script tag firing same Measurement ID**  
GTM container `GTM-MS8LQ9GB` already fires GA4. A duplicate direct `<Script>` tag sent every pageview twice.  
**Status:** Fixed in Phase 1 — direct GA4 Script tags removed, GTM only

**H8. District `containsPlace` used placeholder names**  
`DistrictPageJsonLd` generated `"Assembly Constituency 1…N"` — fabricated names. Real names available in `data.assemblies`.  
**Status:** Fixed in Phase 1

**H9. Homepage missing `og:image` and `twitter:image`**  
Blank social card when sharing the homepage.  
**Status:** Fixed in Phase 2 — `/indiastats-logo-1024.png` set as fallback

**H10. www subdomain returns 200 — duplicate domain**  
`https://www.indiastats.org/` returns HTTP 200 instead of redirecting. Google can index both as separate sites.  
**Status:** Pending — fix via Cloudflare Redirect Rule (5 min, no deploy needed)

---

### Medium

| # | Issue | File / Location | Status |
|---|---|---|---|
| M1 | Mixpanel session recording at 100% — INP impact | `instrumentation-client.ts` | Fixed Phase 1 → 5% |
| M2 | PostHog + Mixpanel init at module load time (in critical JS bundle) | `instrumentation-client.ts` | Pending Phase 4 |
| M3 | GeoJSON passed as RSC prop (314KB) on election-results | `election-results/page.tsx:91` | Pending Phase 4 |
| M4 | Recharts eagerly imported in AssemblyPageClient | `AssemblyPageClient.tsx:8-16` | Pending Phase 4 |
| M5 | `icon.png` is 254KB JPEG mislabeled as PNG — loads on every page | `public/icon.png` | Pending Phase 4 |
| M6 | All sitemaps use dynamic current-timestamp as `lastmod` | Sitemap generation code | Pending |
| M7 | Sitemap index has no `lastmod` on child entries | Sitemap index generator | Pending |
| M8 | Assembly-map district filter uses Tamil-encoded query param | Assembly map route | Pending |
| M9 | Prediction URLs contain numeric IDs — brittle canonical | Middleware + predictions routing | Pending |
| M10 | No `loading.tsx` for election-results route — blank screen | New file needed | Pending Phase 4 |
| M11 | Tailwind dynamic color classes at risk of purge in production | `tailwind.config.mjs` safelist | Pending |
| M12 | No `llms.txt` file | Create `/public/llms.txt` | Pending Phase 3 |
| M13 | `og:type: "website"` on assembly/district pages (should be `article`) | `generateMeta.ts` | Pending |
| M14 | robots.txt redundantly lists all 5 child sitemaps + index | `public/robots.txt` | Pending |
| M15 | `Host:` directive in robots.txt is deprecated Yandex extension | `public/robots.txt` | Pending |
| M16 | Homepage has no meta description in rendered HTML | `(home)/page.tsx` | Pending Phase 3 |
| M17 | 10 blog posts all published same day — content burst pattern | Content strategy | Pending Phase 3 |
| M18 | Assembly page above-the-fold shows voter counts, not 2026 winner | `AssemblyPageClient.tsx` order | Partially addressed (factual summary added in Phase 2) |
| M19 | Blog post last H2 is always a navigation CTA, not content | All 10 posts | Pending Phase 3 |
| M20 | No `preconnect` hints for GTM, PostHog proxy | `layout.tsx` | Pending Phase 4 |

---

### Low

| # | Issue | Status |
|---|---|---|
| L1 | Implement IndexNow in `eci:push` script | Pending |
| L2 | Organization `sameAs` array has only Twitter — add LinkedIn/Wikipedia | Pending |
| L3 | `GovernmentServiceJsonLd` defined but never used — dead code | Pending |
| L4 | 5 utility pages in pages-sitemap missing priority/changefreq | Pending |
| L5 | Sitemap index missing `lastmod` on child entries | Pending |
| L6 | `AboutPage` schema type not set on `/about` | Pending Phase 3 |
| L7 | Party logo images not converted to WebP | Pending Phase 4 |
| L8 | Dark mode CLS via `InitTheme beforeInteractive` | Pending |
| L9 | No pagination signals on booth listing pages | Pending |
| L10 | Meta description on `/posts/` listing is sitewide fallback | Pending Phase 3 |

---

## GEO / AI Search Readiness

**Score: 38 / 100**

| Platform | Score | Primary Blocker |
|---|---|---|
| Google AI Overviews | 42/100 | No Dataset schema (fixed Phase 2); key facts were client-rendered (fixed Phase 2) |
| ChatGPT / OpenAI | 28/100 | No author entity; thin blog content |
| Perplexity | 30/100 | No sourced claims in blog posts; under 500 words |
| Bing Copilot | 40/100 | Limited by missing Article schema (fixed Phase 2) |

**Key AI finding:** Before Phase 2, for queries like "who won anna nagar 2026 election", the answer was only inside a `'use client'` component — not present in static HTML. GPTBot, ClaudeBot, and PerplexityBot would see blank data sections. Phase 2 moved the JSON-LD and added a factual summary paragraph to the server component, resolving this.

---

## SXO (Search Experience Optimization)

**Score: 56 / 100**

### Page-type mismatches

| Page | Expected SERP type | Actual | Mismatch |
|---|---|---|---|
| Homepage | Data portal / results hub | Marketing landing page | HIGH |
| Assembly page | Constituency profile + results table | Data dashboard | Aligned |
| District page | District results hub | District data page | Medium |
| Blog post | Long-form analysis (2k+ words) | Short editorial (~500 words) | HIGH |

### Persona scores

| Persona | Score | Biggest gap |
|---|---|---|
| Voter seeking constituency info | 68/100 | Current MLA not above the fold |
| Journalist on deadline | 65/100 | No "copy key stats" or chart embed |
| Political researcher | 62/100 | No side-by-side comparison tool |
| Academic researcher | 48/100 | No methodology page, no data citation format |
| Developer / Data analyst | 38/100 | No public API docs, no dataset download CTA |

---

## Content Quality & E-E-A-T

**Score: 54 / 100**

| Factor | Score | Notes |
|---|---|---|
| Experience | 10/25 | Original data; no first-hand editorial voice |
| Expertise | 13/25 | Strong data; weak author credentials |
| Authoritativeness | 14/25 | ECI attribution present; no named experts |
| Trustworthiness | 17/25 | Good footer/about; AI content disclosure missing |

**Key gaps (all Pending Phase 3):**
- No named authors on any of the 10 blog posts
- Blog posts are ~450 words each (threshold: 1,200+)
- All 10 posts published the same day (April 23, 2026) — looks like bulk generation
- AI-generated assembly descriptions lack editorial policy disclosure
- No `methodology` page explaining ECI sourcing

---

## Performance (Core Web Vitals)

**Estimated scores by page:**

| Page | LCP | FCP | TTFB | INP Risk | CLS Risk |
|---|---|---|---|---|---|
| Homepage | Good (text LCP, ISR, CDN cached) | Good | Good | Medium (5 analytics SDKs) | Low |
| Assembly page | Good (text LCP, statically generated) | Good | Good | High (Recharts in critical bundle) | Low-Medium |
| Election results | Poor (`revalidate=0`, no CDN cache, Leaflet delayed) | Poor | Needs work (DB query every request, 0.25 CPU) | High | High |

**Top performance issues (Phase 4):**
1. GA4 double-firing — fixed Phase 1
2. Mixpanel 100% session recording → 5% — fixed Phase 1
3. PostHog + Mixpanel eagerly initialized in critical bundle (M2)
4. 314KB GeoJSON passed as RSC prop on election-results page (M3)
5. Recharts eagerly imported — not lazy-loaded via `next/dynamic` (M4)
6. `icon.png` is 254KB JPEG — loads on every page (M5)
7. 5 analytics SDKs running simultaneously (GA4 via GTM, PostHog, Mixpanel, Clarity, AdSense)

---

## Implementation Phases

### Phase 1 — Foundation ✅ COMPLETE (June 18, 2026)

| Fix | File(s) |
|---|---|
| Title deduplication — strip site suffix in `generateMeta`, let root layout template handle it | `generateMeta.ts` |
| `og:url` bug — posts now get absolute `/posts/{slug}` URL | `generateMeta.ts`, `posts/[slug]/page.tsx`, `pages/[pageSlug]/page.tsx` |
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
| `AssemblyPageJsonLd` moved to server component (`page.tsx`) | `assembly/.../page.tsx`, `AssemblyPageClient.tsx` |
| Server-rendered factual summary paragraph (constituency name, 2026 winner, voter count) | `assembly/.../page.tsx` |
| `DatasetJsonLd` on all 234 assembly pages | `JsonLd.tsx`, `assembly/.../page.tsx` |
| `BlogPostingJsonLd` on all 10 blog posts | `JsonLd.tsx`, `posts/[slug]/page.tsx` |
| `DataCatalogJsonLd` on homepage | `JsonLd.tsx`, `(home)/page.tsx` |
| Homepage `og:image` + `twitter:images` fallback | `(home)/page.tsx` |

### Phase 3 — E-E-A-T & Content (Pending)

| # | Fix | File / Action | Effort |
|---|---|---|---|
| 1 | Create author profile in CMS, assign to all 10 posts | PayloadCMS Admin | 1 hr |
| 2 | Expand DMK vs AIADMK post to 1,500+ words with embedded data tables | Content | 4 hrs |
| 3 | Expand 2026 election preview post to 1,500+ words | Content | 4 hrs |
| 4 | Add editorial policy + AI content disclosure to About page | Content | 1 hr |
| 5 | Create `/public/llms.txt` | `/public/llms.txt` | 30 min |
| 6 | Fix `og:type: "article"` on blog posts in `generateMeta` or post metadata | `generateMeta.ts` | 30 min |
| 7 | Add `AboutPage` schema type to `/about` | `about/page.tsx` | 15 min |
| 8 | Fix homepage meta description (currently too long at 190 chars) | `(home)/page.tsx` | 15 min |
| 9 | Add meta description to `/posts/` listing | `posts/page.tsx` | 15 min |
| 10 | Fix www → non-www redirect | Cloudflare Redirect Rule | 5 min |

### Phase 4 — Performance (Pending)

| # | Fix | File | Effort | CWV Impact |
|---|---|---|---|---|
| 1 | Lazy-initialize PostHog + Mixpanel behind `requestIdleCallback` | `instrumentation-client.ts` | 2 hrs | -150-400ms TTI |
| 2 | Serve GeoJSON as client-side fetch from `public/` URL (not RSC prop) | `election-results/page.tsx` | 2 hrs | -200-500ms TTFB |
| 3 | Lazy-load Recharts via `next/dynamic` in AssemblyPageClient | `AssemblyPageClient.tsx` | 2 hrs | -150-400ms LCP mobile |
| 4 | Add `loading.tsx` for election-results route | New file | 30 min | FCP improvement |
| 5 | Fix `icon.png` (254KB JPEG → proper 32×32 PNG favicon) | `public/icon.png` | 1 hr | -250KB per page |
| 6 | Add Tailwind dynamic color classes to safelist | `tailwind.config.mjs` | 30 min | Prevents prod CSS bug |
| 7 | Add `Cache-Control` headers for `/public/images/` and `/public/geojson/` | `next.config.js` | 30 min | CDN efficiency |
| 8 | Add `preconnect` hints for GTM and PostHog proxy | `layout.tsx` | 15 min | -150-300ms script load |
| 9 | Convert party logo `.jpg` files to WebP | `public/images/` | 1 hr | Bandwidth reduction |

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
| Election data table page | `src/app/(frontend)/election-data/page.tsx` |
| Pages sitemap | `src/app/(frontend)/(sitemaps)/pages-sitemap.xml/route.ts` |
| Sitemap index | `src/app/(frontend)/(sitemaps)/sitemap.xml/route.ts` |
| Analytics init | `src/instrumentation-client.ts` |
| Next.js config | `next.config.js` |
| OG image defaults | `src/utilities/mergeOpenGraph.ts` |

---

## robots.txt Issues (Minor — Fix Anytime)

Current `robots.txt` has two issues that can be fixed with a single edit to `public/robots.txt`:
1. Redundantly lists all 5 child sitemaps in addition to the sitemap index — only the index is needed
2. `Host: https://indiastats.org` is a deprecated Yandex extension — no search engine acts on it

**Recommended `public/robots.txt`:**
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://indiastats.org/sitemap.xml
```

---

## Sitemap Issues

| Issue | Severity | Fix |
|---|---|---|
| 32 of 234 assembly constituencies missing | High | Query PayloadCMS for assemblies without `slug` or `districtSlug`; add assertion to sitemap generator |
| All `lastmod` values are dynamic current-timestamp | Medium | Use actual `updatedAt` field from Payload collection records |
| Sitemap index has no `lastmod` on child entries | Low | Add `<lastmod>` to each `<sitemap>` entry in the index |
| 5 utility pages missing priority/changefreq | Low | Add `priority: 0.3, changefreq: 'monthly'` for about/contact/terms |
| `/privacy-policy` not in sitemap | Low | Add to pages-sitemap |
