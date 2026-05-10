# LinkedIn Agent (MVP Bootstrap)

Monorepo initialized from architecture plan with:

- `web`: Next.js + Tailwind
- `api`: Express + Zod + Prisma
- `worker`: BullMQ-ready worker process
- `packages/shared`: shared types/constants
- `docker-compose.yml`: Postgres + Redis + app services

## Quick start

1. Install dependencies:
   - `pnpm install`
2. Copy env examples as needed:
   - `cp .env.example .env` (or create manually on Windows)
3. Run locally:
   - `pnpm dev`

## Docker

- Start full stack: `pnpm docker:up`
- Stop and remove volumes: `pnpm docker:down`

## Notes

- API health endpoint: `http://localhost:4000/health`
- Web app: `http://localhost:3000`
