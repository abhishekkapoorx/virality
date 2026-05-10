FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml ./
COPY web/package.json ./web/package.json

RUN pnpm install --filter @linkedin-agent/web... --frozen-lockfile=false

COPY web ./web

EXPOSE 3000

CMD ["pnpm", "--filter", "@linkedin-agent/web", "dev"]
