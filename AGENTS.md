# AGENTS.md

High-signal operating notes for AI agents working in this repo. Verify against
executable config (package.json, tsconfig.json, next.config.js) when in doubt.

## Commands

```bash
pnpm dev                 # Dev server on http://localhost:3010 (NOT 3000)
pnpm build               # Production build (output: 'standalone' for Docker)
pnpm lint                # next lint
pnpm lint:fix            # ESLint with auto-fix
pnpm generate:types      # Regenerate src/payload-types.ts after collection changes
pnpm generate:importmap  # Regenerate Payload admin import map (after adding plugin/admin components)
pnpm test:int            # Vitest (jsdom) — tests/int/**/*.int.spec.ts
pnpm test:e2e            # Playwright — tests/e2e/**/*.e2e.spec.ts
pnpm test:smoke          # Playwright smoke subset only
pnpm eci:push            # Scrape ECI + write live results directly to PostgreSQL
```

Run a single test:
```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/api.int.spec.ts
pnpm exec playwright test tests/e2e/smoke.spec.ts
```

## Verification gotchas

- **No `typecheck` script.** Type-check via `pnpm exec tsc --noEmit`, or rely on `pnpm build` (which runs `tsc`). `next build` is the real type gate.
- **`next build` ignores ESLint** (`eslint.ignoreDuringBuilds: true` in next.config.js). Lint is a separate, manual step — don't assume a green build means clean lint.
- ESLint rules `@typescript-eslint/no-explicit-any`, `no-empty-object-type`, `ban-ts-comment` are **warnings**, not errors. Unused vars must be prefixed `_`.
- **Port mismatch:** `pnpm dev` serves on **3010**, but `playwright.config.ts` `webServer`/`baseURL` target **3000**. Reconcile (run a server on 3000, or set `BASE_URL`) before `pnpm test:e2e` locally. README says 3000 and `.github/copilot-instructions.md` says 3001 — both stale.
- Integration tests (`tests/int/`) use jsdom; only 3 test files exist today (`tests/int/api.int.spec.ts`, `tests/e2e/frontend.e2e.spec.ts`, `tests/e2e/smoke.spec.ts`).

## Code style

- Prettier: **no semicolons**, single quotes, trailing commas all, print width 100 (`.prettierrc.json`). Don't add semicolons.
- Path aliases (tsconfig): `@/*` → `src/*`; `@payload-config` → `src/payload.config.ts`.
- webpack `extensionAlias` (next.config.js) resolves `.js` imports to `.ts/.tsx` — you may see imports written as `foo.js` that are actually TS files.

## Architecture essentials

- **PayloadCMS 3.x + Next.js 15** (App Router), PostgreSQL, Azure Blob Storage. React 19.
- **State-scoped routing:** all election pages live under `[stateSlug]/` (e.g. `/tamil-nadu/...`). `src/app/[stateSlug]/layout.tsx` validates the slug via `src/config/states/index.ts` and wraps children in `<StateProvider>`.
- **Registered states: Tamil Nadu (TN) and Uttar Pradesh (UP)** — both in `src/config/states/index.ts`. (CLAUDE.md says "only TN" — stale.) To add a state: create `src/config/states/{slug}.ts` modeled on `tamil-nadu.ts`, register in `index.ts`.
- **Page pattern:** server `page.tsx` fetches via Payload Local API → passes data to a `*Client.tsx` client component for interactivity.
- **16 collections** in `src/payload.config.ts`. Election data (Assemblies, Districts, Booths, ElectionHistory, ElectionPredictions, LiveElectionResults) is read-only public; `LiveElectionResults` accepts bearer-token writes via `CRON_SECRET`. CMS content (Pages, Posts, Media) uses the admin panel. Globals: Header, Footer, SiteSettings.
- **Analytics:** import from `@/analytics`; use `events.{namespace}.{action}()` and call `setPageContext()` once per page. All event/property names are `snake_case`. See `ANALYTICS_EVENTS.md`.
- **Middleware** (`src/middleware.ts`) 301-redirects old ID-based URLs to slug-based URLs via `/api/slug-mappings` (cached in memory).

## Payload / DB gotchas

