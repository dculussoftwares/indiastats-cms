# India Stats CMS — Copilot Instructions

PayloadCMS 3.x + Next.js 15 app serving Indian election data (currently Tamil Nadu).
See [CLAUDE.md](../CLAUDE.md) for full architecture, DB schema, design system, and migration scripts.

## Build & Test

```bash
pnpm dev          # Dev server → http://localhost:3001  (not 3000)
pnpm build        # Production build (standalone output for Docker)
pnpm lint:fix     # ESLint with auto-fix
pnpm generate:types  # Regenerate src/payload-types.ts after collection changes
pnpm test:int     # Vitest integration tests
pnpm test:e2e     # Playwright e2e tests
```

Single test: `pnpm exec vitest run --config ./vitest.config.mts path/to/file.test.ts`

## Architecture

- **Path alias**: `@/*` → `src/*`. Payload config imported as `@payload-config`.
- **State-scoped routing**: All election pages under `[stateSlug]/` (e.g. `/tamil-nadu/...`). Layout validates slug via `src/config/states/index.ts` and wraps with `<StateProvider>`.
- **Page pattern**: Server component `page.tsx` fetches via Payload Local API → passes data to `*Client.tsx` for interactivity.
- **Collections** (`src/collections/`): 13 total. Election data (Assemblies, Districts, Booths, ElectionHistory) are read-only public. CMS content (Pages, Posts, Media) uses admin panel.
- **Analytics** (`src/analytics/`): Import from `@/analytics`. Use `events.{namespace}.{action}()` and call `setPageContext()` once per page. All event/property names are `snake_case`.

## Key Conventions

- **Bilingual data**: Names stored as `"Tamil / English"` (e.g. `"சென்னை / CHENNAI"`).
- **IDs**: Assembly `ac001`–`ac234`, District `dt1`–`dt38`.
- **Adding a state**: Create `src/config/states/{state-slug}.ts` (follow `tamil-nadu.ts`), register in `src/config/states/index.ts`.
- **After changing collections**: Run `pnpm generate:types` to keep `src/payload-types.ts` in sync.
- **Azure Blob Storage**: Only activates when `AZURE_STORAGE_CONNECTION_STRING` is set (skipped in local dev).

## Design System — BBC News Style

- **Accent**: `#BB1919` / `red-600` for borders, badges, active indicators.
- **Section headers**: `border-l-4 border-red-600 pl-3` — always.
- **Cards**: `border border-border rounded` — no heavy shadows, no gradients.
- **Typography**: Headlines `text-2xl`–`text-3xl font-bold`; labels `uppercase tracking-wide text-xs`.
- **Don'ts**: No colorful icon backgrounds, no large border-radius, no glassmorphism.

## Required Env Vars

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URI` | Yes | PostgreSQL connection string |
| `PAYLOAD_SECRET` | Yes | JWT encryption secret |
| `NEXT_PUBLIC_SERVER_URL` | Yes | No trailing slash |
| `CRON_SECRET` | Yes | Cron job auth |
| `PREVIEW_SECRET` | Yes | Live preview auth |
| `AZURE_STORAGE_CONNECTION_STRING` | Prod only | Media storage |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional | Analytics |
| `NEXT_PUBLIC_GA_ID` | Optional | Google Analytics 4 |

Copy `.env.example` → `.env.local` to get started.
