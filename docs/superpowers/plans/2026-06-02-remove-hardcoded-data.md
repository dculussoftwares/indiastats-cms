# Remove Hardcoded State/Party Data — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate all hardcoded state, party, and numeric data from components so `src/config/states/[state].ts` is the single source of truth and the app is ready for multi-state support.

**Architecture:** Extend `StateConfig` with 5 new fields (`historyStartYear`, `partyNameMap`, `boothCountLabel`, `voterCountLabel`, `defaultHashtags`). Refactor `src/lib/partyColors.ts` to delegate to state config instead of maintaining its own constant maps. Update all components to read from state config or pass state code to existing helpers. No new files, no new abstraction layers.

**Tech Stack:** TypeScript, Next.js 15, PayloadCMS 3.x, existing `StateProvider` / `useStateConfig()` hook at `src/components/providers/StateProvider.tsx`

**Spec:** `docs/superpowers/specs/2026-06-02-remove-hardcoded-data-design.md`

---

## Task 1: Extend StateConfig Type

**Files:**
- Modify: `src/config/states/types.ts`

- [ ] **Step 1: Add 5 new fields to `StateConfig`**

In `src/config/states/types.ts`, add after `electionYears: number[]`:

```ts
  // Replaces >= 1977 hardcoded filter in 5+ files
  historyStartYear: number

  // Replaces PARTY_NAME_MAP in src/lib/partyColors.ts (full name → abbreviation)
  partyNameMap: Record<string, string>

  // Replaces hardcoded hashtag string in TwitterCardModal
  defaultHashtags: string[]

  // Replaces "50,000+" and "6+ crore" hardcoded UI text
  boothCountLabel: string
  voterCountLabel: string
```

Full updated `StateConfig` interface:

```ts
export interface StateConfig {
  code: string
  slug: string
  name: string
  assemblyCount: number
  districtCount: number

  majorParties: string[]
  blocs: BlocConfig[]

  partyColors: Record<string, string>
  leaderImages: Record<string, string>

  mapGeoJson: string
  electionYears: number[]

  historyStartYear: number
  partyNameMap: Record<string, string>
  defaultHashtags: string[]
  boothCountLabel: string
  voterCountLabel: string
}
```

- [ ] **Step 2: Verify TypeScript catches missing fields**

```bash
cd /Users/natheeshkumarrangasamy/Desktop/DculusApps/indiastats-cms
npx tsc --noEmit 2>&1 | grep "tamil-nadu" | head -10
```

Expected: errors like `Property 'historyStartYear' is missing in type...` in `tamil-nadu.ts` — confirms the type is enforced.

---

## Task 2: Update Tamil Nadu Config With New Fields

**Files:**
- Modify: `src/config/states/tamil-nadu.ts`

- [ ] **Step 1: Add 5 new fields to `tamilNaduConfig`**

Open `src/config/states/tamil-nadu.ts`. After `electionYears`, add:

```ts
  historyStartYear: 1977,

  partyNameMap: {
    'TAMILAGA VETTRI KAZHAGAM': 'TVK',
    'DRAVIDA MUNNETRA KAZHAGAM': 'DMK',
    'ALL INDIA ANNA DRAVIDA MUNNETRA KAZHAGAM': 'AIADMK',
    'ANNA DRAVIDA MUNNETRA KAZHAGAM': 'AIADMK',
    'INDIAN NATIONAL CONGRESS': 'INC',
    'BHARATIYA JANATA PARTY': 'BJP',
    'PATTALI MAKKAL KATCHI': 'PMK',
    'VIDUTHALAI CHIRUTHAIGAL KATCHI': 'VCK',
    'INDIAN UNION MUSLIM LEAGUE': 'IUML',
    'COMMUNIST PARTY OF INDIA (MARXIST)': 'CPI(M)',
    'COMMUNIST PARTY OF INDIA': 'CPI',
    'AMMA MAKKAL MUNNETTRA KAZAGAM': 'AMMK',
    'DESIYA MURPOKKU DRAVIDA KAZHAGAM': 'DMDK',
    'NAAM TAMILAR KATCHI': 'NTK',
    'MAKKAL NEEDHI MAIAM': 'MNM',
    'MARUMALARCHI DRAVIDA MUNNETRA KAZHAGAM': 'MDMK',
    'KERALA CONGRESS (M)': 'KC(M)',
  },

  defaultHashtags: [
    'TamilNadu',
    'TNElections',
    'TamilNaduPolitics',
    'IndiaStats',
    'DMK',
    'AIADMK',
    'TNPolls',
    'ElectionData',
    'TVK',
    'Vijay',
    'Stalin',
    'EPS',
    'BJP',
    'Modi',
    'INC',
    'RahulGandhi',
  ],

  boothCountLabel: '50,000+',
  voterCountLabel: '6+ crore',
```

