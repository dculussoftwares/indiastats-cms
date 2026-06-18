# Codebase Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all correctness bugs, extract shared utilities, improve performance, and reduce duplication across the India Stats CMS codebase in five independent phases.

**Architecture:** Each phase is independently shippable. Phases 1–3 are fixes/deletions with no new components. Phase 4 extracts reusable UI primitives. Phase 5 adds resilience. Each phase produces a working, testable build.

**Tech Stack:** Next.js 15, PayloadCMS 3.x, TypeScript, Recharts, Tailwind CSS, Vitest, pnpm

---

## Phase 1 — Correctness Bugs

Five bugs that can cause crashes or incorrect behavior in production.

---

### Task 1.1: Add try/catch to assembly-info route

**Files:**
- Modify: `src/app/api/assembly-info/[assemblyId]/route.ts:11`

- [ ] **Step 1: Wrap the handler body in try/catch**

Replace the entire handler body starting at line 11. The existing validation guard (lines 17–19) stays inside the try block since a `getPayload` failure before it still needs a JSON error response.

```ts
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ assemblyId: string }> },
) {
  try {
    const { assemblyId } = await params

    if (!assemblyId || !/^ac\d{3}$/i.test(assemblyId)) {
      return NextResponse.json({ error: 'Invalid assemblyId' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const assemblyResult = await payload.find({
      collection: 'assemblies',
      where: { assemblyId: { equals: assemblyId.toLowerCase() } },
      limit: 1,
    })

    const assembly = assemblyResult.docs[0] as any
    if (!assembly) {
      return NextResponse.json({ error: 'Assembly not found' }, { status: 404 })
    }

    const historyResult = await payload.find({
      collection: 'election-history',
      where: { assemblyId: { equals: assemblyId.toLowerCase() } },
      sort: '-electionYear',
      limit: 20,
    })

    let lastWinner: string | null = null
    let lastWinnerParty: string | null = null
    let lastYear: number | null = null

    if (historyResult.docs.length > 0) {
      const sorted = [...historyResult.docs].sort((a: any, b: any) => {
        if (b.electionYear !== a.electionYear) return b.electionYear - a.electionYear
        return (b.candidateVotes || 0) - (a.candidateVotes || 0)
      })
      const top = sorted[0] as any
      lastYear = top.electionYear
      lastWinner = top.candidateName || null
      lastWinnerParty = top.candidateParty || null
    }

    const name = cleanName(assembly.name)
    const districtName = cleanName(assembly.districtName)
    const districtId: string = assembly.districtId || 'dt7'
    const stateSlug = getStateByCode(assembly.stateCode || '')?.slug ?? stateCodeToSlug(assembly.stateCode || '')

    const districtResult = await payload.find({
      collection: 'districts',
      where: { districtId: { equals: districtId } },
      limit: 1,
      depth: 0,
      select: { slug: true },
    })
    const districtSlug: string = (districtResult.docs[0] as any)?.slug || districtId
    const assemblySlug: string = assembly.slug || assembly.assemblyId

    return NextResponse.json({
      assemblyId: assembly.assemblyId,
      name,
      districtName,
      districtId,
      isReserved: assembly.voters?.isReservedAc || false,
      totalVoters: Number(assembly.voters?.total) || 0,
      lastElection: lastYear ? { year: lastYear, winner: lastWinner, party: lastWinnerParty } : null,
      pageUrl: `/${stateSlug}/assembly/${districtSlug}/${assemblySlug}`,
    })
  } catch (error) {
    console.error('Error in assembly-info route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -20
```
Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/assembly-info/\[assemblyId\]/route.ts
git commit -m "fix: add try/catch to assembly-info route"
```

---

### Task 1.2: Move getPayload inside try in caste-data route

**Files:**
- Modify: `src/app/api/caste-data/route.ts:12`

- [ ] **Step 1: Move `getPayload` call inside the try block**

Current file has `const payload = await getPayload({ config })` at line 12, before `try {` at line 14. Move it inside:

```ts
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const assemblyId = searchParams.get('assemblyId')
    const districtName = searchParams.get('districtName')
    const all = searchParams.get('all')
    const stateCode = searchParams.get('stateCode') || 'TN'

    try {
        const payload = await getPayload({ config })

        if (all === 'true') {
            // ... rest of handler unchanged
```

- [ ] **Step 2: Verify build**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/caste-data/route.ts
git commit -m "fix: move getPayload inside try block in caste-data route"
```

---

### Task 1.3: Fix wrong MIME type on OG logo (assembly + district + state routes)

**Files:**
- Modify: `src/app/api/og/[assemblyId]/route.tsx:113`
- Modify: `src/app/api/og/district/[districtId]/route.tsx:88`
- Modify: `src/app/api/og/state/[stateSlug]/route.tsx:88`

The file is `indiastats-logo-1024.png` but 3 of 4 OG routes declare `data:image/jpeg`. The prediction route (`og/prediction`) already uses `image/png` correctly.

- [ ] **Step 1: Fix the MIME type in all three routes**

In each of the three files, find:
```ts
const logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`
```
Replace with:
```ts
const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`
```

Run this to confirm the change:
```bash
grep -n "image/jpeg\|image/png" src/app/api/og/\[assemblyId\]/route.tsx src/app/api/og/district/\[districtId\]/route.tsx src/app/api/og/state/\[stateSlug\]/route.tsx src/app/api/og/prediction/\[predictorId\]/route.tsx
```
Expected: all four routes show `image/png`.

- [ ] **Step 2: Commit**

```bash
git add src/app/api/og/\[assemblyId\]/route.tsx src/app/api/og/district/\[districtId\]/route.tsx src/app/api/og/state/\[stateSlug\]/route.tsx
git commit -m "fix: correct OG logo MIME type from jpeg to png in 3 OG routes"
```

---

### Task 1.4: Fix ElectionPredictionMap crash on un-bilingual names

**Files:**
- Modify: `src/components/ElectionPredictionMap/index.tsx:~175`

- [ ] **Step 1: Find the unsafe split**

```bash
grep -n "split('/')" src/components/ElectionPredictionMap/index.tsx
```

The line looks like:
```ts
.split('/')
```
as part of `getDisplayText` or an inline expression. Read lines 168–185 to see the full context.

- [ ] **Step 2: Fix by adding a guard**

The existing `getDisplayText` function in the file already has a safe pattern. Confirm it's being used everywhere, or replace the unsafe `.split('/')` with the safe form:

```ts
// safe: returns last segment if '/' present, otherwise the whole string
const getDisplayText = (value: string | null | undefined): string => {
  if (!value) return ''
  const parts = value
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean)
  return parts[parts.length - 1] ?? value
}
```

If there's an additional inline `.split('/')[1]` call elsewhere in the file (grep shows line 175 only calls `.split('/')`), ensure it goes through `getDisplayText` instead.

- [ ] **Step 3: Verify build**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ElectionPredictionMap/index.tsx
git commit -m "fix: guard bilingual name split in ElectionPredictionMap to prevent crash"
```

---

### Task 1.5: Validate year params to prevent NaN in DB queries

**Files:**
- Modify: `src/app/api/alliances/route.ts:18`
- Modify: `src/app/api/election-data-table/route.ts:56`

Both routes do `parseInt(yearParam, 10)` and pass the result directly into a DB `where` clause without checking for `NaN`. `?year=abc` → `NaN` → silent DB query with `NaN` value.

- [ ] **Step 1: Add validation in alliances/route.ts**

Current (line 17–19):
```ts
if (yearParam) {
    whereClause.electionYear = { equals: parseInt(yearParam, 10) }
}
```

Replace with:
```ts
if (yearParam) {
    const year = parseInt(yearParam, 10)
    if (!Number.isFinite(year) || year < 1950 || year > 2100) {
        return NextResponse.json({ error: 'Invalid year parameter' }, { status: 400 })
    }
    whereClause.electionYear = { equals: year }
}
```

- [ ] **Step 2: Add validation in election-data-table/route.ts**

Current (line 54–57):
```ts
if (yearParam) {
    whereClause.electionYear = { equals: parseInt(yearParam, 10) }
}
```

Replace with:
```ts
if (yearParam) {
    const year = parseInt(yearParam, 10)
    if (!Number.isFinite(year) || year < 1950 || year > 2100) {
        return NextResponse.json({ error: 'Invalid year parameter' }, { status: 400 })
    }
    whereClause.electionYear = { equals: year }
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/alliances/route.ts src/app/api/election-data-table/route.ts
git commit -m "fix: validate year params to prevent NaN propagating into DB queries"
```

---

## Phase 2 — Shared Utilities

Extract repeated logic into single sources of truth. This phase eliminates ~50 duplicate definitions scattered across 30+ files.

---

### Task 2.1: Create shared `formatNumber` utility

**Files:**
- Create: `src/utilities/formatNumber.ts`
- Modify (11 files): `src/components/TwitterCardModal.tsx`, `src/components/ElectionAnalysisMap/MapInner.tsx`, `src/components/VoteTransferChart/index.tsx`, `src/components/PopulationChangeCard/index.tsx`, `src/components/VotesSharesChart/index.tsx`, `src/components/MandateMeter/index.tsx`, `src/components/StatCard/index.tsx`, `src/components/GenderChart/index.tsx`, `src/components/PastWinningHistories/index.tsx`, `src/components/DistrictDetailsCard/index.tsx`, `src/components/ConstituencyLeaderboard/index.tsx`

- [ ] **Step 1: Create the utility**

```ts
// src/utilities/formatNumber.ts

/**
 * Formats a number into a compact Indian notation string.
 * 10,000,000 → "1 Cr"
 * 100,000 → "1 L"
 * 1,000 → "1 K"
 */
export function formatNumber(num: number): string {
  if (num >= 10_000_000) return `${(num / 10_000_000).toFixed(1)} Cr`
  if (num >= 100_000) return `${(num / 100_000).toFixed(1)} L`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)} K`
  return num.toString()
}
```

- [ ] **Step 2: Replace local definitions — grep for all usages**

```bash
grep -rn "function formatNumber\|function fmtV\|function fmtVotes\|function fmtNum" src/components --include="*.tsx"
```

For each file returned, do two things:
1. Remove the local function definition
2. Add `import { formatNumber } from '@/utilities/formatNumber'` at the top
3. Replace the local name (`fmtV`, `fmtVotes`, `fmtNum`) with `formatNumber` at all call sites within that file

Work through all 11 files. Each one follows the same pattern.

- [ ] **Step 3: Verify build**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/utilities/formatNumber.ts src/components/TwitterCardModal.tsx src/components/ElectionAnalysisMap/MapInner.tsx src/components/VoteTransferChart/index.tsx src/components/PopulationChangeCard/index.tsx src/components/VotesSharesChart/index.tsx src/components/MandateMeter/index.tsx src/components/StatCard/index.tsx src/components/GenderChart/index.tsx src/components/PastWinningHistories/index.tsx src/components/DistrictDetailsCard/index.tsx src/components/ConstituencyLeaderboard/index.tsx
git commit -m "refactor: extract formatNumber to shared utility, remove 11 local definitions"
```

---

### Task 2.2: Create shared `getEnglishName` utility

**Files:**
- Create: `src/utilities/bilingualName.ts`
- Modify (6 files): `src/components/GenderDistrictChart/index.tsx`, `src/components/ConstituencyLeaderboard/index.tsx`, `src/components/SeatFlipSankey/index.tsx`, `src/components/ElectionAnalysisMap/MapInner.tsx`, `src/components/MarginScatterPlot/index.tsx`, `src/components/CasteComparisonTable/index.tsx`
- Also check: `src/app/api/assembly-info/[assemblyId]/route.ts` (has local `cleanName`)

- [ ] **Step 1: Create the utility**

```ts
// src/utilities/bilingualName.ts

/**
 * Extracts the English portion from a bilingual "Tamil / English" name string.
 * If the string contains no '/', returns it unchanged.
 *
 * Examples:
 *   "சென்னை / CHENNAI" → "CHENNAI"
 *   "CHENNAI" → "CHENNAI"
 *   "" → ""
 */
export function getEnglishName(name: string | null | undefined): string {
  if (!name) return ''
  if (!name.includes('/')) return name.trim()
  return name.split('/').pop()!.trim()
}
```

- [ ] **Step 2: Replace in all 6 component files**

```bash
grep -rn "function getEnglishName\|includes('/')\|split('/')" src/components --include="*.tsx" | grep -v "node_modules"
```

For each file:
1. Remove the local `getEnglishName` function (or inline expression)
2. Add `import { getEnglishName } from '@/utilities/bilingualName'`
3. Replace all call sites

For `MarginScatterPlot/index.tsx` line 40 (inline JSX):
```tsx
// Before:
{d.assemblyName.includes('/') ? d.assemblyName.split('/')[1].trim() : d.assemblyName}

// After:
{getEnglishName(d.assemblyName)}
```

For `CasteComparisonTable/index.tsx` lines 43–46 (multi-line if block), replace with `getEnglishName(name)`.

For `assembly-info` route — the local `cleanName` function does the same thing. Replace it:
```ts
import { getEnglishName } from '@/utilities/bilingualName'
// remove cleanName definition
// replace cleanName(assembly.name) → getEnglishName(assembly.name)
// replace cleanName(assembly.districtName) → getEnglishName(assembly.districtName)
```

- [ ] **Step 3: Verify build**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/utilities/bilingualName.ts
git add src/components/GenderDistrictChart/index.tsx src/components/ConstituencyLeaderboard/index.tsx src/components/SeatFlipSankey/index.tsx src/components/ElectionAnalysisMap/MapInner.tsx src/components/MarginScatterPlot/index.tsx src/components/CasteComparisonTable/index.tsx
git add src/app/api/assembly-info/\[assemblyId\]/route.ts
git commit -m "refactor: extract getEnglishName to shared utility, remove 7 local definitions"
```

---

### Task 2.3: Replace inline baseUrl with getServerSideURL()

**Files (20+ files — see list below):**

`getServerSideURL()` already exists in `src/utilities/getURL.ts`. The 20 files that inline `process.env.NEXT_PUBLIC_SERVER_URL || 'https://indiastats.org'` should call it instead.

- [ ] **Step 1: Find all occurrences**

```bash
grep -rn "NEXT_PUBLIC_SERVER_URL\|const baseUrl\s*=" src/app --include="*.tsx" --include="*.ts"
```

- [ ] **Step 2: Replace each file**

Pattern: remove the `const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || ...` line and add `import { getServerSideURL } from '@/utilities/getURL'` at the top. Replace `baseUrl` with `getServerSideURL()` at all call sites within the file.

For **page files** (all under `src/app/(frontend)/`), the pattern is:
```ts
// Remove:
const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://indiastats.org'

// Add import at top:
import { getServerSideURL } from '@/utilities/getURL'

// Replace usages:
const baseUrl = getServerSideURL()
// OR inline: `${getServerSideURL()}/path`
```

For **sitemap routes** (under `src/app/(frontend)/(sitemaps)/`), the pattern varies slightly — check each file; replace the inlined value with `getServerSideURL()`.

Also fix `src/middleware.ts`:
```ts
// Before (line 37):
const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

// After:
import { getServerSideURL } from '@/utilities/getURL'
const baseUrl = getServerSideURL()
```

Full file list to update:
- `src/app/(frontend)/contact/page.tsx`
- `src/app/(frontend)/(home)/page.tsx`
- `src/app/(frontend)/terms/page.tsx`
- `src/app/(frontend)/about/page.tsx`
- `src/app/(frontend)/[stateSlug]/caste-demographics/page.tsx`
- `src/app/(frontend)/[stateSlug]/election-results/page.tsx`
- `src/app/(frontend)/[stateSlug]/assembly/[districtSlug]/[assemblySlug]/page.tsx`
- `src/app/(frontend)/[stateSlug]/election-analysis/[year]/page.tsx`
- `src/app/(frontend)/[stateSlug]/assembly/[districtSlug]/[assemblySlug]/booths/[boothId]/page.tsx`
- `src/app/(frontend)/[stateSlug]/assembly/[districtSlug]/[assemblySlug]/booths/page.tsx`
- `src/app/(frontend)/[stateSlug]/assembly-map/page.tsx`
- `src/app/(frontend)/[stateSlug]/election-predictions/page.tsx`
- `src/app/(frontend)/[stateSlug]/dashboard/page.tsx`
- `src/app/(frontend)/[stateSlug]/district/[districtSlug]/page.tsx`
- `src/app/(frontend)/[stateSlug]/election-predictions/[predictorId]/[predictorSlug]/page.tsx`
- `src/app/(frontend)/search/page.tsx`
- `src/app/(frontend)/(sitemaps)/districts-sitemap.xml/route.ts`
- `src/app/(frontend)/(sitemaps)/assemblies-sitemap.xml/route.ts`
- `src/app/(frontend)/(sitemaps)/posts-sitemap.xml/route.ts`
- `src/app/(frontend)/(sitemaps)/sitemap.xml/route.ts`
- `src/app/(frontend)/(sitemaps)/predictions-sitemap.xml/route.ts`
- `src/app/(frontend)/(sitemaps)/pages-sitemap.xml/route.ts`
- `src/middleware.ts`

- [ ] **Step 3: Verify build**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add -p  # stage each file's change
git commit -m "refactor: replace 23 inline baseUrl constants with getServerSideURL()"
```

---

### Task 2.4: Fix cn() duplication — delete lib/utils.ts

**Files:**
- Modify: `src/components/ui/table.tsx:3`
- Delete: `src/lib/utils.ts`

`src/lib/utils.ts` is identical to `src/utilities/ui.ts` and has exactly one consumer.

- [ ] **Step 1: Update table.tsx import**

```ts
// Before (line 3):
import { cn } from '@/lib/utils'

// After:
import { cn } from '@/utilities/ui'
```

- [ ] **Step 2: Delete the duplicate file**

```bash
rm src/lib/utils.ts
```

- [ ] **Step 3: Verify no other importers remain**

```bash
grep -rn "from '@/lib/utils'" src --include="*.ts" --include="*.tsx"
```
Expected: no output.

- [ ] **Step 4: Verify build**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/table.tsx src/lib/utils.ts
git commit -m "refactor: remove duplicate lib/utils.ts, point table.tsx to utilities/ui"
```

---

### Task 2.5: Delete dead files and exports

**Files to delete:**
- `src/utilities/toKebabCase.ts` — zero importers
- `src/utilities/getMeUser.ts` — zero importers
- `src/utilities/analytics.ts` — marked deprecated, zero importers (just a re-export shim)

**File to modify:**
- `src/utilities/clarityTracking.ts` — remove dead domain-specific wrappers (lines ~103–205)
- `src/config/states/types.ts` — remove dead `DEFAULT_PARTY_COLORS` export

- [ ] **Step 1: Confirm zero importers before deleting**

```bash
grep -rn "toKebabCase\|getMeUser\|from '@/utilities/analytics'" src --include="*.ts" --include="*.tsx" | grep -v "^src/utilities/analytics.ts"
```
Expected: no output.

- [ ] **Step 2: Delete the dead files**

```bash
rm src/utilities/toKebabCase.ts src/utilities/getMeUser.ts src/utilities/analytics.ts
```

- [ ] **Step 3: Remove dead domain wrappers from clarityTracking.ts**

```bash
grep -n "export function track\|export function set\|export function upgrade\|export function grant\|export function identify" src/utilities/clarityTracking.ts
```

Keep only the functions that `src/analytics/tracker.ts` actually imports. Check:
```bash
grep -n "from '@/utilities/clarityTracking'" src/analytics/tracker.ts
```

Remove all exported functions from `clarityTracking.ts` that are NOT imported by `tracker.ts`. Typically: `trackAssemblyView`, `trackDistrictView`, `trackSearch`, `trackShare`, and similar domain wrappers.

- [ ] **Step 4: Remove DEFAULT_PARTY_COLORS from types.ts**

```bash
grep -n "DEFAULT_PARTY_COLORS" src/config/states/types.ts
```

Delete the `export const DEFAULT_PARTY_COLORS = ...` block (confirm zero importers first):
```bash
grep -rn "DEFAULT_PARTY_COLORS" src --include="*.ts" --include="*.tsx"
```
Expected: only the definition in `types.ts`. Delete it.

- [ ] **Step 5: Verify build**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: delete dead utilities (toKebabCase, getMeUser, analytics shim), remove dead Clarity wrappers"
```

---

## Phase 3 — Performance

---

### Task 3.1: Cache OG route font and logo buffers

**Files:**
- Modify: `src/app/api/og/[assemblyId]/route.tsx`
- Modify: `src/app/api/og/district/[districtId]/route.tsx`
- Modify: `src/app/api/og/state/[stateSlug]/route.tsx`
- Modify: `src/app/api/og/prediction/[predictorId]/route.tsx`

Each OG route does 3 synchronous `readFileSync` calls (logo + 2 fonts) **on every request**. Module-level singletons load them once per server process.

- [ ] **Step 1: Extract the asset loading to module scope in each OG route**

In each file, find the block:
```ts
const logoPath = join(process.cwd(), 'public/indiastats-logo-1024.png')
const logoBuffer = readFileSync(logoPath)
const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`

const fontRegular = readFileSync(join(process.cwd(), 'public/fonts/NotoSans-Regular.ttf'))
const fontBold = readFileSync(join(process.cwd(), 'public/fonts/NotoSans-Bold.ttf'))
```

Move it to **module scope** (top of file, before the `export async function GET`):

```ts
// Module-level cache — loaded once per server process
const _logoBase64 = `data:image/png;base64,${readFileSync(join(process.cwd(), 'public/indiastats-logo-1024.png')).toString('base64')}`
const _fontRegular = readFileSync(join(process.cwd(), 'public/fonts/NotoSans-Regular.ttf'))
const _fontBold = readFileSync(join(process.cwd(), 'public/fonts/NotoSans-Bold.ttf'))
```

Then inside the handler, replace the 5 lines above with:
```ts
const logoBase64 = _logoBase64
const fontRegular = _fontRegular
const fontBold = _fontBold
```

- [ ] **Step 2: Verify build**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/og/\[assemblyId\]/route.tsx src/app/api/og/district/\[districtId\]/route.tsx src/app/api/og/state/\[stateSlug\]/route.tsx src/app/api/og/prediction/\[predictorId\]/route.tsx
git commit -m "perf: cache OG route font/logo buffers at module scope to avoid sync disk I/O per request"
```

---

### Task 3.2: Add Cache-Control headers to heavy read routes

**Files:**
- Modify: `src/app/api/election-results/route.ts`
- Modify: `src/app/api/map-stats/route.ts`
- Modify: `src/app/api/alliances/route.ts`
- Modify: `src/app/api/election-insights/route.ts`

These routes return static historical data (outside counting day). Model: `slug-mappings/route.ts` already uses `s-maxage=86400`.

- [ ] **Step 1: Add cache headers on successful responses**

In `election-results/route.ts`, `map-stats/route.ts`, `alliances/route.ts`, `election-insights/route.ts` — find the final `return NextResponse.json(...)` for the success path and add cache headers:

```ts
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  },
})
```

Use `s-maxage=3600` (1 hour) for election data since it doesn't change mid-day. `election-results` already has `revalidate = 0` exported for the counting-day live feed — **do not** add a cache header there if the route is for live data. Check the file's intent first:
```bash
grep -n "revalidate\|live\|counting" src/app/api/election-results/route.ts | head -10
```
If it serves historical results (not live), add the header. If it serves live counting data, skip it.

- [ ] **Step 2: Verify build**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/election-results/route.ts src/app/api/map-stats/route.ts src/app/api/alliances/route.ts src/app/api/election-insights/route.ts
git commit -m "perf: add Cache-Control headers to heavy read API routes"
```

