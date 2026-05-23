# Planned routes

Last updated: 2026-05-23 (Telegram webhook implemented)  
Source of truth for product architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)  
Implementation notes: [feature-telegram-bot.md](./feature-telegram-bot.md)

This document lists **planned** HTTP routes for the Express orchestration API, the Next.js web app (App Router), Telegram webhook ingress, and Clerk-adjacent endpoints. Paths are stable targets for implementation; naming may shift slightly during build (keep OpenAPI in sync).

> **Channel pivot (2026-05-23):** Slack routes below are **deprecated for MVP**; implement Telegram paths instead. See [decisions/0004-telegram-over-slack-mvp-channel.md](./decisions/0004-telegram-over-slack-mvp-channel.md).

**Auth boundaries**

- **Web UI + user-scoped JSON API**: Clerk session / JWT verification (`/v1/me/*`).
- **Telegram webhook**: Shared secret (header or path token), not Clerk.
- **Telegram account link**: Clerk-signed user on web issues `link_token`; bot `/start link_<token>` completes binding.

---

## 1) Orchestration API (Express)

Base URL example: `https://api.example.com`. Version prefix: **`/v1`**.

### 1.1 Health

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | None | Liveness |
| GET | `/health/ready` | None | Readiness (DB + Redis checks when wired) |

### 1.2 Telegram ingress (adapter)

| Method | Path | Auth | Status | Purpose |
|--------|------|------|--------|---------|
| POST | `/v1/integrations/telegram/webhook` | Optional `X-Telegram-Bot-Api-Secret-Token` | **Shipped** | All Bot API updates: messages, `callback_query`, bot commands |

Handler: grammY `webhookCallback` in `api/src/routes/telegramWebhook.ts` → `api/src/telegram/handlers.ts`.  
Idempotency via grammY middleware (in-memory today). Canonical `InboundMessage` mapping — **not yet**.

### 1.3 Telegram account link (connector)

| Method | Path | Auth | Status | Purpose |
|--------|------|------|--------|---------|
| POST | `/v1/me/integrations/telegram/link-token` | Clerk JWT | Planned | Issue short-lived token for `t.me/<bot>?start=link_<token>` |
| GET | `/v1/me/integrations/telegram` | Clerk JWT | Planned | Link status (`telegram_user_id`, connected at) |
| DELETE | `/v1/me/integrations/telegram` | Clerk JWT | Planned | Unlink Telegram from internal user |

Webhook `/start link_*` — **placeholder reply only** until link-token API + DB binding ship.

### 1.3a Deprecated — Slack (not MVP)

Do not implement for new work unless explicitly reviving Slack post-pilot.

| Method | Path | Notes |
|--------|------|-------|
| POST | `/v1/integrations/slack/events` | Was Events API |
| POST | `/v1/integrations/slack/interactions` | Was Block Kit |
| POST | `/v1/integrations/slack/commands` | Stub may exist in repo |
| GET | `/v1/oauth/slack/*` | Was workspace OAuth |

### 1.4 Clerk webhooks (directory sync)

Server-only; verify Clerk webhook signature.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/v1/webhooks/clerk` | Clerk webhook signing secret | `user.created`, `user.updated`, `user.deleted` → upsert internal `users` |

Route name is illustrative (`/v1/webhooks/clerk`); mount a single handler and branch on event type.

### 1.5 Authenticated web API (Clerk JWT)

All routes assume **verified Clerk JWT** and resolve Clerk `sub` → internal `User` / `tenantId`. Optional header: `X-Correlation-Id`.

#### Instruction profiles

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/me/profile` | Active profile + pointer to current version |
| GET | `/v1/me/profile/versions` | Paginated version list |
| GET | `/v1/me/profile/versions/:versionId` | One immutable snapshot |
| PUT | `/v1/me/profile` | Update profile → new `instruction_profile_versions` row |

#### Workflow context (Postgres — replaces n8n Google Docs)

Pre-auth: `userId` defaults to `DEMO_USER_ID` (`demo-user`). Post-auth: Clerk `sub` → internal user id.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/me/workflow-context` | Load `configText`, `styleText`, `scheduleText`, `hookSystemText`, carousel + cron |
| PUT | `/v1/me/workflow-context` | Upsert per-user prompt context (web `/workflow`) |
| GET | `/internal/v1/workflow-context` | Worker bundle for LangGraph `loadContext` (query: `userId`, optional `userFeedback`) |

#### Workflow preferences + schedule (legacy alias)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/me/workflow-preferences` | Alias: maps DB context → legacy `writingStyle` / `weeklyCalendar` fields |
| PUT | `/v1/me/workflow-preferences` | Partial update (style + schedule + carousel + cron only) |
| POST | `/v1/me/drafts/generate` | Generate draft + carousel artifact (accepts optional update request text) |

