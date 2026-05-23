# Feature plan 1 (scratch pad)

Last updated: 2026-05-23 (Telegram webhook slice)

Informal **build order** for developing the product one slice at a time. Reorder if pilot feedback says otherwise. Cross-check with [ARCHITECTURE.md](./ARCHITECTURE.md) and [planned-routes.md](./planned-routes.md).

**Rule of thumb:** each step should be shippable or demoable on its own (migrations forward-only, feature flags ok).

---

## Phase 0 — Repo and environments

Status: completed (2026-05-10)

1. **Monorepo wiring** — `pnpm` workspaces, root scripts, `docker-compose` for Postgres + Redis; document `DATABASE_URL`, `REDIS_URL` in each package’s `.env.example`. ✅
2. **CI smoke** — lint + typecheck + test (even if empty) on PR for `api`, `web`, `worker`, `packages/shared`. ✅

*Exit:* clean `pnpm install` and `docker compose up` for local dev. ✅ (`pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test` verified)

---

## Priority pivot (2026-05-10)

Requested change: prioritize **landing page + post generation workflow** before deeper platform buildout.

### New near-term execution order

1. **Landing page + workflow UX first**
   - Build `/` as product story and CTA. **Shipped (2026-05-21):** hero, interactive flow demo, six core-feature bento, dedicated **`#schedule` cron section** (web + `/set-repeat` + worker path), waitlist. See [feature-landing-page.md](./feature-landing-page.md).
   - Build `/workflow` UI to configure:
     - user writing style (per user, DB-backed)
     - weekly calendar (per user, DB-backed)
     - carousel design language (per user, DB-backed)
     - cron schedule (`/set-repeat` compatible expression)
   - Add minimal settings routes for **Telegram** (link bot) and profile preferences.

2. **Post generation workflow foundation**
   - Inputs to generation: writing style + weekly calendar + optional update request.
   - Output: post draft + generated carousel artifact.
   - Delivery targets: **Telegram** + website.
   - Keep LLM and image generation as adapter-friendly stubs first, then replace with real providers.

3. **Scheduling first-class path**
   - Add per-user cron configuration in data model.
   - Trigger workflow via:
     - website preference update
     - Telegram bot command (`/set_repeat <cron>`) or web-only until bot commands ship
     - internal scheduled trigger endpoint / worker.

4. **Then resume remaining platform phases**
   - Continue with Clerk + full DB models + connector hardening + history.
   - Keep original phase list below as backlog reference and reorder during implementation.

---

## Phase 1 — Data model and Prisma

3. **Extend Prisma schema** toward ARCHITECTURE §8: `Connector`, `Conversation`, `InstructionProfile`, `InstructionProfileVersion`, `Draft`, `WorkflowState` (or enum + fields on `Draft`/`Conversation` — pick one representation), `AuditEvent`. Add `clerkUserId` (unique) on `User` and keep `email` in sync.
4. **Migrations + seed** — one dev tenant, one user (optional), default instruction profile + version for tests.

*Exit:* `prisma migrate dev` works; seed creates a usable baseline.

---

## Phase 2 — API skeleton and observability

5. **Express structure** — router modules (`health`, `webhooks`, `me`, `integrations/telegram`) matching [planned-routes](./planned-routes.md); centralized error handler; request logging with **correlation id** (ARCHITECTURE §10).
6. **Readiness** — `GET /health/ready` checks DB + Redis when vars present.
7. **Remove or isolate stub** — `POST /v1/inbound` behind a flag or delete once Telegram path exists. Legacy `/v1/integrations/slack/commands` is not MVP.

*Exit:* API starts in Docker; readiness reflects backing services.

---

## Phase 3 — Clerk (web identity → internal user) — **in progress (MVP shipped)**

8. **Clerk on Next.js** — ✅ `@clerk/nextjs`, env vars, `/sign-in`, `/sign-up`, `middleware.ts` protecting `/workflow` (onboarding/settings/activity when added).
9. **Clerk → DB user** — ✅ Webhook `POST /v1/webhooks/clerk` + lazy create on first `/v1/me/*` call; `User.clerkUserId`. Local webhooks: ngrok → API :4000 (`Documentation/clerk-local-dev.md`).
10. **API JWT middleware** — ✅ `clerkAuthMiddleware` on `/v1/me/*`; dev fallback if `CLERK_SECRET_KEY` unset.

*Exit:* signed-in user in Next.js hits one protected API route and resolves to a DB row. **Done for `/workflow` + workflow-context CRUD.**

---

## Phase 4 — Instruction profile CRUD (API + minimal UI)

11. **`GET/PUT /v1/me/profile`** — Load active snapshot; updates append `InstructionProfileVersion`.
12. **`GET /v1/me/profile/versions`** + **`/:versionId`** — Read-only history for debugging and UI.
13. **Web pages** — `/settings/profile` listing + edit form calling the API (server actions or client fetch with Clerk session).

*Exit:* user can edit profile text/settings and see version history (even if UI is ugly).

---

## Phase 5 — Policy settings (stub → real)

14. **`GET/PUT /v1/me/policy`** — Persist JSON or normalized columns for banned phrases / toggles (Policy layer will consume later).
15. **Web** — `/settings/policy` wired to API.