- [ ] **Step 2: Confirm TypeScript is satisfied**

```bash
npx tsc --noEmit 2>&1 | grep "tamil-nadu" | head -5
```

Expected: no errors for `tamil-nadu.ts`

- [ ] **Step 3: Commit**

```bash
git add src/config/states/types.ts src/config/states/tamil-nadu.ts
git commit -m "feat: extend StateConfig with historyStartYear, partyNameMap, defaultHashtags, boothCountLabel, voterCountLabel"
```

---

## Task 3: Refactor partyColors.ts to Delegate to State Config

**Files:**
- Modify: `src/lib/partyColors.ts`

The file currently has its own `PARTY_COLORS` and `PARTY_NAME_MAP` constants that duplicate data now in `tamil-nadu.ts`. Replace them so the file is a thin wrapper over state config.

- [ ] **Step 1: Replace the entire contents of `src/lib/partyColors.ts`**

```ts
import { getStateByCode } from '@/config/states'

// Fallback color for unknown parties
const FALLBACK_COLOR = '#607d8b'

// Partial-name fallback rules (for ECI full names with typos or variants)
const PARTIAL_FALLBACKS: Array<[RegExp, string]> = [
  [/VETTRI|TVK/i, 'TVK'],
  [/ANNA.*DRAVIDA|AIADMK|ADMK/i, 'AIADMK'],
  [/DRAVIDA MUNNETRA|^DMK$/i, 'DMK'],
  [/CONGRESS|^INC$/i, 'INC'],
  [/BHARATIYA JANATA|^BJP$/i, 'BJP'],
  [/PATTALI|^PMK$/i, 'PMK'],
  [/VIDUTHALAI|^VCK$/i, 'VCK'],
  [/MUSLIM LEAGUE|^IUML$/i, 'IUML'],
  [/COMMUNIST.*MARXIST|CPIM|CPI\(M\)/i, 'CPI(M)'],
  [/COMMUNIST/i, 'CPI'],
  [/AMMA MAKKAL|AMMK/i, 'AMMK'],
  [/DESIYA MURPOKKU|DMDK/i, 'DMDK'],
]

export function normalizePartyName(party: string, stateCode = 'TN'): string {
  if (!party) return party
  const config = getStateByCode(stateCode)
  const map = config?.partyNameMap ?? {}
  return map[party.toUpperCase().trim()] ?? party
}

export function getPartyColor(party: string, stateCode = 'TN'): string {
  if (!party || party.trim() === '') return FALLBACK_COLOR

  const config = getStateByCode(stateCode)
  if (!config) return FALLBACK_COLOR

  const upper = party.toUpperCase().trim()
  const normalized = config.partyNameMap[upper] ?? upper

  // Direct lookup (abbreviation or mapped abbreviation)
  if (config.partyColors[normalized]) return config.partyColors[normalized]
  if (config.partyColors[upper]) return config.partyColors[upper]

  // Partial string fallback for messy ECI names
  for (const [pattern, abbrev] of PARTIAL_FALLBACKS) {
    if (pattern.test(upper) && config.partyColors[abbrev]) {
      return config.partyColors[abbrev]
    }
  }

  return FALLBACK_COLOR
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | grep "partyColors" | head -10
```

Expected: no errors

- [ ] **Step 3: Run the dev build to confirm nothing crashes**

```bash
pnpm build 2>&1 | tail -20
```

Expected: build succeeds (may have pre-existing warnings unrelated to this change)

- [ ] **Step 4: Commit**

```bash
git add src/lib/partyColors.ts
git commit -m "refactor: delegate partyColors.ts to state config, remove duplicated PARTY_COLORS and PARTY_NAME_MAP constants"
```

---

## Task 4: Fix VoteTransferChart Inline Color Map

**Files:**
- Modify: `src/components/VoteTransferChart/index.tsx`

The component has its own `PARTY_COLORS` constant (lines 19–27) and a local `getPartyColor(party, fallbackIndex)`. Replace with state config.

- [ ] **Step 1: Add StateProvider import and remove inline color map**

At the top of `src/components/VoteTransferChart/index.tsx`, add:

```ts
import { useStateConfig } from '@/components/providers/StateProvider'
import { getPartyColor as getConfigPartyColor } from '@/lib/partyColors'
```

Remove the `const PARTY_COLORS: Record<string, string> = { ... }` block (lines 19–27 roughly).

- [ ] **Step 2: Update the local getPartyColor helper**

Find the local function:

```ts
function getPartyColor(party: string, fallbackIndex: number): string {
  return PARTY_COLORS[party] ?? FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length]
}
```

