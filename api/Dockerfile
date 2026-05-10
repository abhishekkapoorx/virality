FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml ./
COPY api/package.json ./api/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN pnpm install --filter @linkedin-agent/api... --filter @linkedin-agent/shared... --frozen-lockfile=false

COPY api ./api
COPY packages ./packages

EXPOSE 4000

CMD ["pnpm", "--filter", "@linkedin-agent/api", "dev"]
