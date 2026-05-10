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

## Validation scripts

- Lint all packages: `pnpm lint`
- Typecheck all packages: `pnpm typecheck`
- Run smoke tests: `pnpm test`

## Docker

- Start full stack: `pnpm docker:up`
- Stop and remove volumes: `pnpm docker:down`

## Environment notes

- Root `.env.example` defines Docker compose defaults and local `DATABASE_URL` / `REDIS_URL`.
- `api/.env.example` and `worker/.env.example` use local Postgres/Redis defaults.
- `web/.env.example` only requires `NEXT_PUBLIC_API_URL`.

## Notes

- API health endpoint: `http://localhost:4000/health`
- Web app: `http://localhost:3000`
- CI workflow runs lint + typecheck + test on pushes/PRs: `.github/workflows/ci.yml`