---

### Task 3.3: Push district/party filters into DB query in election-data-table

**Files:**
- Modify: `src/app/api/election-data-table/route.ts:40–90`

Currently fetches all 50k records then filters in JS. The `districtParam` filter can be pushed to the assemblies query; the `assemblyId` filter can be applied directly in the election-history query.

- [ ] **Step 1: Apply district filter at DB level**

Current code around lines 40–90:
```ts
const districtParam = searchParams.get('district')
const partyParam = searchParams.get('party')
// ...
const electionRecords = await payload.find({
    collection: 'election-history',
    where: whereClause,
    limit: 50000,
})
const assemblies = await payload.find({
    collection: 'assemblies',
    where: { stateCode: { equals: stateCode } },
    limit: 500,
})
```

When `districtParam` is set, add it to the assemblies query and build an `assemblyId` `in` constraint for the history query:

```ts
const assembliesWhere: Record<string, any> = { stateCode: { equals: stateCode } }
if (districtParam) {
    assembliesWhere.districtName = { equals: districtParam }
}

const assemblies = await payload.find({
    collection: 'assemblies',
    where: assembliesWhere,
    limit: 500,
})

// If district filtered, only fetch history for those assemblies
if (districtParam && assemblies.docs.length > 0) {
    const ids = assemblies.docs.map((a: any) => a.assemblyId)
    whereClause.assemblyId = { in: ids }
}

const electionRecords = await payload.find({
    collection: 'election-history',
    where: whereClause,
    limit: 50000,
})
```

