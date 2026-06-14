# To use this Dockerfile, you have to set `output: 'standalone'` in your next.config.js file.
# From https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

FROM node:22.17.0-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time arguments for Payload CMS
ARG DATABASE_URI
# Direct PostgreSQL URL (bypasses PgBouncer) — used only for schema push during build.
# PgBouncer transaction mode breaks Drizzle advisory locks used during push.
ARG DATABASE_URI_DIRECT
ARG PAYLOAD_SECRET
ARG NEXT_PUBLIC_SERVER_URL

# Build-time arguments for Analytics (NEXT_PUBLIC_* are inlined at build time)
ARG NEXT_PUBLIC_CLARITY_ID
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ARG NEXT_PUBLIC_MIXPANEL_TOKEN
ARG NEXT_PUBLIC_GA_ID
ARG NEXT_PUBLIC_ADSENSE_CLIENT_ID

# Set environment variables for the build
ENV DATABASE_URI=$DATABASE_URI
ENV DATABASE_URI_DIRECT=$DATABASE_URI_DIRECT
ENV PAYLOAD_SECRET=$PAYLOAD_SECRET
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_CLARITY_ID=$NEXT_PUBLIC_CLARITY_ID
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST
ENV NEXT_PUBLIC_MIXPANEL_TOKEN=$NEXT_PUBLIC_MIXPANEL_TOKEN
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID
ENV NEXT_PUBLIC_ADSENSE_CLIENT_ID=$NEXT_PUBLIC_ADSENSE_CLIENT_ID
ENV NEXT_TELEMETRY_DISABLED=1

# Push schema changes to DB before build (new columns must exist for prerender).
# Use DATABASE_URI_DIRECT (direct PostgreSQL) — not PgBouncer — so Drizzle advisory locks work.
RUN corepack enable pnpm && DATABASE_URI=${DATABASE_URI_DIRECT:-$DATABASE_URI} pnpm exec tsx scripts/push-db-schema.ts || true

# Regenerate Payload import map so all plugin components (e.g. AzureClientUploadHandler)
# are included regardless of which env vars are set at build time.
# Uses placeholder Azure creds — real creds are injected at runtime via Container App secrets.
RUN export AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=placeholder;AccountKey=cGxhY2Vob2xkZXI=;EndpointSuffix=core.windows.net" && \
    export AZURE_STORAGE_ACCOUNT_BASEURL="https://placeholder.blob.core.windows.net/" && \
    corepack enable pnpm && pnpm generate:importmap

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Remove this line if you do not have this folder
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
