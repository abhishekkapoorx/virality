# syntax=docker/dockerfile:1
# Multi-stage: deps → development | (builder → production)
# Next.js `output: "standalone"` — minimal production image

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY web/package.json ./web/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --filter @linkedin-agent/web... --filter @linkedin-agent/shared...

FROM deps AS development
COPY web ./web
COPY packages/shared ./packages/shared
WORKDIR /app
ENV NODE_ENV=development
# File watching inside Docker (especially bind mounts on Windows/macOS)
ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_USEPOLLING=true
EXPOSE 3000
CMD ["pnpm", "--filter", "@linkedin-agent/web", "dev", "--hostname", "0.0.0.0", "--port", "3000"]

FROM deps AS builder
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
COPY web ./web
COPY packages/shared ./packages/shared
RUN pnpm --filter @linkedin-agent/shared build \
  && pnpm --filter @linkedin-agent/web build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder /app/web/.next/standalone ./
COPY --from=builder /app/web/.next/static ./web/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "web/server.js"]
