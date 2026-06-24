# Multi-State Home Page & Per-State Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the TN-centric home page with a multi-state India landing page, and enrich each state's dashboard with bloc cards, election snapshot, and a "What You Can Explore" feature grid.

**Architecture:** The home page pulls all registered states from `getAllStates()` (zero DB cost, config only) and renders state cards. The dashboard enriches its existing server data fetch with blocs from `stateConfig` and a new last-election snapshot query, passing both to an expanded `DashboardClient`.

**Tech Stack:** Next.js 15 App Router, PayloadCMS Local API, TypeScript, Tailwind CSS, Lucide icons, `unstable_cache`

## Global Constraints

- BBC News design language: red accent `#BB1919` / `red-600`, minimal borders, no heavy shadows
- Dark sections use `bg-[#1a1a2e]`, light sections use `bg-background` or `bg-muted/50`
- Feature cards: `p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/50 transition-all duration-300` (dark), or `border border-border rounded-xl p-6 hover:border-red-600/50 transition-all` (light)
- Section headers: `border-l-4 border-red-600 pl-3`
- No hardcoded state-specific content on the root home page after this change (hero CTAs pointing to `/tamil-nadu/` are explicitly allowed as a temporary measure per spec)
- Cache keys must be per-state: `dashboard-data-${stateCode}`
- All new props must be typed — no `any` in new code

---

## File Map

| File | Change |
|---|---|
| `src/app/(frontend)/(home)/page.tsx` | Import `getAllStates`, pass `states` to client |
| `src/app/(frontend)/(home)/HomePageClient.tsx` | Add Browse by State section; remove TN-specific sections; fix feature card links |
| `src/app/(frontend)/[stateSlug]/dashboard/page.tsx` | Add election snapshot query; pass `blocs`, `snapshot`, `lastElectionYear`, `partyColors` to client |
| `src/app/(frontend)/[stateSlug]/dashboard/DashboardClient.tsx` | Add Bloc Cards, Election Snapshot, What You Can Explore grid; move search to bottom |

---

## Task 1: Home Page — Browse by State + Remove TN Sections

**Files:**
- Modify: `src/app/(frontend)/(home)/page.tsx`
- Modify: `src/app/(frontend)/(home)/HomePageClient.tsx`

**Interfaces:**
- Produces: `HomePageClient` accepts new `states: StateInfo[]` prop
- `StateInfo = { code: string; slug: string; name: string; assemblyCount: number; districtCount: number; historyStartYear: number; electionYears: number[]; majorParties: string[]; partyColors: Record<string, string> }`

---

- [ ] **Step 1: Add `states` prop to `HomePageClient` and update `page.tsx`**

In `src/app/(frontend)/(home)/page.tsx`, import `getAllStates` and pass states to the client:

