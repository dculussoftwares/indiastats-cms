# Design: Remove Hardcoded State/Party Data

**Date:** 2026-06-02  
**Goal:** Eliminate all hardcoded state, party, and numeric data from components so the app is multi-state ready. `src/config/states/[state].ts` becomes the single source of truth.

---

## Problem Summary

18 categories of hardcoded data exist across 20+ files:

| Category | Files | Example |
|---|---|---|
| Party colors defined 3× | `partyColors.ts`, `VoteTransferChart`, `tamil-nadu.ts` | DMK is `#E7191E` vs `#b71c1c` (inconsistent!) |
| Default `stateCode = 'TN'` | 5 components | `ElectionDataTable`, `MostWinningPartiesCard`, `PartyWinsChart` |
| Hardcoded numbers in UI text | 10 files | `"234 assembly constituencies"`, `"38 districts"` |
| Hardcoded year filter `>= 1977` | 5 files | `XCardPreview`, `AssemblyPageClient`, `TwitterCardModal` |
| State slug in URL construction | 2 files | `'/tamil-nadu/assembly/${row.districtSlug}'` |
| Party name map | 1 file | `partyColors.ts` PARTY_NAME_MAP |
| Hashtag string | 1 file | Hardcoded `#TamilNadu #DMK #AIADMK ...` |
| Election years list | 2 files | Different lists in `tamil-nadu.ts` vs `election-results/route.ts` |

---

## Approach: Expand StateConfig as Single Source of Truth

Keep `src/config/states/[state].ts` as the canonical contract. No new files, no new abstraction layers. Components read everything via the existing `useStateConfig()` hook (already provided by `StateProvider`).

---

## 1. StateConfig Type Changes (`src/config/states/types.ts`)

Add 5 new fields:

```ts
export interface StateConfig {
  // ... existing fields unchanged ...

  // NEW: replaces hardcoded >= 1977 filter in 5 files
  historyStartYear: number

  // NEW: replaces PARTY_NAME_MAP in src/lib/partyColors.ts
  partyNameMap: Record<string, string>

  // NEW: replaces hardcoded hashtag string in TwitterCardModal
  defaultHashtags: string[]

  // NEW: replaces "50,000+" and "6+ crore" hardcoded UI strings
  boothCountLabel: string
  voterCountLabel: string
}
```

---

## 2. Tamil Nadu Config Updates (`src/config/states/tamil-nadu.ts`)

Add the 5 new fields. Reconcile party colors (state config `partyColors` is authoritative — fix the inconsistencies where `partyColors.ts` had different hex values for same parties).

```ts
historyStartYear: 1977,
boothCountLabel: '50,000+',
voterCountLabel: '6+ crore',
defaultHashtags: ['TamilNadu', 'TNElections', 'TamilNaduPolitics', 'IndiaStats', ...],
partyNameMap: {
  'TAMILAGA VETTRI KAZHAGAM': 'TVK',
  'DRAVIDA MUNNETRA KAZHAGAM': 'DMK',
  // ... all 14 entries from partyColors.ts PARTY_NAME_MAP ...
}
```

---

## 3. Party Color Utilities (`src/lib/partyColors.ts`)

**Keep the file** — it contains `getPartyColor()` and `normalizePartyName()` which are used broadly. **Refactor** to accept state config instead of using its own hardcoded maps:

```ts
// Before: reads from internal PARTY_COLORS constant
export function getPartyColor(party: string): string

// After: reads from state config passed in
export function getPartyColor(party: string, partyColors: Record<string, string>, partyNameMap: Record<string, string>): string

// Keep PARTY_COLORS and PARTY_NAME_MAP as DEPRECATED fallbacks (removed in follow-up)
// This avoids breaking callers not yet migrated
```

All callers updated to pass `stateConfig.partyColors` and `stateConfig.partyNameMap`.

**Delete:** The `PARTY_COLORS` constant eventually once all callers are migrated. For now it stays as fallback.

---

## 4. Component Hardcoding Fixes

### 4a. Default `stateCode = 'TN'` (5 components)
Remove hardcoded defaults. Components that render inside `[stateSlug]/` already have access to `useStateConfig()`. Components used on `/election-data` (cross-state page) accept `stateCode` as a required prop, caller passes it explicitly.

Files: `ElectionDataTable`, `MostWinningPartiesCard`, `PartyWinsChart`, `api/election-results/route.ts`

