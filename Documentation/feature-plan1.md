# Feature plan 1 (scratch pad)

Last updated: 2026-05-21

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
   - Add minimal settings routes for Slack and profile preferences.

2. **Post generation workflow foundation**
   - Inputs to generation: writing style + weekly calendar + optional update request.
   - Output: post draft + generated carousel artifact.
   - Delivery targets: Slack + website.
   - Keep LLM and image generation as adapter-friendly stubs first, then replace with real providers.

3. **Scheduling first-class path**
   - Add per-user cron configuration in data model.
   - Trigger workflow via:
     - website preference update
     - Slack command (`/set-repeat <cron>`)
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

5. **Express structure** — router modules (`health`, `webhooks`, `me`, `integrations/slack`) matching [planned-routes](./planned-routes.md); centralized error handler; request logging with **correlation id** (ARCHITECTURE §10).
6. **Readiness** — `GET /health/ready` checks DB + Redis when vars present.
7. **Remove or isolate stub** — `POST /v1/inbound` behind a flag or delete once Slack path exists.

*Exit:* API starts in Docker; readiness reflects backing services.

---

## Phase 3 — Clerk (web identity → internal user)

8. **Clerk on Next.js** — `@clerk/nextjs`, env vars, `/sign-in`, `/sign-up`, `middleware.ts` protecting `/onboarding`, `/settings`, `/activity`.
9. **Clerk → DB user** — Either **webhook** `POST /v1/webhooks/clerk` on API with signature verification, or **lazy create** on first authenticated API call; map Clerk `sub` → `User.clerkUserId` + tenant assignment rule (decide workspace-first vs prosumer once — ARCHITECTURE §12).
10. **API JWT middleware** — Verify Clerk JWT on `/v1/me/*`; attach internal `userId` / `tenantId` to `req`.

*Exit:* signed-in user in Next.js hits one protected API route and resolves to a DB row.

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

## Phase 6 — Slack connector install

16. **Slack app config** — OAuth scopes, redirect URL → `/v1/oauth/slack/callback`, store bot token + team id in `Connector` linked to tenant/user.
17. **Install UX** — `/settings/slack` button starts OAuth; show connected workspace or errors.

*Exit:* workspace installs bot; token encrypted-at-rest decision documented (even if MVP is env-only encryption stub).

---

## Phase 7 — Slack ingress (adapter only)

18. **`POST /v1/integrations/slack/events`** — URL verification + signature validation + raw body; parse canonical inbound message from DMs or configured channel (product decision).
19. **Idempotency** — Redis key per Slack event id / composite key; skip duplicates (ARCHITECTURE §6).
20. **`POST /v1/integrations/slack/interactions`** — Verify signature; parse button payloads into internal action types (approve/refine/reject) — workflow execution can stay stubbed.

*Exit:* Slack shows “received” or echo from adapter without breaking signatures; duplicates don’t double-process.

---

## Phase 8 — Workflow engine (minimal state machine)

21. **States** — Persist transitions per ARCHITECTURE §5: `IntakeReceived` → `DraftGenerating` → `DraftReady` (+ `Failed` path).
22. **`Draft` persistence** — Store LLM output placeholder first; attach `instruction_profile_version_id`.
23. **Audit** — Append-only `AuditEvent` on every transition.

*Exit:* one happy path from Slack message → `DraftReady` with audit trail (LLM can return mock text).

---

## Phase 9 — Policy layer + LLM

24. **Policy pre/post checks** — Wire `/v1/me/policy` + instruction snapshot into prompt assembly; block approve if violations (return reason to Slack later).
25. **LLM adapter** — Provider-agnostic client; timeouts + one retry then `Failed` (ARCHITECTURE §6).
26. **Approve gate** — Interaction handler runs policy before transitioning to `Approved`.

*Exit:* draft quality visible in Slack; approve blocked when policy fails.

---

## Phase 10 — Worker and async generation

27. **BullMQ (or chosen queue)** — Enqueue `DraftGenerating` jobs from API; worker in `worker/` runs generation + updates DB; API returns quickly to Slack (`202`-style pattern).
28. **Retries + DLQ** — Bounded retries; dead-letter for poison messages (ARCHITECTURE §10).

*Exit:* heavy work off HTTP; failures visible in logs/DLQ.

---

## Phase 11 — Slack UX completion

29. **Outbound messages** — Post draft + block kit buttons; refine loop posts updated draft.
30. **Ready to publish** — After approve, surface “copy” or checklist for manual LinkedIn post (`PublishedManual` transition when user confirms).

*Exit:* pilot can run full loop in Slack without the web app except onboarding/settings.

---

## Phase 12 — History on the web

31. **`GET /v1/me/conversations`** + **`/:conversationId`** + drafts + audit endpoints.
32. **Pages** — `/activity`, `/activity/[conversationId]` read-only mirror of Slack threads.

*Exit:* web history matches DB for a test conversation.

---

## Phase 13 — Hardening and ops

33. **Rate limits** — API (especially Slack and Clerk webhook) and basic abuse protection.
34. **Sentry + OpenTelemetry** — Traces for API, worker, LLM calls; tag `conversation_id`.
35. **Staging deploy** — Single path from CI (ARCHITECTURE §7); secrets in manager not `.env` in prod.

*Exit:* on-call can trace a failed draft across services.

---

## Parking lot (explicitly after MVP slice)

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
  → Phase 6 (Slack OAuth)
  → Phase 7 (Slack ingress)
  → Phase 8–9 (workflow + LLM + policy gate)
  → Phase 10 (queue)
  → Phase 11 (Slack UX polish)
  → Phase 12 (web history)
  → Phase 13 (hardening)
```

Scratch notes — edit freely as you learn.