Then remove the JS-level filter at line ~143:
```ts
// DELETE this block:
if (districtParam && districtName !== districtParam) {
    continue
}
```

The `partyParam` filter at line ~173 (`if (partyParam && candidates.length > 0 && candidates[0].party !== partyParam)`) is applied after assembly grouping — leave it as-is since Payload doesn't support filtering by a related-record's field in this shape.

- [ ] **Step 2: Verify build**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/election-data-table/route.ts
git commit -m "perf: push district filter into DB query in election-data-table, avoid full 50k-row scan"
```

---

## Phase 4 — Shared UI Primitives

Extract reusable components that are currently copy-pasted.

---

### Task 4.1: Add Skeleton component

**Files:**
- Create: `src/components/ui/skeleton.tsx`
- Modify (3 files): `src/components/ElectionInsightsPanel/index.tsx`, `src/components/MapStatsDashboard/index.tsx`, `src/components/ElectionAnalysisMap/index.tsx`

- [ ] **Step 1: Create the Skeleton component**

```tsx
// src/components/ui/skeleton.tsx
import { cn } from '@/utilities/ui'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-gray-200 dark:bg-gray-800',
        className,
      )}
    />
  )
}
```

- [ ] **Step 2: Replace manual pulse divs in ElectionInsightsPanel**

```bash
grep -n "animate-pulse\|bg-gray-200" src/components/ElectionInsightsPanel/index.tsx
```

Replace each `<div className="h-X bg-gray-200 dark:bg-gray-800 rounded ...">` with `<Skeleton className="h-X ..." />`. Add import:
```ts
import { Skeleton } from '@/components/ui/skeleton'
```

- [ ] **Step 3: Replace in MapStatsDashboard**

```bash
grep -n "animate-pulse\|bg-gray-200" src/components/MapStatsDashboard/index.tsx
```

Same substitution pattern.

- [ ] **Step 4: Replace in ElectionAnalysisMap**

```bash
grep -n "animate-pulse\|bg-gray-100\|bg-gray-200" src/components/ElectionAnalysisMap/index.tsx
```

- [ ] **Step 5: Verify build**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/skeleton.tsx src/components/ElectionInsightsPanel/index.tsx src/components/MapStatsDashboard/index.tsx src/components/ElectionAnalysisMap/index.tsx
git commit -m "refactor: add Skeleton component, replace 3 manual animate-pulse blocks"
```