Replace with (note: the component needs `stateCode` from context):

```ts
function makeGetColor(stateCode: string) {
  return (party: string, fallbackIndex: number): string => {
    const color = getConfigPartyColor(party, stateCode)
    if (color !== '#607d8b') return color
    return FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length]
  }
}
```

- [ ] **Step 3: Use state config inside the component**

At the start of the component function body, add:

```ts
const state = useStateConfig()
const getPartyColor = makeGetColor(state.code)
```

(The existing call sites `getPartyColor(c.party, i)` continue to work unchanged.)

- [ ] **Step 4: Verify no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | grep "VoteTransferChart" | head -5
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/components/VoteTransferChart/index.tsx
git commit -m "refactor: remove inline PARTY_COLORS from VoteTransferChart, use state config via partyColors utility"
```

---

## Task 5: Fix WaveTimeline MAJOR_PARTIES

**Files:**
- Modify: `src/components/WaveTimeline/index.tsx`

- [ ] **Step 1: Remove hardcoded constant and read from state config**

Find at top of file (line 21):
```ts
const MAJOR_PARTIES = ['TVK', 'DMK', 'AIADMK', 'INC', 'BJP', 'PMK', 'VCK', 'NTK']
```

Remove this line. Then find the import for `useStateConfig` — if not present, add:

```ts
import { useStateConfig } from '@/components/providers/StateProvider'
```

Inside the component function, add at the top:

```ts
const state = useStateConfig()
const MAJOR_PARTIES = state.majorParties
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "WaveTimeline" | head -5
```

- [ ] **Step 3: Commit**

```bash
git add src/components/WaveTimeline/index.tsx
git commit -m "refactor: replace hardcoded MAJOR_PARTIES constant in WaveTimeline with stateConfig.majorParties"
```

---

## Task 6: Fix MostWinningPartiesCard — stateCode Default + Year Filter

**Files:**
- Modify: `src/components/MostWinningPartiesCard/index.tsx`

- [ ] **Step 1: Remove the `stateCode = 'TN'` default**

Find the function signature (around line 82):
```ts
  stateCode = 'TN',
```

Change to (make it required):
```ts
  stateCode: string,