#### Policy / guardrails

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/me/policy` | Banned phrases, tone, claim guardrails |
| PUT | `/v1/me/policy` | Persist policy settings for Policy layer |

#### History / conversations / audit

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/me/conversations` | List conversations (filters TBD) |
| GET | `/v1/me/conversations/:conversationId` | Detail + workflow summary |
| GET | `/v1/me/conversations/:conversationId/drafts` | Draft lineage |
| GET | `/v1/me/conversations/:conversationId/audit` | Paginated audit events |

#### Workflow actions from web (optional MVP)

Same domain events as Telegram inline keyboard; web actions optional if bot-only MVP.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/v1/me/conversations/:conversationId/actions/refine` | Body: refinement text → `user_refine` |
| POST | `/v1/me/conversations/:conversationId/actions/approve` | Policy gate → `user_approve` |
| POST | `/v1/me/conversations/:conversationId/actions/reject` | `user_reject` |
| POST | `/v1/me/conversations/:conversationId/actions/mark-published` | `PublishedManual` |

### 1.6 Internal / worker (non-public)

Not exposed on the public internet in production; optional during development.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/internal/jobs/dispatch` | Optional HTTP trigger for workers |
| POST | `/internal/jobs/scheduled-draft-run` | Scheduler trigger path for cron-generated drafts |

Prefer **BullMQ** consumers in `worker/` without public HTTP.

### 1.7 Legacy / bootstrap (remove when workflow exists)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/v1/inbound` | Temporary stub; replace with Telegram-driven canonical inbound |

---

## 2) Next.js web app (App Router)

Protect app routes with **Clerk middleware** except marketing/legal/sign-in as configured.

### 2.1 Public

| Route | Purpose |
|-------|---------|
| `/` | Landing / marketing shell — sections: `#flow`, `#features`, `#schedule` (per-user cron), `#waitlist`. See [feature-landing-page.md](./feature-landing-page.md). |
| `/sign-in` | Clerk sign-in (or Clerk-hosted redirect URL — align with `@clerk/nextjs` config) |
| `/sign-up` | Clerk sign-up |
| `/privacy`, `/terms` | Legal (if required for Clerk / OAuth directories) |

### 2.2 Authenticated (Clerk session required)

| Route | Purpose |
|-------|---------|
| `/onboarding` | Tenant context, Telegram link, default instruction profile |
| `/settings/telegram` | Link status, connect via deep link, disconnect |
| `/settings/profile` | Instruction profile CRUD (calls `/v1/me/profile`) |
| `/settings/policy` | Policy / guardrails (calls `/v1/me/policy`) |
| `/activity` | Conversation list (calls `/v1/me/conversations`) |
| `/activity/[conversationId]` | Thread detail, drafts, audit timeline |

### 2.3 Next.js API routes / Route Handlers (optional)

If the browser talks only to Express, these may be unnecessary. If using Next as BFF:

| Pattern | Purpose |
|---------|---------|
| `app/api/v1/me/...` | Proxy to Express with Clerk `auth()` server-side |
| `app/api/webhooks/clerk/route.ts` | Alternative to Express for Clerk webhooks (choose one stack location, not both) |

Pick **either** Express **or** Next route handlers for Clerk webhooks to avoid duplicate endpoints.

---

## 3) Worker / queue (no HTTP)

Background jobs (BullMQ / similar): `workflow.generate`, `workflow.deliver-telegram`, `audit.write`, DLQ processing. See ARCHITECTURE.md §11.

---

## 4) Implementation checklist

- [x] Register Telegram webhook → `POST /v1/integrations/telegram/webhook` (use `pnpm --filter @linkedin-agent/api telegram:set-webhook`; see [feature-telegram-bot.md](./feature-telegram-bot.md)).
- [ ] Implement link-token flow → `POST /v1/me/integrations/telegram/link-token` + `/start link_*` handler (DB bind).
- [x] Register Clerk JWT issuer/JWKS in API middleware; map `sub` to `users.clerkUserId`.
- [x] Register Clerk webhook URL → `/v1/webhooks/clerk` with signing secret (local: ngrok → port 4000; see `Documentation/clerk-local-dev.md`).
- [x] Align Next.js `middleware.ts` matcher with §2.2 routes (`/workflow` protected; landing + waitlist public).
- [ ] Replace `/v1/inbound` stub with real Telegram → workflow path.
- [ ] Publish OpenAPI for `/v1/me/*` and Telegram webhook contracts where stable.