---

### Task 4.2: Add SectionAccent component and replace 7 inline usages

**Files:**
- Create: `src/components/ui/section-accent.tsx`
- Modify (7 files): `src/components/GenderDistrictChart/index.tsx`, `src/components/MandateMeter/index.tsx`, `src/components/WaveTimeline/index.tsx`, `src/components/HemicycleChart/index.tsx`, `src/components/MarginScatterPlot/index.tsx`, `src/components/ConstituencyLeaderboard/index.tsx`, `src/components/SeatFlipSankey/index.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/ui/section-accent.tsx
export function SectionAccent() {
  return <span className="inline-block w-1 h-5 bg-red-600 rounded-sm" />
}
```

- [ ] **Step 2: Find all 7 usages**

```bash
grep -rn "inline-block w-1 h-5 bg-red-600" src/components --include="*.tsx"
```

- [ ] **Step 3: Replace in each file**

For each file, replace:
```tsx
<span className="inline-block w-1 h-5 bg-red-600 rounded-sm" />
```
With:
```tsx
<SectionAccent />
```
And add `import { SectionAccent } from '@/components/ui/section-accent'` at the top.

- [ ] **Step 4: Verify build**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/section-accent.tsx src/components/GenderDistrictChart/index.tsx src/components/MandateMeter/index.tsx src/components/WaveTimeline/index.tsx src/components/HemicycleChart/index.tsx src/components/MarginScatterPlot/index.tsx src/components/ConstituencyLeaderboard/index.tsx src/components/SeatFlipSankey/index.tsx
git commit -m "refactor: extract SectionAccent component, replace 7 inline red accent spans"
```

---

## Phase 5 — Resilience

Add error boundaries and loading states to prevent blank screens.

---

### Task 5.1: Add error.tsx to [stateSlug] route group

**Files:**
- Create: `src/app/(frontend)/[stateSlug]/error.tsx`

This file catches unhandled errors in any page under `[stateSlug]/`. Without it, a DB failure shows a blank white screen or raw Next.js error page in production.

- [ ] **Step 1: Create the error boundary**

```tsx
// src/app/(frontend)/[stateSlug]/error.tsx
'use client'