### 4b. Year filter `>= 1977` (5 files)
Replace with `stateConfig.historyStartYear`:
```ts
// Before
.filter(h => h.electionYear >= 1977)

// After
.filter(h => h.electionYear >= stateConfig.historyStartYear)
```

Files: `XCardPreview.tsx`, `AssemblyPageClient.tsx`, `TwitterCardModal.tsx`, `og/[assemblyId]/route.tsx`

### 4c. State slug in URL construction (2 files)
`ElectionDataTable` and `BeforeDashboard/ImportPredictions` hardcode `/tamil-nadu/` in paths. Replace with `stateConfig.slug` from context or prop.

### 4d. `VoteTransferChart` inline color map (1 file)
Remove the 9-entry `PARTY_COLORS` object inside the component. Use `getPartyColor()` with state config instead.

### 4e. Hashtags in `TwitterCardModal` (1 file)
Replace hardcoded string with `stateConfig.defaultHashtags.map(t => '#' + t).join(' ')`.

---

## 5. UI Text with Hardcoded Numbers (10 files)

Replace static strings with state config values:

| File | Hardcoded | Replacement |
|---|---|---|
| `(home)/page.tsx` | `"234 assembly constituencies, 50,000+ booths, 6+ crore voters"` | `stateConfig.assemblyCount`, `.boothCountLabel`, `.voterCountLabel` |
| `HomePageClient.tsx` (×6) | `"234"`, `"38"` | `stateConfig.assemblyCount`, `stateConfig.districtCount` |
| `about/page.tsx` (×2) | `"234 Tamil Nadu assembly constituencies"` | Same |
| `election-results/route.ts` | `[1952, 1957, ...]` hardcoded list | `stateConfig.electionYears` |

---

## 6. WaveTimeline MAJOR_PARTIES (1 file)

```ts
// Before
const MAJOR_PARTIES = ['TVK', 'DMK', 'AIADMK', 'INC', 'BJP', ...]

// After
const { stateConfig } = useStateConfig()
// use stateConfig.majorParties
```

---

## Files Changed Summary

| File | Change |
|---|---|
| `src/config/states/types.ts` | Add 5 fields to `StateConfig` |
| `src/config/states/tamil-nadu.ts` | Add 5 new field values |
| `src/lib/partyColors.ts` | Refactor `getPartyColor` / `normalizePartyName` to accept config params |
| `src/components/VoteTransferChart/index.tsx` | Remove inline color map, use `getPartyColor` |
| `src/components/ElectionDataTable/index.tsx` | Remove `stateCode='TN'` default, fix URL construction |
| `src/components/MostWinningPartiesCard/index.tsx` | Remove `stateCode='TN'` default |
| `src/components/PartyWinsChart/index.tsx` | Remove `stateCode='TN'` default |
| `src/components/WaveTimeline/index.tsx` | Replace `MAJOR_PARTIES` const with `stateConfig.majorParties` |
| `src/components/TwitterCardModal.tsx` | Replace hashtag string + year filter |
| `src/app/(x-card)/x-card/[assemblyId]/XCardPreview.tsx` | Replace year filters and "1977-2021" strings |
| `src/app/(frontend)/[stateSlug]/assembly/.../AssemblyPageClient.tsx` | Replace year filters |
| `src/app/(frontend)/(home)/page.tsx` | Replace count strings |
| `src/app/(frontend)/(home)/HomePageClient.tsx` | Replace all 6 hardcoded count references |
| `src/app/(frontend)/about/page.tsx` | Replace count strings |
| `src/app/api/election-results/route.ts` | Remove `stateCode='TN'` default + year list |
| `src/app/api/og/[assemblyId]/route.tsx` | Replace year filter |
| `src/components/BeforeDashboard/ImportPredictions/index.tsx` | Remove hardcoded `'TN'` state |
| `src/middleware.ts` | `DEFAULT_STATE_SLUG` already a const — verify it's used correctly |

---

## Out of Scope (This Phase)

- Moving config to PayloadCMS database
- Per-year alliance config (alliances change between elections)
- Adding a second state (that comes next, once this is done)
- Deleting `PARTY_COLORS` from `partyColors.ts` (deprecated but kept as fallback)

---

## Success Criteria

1. `grep -r "tamil-nadu\|'TN'\|\"TN\"\| 234 \| 38 \|1977" src/components src/app` returns zero results (excluding config files and middleware DEFAULT_STATE_SLUG)
2. `pnpm build` passes with no TypeScript errors
3. `pnpm lint` passes clean
4. Dev server renders Tamil Nadu pages correctly (visual regression check)