```

Verify the only caller (`election-data/page.tsx`) already passes `stateCode="TN"` explicitly — it does.

- [ ] **Step 2: Replace hardcoded `>= 1977` filters with state config**

The component calls `getStateByCode(stateCode)` somewhere for leader images. Add:

```ts
const stateConfig = getStateByCode(stateCode)
const historyStartYear = stateConfig?.historyStartYear ?? 1977
```

Then find all occurrences of `.filter((d) => d.year >= 1977)` (around lines 95, 150) and replace with:

```ts
.filter((d) => d.year >= historyStartYear)
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "MostWinningPartiesCard" | head -5
```

- [ ] **Step 4: Commit**

```bash
git add src/components/MostWinningPartiesCard/index.tsx
git commit -m "refactor: make stateCode required in MostWinningPartiesCard, replace hardcoded 1977 filter with stateConfig.historyStartYear"
```

---

## Task 7: Fix AssemblyPageClient Year Filters

**Files:**
- Modify: `src/app/(frontend)/[stateSlug]/assembly/[districtSlug]/[assemblySlug]/AssemblyPageClient.tsx`

The component already calls `const state = useStateConfig()` (line 136). Just use it.

- [ ] **Step 1: Replace the two `>= 1977` filters**

Find (around line 361):
```ts
: data.electionHistory.filter((e) => e.year >= 1977).slice(0, 3)
```
Replace with:
```ts
: data.electionHistory.filter((e) => e.year >= state.historyStartYear).slice(0, 3)
```

Find (around line 395):
```ts
data.electionHistory.filter((e) => e.year >= 1977).length > 3 && (
```
Replace with:
```ts
data.electionHistory.filter((e) => e.year >= state.historyStartYear).length > 3 && (
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "AssemblyPageClient" | head -5
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(frontend)/[stateSlug]/assembly/[districtSlug]/[assemblySlug]/AssemblyPageClient.tsx"
git commit -m "refactor: replace hardcoded 1977 filter in AssemblyPageClient with stateConfig.historyStartYear"
```

---

## Task 8: Fix TwitterCardModal — Year Filter + Hashtags

**Files:**
- Modify: `src/components/TwitterCardModal.tsx`

This component does not yet import `useStateConfig`. It renders inside `[stateSlug]/` pages so StateProvider is present.

- [ ] **Step 1: Add useStateConfig import**

Add at the top of the file (after existing imports):

```ts
import { useStateConfig } from '@/components/providers/StateProvider'
```

- [ ] **Step 2: Add state config usage inside component**

Find the component function body. Add at the top:

```ts
const state = useStateConfig()
```

- [ ] **Step 3: Replace `>= 1977` year filter**

Find (lines 155–156):
```ts
const electionsFrom1977 = data.electionHistory
  .filter((e) => e.year >= 1977)
```
Replace with:
```ts
const electionsFromStart = data.electionHistory
  .filter((e) => e.year >= state.historyStartYear)
```

Update all references to `electionsFrom1977` → `electionsFromStart` (lines 165, 242–244).

- [ ] **Step 4: Replace hardcoded hashtag string**

Find (line 305 roughly):
```ts
`#TamilNadu #TNElections #TamilNaduPolitics #IndiaStats #DMK #AIADMK #TNPolls #ElectionData #TVK #Vijay #Stalin #EPS #BJP #Modi #INC #RahulGandhi`
```
Replace with:
```ts
state.defaultHashtags.map((t) => `#${t}`).join(' ')
```

- [ ] **Step 5: Replace "1977-2021" label in the UI**

Find (line 500 roughly):
```ts
🏆 MOST WINNING PARTIES (1977-2021)
```
Replace with a dynamic version. First compute `lastYear` from the data:

```ts
const lastYear = electionsFromStart.at(-1)?.year ?? state.historyStartYear
```

Then replace the string with:
```ts
{`🏆 MOST WINNING PARTIES (${state.historyStartYear}-${lastYear})`}
```

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "TwitterCardModal" | head -5
```

- [ ] **Step 7: Commit**

```bash
git add src/components/TwitterCardModal.tsx
git commit -m "refactor: replace hardcoded 1977 filter, hashtag string, and year range label in TwitterCardModal with state config values"
```

---

## Task 9: Fix XCardPreview — Year Filter + Label Strings

**Files:**
- Modify: `src/app/(x-card)/x-card/[assemblyId]/XCardPreview.tsx`
- Modify: `src/app/(x-card)/x-card/[assemblyId]/page.tsx`

XCardPreview is a standalone component (no StateProvider). It receives `CardData` from the page. The fix: add `historyStartYear` to `CardData`, populate it from state config in `page.tsx`.

- [ ] **Step 1: Add `historyStartYear` to `CardData` interface in XCardPreview.tsx**

Find the `CardData` interface (line 22):
```ts
interface CardData {
  assemblyId: string
  stateCode?: string
  // ...
```
Add after `stateCode`:
```ts
  historyStartYear: number
```

- [ ] **Step 2: Fix `deriveStats()` to use `data.historyStartYear`**

Find in `deriveStats()` (line 270):
```ts
const elections = data.electionHistory
  .filter((e) => e.year >= 1977)
```
Replace with:
```ts
const elections = data.electionHistory
  .filter((e) => e.year >= data.historyStartYear)
```

- [ ] **Step 3: Compute `historyYearRange` helper string for labels**

After the `deriveStats` function signature, add computation of a year range string that replaces "1977-2021" in all templates:

Inside `deriveStats`, before the `return` statement, add:

```ts
const lastYear = elections.at(-1)?.year ?? data.historyStartYear
const historyYearRange = `${data.historyStartYear}-${lastYear}`
```

Include `historyYearRange` in the returned stats object. Find the return statement in `deriveStats` and add:

```ts
historyYearRange,
```

`Stats` is defined as `type Stats = ReturnType<typeof deriveStats>` (line 316) so it is inferred from the return type — adding `historyYearRange` to the return object automatically extends `Stats`. No manual type edit needed.

- [ ] **Step 4: Replace all "1977-2021" string occurrences with `stats.historyYearRange`**

Run a targeted search:
```bash
grep -n "1977-2021\|1977\|WINS SINCE" src/app/\(x-card\)/x-card/\[assemblyId\]/XCardPreview.tsx | head -30
```

For each JSX occurrence like:
```tsx
MOST WINNING PARTIES (1977-2021)
```
Replace with:
```tsx
{`MOST WINNING PARTIES (${stats.historyYearRange})`}
```

For occurrences like `WINS SINCE 1977`:
```tsx
{`WINS SINCE ${data.historyStartYear}`}
```

For text like `wins since 1977` and `elections since 1977`:
```tsx
{`wins since ${data.historyStartYear}`}
```

Note: These replacements are inside JSX strings in function components that receive `{ data, stats }` props, so both `data.historyStartYear` and `stats.historyYearRange` are available.

- [ ] **Step 5: Populate historyStartYear in page.tsx**

Open `src/app/(x-card)/x-card/[assemblyId]/page.tsx`. Find the return object in `getAssemblyCardData()` (around line 103):

```ts
return {
  assemblyId: assembly.assemblyId,
  stateCode: assembly.stateCode || 'TN',
  stateName: getStateByCode(assembly.stateCode || 'TN')?.name ?? 'Tamil Nadu',
  // ...
```

Add after `stateName`:

```ts
historyStartYear: getStateByCode(assembly.stateCode || 'TN')?.historyStartYear ?? 1977,
```

- [ ] **Step 6: Fix the hardcoded getLeaderImage helper in XCardPreview.tsx**

Find the local helper (lines 44–51):
```ts
const getLeaderImage = (partyName: string): string | null => {
  if (partyName === 'ADMK' || partyName === 'AIADMK') return '/images/EPS.jpg'
  if (partyName === 'DMK') return '/images/Stalin.png'
  // ...
```

Replace with a state-config-driven version:

```ts
const getLeaderImage = (partyName: string, stateCode: string): string | null => {
  const config = getStateByCode(stateCode)
  if (!config) return null
  return config.leaderImages[partyName] ?? config.leaderImages[partyName.toUpperCase()] ?? null
}
```

Add the import at the top of the file if not present:
```ts
import { getStateByCode } from '@/config/states'
```

Update all call sites from `getLeaderImage(party)` to `getLeaderImage(party, data.stateCode ?? 'TN')`.

- [ ] **Step 7: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "XCardPreview\|x-card" | head -10
```

Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add "src/app/(x-card)/x-card/[assemblyId]/XCardPreview.tsx" "src/app/(x-card)/x-card/[assemblyId]/page.tsx"
git commit -m "refactor: replace all hardcoded 1977/year-range strings in XCardPreview with state config historyStartYear; fix getLeaderImage to use state config"
```

---

## Task 10: Fix og/[assemblyId]/route.tsx Year Filter

**Files:**
- Modify: `src/app/api/og/[assemblyId]/route.tsx`

Already imports `getStateByCode`. Just use it.

- [ ] **Step 1: Add historyStartYear lookup**

Find where `year >= 1977` is used (line 75):
```ts
if (year >= 1977) {
```

Before that section, find where `stateCode` is available (look for existing `getStateByCode` call). Add:

```ts
const stateConfig = getStateByCode(assembly.stateCode || 'TN')
const historyStartYear = stateConfig?.historyStartYear ?? 1977
```

Replace:
```ts
if (year >= 1977) {
```
with:
```ts
if (year >= historyStartYear) {
```

Find the JSX label "Election History (Since 1977)" (around line 213):
```tsx
Election History (Since 1977)
```
Replace with:
```tsx
{`Election History (Since ${historyStartYear})`}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "og/\[assemblyId\]" | head -5
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/og/[assemblyId]/route.tsx"
git commit -m "refactor: replace hardcoded 1977 filter and label in og/[assemblyId] route with stateConfig.historyStartYear"
```

---

## Task 11: Fix ElectionDataTable — URL Construction + stateCode Default

**Files:**
- Modify: `src/components/ElectionDataTable/index.tsx`

- [ ] **Step 1: Add stateCodeToSlug import**

At the top of `src/components/ElectionDataTable/index.tsx`, the file already imports `getPartyColor` from `@/lib/partyColors`. Add:

```ts
import { stateCodeToSlug } from '@/config/states'
```

- [ ] **Step 2: Remove `stateCode = 'TN'` default**

Find (around line 128):
```ts
export function ElectionDataTable({ stateCode = 'TN' }: { stateCode?: string }) {
```
Change to:
```ts
export function ElectionDataTable({ stateCode }: { stateCode: string }) {
```

The only caller (`src/app/(frontend)/election-data/page.tsx` line 37) already passes `stateCode="TN"` — no change needed there.

- [ ] **Step 3: Fix hardcoded URL construction**

Find (around line 230):
```ts
const url = `/tamil-nadu/assembly/${row.districtSlug}/${row.assemblySlug}`
```
Replace with:
```ts
const url = `/${stateCodeToSlug(stateCode)}/assembly/${row.districtSlug}/${row.assemblySlug}`
```

Find (around line 256):
```ts
const url = `/tamil-nadu/district/${row.districtSlug}`
```
Replace with:
```ts
const url = `/${stateCodeToSlug(stateCode)}/district/${row.districtSlug}`
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "ElectionDataTable" | head -5
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ElectionDataTable/index.tsx
git commit -m "refactor: make stateCode required in ElectionDataTable, replace hardcoded /tamil-nadu/ URL paths with stateCodeToSlug()"
```

---

## Task 12: Fix election-results API Route

**Files:**
- Modify: `src/app/api/election-results/route.ts`

- [ ] **Step 1: Use state config election years**

Open the file. Find (around line 16):
```ts
const stateCode = searchParams.get('stateCode') || 'TN' // Default to TN
```
Keep this — it's a query param default, acceptable.

Find the hardcoded years array (lines 25–28):
```ts
[
  1952, 1957, 1962, 1967, 1971, 1977, 1980, 1984, 1989, 1991, 1996, 2001, 2006, 2011, 2016,
  2021, 2026,
]
```

Add import at top of file if not present:
```ts
import { getStateByCode } from '@/config/states'
```

Replace the hardcoded array with:
```ts
getStateByCode(stateCode)?.electionYears ?? []
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "election-results" | head -5
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/election-results/route.ts
git commit -m "refactor: replace hardcoded election year array in election-results route with stateConfig.electionYears"
```

---

## Task 13: Fix HomePageClient Hardcoded Numbers

**Files:**
- Modify: `src/app/(frontend)/(home)/HomePageClient.tsx`

`HomePageClient` already receives `stats` prop with `totalAssemblies`, `totalDistricts`, `totalBooths` from the database. Use them instead of hardcoded strings.

- [ ] **Step 1: Replace hardcoded 234 and 38 in static text**

Find each occurrence and replace:

Line 329:
```tsx
desc: 'Margin scatter across all 234 constituencies',
```
→
```tsx
desc: `Margin scatter across all ${stats.totalAssemblies} constituencies`,
```

Line 472:
```tsx
<p className="text-white/50 text-sm mb-4">Deep dive into 38 districts data</p>
```
→
```tsx
<p className="text-white/50 text-sm mb-4">Deep dive into {stats.totalDistricts} districts data</p>
```

Line 651:
```tsx
<strong className="text-foreground">234 assembly constituencies in Tamil Nadu</strong>
```
→
```tsx
<strong className="text-foreground">{stats.totalAssemblies} assembly constituencies in Tamil Nadu</strong>
```

Line 661:
```tsx
Historical data from 1967 to 2021 across all 234 Tamil Nadu constituencies
```
→
```tsx
{`Historical data from 1967 to 2021 across all ${stats.totalAssemblies} Tamil Nadu constituencies`}
```

Line 719:
```tsx
<span>234 Assembly Constituencies</span>
```
→
```tsx
<span>{stats.totalAssemblies} Assembly Constituencies</span>
```

Line 723:
```tsx
<span>38 Districts Covered</span>
```
→
```tsx
<span>{stats.totalDistricts} Districts Covered</span>
```

- [ ] **Step 2: Replace "50,000+" booth label**

Line 665:
```tsx
<div className="text-2xl font-bold text-red-600 mb-1">50,000+ Booths</div>
```
→
```tsx
<div className="text-2xl font-bold text-red-600 mb-1">{stats.totalBooths.toLocaleString('en-IN')}+ Booths</div>
```

Line 727:
```tsx
<span>50,000+ Polling Booths</span>
```
→
```tsx
<span>{stats.totalBooths.toLocaleString('en-IN')}+ Polling Booths</span>
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "HomePageClient" | head -5
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(frontend)/(home)/HomePageClient.tsx"
git commit -m "refactor: replace hardcoded constituency/district/booth counts in HomePageClient with dynamic stats values"
```

---

## Task 14: Fix Home Page Metadata Description

**Files:**
- Modify: `src/app/(frontend)/(home)/page.tsx`

The metadata description is static but `page.tsx` already fetches `stats`. Generate it from real data.

- [ ] **Step 1: Make metadata dynamic using generateMetadata**

The current file exports `export const metadata: Metadata = { ... }` which is static. Change to a dynamic `generateMetadata` function that has access to fetched stats.

Replace the static export at the top:
```ts
export const metadata: Metadata = {
  title: 'IndiaStats.org - India Election Data & Statistics',
  description:
    "Explore detailed election history, constituency demographics, and voting patterns across India. Start with Tamil Nadu's 234 assembly constituencies, 50,000+ booths, and 6+ crore voters.",
  // ...
}
```

With a dynamic version. Move metadata generation inside `HomePage` after fetching stats, but since Next.js requires `generateMetadata` as a separate export, add:

```ts
export async function generateMetadata(): Promise<Metadata> {
  const { stats } = await getHomePageData()
  const boothsFormatted = (Math.floor(stats.totalBooths / 1000) * 1000).toLocaleString('en-IN')
  return {
    title: 'IndiaStats.org - India Election Data & Statistics',
    description: `Explore detailed election history, constituency demographics, and voting patterns across India. Start with Tamil Nadu's ${stats.totalAssemblies} assembly constituencies, ${boothsFormatted}+ booths, and ${(stats.totalVoters / 10000000).toFixed(0)}+ crore voters.`,
    keywords: [
      'India elections',
      'assembly constituency',
      'voter data',
      'MLA history',
      'election statistics',
      'Tamil Nadu elections',
      'Tamil Nadu MLAs',
      'booth data',
    ],
    alternates: { canonical: baseUrl },
    openGraph: {
      title: "IndiaStats.org - India's Most Comprehensive Election Data Platform",
      description: 'Explore detailed election history, constituency demographics, and voting patterns across Indian assembly constituencies.',
      type: 'website',
      url: baseUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'IndiaStats.org - India Election Data',
      description: 'Comprehensive election data for assembly constituencies across India.',
    },
  }
}
```

Remove the old `export const metadata` block.

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "(home)/page" | head -5
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(frontend)/(home)/page.tsx"
git commit -m "refactor: replace static metadata with dynamic generateMetadata in home page, derive counts from DB stats"
```