*Exit:* settings persist and reload correctly.

---

## Phase 6 — Telegram bot setup and account linking

> **Channel pivot (2026-05-23):** Slack OAuth install deferred. See [decisions/0004-telegram-over-slack-mvp-channel.md](./decisions/0004-telegram-over-slack-mvp-channel.md).  
> **Shipped slice:** [feature-telegram-bot.md](./feature-telegram-bot.md).

16. **BotFather + webhook** — ✅ Webhook route + env token + `telegram:set-webhook` script. Token still in env (not `connectors` table yet).
17. **Link UX** — ⏳ `/settings/telegram` and link-token API not built; `/start link_*` returns placeholder copy only.

*Exit:* test user can link Telegram from web and send a message that resolves to their DB user. **Partial:** anyone can message the bot; replies work but no user binding.

---

## Phase 7 — Telegram ingress (adapter only)

18. **`POST /v1/integrations/telegram/webhook`** — ✅ grammY `webhookCallback` + handlers (`api/src/telegram/*`); optional webhook secret header.
19. **Idempotency** — ✅ In-process `update_id` dedupe. ⏳ Redis per ARCHITECTURE §6.
20. **Callback queries** — ✅ Answer + stub message. ⏳ Map `approve` / `refine` / `reject` to workflow (no `InboundMessage` canonical type yet).

*Exit:* bot echoes “received” or ack without breaking webhook auth; duplicate `update_id` does not double-process. **Met** for local pilot; promote Redis before production.

---

## Phase 8 — Workflow engine (minimal state machine)

21. **States** — Persist transitions per ARCHITECTURE §5: `IntakeReceived` → `DraftGenerating` → `DraftReady` (+ `Failed` path).
22. **`Draft` persistence** — Store LLM output placeholder first; attach `instruction_profile_version_id`.
23. **Audit** — Append-only `AuditEvent` on every transition.

*Exit:* one happy path from Telegram message → `DraftReady` with audit trail (LLM can return mock text).

---

## Phase 9 — Policy layer + LLM

24. **Policy pre/post checks** — Wire `/v1/me/policy` + instruction snapshot into prompt assembly; block approve if violations (return reason in Telegram thread).
25. **LLM adapter** — Provider-agnostic client; timeouts + one retry then `Failed` (ARCHITECTURE §6).
26. **Approve gate** — Interaction handler runs policy before transitioning to `Approved`.

*Exit:* draft quality visible in Telegram; approve blocked when policy fails.

---

## Phase 10 — Worker and async generation

27. **BullMQ (or chosen queue)** — Enqueue `DraftGenerating` jobs from API; worker in `worker/` runs generation + updates DB; API returns quickly to Telegram webhook handler (`202`-style pattern).
28. **Retries + DLQ** — Bounded retries; dead-letter for poison messages (ARCHITECTURE §10).

*Exit:* heavy work off HTTP; failures visible in logs/DLQ.

---

## Phase 11 — Telegram UX completion

29. **Outbound messages** — Post draft + inline keyboard (Approve / Refine / Reject); refine loop edits same message or sends updated draft per Telegram UX choice.
30. **Ready to publish** — After approve, surface copy-friendly text for manual LinkedIn post (`PublishedManual` when user confirms).

*Exit:* pilot can run full loop in Telegram without the web app except onboarding/settings/linking.

---

## Phase 12 — History on the web

31. **`GET /v1/me/conversations`** + **`/:conversationId`** + drafts + audit endpoints.
32. **Pages** — `/activity`, `/activity/[conversationId]` read-only mirror of Telegram chats.

*Exit:* web history matches DB for a test conversation.

---

## Phase 13 — Hardening and ops

33. **Rate limits** — API (especially Telegram webhook and Clerk webhook) and basic abuse protection.
34. **Sentry + OpenTelemetry** — Traces for API, worker, LLM calls; tag `conversation_id`.
35. **Staging deploy** — Single path from CI (ARCHITECTURE §7); secrets in manager not `.env` in prod.

*Exit:* on-call can trace a failed draft across services.

---

## Parking lot (explicitly after MVP slice)

- **Slack adapter** (OAuth + Events API) — deferred per [0004](./decisions/0004-telegram-over-slack-mvp-channel.md); remove or ignore existing Slack stubs when implementing Telegram.
- WhatsApp/Discord adapters (ARCHITECTURE §9).
- Automated LinkedIn publish (out of scope for MVP architecture).
- Admin portal, billing, multi-tenant org policies (tie to ARCHITECTURE §12 decisions).

---

## Quick dependency graph (high level)

```text
Phase 0–1 (infra + schema)
  → Phase 2 (API shell)
  → Phase 3 (Clerk)
  → Phase 4–5 (profile + policy API/UI)
  → Phase 6 (Telegram link + bot setup)
  → Phase 7 (Telegram webhook ingress)
  → Phase 8–9 (workflow + LLM + policy gate)
  → Phase 10 (queue)
  → Phase 11 (Telegram UX polish)
  → Phase 12 (web history)
  → Phase 13 (hardening)
```

Scratch notes — edit freely as you learn.
