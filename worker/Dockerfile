# syntax=docker/dockerfile:1
# Multi-stage: deps → development | (builder → production)

FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY worker/package.json ./worker/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --filter @linkedin-agent/worker... --filter @linkedin-agent/shared...

FROM deps AS development
COPY worker ./worker
COPY packages/shared ./packages/shared
WORKDIR /app
ENV NODE_ENV=development
EXPOSE 4010
CMD ["pnpm", "--filter", "@linkedin-agent/worker", "dev"]

FROM deps AS builder
COPY worker ./worker
COPY packages/shared ./packages/shared
RUN pnpm --filter @linkedin-agent/shared build \
  && pnpm --filter @linkedin-agent/worker build

FROM base AS production
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs workeruser

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY worker/package.json ./worker/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile --prod --filter @linkedin-agent/worker... --filter @linkedin-agent/shared...

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/worker/dist ./worker/dist
COPY --from=builder /app/worker/package.json ./worker/package.json

USER workeruser
WORKDIR /app/worker
EXPOSE 4010
CMD ["node", "dist/index.js"]