---

## Task 15: Fix about/page.tsx

**Files:**
- Modify: `src/app/(frontend)/about/page.tsx`

This is a server component. Import `tamilNaduConfig` for static counts.

- [ ] **Step 1: Add tamilNaduConfig import**

At the top of `src/app/(frontend)/about/page.tsx`, add:

```ts
import { tamilNaduConfig } from '@/config/states'
```

- [ ] **Step 2: Replace hardcoded counts**

Find (line 11):
```ts
"234 Tamil Nadu assembly constituencies, 50,000+ booths"
```
Replace with:
```ts
`${tamilNaduConfig.assemblyCount} Tamil Nadu assembly constituencies, ${tamilNaduConfig.boothCountLabel} booths`
```

Find (line 143):
```ts
"all 234 Tamil Nadu"
```
Replace with:
```ts
`all ${tamilNaduConfig.assemblyCount} Tamil Nadu`
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "about/page" | head -5
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(frontend)/about/page.tsx"
git commit -m "refactor: replace hardcoded assembly/booth counts in about page with tamilNaduConfig values"
```

---

## Task 16: Fix BeforeDashboard/ImportPredictions Default State

**Files:**
- Modify: `src/components/BeforeDashboard/ImportPredictions/index.tsx`

- [ ] **Step 1: Replace hardcoded 'TN' with config-driven default**