```typescript
import { getPayload } from 'payload'
import config from '@payload-config'
import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { HomePageClient } from './HomePageClient'
import { getAllStates } from '@/config/states'
import { getServerSideURL } from '@/utilities/getURL'
import { DataCatalogJsonLd } from '@/components/seo/JsonLd'

const baseUrl = getServerSideURL()

export const metadata: Metadata = {
  title: 'IndiaStats.org - India Election Data & Statistics',
  description: `Explore India's assembly constituencies — election history, voter data, booth statistics, and political analysis across Tamil Nadu, Uttar Pradesh, and more.`,
  keywords: [
    'India elections',
    'assembly constituency',
    'voter data',
    'MLA history',
    'election statistics',
    'Tamil Nadu elections',
    'Uttar Pradesh elections',
  ],
  alternates: { canonical: baseUrl },
  openGraph: {
    title: "IndiaStats.org - India's Most Comprehensive Election Data Platform",
    description: 'Explore detailed election history, constituency demographics, and voting patterns across Indian assembly constituencies.',
    type: 'website',
    url: baseUrl,
    images: [{ url: `${baseUrl}/indiastats-logo-1024.png`, width: 1024, height: 1024, alt: 'IndiaStats.org' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IndiaStats.org - India Election Data',
    description: 'Comprehensive election data for assembly constituencies across India.',
    images: [`${baseUrl}/indiastats-logo-1024.png`],
  },
}

async function _getHomePageData() {
  const payload = await getPayload({ config })
  const [assembliesCount, districtsCount, boothsCount, assembliesData] = await Promise.all([
    payload.count({ collection: 'assemblies' }),
    payload.count({ collection: 'districts' }),
    payload.count({ collection: 'booths' }),
    payload.find({ collection: 'assemblies', limit: 1000 }),
  ])
  let totalVoters = 0
  assembliesData.docs.forEach((assembly: any) => {
    if (assembly.voters?.total) totalVoters += Number(assembly.voters.total)
  })
  return {
    stats: {
      totalDistricts: districtsCount.totalDocs,
      totalAssemblies: assembliesCount.totalDocs,
      totalBooths: boothsCount.totalDocs,
      totalVoters,
    },
  }
}

const getHomePageData = unstable_cache(_getHomePageData, ['home-page-data'], {
  tags: ['home', 'assemblies'],
  revalidate: 86400,
})

export default async function HomePage() {
  const { stats } = await getHomePageData()
  const states = getAllStates()
  return (
    <>
      <DataCatalogJsonLd totalAssemblies={stats.totalAssemblies} totalBooths={stats.totalBooths} />
      <HomePageClient stats={stats} states={states} />
    </>
  )
}
```

- [ ] **Step 2: Update `HomePageClient` props interface and add import for `StateConfig`**

At the top of `src/app/(frontend)/(home)/HomePageClient.tsx`, update the props interface and add import:

```typescript
import type { StateConfig } from '@/config/states/types'

interface HomePageClientProps {
  stats: {
    totalDistricts: number
    totalAssemblies: number
    totalBooths: number
    totalVoters: number
  }
  states: StateConfig[]
}
```

Update the function signature:
```typescript
export function HomePageClient({ stats, states }: HomePageClientProps) {
```

- [ ] **Step 3: Change "Tamil Nadu at a Glance" heading to "India at a Glance"**

Find and replace in `HomePageClient.tsx` (around line 210):

Old:
```tsx
<h3 className="text-white/50 text-sm uppercase tracking-wider mb-6 text-center">
  Tamil Nadu at a Glance
</h3>
```

New:
```tsx
<h3 className="text-white/50 text-sm uppercase tracking-wider mb-6 text-center">
  India at a Glance
</h3>
```

- [ ] **Step 4: Add Browse by State section after the hero section**

Insert the following section after the closing `</section>` of the hero (after the `</section>` around line 221, before the Election Analysis section):

```tsx
{/* Browse by State */}
<section className="bg-[#0f0f1a] py-14 border-b border-white/5">
  <div className="container">
    <div className="text-center mb-10">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Browse by State</h2>
      <p className="text-white/50 text-sm">Choose a state to explore its election data</p>
    </div>
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {states.map((state) => {
        const lastYear = [...state.electionYears].reverse().find(y => y <= new Date().getFullYear()) ?? state.electionYears[state.electionYears.length - 1]
        const nextYear = state.electionYears.find(y => y > new Date().getFullYear())
        const topParties = state.majorParties.slice(0, 4)
        return (
          <Link
            key={state.code}
            href={`/${state.slug}/dashboard`}
            className="group"
            onClick={() => {
              const pageContext = getPageContext()
              trackClicked({
                name: 'link',
                page_name: pageContext.page_name || 'Homepage',
                link_name: `state_card_${state.code.toLowerCase()}`,
                link_location: 'browse_by_state',
              })
            }}
          >
            <div className="h-full p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/50 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                    {state.name}
                  </h3>
                  <p className="text-white/40 text-xs mt-1">Data from {state.historyStartYear}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-white/30 group-hover:text-red-400 transition-colors mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">{state.assemblyCount}</div>
                  <div className="text-white/40 text-xs uppercase tracking-wide mt-1">Seats</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">{state.districtCount}</div>
                  <div className="text-white/40 text-xs uppercase tracking-wide mt-1">Districts</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {topParties.map((party) => (
                    <div
                      key={party}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ backgroundColor: state.partyColors[party] ?? '#666' }}
                      title={party}
                    >
                      {party.slice(0, 2)}
                    </div>
                  ))}
                </div>
                {nextYear && (
                  <span className="text-xs text-yellow-400/80 font-medium">Next: {nextYear}</span>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  </div>
</section>
```

- [ ] **Step 5: Remove TN-specific sections**

Delete the following complete sections from `HomePageClient.tsx`:

1. **Tamil Nadu Highlight** section (~lines 697–765): The entire `<section className="bg-muted/50 py-16">` block containing the TN Card with "Tamil Nadu Election Data" heading.

2. **TVK 2026 Results Highlight** section (~lines 767–871): The entire `<section className="bg-[#1a1a2e] py-16">` block containing hardcoded TVK/DMK/AIADMK seat counts.

3. **"More states in development"** Coming Soon section (~lines 873–895): The entire `<section className="container py-16">` block with the coming soon state pills.

- [ ] **Step 6: Update "What is IndiaStats.org?" About section paragraph**

Replace the TN-specific paragraph (around line 648–656):

Old:
```tsx
<p>
  The platform currently covers all{' '}
  <strong className="text-foreground">{stats.totalAssemblies} assembly constituencies in Tamil Nadu</strong>
  , with detailed records spanning elections from 1967 to 2021. Each constituency page
  shows vote counts, winning margins, candidate lists, voter turnout, and demographic
  breakdowns — all sourced from official Election Commission of India data.
</p>
```

New:
```tsx
<p>
  The platform currently covers{' '}
  <strong className="text-foreground">{stats.totalAssemblies} assembly constituencies across Tamil Nadu and Uttar Pradesh</strong>
  , with detailed records spanning decades of election history. Each constituency page
  shows vote counts, winning margins, candidate lists, voter turnout, and demographic
  breakdowns — all sourced from official Election Commission of India data.
</p>
```

Also update the inline stat card (~line 661):

Old:
```tsx
<p className="text-sm text-muted-foreground">
  {`Historical data from 1967 to 2021 across all ${stats.totalAssemblies} Tamil Nadu constituencies`}
</p>
```

New:
```tsx
<p className="text-sm text-muted-foreground">
  Historical data across {stats.totalAssemblies} constituencies in Tamil Nadu and Uttar Pradesh
</p>
```

Also update the TN-specific paragraph (~line 679–684):

Old (entire paragraph):
```tsx
<p>
  Tamil Nadu's political landscape is one of the most studied in India. Since 1967, the
  state has been governed exclusively by Dravidian parties — first the DMK under M.
  Karunanidhi, then the AIADMK under M. G. Ramachandran and J. Jayalalithaa, and back to
  the DMK under M. K. Stalin in 2021. IndiaStats.org lets you trace this 50-year story
  ward by ward, district by district, election by election.
</p>
```

New:
```tsx
<p>
  India's state assembly elections tell the story of its democracy — caste arithmetic, 
  alliance shifts, anti-incumbency waves, and emergence of new political forces. 
  IndiaStats.org lets you trace these stories ward by ward, district by district, 
  election by election — across Tamil Nadu's Dravidian politics and Uttar Pradesh's 
  BJP-SP-BSP triangle, with more states coming soon.
</p>
```

- [ ] **Step 7: Verify dev server renders correctly**

```bash
pnpm dev
```

Open `http://localhost:3010` and verify:
- Hero shows "India at a Glance" (not "Tamil Nadu at a Glance")
- Browse by State section shows two cards: Tamil Nadu and Uttar Pradesh
- TN card: 234 seats, 38 districts, top parties as colored dots
- UP card: 403 seats, 75 districts, top parties as colored dots
- No "Tamil Nadu Highlight" card section visible
- No "TVK 2026 Results" section visible
- No "More states in development" pills visible

- [ ] **Step 8: Commit**

```bash
git add src/app/\(frontend\)/\(home\)/page.tsx src/app/\(frontend\)/\(home\)/HomePageClient.tsx
git commit -m "feat(home): add Browse by State section, remove TN-specific sections"
```

---

## Task 2: Dashboard — Blocs, Election Snapshot, What You Can Explore

**Files:**
- Modify: `src/app/(frontend)/[stateSlug]/dashboard/page.tsx`
- Modify: `src/app/(frontend)/[stateSlug]/dashboard/DashboardClient.tsx`

**Interfaces:**
- Consumes: `stateConfig.blocs: BlocConfig[]`, `stateConfig.partyColors`, `stateConfig.electionYears`
- Produces: `DashboardClient` accepts additional props:
  ```typescript
  blocs: BlocConfig[]
  partyColors: Record<string, string>
  snapshot: { year: number; results: { name: string; seats: number; color: string }[] } | null
  lastElectionYear: number
  ```

---

- [ ] **Step 1: Add election snapshot computation to `dashboard/page.tsx`**

Replace the entire `_getDashboardData` function and `DashboardPage` in `src/app/(frontend)/[stateSlug]/dashboard/page.tsx`:

```typescript
import { getPayload } from 'payload'
import config from '@payload-config'
import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { Map, MapPinned, Locate, UsersRound } from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { DashboardClient } from './DashboardClient'
import { getStateBySlug } from '@/config/states'
import { getServerSideURL } from '@/utilities/getURL'
import { JsonLd } from '@/components/seo/JsonLd'
import type { BlocConfig } from '@/config/states/types'

// generateMetadata unchanged — keep existing implementation

interface SnapshotResult {
  year: number
  results: { name: string; seats: number; color: string }[]
}

async function computeElectionSnapshot(
  stateCode: string,
  blocs: BlocConfig[],
  partyColors: Record<string, string>,
): Promise<SnapshotResult | null> {
  const payload = await getPayload({ config })

  // Find most recent year with data
  const latestRecord = await payload.find({
    collection: 'election-history',
    where: { stateCode: { equals: stateCode } },
    sort: '-electionYear',
    limit: 1,
    pagination: false,
  })
  if (!latestRecord.docs.length) return null
  const lastYear = latestRecord.docs[0].electionYear as number

  // Get all results for that year
  const allResults = await payload.find({
    collection: 'election-history',
    where: {
      stateCode: { equals: stateCode },
      electionYear: { equals: lastYear },
    },
    limit: 10000,
    pagination: false,
  })

  // Find winner per assembly (highest votes)
  const winnerByAssembly = new Map<string, { party: string; votes: number }>()
  for (const record of allResults.docs) {
    const assemblyId = record.assemblyId as string
    const votes = Number(record.candidateVotes) || 0
    const current = winnerByAssembly.get(assemblyId)
    if (!current || votes > current.votes) {
      winnerByAssembly.set(assemblyId, { party: record.candidateParty as string, votes })
    }
  }

  // Count seats per party
  const seatsByParty = new Map<string, number>()
  for (const { party } of winnerByAssembly.values()) {
    seatsByParty.set(party, (seatsByParty.get(party) ?? 0) + 1)
  }

  // Roll up into blocs
  const seatsByBloc = new Map<string, { seats: number; color: string }>()
  for (const [party, seats] of seatsByParty) {
    let matched = false
    for (const bloc of blocs) {
      if (bloc.parties.includes(party)) {
        const existing = seatsByBloc.get(bloc.name)
        seatsByBloc.set(bloc.name, {
          seats: (existing?.seats ?? 0) + seats,
          color: bloc.color,
        })
        matched = true
        break
      }
    }
    if (!matched) {
      const existing = seatsByBloc.get('Others')
      seatsByBloc.set('Others', {
        seats: (existing?.seats ?? 0) + seats,
        color: partyColors['IND'] ?? '#888888',
      })
    }
  }

  const results = [...seatsByBloc.entries()]
    .map(([name, { seats, color }]) => ({ name, seats, color }))
    .sort((a, b) => b.seats - a.seats)

  return { year: lastYear, results }
}

async function _getDashboardData(stateCode: string) {
  const payload = await getPayload({ config })
  const stateFilter = { where: { stateCode: { equals: stateCode } } }

  const [assembliesCount, districtsCount, boothsCount, assembliesData, districtsData] =
    await Promise.all([
      payload.count({ collection: 'assemblies', ...stateFilter }),
      payload.count({ collection: 'districts', ...stateFilter }),
      payload.count({ collection: 'booths', ...stateFilter }),
      payload.find({ collection: 'assemblies', limit: 1000, ...stateFilter }),
      payload.find({ collection: 'districts', limit: 100, ...stateFilter }),
    ])

  let totalVoters = 0
  assembliesData.docs.forEach((assembly: any) => {
    if (assembly.voters?.total) totalVoters += Number(assembly.voters.total)
  })

  const districtNameToIdMap: Record<string, string> = {}
  const districtNameToSlugMap: Record<string, string> = {}
  districtsData.docs.forEach((d: any) => {
    districtNameToIdMap[d.districtName] = d.districtId
    districtNameToSlugMap[d.districtName] = d.slug || d.districtId
  })

  const assemblies = assembliesData.docs.map((a: any) => ({
    assemblyId: a.assemblyId,
    assemblySlug: a.slug || a.assemblyId,
    districtId: districtNameToIdMap[a.districtName] || '',
    districtSlug: districtNameToSlugMap[a.districtName] || districtNameToIdMap[a.districtName] || '',
    districtName: a.districtName,
    name: a.name,
    voters: a.voters
      ? {
          male: Number(a.voters.male) || 0,
          female: Number(a.voters.female) || 0,
          trans: Number(a.voters.trans) || 0,
          total: Number(a.voters.total) || 0,
        }
      : undefined,
  }))

  const districts = districtsData.docs.map((d: any) => ({
    districtId: d.districtId,
    districtSlug: d.slug || d.districtId,
    districtName: d.districtName,
  }))

  return {
    stats: {
      totalDistricts: districtsCount.totalDocs,
      totalAssemblies: assembliesCount.totalDocs,
      totalBooths: boothsCount.totalDocs,
      totalVoters,
    },
    assemblies,
    districts,
  }
}

const getDashboardData = (stateCode: string) =>
  unstable_cache(() => _getDashboardData(stateCode), [`dashboard-data-${stateCode}`], {
    tags: ['dashboard', 'assemblies', 'districts'],
    revalidate: 86400,
  })()

interface Props {
  params: Promise<{ stateSlug: string }>
}

export default async function DashboardPage({ params }: Props) {
  const { stateSlug } = await params
  const stateConfig = getStateBySlug(stateSlug)
  const stateName = stateConfig?.name ?? stateSlug
  const stateCode = stateConfig?.code ?? stateSlug.toUpperCase()

  const { stats, assemblies, districts } = await getDashboardData(stateCode)

  // Compute election snapshot (cached inline with getDashboardData reuse)
  const snapshot = stateConfig
    ? await unstable_cache(
        () => computeElectionSnapshot(stateCode, stateConfig.blocs, stateConfig.partyColors),
        [`election-snapshot-${stateCode}`],
        { tags: ['election-history', stateCode], revalidate: 86400 },
      )()
    : null

  // Last election year ≤ current year
  const currentYear = new Date().getFullYear()
  const lastElectionYear =
    stateConfig?.electionYears.filter((y) => y <= currentYear).at(-1) ??
    new Date().getFullYear()

  return (
    <div className="container py-8">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `${stateName} Election Data — IndiaStats.org`,
        description: `${stats.totalAssemblies} assembly constituencies, ${stats.totalDistricts} districts, ${stats.totalBooths.toLocaleString()}+ polling booths. Complete ${stateName} election statistics.`,
        url: `${getServerSideURL()}/${stateSlug}/dashboard`,
        about: {
          '@type': 'AdministrativeArea',
          name: stateName,
          containedInPlace: { '@type': 'Country', name: 'India' },
        },
        isPartOf: { '@type': 'WebSite', name: 'IndiaStats.org', url: 'https://indiastats.org' },
      }} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{stateName} Election Data</h1>
        <p className="text-muted-foreground">
          {stats.totalAssemblies} assembly constituencies · {stats.totalDistricts} districts · {stats.totalBooths.toLocaleString()} polling booths
        </p>
      </div>

      {/* Statistics Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Statistics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Districts" value={stats.totalDistricts} icon={<Map className="h-4 w-4" />} description={`${stats.totalDistricts} districts`} />
          <StatCard title="Assemblies" value={stats.totalAssemblies} icon={<MapPinned className="h-4 w-4" />} description={`${stats.totalAssemblies} assembly constituencies`} />
          <StatCard title="Booths" value={stats.totalBooths} icon={<Locate className="h-4 w-4" />} description={`${stats.totalBooths} polling booths`} />
          <StatCard title="Voters" value={stats.totalVoters} icon={<UsersRound className="h-4 w-4" />} description={`${stats.totalVoters.toLocaleString()} registered voters`} />
        </div>
      </section>

      {/* Blocs + Snapshot + Explore + Search — Client Component */}
      <DashboardClient
        assemblies={assemblies}
        districts={districts}
        stateSlug={stateSlug}
        blocs={stateConfig?.blocs ?? []}
        partyColors={stateConfig?.partyColors ?? {}}
        snapshot={snapshot}
        lastElectionYear={lastElectionYear}
      />
    </div>
  )
}
```

- [ ] **Step 2: Rewrite `DashboardClient.tsx` with new sections**

Replace the entire contents of `src/app/(frontend)/[stateSlug]/dashboard/DashboardClient.tsx`:

```typescript
'use client'
import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Map,
  MapPinned,
  BarChart3,
  Users,
  Vote,
  Download,
  TrendingUp,
  ChevronRight,
} from 'lucide-react'
import { DistrictSearch, District } from '@/components/DistrictSearch'
import { AssemblySearch, Assembly } from '@/components/AssemblySearch'
import { trackViewed, trackClicked, getPageContext, PAGE_NAMES } from '@/analytics'
import type { BlocConfig } from '@/config/states/types'

interface AssemblyData {
  assemblyId: string
  assemblySlug: string
  districtId: string
  districtSlug: string
  districtName: string
  name: string
  voters?: { male?: number; female?: number; trans?: number; total?: number }
}

interface SnapshotResult {
  year: number
  results: { name: string; seats: number; color: string }[]
}

interface DashboardClientProps {
  assemblies: AssemblyData[]
  districts: District[]
  stateSlug: string
  blocs: BlocConfig[]
  partyColors: Record<string, string>
  snapshot: SnapshotResult | null
  lastElectionYear: number
}

const EXPLORE_CARDS = [
  {
    key: 'map',
    title: 'Assembly Map',
    description: 'Interactive colour-coded map of all constituencies',
    icon: <Map className="h-6 w-6 text-red-500" />,
    iconBg: 'bg-red-600/20 group-hover:bg-red-600/30',
    hoverBorder: 'hover:border-red-500/50',
    hoverText: 'group-hover:text-red-400',
    ctaColor: 'text-red-500',
    href: (stateSlug: string, lastYear: number) => `/${stateSlug}/assembly-map`,
    cta: 'Explore',
  },
  {
    key: 'analysis',
    title: 'Election Analysis',
    description: 'Deep dive: vote shares, seat flips, closest races',
    icon: <BarChart3 className="h-6 w-6 text-purple-400" />,
    iconBg: 'bg-purple-600/20 group-hover:bg-purple-600/30',
    hoverBorder: 'hover:border-purple-500/50',
    hoverText: 'group-hover:text-purple-400',
    ctaColor: 'text-purple-400',
    href: (stateSlug: string, lastYear: number) => `/${stateSlug}/election-analysis/${lastYear}`,
    cta: 'Analyse',
  },
  {
    key: 'results',
    title: 'Election Results',
    description: 'Live and final results map by constituency',
    icon: <Vote className="h-6 w-6 text-yellow-400" />,
    iconBg: 'bg-yellow-500/20 group-hover:bg-yellow-500/30',
    hoverBorder: 'hover:border-yellow-500/50',
    hoverText: 'group-hover:text-yellow-400',
    ctaColor: 'text-yellow-400',
    href: (stateSlug: string, lastYear: number) => `/${stateSlug}/election-results`,
    cta: 'View',
  },
  {
    key: 'caste',
    title: 'Caste Demographics',
    description: 'Population breakdown by constituency',
    icon: <Users className="h-6 w-6 text-blue-400" />,
    iconBg: 'bg-blue-600/20 group-hover:bg-blue-600/30',
    hoverBorder: 'hover:border-blue-500/50',
    hoverText: 'group-hover:text-blue-400',
    ctaColor: 'text-blue-400',
    href: (stateSlug: string, lastYear: number) => `/${stateSlug}/caste-demographics`,
    cta: 'Explore',
  },
  {
    key: 'districts',
    title: 'District Explorer',
    description: 'Browse election data by district',
    icon: <MapPinned className="h-6 w-6 text-red-500" />,
    iconBg: 'bg-red-600/20 group-hover:bg-red-600/30',
    hoverBorder: 'hover:border-red-500/50',
    hoverText: 'group-hover:text-red-400',
    ctaColor: 'text-red-500',
    href: (stateSlug: string, lastYear: number) => `/${stateSlug}/dashboard`,
    cta: 'Browse',
  },
  {
    key: 'data',
    title: 'Election Data Table',
    description: 'Filter, sort & export all candidate data',
    icon: <Download className="h-6 w-6 text-green-400" />,
    iconBg: 'bg-green-600/20 group-hover:bg-green-600/30',
    hoverBorder: 'hover:border-green-500/50',
    hoverText: 'group-hover:text-green-400',
    ctaColor: 'text-green-400',
    href: (stateSlug: string, lastYear: number) => `/election-data`,
    cta: 'Download',
  },
]

export function DashboardClient({
  assemblies,
  districts,
  stateSlug,
  blocs,
  partyColors,
  snapshot,
  lastElectionYear,
}: DashboardClientProps) {
  React.useEffect(() => {
    trackViewed({
      name: 'dashboard_page',
      page_name: PAGE_NAMES.DASHBOARD,
      page_type: 'other',
      page_url: window.location.href,
      page_path: window.location.pathname,
    })
  }, [])

  const handleAssemblySearch = (district: District, assembly: Assembly) => {
    console.log('Assembly selected:', { district, assembly })
  }

  return (
    <>
      {/* Bloc Cards */}
      {blocs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">Political Blocs</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {blocs.map((bloc) => (
              <div
                key={bloc.name}
                className="border border-border rounded-xl p-5 flex flex-col gap-3"
                style={{ borderLeftColor: bloc.color, borderLeftWidth: 4 }}
              >
                <div className="flex items-center gap-3">
                  {bloc.leaderImage && (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-border">
                      <Image
                        src={bloc.leaderImage}
                        alt={bloc.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-sm">{bloc.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {bloc.parties.length} {bloc.parties.length === 1 ? 'party' : 'parties'}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {bloc.parties.map((party) => (
                    <span
                      key={party}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: partyColors[party] ?? '#666' }}
                    >
                      {party}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Last Election Snapshot */}
      {snapshot && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            {snapshot.year} Election Results
          </h2>
          <div className="border border-border rounded-xl p-5">
            <div className="flex flex-wrap gap-3 mb-4">
              {snapshot.results.map((r) => (
                <div key={r.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="text-sm font-semibold">{r.name}</span>
                  <span
                    className="text-lg font-black"
                    style={{ color: r.color }}
                  >
                    {r.seats}
                  </span>
                  <span className="text-xs text-muted-foreground">seats</span>
                </div>
              ))}
            </div>
            {/* Visual seat bar */}
            <div className="flex rounded-full overflow-hidden h-3">
              {snapshot.results.map((r) => {
                const total = snapshot.results.reduce((s, x) => s + x.seats, 0)
                return (
                  <div
                    key={r.name}
                    className="h-full transition-all"
                    style={{
                      width: `${(r.seats / total) * 100}%`,
                      backgroundColor: r.color,
                    }}
                    title={`${r.name}: ${r.seats} seats`}
                  />
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* What You Can Explore */}
      <section className="mb-8 bg-[#1a1a2e] rounded-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">What You Can Explore</h2>
          <p className="text-white/50 text-sm">All the tools available for this state</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXPLORE_CARDS.map((card) => (
            <Link
              key={card.key}
              href={card.href(stateSlug, lastElectionYear)}
              className="group"
              onClick={() => {
                const pageContext = getPageContext()
                trackClicked({
                  name: 'link',
                  page_name: pageContext.page_name || 'Dashboard',
                  link_name: `dashboard_explore_${card.key}`,
                  link_location: 'what_you_can_explore',
                })
              }}
            >
              <div className={`h-full p-6 rounded-xl bg-white/5 border border-white/10 ${card.hoverBorder} transition-all duration-300`}>
                <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center mb-4 transition-colors`}>
                  {card.icon}
                </div>
                <h3 className={`text-base font-semibold text-white mb-2 ${card.hoverText} transition-colors`}>
                  {card.title}
                </h3>
                <p className="text-white/50 text-sm mb-4">{card.description}</p>
                <div className={`flex items-center ${card.ctaColor} text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity`}>
                  {card.cta} <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* District Search */}
      <section className="mb-8">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">District Search</h2>
        <DistrictSearch districts={districts} />
      </section>

      {/* Assembly Search */}
      <section className="mb-8">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">Assembly Search</h2>
        <AssemblySearch assemblies={assemblies} districts={districts} onSearch={handleAssemblySearch} />
      </section>
    </>
  )
}
```

- [ ] **Step 3: Verify TN dashboard renders correctly**

```bash
pnpm dev
```

Open `http://localhost:3010/tamil-nadu/dashboard` and verify:
- Stats bar shows TN counts (234 assemblies, 38 districts)
- Bloc Cards section shows DMK Bloc, AIADMK Bloc, TVK with leader images and party badges
- Election Snapshot shows 2021 (or 2026 if seeded) results with seat counts and colored bar
- "What You Can Explore" dark section shows 6 cards: Assembly Map, Election Analysis, Election Results, Caste Demographics, District Explorer, Election Data Table
- District and Assembly search widgets appear at bottom

- [ ] **Step 4: Verify UP dashboard renders correctly**

Open `http://localhost:3010/uttar-pradesh/dashboard` and verify:
- Stats bar shows UP counts (403 assemblies, 75 districts)
- Bloc Cards section shows NDA (yogi image), SP Alliance (akhilesh image), BSP (mayawati image)
- Election Snapshot shows 2022: NDA ~273 seats, SP Alliance ~125, BSP ~1, Others ~4
- "What You Can Explore" shows 6 cards (Election Analysis links to `/uttar-pradesh/election-analysis/2022`)
- Search widgets at bottom

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/\[stateSlug\]/dashboard/page.tsx src/app/\(frontend\)/\[stateSlug\]/dashboard/DashboardClient.tsx
git commit -m "feat(dashboard): add bloc cards, election snapshot, and What You Can Explore grid"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| Browse by State section between hero and features | Task 1 Step 4 |
| State card: name, seats, districts, history range, next election, top parties | Task 1 Step 4 |
| Data source: `getAllStates()` (no DB) | Task 1 Step 1 |
| Remove Tamil Nadu Highlight section | Task 1 Step 5 |
| Remove TVK 2026 Results section | Task 1 Step 5 |
| Remove Coming Soon pills | Task 1 Step 5 |
| Update About section text | Task 1 Step 6 |
| Hero CTA buttons remain pointing to /tamil-nadu/ | Explicitly not changed (per spec) |
| Bloc cards from stateConfig | Task 2 Step 2 |
| Last election snapshot | Task 2 Steps 1–2 |
| What You Can Explore on dashboard | Task 2 Step 2 |
| Search moved to bottom | Task 2 Step 2 |
| Cache key per-state | Task 2 Step 1 (snapshot cache) |
| TN dashboard unaffected | Verified in Task 2 Step 3 |

**Placeholder scan:** No TBDs, no TODOs found.

**Type consistency:** `BlocConfig` imported from `@/config/states/types` in both `page.tsx` and `DashboardClient.tsx`. `SnapshotResult` interface defined in `page.tsx` (server) and re-declared in `DashboardClient.tsx` (client) — both identical. `lastElectionYear: number` passed as prop and consumed correctly.
