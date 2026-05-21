# syntax=docker/dockerfile:1
# Multi-stage: deps → development | (builder → production)
# Default final stage: production (optimized runtime)

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

# Cached install layer — manifests + Prisma files required by api postinstall
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json ./api/
COPY api/prisma.config.ts ./api/
COPY api/prisma ./api/prisma
COPY packages/shared/package.json ./packages/shared/
# prisma generate does not connect to the DB; env() still needs a value at build time
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/linkedin_agent"
RUN pnpm install --frozen-lockfile --filter @linkedin-agent/api... --filter @linkedin-agent/shared...

# ── Development (compose watch / hot reload) ─────────────────────────────
FROM deps AS development
COPY api ./api
COPY packages/shared ./packages/shared
WORKDIR /app
ENV NODE_ENV=development
EXPOSE 4000
CMD ["pnpm", "--filter", "@linkedin-agent/api", "dev"]

# ── Production build ─────────────────────────────────────────────────────
FROM deps AS builder
COPY api ./api
COPY packages/shared ./packages/shared
RUN pnpm --filter @linkedin-agent/shared build \
  && pnpm --filter @linkedin-agent/api exec prisma generate \
  && pnpm --filter @linkedin-agent/api build

FROM base AS production
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs apiuser

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json ./api/
COPY packages/shared/package.json ./packages/shared/

# Client is generated in builder; skip postinstall on prod-only install
RUN pnpm install --frozen-lockfile --prod --ignore-scripts \
  --filter @linkedin-agent/api... --filter @linkedin-agent/shared...

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/api/dist ./api/dist
COPY --from=builder /app/api/package.json ./api/package.json
COPY --from=builder /app/api/prisma ./api/prisma

COPY --from=builder /app/api/src/generated ./api/src/generated

USER apiuser
WORKDIR /app/api
EXPOSE 4000
CMD ["node", "dist/index.js"]
