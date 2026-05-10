FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml ./
COPY worker/package.json ./worker/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN pnpm install --filter @linkedin-agent/worker... --filter @linkedin-agent/shared... --frozen-lockfile=false

COPY worker ./worker
COPY packages ./packages

EXPOSE 4010

CMD ["pnpm", "--filter", "@linkedin-agent/worker", "dev"]