Add import at top of file:
```ts
import { getAllStates } from '@/config/states'
```

Find (line 34):
```ts
const [stateCode, setStateCode] = useState('TN')
```
Replace with:
```ts
const [stateCode, setStateCode] = useState(() => getAllStates()[0]?.code ?? 'TN')
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "ImportPredictions" | head -5
```

- [ ] **Step 3: Commit**

```bash
git add src/components/BeforeDashboard/ImportPredictions/index.tsx
git commit -m "refactor: replace hardcoded TN default in ImportPredictions with getAllStates()[0] from state registry"
```

---

## Task 17: Fix Remaining Inline PARTY_COLORS in 3 More Files

**Files:**
- Modify: `src/components/VotesSharesChart/index.tsx`
- Modify: `src/components/PastWinningHistories/index.tsx`
- Modify: `src/app/api/og/prediction/[predictorId]/route.tsx`

These files each define their own `const PARTY_COLORS` inline. Replace with state config.

- [ ] **Step 1: Fix VotesSharesChart**

Open `src/components/VotesSharesChart/index.tsx`. Find the `PARTY_COLORS` constant (line 31). Remove it.

Add `useStateConfig` import:
```ts
import { useStateConfig } from '@/components/providers/StateProvider'
```

Inside the component function, add at top:
```ts
const state = useStateConfig()
```