import { useEffect } from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function StateError({ error, reset }: Props) {
  useEffect(() => {
    console.error('State page error:', error)
  }, [error])

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="border-l-4 border-red-600 pl-3 mb-6 inline-block text-left">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        We could not load this page. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify the file is picked up by Next.js**

```bash
pnpm build 2>&1 | grep -i "error\|stateSlug" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/\[stateSlug\]/error.tsx
git commit -m "feat: add error boundary for [stateSlug] route group to handle DB failures gracefully"
```

---

### Task 5.2: Add loading.tsx to [stateSlug] route group

**Files:**
- Create: `src/app/(frontend)/[stateSlug]/loading.tsx`

Without this, all pages under `[stateSlug]/` show nothing while data fetches. Next.js App Router shows this file automatically during server-component data fetching.

- [ ] **Step 1: Create the loading component**

```tsx
// src/app/(frontend)/[stateSlug]/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function StateLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}
```

> Note: This file depends on the `Skeleton` component from Task 4.1. Complete Task 4.1 first.

- [ ] **Step 2: Verify build**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/\[stateSlug\]/loading.tsx
git commit -m "feat: add loading skeleton for [stateSlug] route group"
```

---

## Self-review

**Spec coverage check:**
- ✅ Task 1.1 — assembly-info try/catch
- ✅ Task 1.2 — caste-data getPayload inside try
- ✅ Task 1.3 — OG MIME type
- ✅ Task 1.4 — ElectionPredictionMap crash
- ✅ Task 1.5 — year NaN validation
- ✅ Task 2.1 — formatNumber (11 sites)
- ✅ Task 2.2 — getEnglishName (7 sites)
- ✅ Task 2.3 — baseUrl (23 sites)
- ✅ Task 2.4 — cn() duplication
- ✅ Task 2.5 — dead files
- ✅ Task 3.1 — OG font/logo caching
- ✅ Task 3.2 — Cache-Control headers
- ✅ Task 3.3 — election-data-table filter at DB level
- ✅ Task 4.1 — Skeleton component
- ✅ Task 4.2 — SectionAccent component
- ✅ Task 5.1 — error.tsx
- ✅ Task 5.2 — loading.tsx

**Deferred (not in scope — larger architectural refactors):**
- election-results 200-line SRP violation (requires lib extraction + new types)
- KnownBusinesses/CasteData interface deduplication (requires Payload type audit)
- 250-line LocalInfoSection extraction (requires careful props alignment)
- VoteSharePieChart extraction (requires chart prop interface design)
- `stateCode || 'TN'` shared helper (low risk, low value without multi-state work)