- **After changing collections**, run `pnpm generate:types` (regenerates `src/payload-types.ts`). If you add admin/plugin components, also run `pnpm generate:importmap`.
- **Schema push is env-gated and PgBouncer-fragile.** `push` is disabled unless `PAYLOAD_SCHEMA_PUSH=true` (src/payload.config.ts). Drizzle advisory locks used during push are session-scoped and **break under PgBouncer transaction mode** — push must use a **direct** PostgreSQL URL, not PgBouncer. In CI this is `scripts/push-db-schema.ts` (run in both the `migrate-schema` workflow job and the Dockerfile build step) with `DATABASE_URI` = direct URL. Never enable push locally against a PgBouncer pool.
- DB pool `max: 2` (PgBouncer handles real pooling).
- **Azure Blob Storage** plugin only activates when `AZURE_STORAGE_CONNECTION_STRING` is set — skipped in local dev. The Dockerfile regenerates the import map with placeholder Azure creds so plugin components are bundled regardless of build-time env.

## Scripts

- `scripts/` holds one-off `tsx` scripts and is **excluded from tsconfig** (along with `functions/` and `cf-worker/`).
- **The migration scripts referenced in CLAUDE.md (`migrate-supabase.ts`, `migrate-remaining.ts`, `verify-migration.ts`, `seed-live-election-results.mts`, `seed-election-results-2026.mts`) no longer exist.** Don't reference them. Current scripts: `eci-push.mts`, `push-db-schema.ts`, `seed-up-data.mts`, `seed-up-election-history.mts`, `import-election-predictions.mts`, `seed-blog-posts.mts`, `generate-routing-map.ts`.
- `pnpm eci:push` (`scripts/eci-push.mts`) scrapes ECI via Playwright (bypasses Akamai WAF) and writes results **directly to PostgreSQL**, not via the Payload API. Requires `pnpm exec playwright install chromium` and `DATABASE_URI`.

## Repo boundaries

- `src/` — the app (the only tree covered by tsconfig `include`).
- `infra/` — Terraform (Azure Container Apps). Remote state in Azure Blob Storage.
- `cf-worker/`, `functions/` — separate auxiliary packages with own tooling, excluded from the app's tsconfig.
- Root scratch/research dirs (`up/`, `thanthi/`, `prdiction/`, `prediction2/`, `google crewall/`, `indiastats-org-audit/`) are not part of the build.

## Deploy

- Push to `main` (path-filtered on `src/**`, `infra/**`, `Dockerfile`, config files) triggers `.github/workflows/terraform-deploy.yml`: build Docker image → push to GHCR → run `push-db-schema.ts` against the direct DB → `terraform apply`. Production: **indiastats.org** on Azure Container Apps.
- The `smoke-test` workflow job is disabled (`if: false`). `x-daily-post.yml.disabled` is also disabled.
- `output: 'standalone'` in next.config.js is required for the Docker image — don't remove it.

## Data conventions

- Bilingual names stored as `"Tamil / English"` (e.g. `"சென்னை / CHENNAI"`).
- Tamil Nadu IDs: assemblies `ac001`–`ac234`, districts `dt1`–`dt38`.
- **Public repo — never commit secrets.** All credentials come from env (`DATABASE_URI`, `PAYLOAD_SECRET`, `CRON_SECRET`, `PREVIEW_SECRET`, Azure storage). Copy `.env.example` → `.env.local`.

## Design system — BBC News style

- Accent: `#BB1919` / `red-600` for borders, badges, active indicators.
- Section headers: always `border-l-4 border-red-600 pl-3`.
- Cards: `border border-border rounded`, white bg — no heavy shadows, no gradients, no large radius, no glassmorphism.
- Icons default `text-gray-500`; accent contexts use `text-red-600` with `bg-red-50`.

## Existing instruction files

- `CLAUDE.md` — full architecture, DB schema, route tree, live-election workflow. Mostly accurate but **stale on**: registered states (says TN-only), migration scripts (removed), and the dev port. Trust this AGENTS.md where they conflict.
- `.github/copilot-instructions.md` — stale on dev port (says 3001) and collection count (says 13, actual 16).
