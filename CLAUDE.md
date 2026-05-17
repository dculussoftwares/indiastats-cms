# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
pnpm dev                # Dev server on http://localhost:3010
pnpm dev:prod           # Clean build + start (local production test)
pnpm build              # Production build (output: standalone for Docker)
pnpm lint               # ESLint
pnpm lint:fix           # ESLint with auto-fix
pnpm generate:types     # Regenerate PayloadCMS types → src/payload-types.ts
pnpm test:int           # Vitest unit/integration tests
pnpm test:e2e           # Playwright end-to-end tests
pnpm test:smoke         # Playwright smoke tests only (fast subset)
pnpm test               # Run both int + e2e
pnpm eci:push           # Scrape ECI website and push live election results to DB
```

Run a single integration test: `pnpm exec vitest run --config ./vitest.config.mts path/to/file.test.ts`

Remotion (video generation):
```bash
pnpm remotion:preview   # Open Remotion studio
pnpm remotion:render    # Render reel video → out/reel.mp4
pnpm remotion:thumbnail # Render thumbnail → out/thumbnail.png
```

## Architecture Overview

**PayloadCMS 3.x + Next.js 15** app serving Tamil Nadu election data (assemblies, districts, booths, election history). Deployed to Azure Container Apps via Terraform.

### Key Architectural Patterns

1. **State-scoped routing**: All election pages live under `[stateSlug]/` (e.g., `/tamil-nadu/assembly/...`). The `[stateSlug]/layout.tsx` validates the slug via `src/config/states/` registry and wraps children in `<StateProvider>`. Currently only Tamil Nadu (`TN`) is registered.

2. **State configuration system** (`src/config/states/`): Each state has a `StateConfig` defining party colors, blocs, leader images, GeoJSON map path, and election years. New states are added by creating a config file and registering it in `src/config/states/index.ts`.

3. **Client/Server page split**: Pages follow the pattern of a server component (`page.tsx`) that fetches data via Payload Local API, passing it to a `*Client.tsx` component for interactivity (e.g., `AssemblyPageClient.tsx`, `HomePageClient.tsx`).

4. **PayloadCMS collections** (`src/collections/`): 16 collections registered in `src/payload.config.ts`. Election data collections (Assemblies, Districts, Booths, ElectionHistory, ElectionPredictions, LiveElectionResults) are read-only public. `LiveElectionResults` also allows bearer-token writes via `CRON_SECRET` for the ECI push script. CMS collections (Pages, Posts, Media) use Payload's admin panel with live preview. Globals: `Header`, `Footer`, `SiteSettings`.

5. **Plugins** (`src/plugins/index.ts`): SEO, redirects, nested docs, form builder, search (Posts only), and Azure Blob Storage (conditional — only active when `AZURE_STORAGE_CONNECTION_STRING` is set).

6. **Analytics** (`src/analytics/`): Standardized event system supporting PostHog, Mixpanel, Clarity, and GA4. Import from `@/analytics`. Uses `events.{namespace}.{action}()` pattern with `setPageContext()` per page. All event/property names are snake_case.

7. **Path alias**: `@/*` maps to `src/*` (tsconfig paths). Payload config accessed via `@payload-config`.

### Frontend Route Structure

```
/                                                    # Landing/redirect
/[stateSlug]/                                        # State home (e.g., /tamil-nadu)
/[stateSlug]/assembly/[districtSlug]/[assemblySlug]  # Assembly detail
/[stateSlug]/assembly/.../booths                     # Booth listing
/[stateSlug]/district/[districtSlug]                 # District detail
/[stateSlug]/assembly-map                            # Interactive map (Leaflet)
/[stateSlug]/caste-demographics                      # Caste census data
/[stateSlug]/dashboard                               # Dashboard view
/[stateSlug]/election-analysis/[year]                # Election analysis by year
/[stateSlug]/election-predictions/[predictorId]      # Predictor-specific predictions
/[stateSlug]/election-results                        # Live/final results map
/election-data                                       # Cross-state election data table
/posts/, /pages/, /search, /privacy-policy           # CMS content
/(x-card)/x-card/[assemblyId]                        # Social share card preview (standalone, no Header/Footer)
```

**URL migration**: The middleware (`src/middleware.ts`) intercepts old ID-based URLs (e.g., `/tamil-nadu/assembly/dt1/ac008`) and 301-redirects to slug-based URLs (`/tamil-nadu/assembly/tiruvallur/ambattur`). Mappings are fetched once from `/api/slug-mappings` and cached in memory.

### Infrastructure

- **Deployment**: Docker (standalone Next.js) → Azure Container App (0.25 CPU, 0.5Gi)
- **IaC**: Terraform in `infra/` with remote state in Azure Blob Storage
- **CI/CD**: GitHub Actions (`terraform-deploy.yml`), plus `x-daily-post.yml` for automated X/Twitter posts
- **Media storage**: Azure Blob Storage (`@payloadcms/storage-azure`)
- **Database**: PostgreSQL (external, via `DATABASE_URI`)

## Database Schema

### Data Relationships
```
Districts (38)
  └── Assemblies (234)
        ├── Booths (~45k)
        ├── ElectionHistory (~15.7k candidate records)
        ├── ElectionPredictions (per candidate per predictor)
        └── LiveElectionResults (counting-day live data, one record per assembly per year)
```

Additional collections: `States`, `Zones`, `Alliances`, `CasteCensus`, `Predictors`

### Key Data Conventions

- **Bilingual names**: Stored as "Tamil / English" (e.g., "சென்னை / CHENNAI")
- **Assembly IDs**: Format `ac001`–`ac234`; District IDs: `dt1`–`dt38`
- **Election history**: One record per candidate per election year. Query by `assemblyId` + `electionYear`, sort by `candidateVotes` DESC to get results.
- **Voters JSON**: Contains `{ male, female, trans, total, isReservedAc }` for SC/ST reserved constituency flag
- **Elected MLAs**: JSON array in assemblies with historical MLA + party data

### API Access

PayloadCMS REST API on all collections:
```
GET /api/assemblies?where[districtName][contains]=Chennai
GET /api/election-history?where[assemblyId][equals]=ac001&where[electionYear][equals]=2021
GET /api/booths?where[assemblyId][equals]=ac001
```

## Live Election Counting Workflow

For counting day (e.g., 2026 election):

```bash
# Before counting day: seed with constituency metadata + electors
pnpm exec tsx scripts/seed-election-results-2026.mts

# On counting day: scrape ECI website (bypasses Akamai WAF via Playwright) + push to DB
pnpm eci:push                   # defaults to current year
pnpm eci:push --year=2026       # explicit year

# For future elections: seed live-election-results collection
pnpm exec tsx scripts/seed-live-election-results.mts --year=2031
```

`LiveElectionResults` writes bypass Payload auth if the request carries `Authorization: Bearer <CRON_SECRET>`.

## Migration Scripts

Data was migrated from Supabase. Source: `AssemblyDataTable`, `AssemblyHistoricDataTable_V4` (V4 only), `BoothDataTable`.

```bash
pnpm exec tsx scripts/migrate-supabase.ts              # Full migration
pnpm exec tsx scripts/migrate-supabase.ts --include-booths  # Include booths (~2h)
pnpm exec tsx scripts/migrate-remaining.ts             # Fill gaps
pnpm exec tsx scripts/verify-migration.ts              # Verify counts
```

Requires `SUPABASE_URL` and `SUPABASE_ANON_KEY` env vars.

## Design Principles — BBC News Style

The frontend follows a **BBC News-inspired design language**: clarity, minimalism, professionalism.

### Core Rules

- **Accent color**: `#BB1919` / `red-600` — used for borders, badges, indicators
- **Section headers**: Always use red left border: `border-l-4 border-red-600 pl-3`
- **Cards**: Minimal borders (`border border-border`), small radius (`rounded`), white bg, no heavy shadows
- **Typography**: Headlines `text-2xl`–`text-3xl font-bold`, labels `uppercase tracking-wide text-xs`
- **Icons**: Default `text-gray-500`; accent contexts use `text-red-600` with `bg-red-50`
- **Charts** (Recharts): Rounded bar tops, horizontal-only grid, no axis lines, circular legends, white tooltip with red header
- **Header**: `sticky top-0 z-50`, red top border (`border-t-4 border-red-600`), white bg with shadow

### Don'ts

- No heavy shadows or gradients on cards
- No colorful icon backgrounds (use gray)
- No large border-radius (keep minimal)
- No neumorphic or glassmorphism effects