Find the local color helper (line 51):
```ts
if (PARTY_COLORS[party]) return PARTY_COLORS[party]
```
Replace with:
```ts
if (state.partyColors[party]) return state.partyColors[party]
```

If there's a fallback after it, keep it unchanged.

- [ ] **Step 2: Fix PastWinningHistories**

Open `src/components/PastWinningHistories/index.tsx`. Find the `PARTY_COLORS` constant (line 32). Remove it.

Add `useStateConfig` import:
```ts
import { useStateConfig } from '@/components/providers/StateProvider'
```

Inside the component function, add at top:
```ts
const state = useStateConfig()
```

Find the local color helper (line 51):
```ts
return PARTY_COLORS[party] || '#607d8b'
```
Replace with:
```ts
return state.partyColors[party] || '#607d8b'
```

- [ ] **Step 3: Fix og/prediction route**

Open `src/app/api/og/prediction/[predictorId]/route.tsx`. Find the local `PARTY_COLORS` variable (line 80). It's defined inside a function. Replace:

```ts
const PARTY_COLORS: Record<string, string> = {
  DMK: '#E7191E',
  // ... other entries ...
}
const getColor = (p: string) => PARTY_COLORS[p] ?? '#64748b'
```

With (add `getStateByCode` import at top if not already present):
```ts
import { getStateByCode } from '@/config/states'
```

