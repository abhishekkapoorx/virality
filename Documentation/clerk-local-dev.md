# Clerk auth — local development

Browser auth uses [Clerk](https://clerk.com) on the Next.js app (`web/`). The API (`api/`) verifies Clerk session JWTs on `/v1/me/*` and receives **webhooks** on port **4000** (not the Next.js dev server).

## 1. Clerk Dashboard

1. Create an application (or use an existing one).
2. **API keys** — copy publishable + secret keys into env (see below).
3. **Paths** — set sign-in URL `/sign-in`, sign-up `/sign-up` if prompted.
4. **Webhooks** — add endpoint (see ngrok below):
   - URL: `https://<your-ngrok-host>.ngrok-free.app/v1/webhooks/clerk`
   - Signing secret → `CLERK_WEBHOOK_SIGNING_SECRET`
   - Subscribe: `user.created`, `user.updated`, `user.deleted`

## 2. Environment variables

**`web/.env.local`** (from `web/.env.example`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**`api/.env`** (from `api/.env.example`):

```bash
CLERK_SECRET_KEY=sk_test_...          # same secret as web — JWT verification
CLERK_WEBHOOK_SIGNING_SECRET=whsec_... # Clerk → Webhooks → Signing secret (NOT sk_test_…)
# Optional if verification fails behind ngrok (must match Clerk endpoint URL exactly):
# CLERK_WEBHOOK_URL=https://werewolf-refined-urgently.ngrok-free.app/v1/webhooks/clerk
DATABASE_URL=postgresql://...
```

**Docker:** `docker-compose.dev.yml` loads `api/.env` (not `.env.example`). Copy and fill secrets before `pnpm docker:dev`:

```bash
cp api/.env.example api/.env
```

When `CLERK_SECRET_KEY` is **unset**, the API falls back to `DEMO_USER_ID` for `/v1/me/*` (legacy local testing without signing in).

## 3. ngrok for webhooks

Clerk must reach your machine over HTTPS on the **API** (port 4000), not the Next.js app.

### Docker dev stack (recommended)

`docker-compose.dev.yml` includes an **ngrok** service that starts with `pnpm docker:dev`.

1. Copy repo-root env and set your token:

   ```bash
   cp .env.example .env
   # NGROK_AUTHTOKEN=...  (from ngrok dashboard)
   # NGROK_DOMAIN=werewolf-refined-urgently.ngrok-free.app  (your reserved domain)
   ```

2. Start everything:

   ```bash
   pnpm docker:dev
   ```

3. Clerk webhook URL:

   `https://<NGROK_DOMAIN>/v1/webhooks/clerk`  
   Example: `https://werewolf-refined-urgently.ngrok-free.app/v1/webhooks/clerk`

4. Optional: ngrok request inspector at http://localhost:4040

The tunnel targets `api:4000` on the Compose network (equivalent to your `host.docker.internal:80` one-liner, but pointed at this project's API).

### Host-only dev (no Docker)

```bash
pnpm ngrok:webhook
# or: ngrok http --url=werewolf-refined-urgently.ngrok-free.app 4000
```

Keep ngrok running while testing sign-up / user sync. First authenticated API call also **lazy-creates** the internal `User` row if the webhook has not fired yet.

## 4. Run stack

**Docker (includes ngrok):**

```bash
cp .env.example .env   # NGROK_AUTHTOKEN required
pnpm docker:dev
```

**Host processes:**

```bash
pnpm install
cd api && pnpm prisma migrate dev
pnpm dev
# plus ngrok (see §3)
```

- Web: http://localhost:3000 — landing is public; `/workflow` requires sign-in.
- API: http://localhost:4000 — health at `/health`, webhook at `POST /v1/webhooks/clerk`.

## 5. Verify

1. Sign up at http://localhost:3000/sign-up
2. Open http://localhost:3000/workflow — context loads/saves without `userId` in the query string.
3. Clerk Dashboard → Webhooks → recent deliveries should show `200` for user events (with ngrok + signing secret set).

## Routes

| Surface | Auth |
|--------|------|
| `GET/PUT /v1/me/workflow-context` | Clerk JWT |
| `POST /v1/me/drafts/generate` | Clerk JWT |
| `POST /v1/webhooks/clerk` | Clerk signing secret (raw body) |
| `POST /v1/integrations/slack/commands` | Slack signing (later) — not Clerk |

See `Documentation/planned-routes.md` §1.4 for the full route list.
