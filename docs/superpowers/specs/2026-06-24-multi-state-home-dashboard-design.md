# Multi-State Home Page & Per-State Dashboard — Design Spec

**Date:** 2026-06-24  
**Status:** Approved  
**Scope:** Root home page (`/`) and per-state dashboard (`/[stateSlug]/dashboard`)

---

## Problem

The root home page is entirely Tamil Nadu-centric — ~20 hardcoded `/tamil-nadu/` links, TN-specific copy, and sections that assume TN is the only state. With Uttar Pradesh now live, the site needs to present both states equally and scale cleanly as more states are added.

The per-state dashboard (`/[state]/dashboard`) is a thin page — just stats counts and a search box. It lacks any navigation to the state's sub-pages, making it a dead end for new visitors.

---

## Solution Overview

**Option chosen: B** — India landing page with state cards. Keep the hero, add a "Browse by State" section, strip TN-specific sections. Each state gets a richer dashboard that serves as its own navigation hub.

---

## 1. Root Home Page (`/`)

### 1.1 What Changes

**Remove entirely:**
- "Tamil Nadu at a Glance" section (hardcoded TN stats + election year links)
- "Tamil Nadu Highlight" section (TN-specific promotional block)
- "Tamil Nadu's political landscape..." paragraph
- Hardcoded TN election year timeline

**Keep (made state-agnostic):**
- Dark hero section — tricolor accent, tagline, animated aggregate stats
- "What You Can Explore" feature cards — links updated to use first available state (`/tamil-nadu/`) for now; will be config-driven when a "featured state" concept is introduced
- Footer, header, SEO metadata

**Add:**
- **"Browse by State"** section — inserted between the hero and "What You Can Explore"

### 1.2 "Browse by State" Section

A responsive card grid. Each registered state in the state registry gets one card.

**Card content (per state):**
- State name (e.g., "Uttar Pradesh")
- Key stats: `{assemblyCount} seats · {districtCount} districts`
- History range: `Data from {historyStartYear}`
- Next election year (from `electionYears` last entry): `Next election: 2027`
- Top 3 major parties as colored dots (from `partyColors` + `majorParties`)
- CTA button: "Explore →" → `/[stateSlug]/dashboard`

**Data source:** `getAllStates()` from `src/config/states/index.ts` — no DB query needed, all from config.

**Layout:** `grid-cols-1 md:grid-cols-2` for 2 states; will reflow to `lg:grid-cols-3` naturally at 3+ states.

### 1.3 Hero CTA Buttons

Currently both buttons hardcode `/tamil-nadu/`. Change to:
- "Explore Data" → `/tamil-nadu/dashboard` (keep TN as primary for now, add state selector dropdown in Phase 2)
- "Interactive Map" → `/tamil-nadu/assembly-map` (same)

These remain TN-pointed until a "select state" UX is designed. The Browse by State section handles multi-state navigation.

### 1.4 Aggregate Stats in Hero

The animated counters currently show all-states-combined (637 assemblies, 113 districts). This is correct behaviour for a national platform — keep it.

---

## 2. Per-State Dashboard (`/[stateSlug]/dashboard`)

### 2.1 Page Structure (top to bottom)

```
[Page Title: "{State} Election Data"]
[Stats Bar: Districts | Assemblies | Booths | Voters]
[Bloc Cards]
[Last Election Snapshot]
[What You Can Explore — feature grid]
[District + Assembly Search] ← moved to bottom
```

### 2.2 Bloc Cards

Sourced from `stateConfig.blocs` — already populated for both TN and UP.

**Per card:**
- Leader image (`leaderImage` path)
- Bloc name (e.g., "NDA", "DMK Bloc")
- Party list as colored badges (from `partyColors`)
- Colored left border matching `bloc.color`

**Layout:** `grid-cols-1 md:grid-cols-3` (3 blocs per state currently)

**Fallback:** If `blocs` is empty, section is hidden.

### 2.3 Last Election Snapshot

A single-row summary of the most recent election year's seat totals per alliance/party.

**Data:** Query `election-history` collection — group by `candidateParty` for the most recent `electionYear`, count winners (rank 1 per assemblyId), sum into party/bloc buckets using `stateConfig.blocs`.

**Display:** Horizontal bar or pill list — e.g.:
```
2022 Results: NDA 273 seats  SP Alliance 125 seats  BSP 1 seat  Others 4 seats
```

**Fallback:** If no election history exists for the state, section hidden.

### 2.4 "What You Can Explore" Feature Grid

Same card style as the current home page section. Links are dynamic per state.

| Card | Icon | Link |
|---|---|---|
| Assembly Map | Map | `/[state]/assembly-map` |
| Election Analysis | BarChart3 | `/[state]/election-analysis/[lastElectionYear]` |
| Election Results | Vote | `/[state]/election-results` |
| Caste Demographics | Users | `/[state]/caste-demographics` |
| District Explorer | MapPinned | `/[state]/district` (first district slug) |
| Election Data Table | Download | `/election-data?state=[stateCode]` |

`lastElectionYear` = last entry in `stateConfig.electionYears` that is ≤ current year.

**Layout:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

### 2.5 Search (moved to bottom)

District Search and Assembly Search widgets remain — moved below the feature grid.

---

## 3. Data & Caching

### Home Page (`/`)
- No DB queries needed for Browse by State — pure config
- Aggregate stats (hero counters) remain as-is — all-states sum
- Cache key unchanged: `home-page-data`

### Dashboard (`/[stateSlug]/dashboard`)
- Existing queries already fixed to filter by `stateCode`
- New: one additional query for last-election snapshot (cached per state + year)
- Bloc data: from `stateConfig` — zero DB cost
- Cache key: `dashboard-data-${stateCode}` (already in place)

---

## 4. Files Changed

| File | Change |
|---|---|
| `src/app/(frontend)/(home)/page.tsx` | Add `getAllStates()` call, pass to client |
| `src/app/(frontend)/(home)/HomePageClient.tsx` | Add Browse by State section, remove TN-specific sections, make feature card links state-agnostic |
| `src/app/(frontend)/[stateSlug]/dashboard/page.tsx` | Add bloc data + last-election query, pass to client |
| `src/app/(frontend)/[stateSlug]/dashboard/DashboardClient.tsx` | Add Bloc Cards, Last Election Snapshot, What You Can Explore grid; move search to bottom |

---

## 5. Out of Scope

- State selector dropdown in hero CTA buttons (Phase 2)
- Caste demographics cards on dashboard (data not seeded for UP yet)
- Booth data cards (not seeded for UP)
- Dynamic "featured state" logic

---

## 6. Success Criteria

- `/` shows TN and UP side by side in Browse by State with correct stats from config
- `/tamil-nadu/dashboard` and `/uttar-pradesh/dashboard` both show blocs, election snapshot, and feature grid
- No hardcoded `/tamil-nadu/` links remain on the root home page (except hero CTAs, which are explicitly noted as temporary)
- Tamil Nadu dashboard is unaffected — same data, richer layout