Inside the handler function, replace the block with:
```ts
const stateCode = /* extract from request context, default 'TN' */ 'TN'
const stateConfig = getStateByCode(stateCode)
const getColor = (p: string) => stateConfig?.partyColors[p] ?? '#64748b'
```

Note: check how `stateCode` is available in this route. If it reads from a query param or path param, use that. Otherwise use `'TN'` as the fallback.

- [ ] **Step 4: Verify all three**

```bash
npx tsc --noEmit 2>&1 | grep "VotesSharesChart\|PastWinningHistories\|og/prediction" | head -10
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/components/VotesSharesChart/index.tsx src/components/PastWinningHistories/index.tsx "src/app/api/og/prediction/[predictorId]/route.tsx"
git commit -m "refactor: remove inline PARTY_COLORS from VotesSharesChart, PastWinningHistories, and og/prediction route; use state config"
```

---

## Task 19: Final Verification

**Files:** None modified — verification only.

- [ ] **Step 1: Check for remaining hardcoded state/party references in components**

```bash
cd /Users/natheeshkumarrangasamy/Desktop/DculusApps/indiastats-cms
grep -rn \
  "'/tamil-nadu\|\"tamil-nadu\|= 'TN'\|= \"TN\"\|>= 1977\|> 1977\|234 \|\"234\"\| 38 \|\"38\"\|50,000\+" \
  src/components src/app \
  --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules\|\.next\|config/states\|middleware\|CLAUDE.md" \
  | grep -v "stateCode.*=.*TN\|DEFAULT_STATE_SLUG"
```

Expected: zero or near-zero results (only the `DEFAULT_STATE_SLUG = 'tamil-nadu'` in middleware which is an intentional named constant, and explicit caller-passed `stateCode="TN"` in election-data page which is valid).

- [ ] **Step 2: Full TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -30
```

Expected: no new errors (only pre-existing warnings if any)

- [ ] **Step 3: Lint check**

```bash
pnpm lint 2>&1 | tail -20
```

Expected: clean or same pre-existing warnings as before

- [ ] **Step 4: Production build**

```bash
pnpm build 2>&1 | tail -30
```

Expected: build completes successfully

- [ ] **Step 5: Dev server smoke test**

```bash
pnpm dev &
sleep 15
curl -s http://localhost:3010/tamil-nadu | grep -c "assembly" || echo "check manually"
```

Manually verify in browser:
- `/tamil-nadu` home renders without errors
- `/tamil-nadu/assembly-map` renders without errors
- `/election-data` renders without errors (ElectionDataTable with explicit stateCode)
- An assembly detail page e.g. `/tamil-nadu/assembly/tiruvallur/ambattur` renders without errors

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: verified - no hardcoded state/party/numeric data remaining outside config files"
```

---

## Summary of Changes

| Task | Files Changed | What Changed |
|---|---|---|
| 1 | `types.ts` | +5 fields on StateConfig |
| 2 | `tamil-nadu.ts` | +5 field values |
| 3 | `partyColors.ts` | Removed PARTY_COLORS/PARTY_NAME_MAP, delegates to state config |
| 4 | `VoteTransferChart/index.tsx` | Removed inline PARTY_COLORS, uses useStateConfig |
| 5 | `WaveTimeline/index.tsx` | MAJOR_PARTIES → stateConfig.majorParties |
| 6 | `MostWinningPartiesCard/index.tsx` | stateCode required, 1977 → historyStartYear |
| 7 | `AssemblyPageClient.tsx` | 1977 → state.historyStartYear |
| 8 | `TwitterCardModal.tsx` | 1977 filter, hashtags, year-range label all config-driven |
| 9 | `XCardPreview.tsx`, `page.tsx` | historyStartYear in CardData, all 1977/year-range refs replaced; getLeaderImage uses state config |
| 10 | `og/[assemblyId]/route.tsx` | 1977 → historyStartYear |
| 11 | `ElectionDataTable/index.tsx` | stateCode required, /tamil-nadu/ → stateCodeToSlug() |
| 12 | `election-results/route.ts` | Hardcoded year array → stateConfig.electionYears |
| 13 | `HomePageClient.tsx` | 234/38/50,000+ → stats.totalAssemblies/Districts/Booths |
| 14 | `(home)/page.tsx` | Static metadata → generateMetadata with dynamic counts |
| 15 | `about/page.tsx` | 234/50,000+ → tamilNaduConfig values |
| 16 | `ImportPredictions/index.tsx` | 'TN' default → getAllStates()[0] |
| 17 | `VotesSharesChart`, `PastWinningHistories`, `og/prediction/route.tsx` | Remove 3 more inline PARTY_COLORS, use state config |
| 18 | — | Verification grep + build + smoke test |
