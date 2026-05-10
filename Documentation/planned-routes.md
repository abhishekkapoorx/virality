# Planned routes

Last updated: 2026-05-10  
Source of truth for product architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)

This document lists **planned** HTTP routes for the Express orchestration API, the Next.js web app (App Router), Slack ingress, and Clerk-adjacent endpoints. Paths are stable targets for implementation; naming may shift slightly during build (keep OpenAPI in sync).

**Auth boundaries**

- **Web UI + user-scoped JSON API**: Clerk session / JWT verification (`/v1/me/*`).
- **Slack Events & Interactions**: Slack signing secret (not Clerk).
- **Slack OAuth (connector install)**: OAuth callback is server-side; user may already be signed into Clerk in the browser before starting install.

---

## 1) Orchestration API (Express)

Base URL example: `https://api.example.com`. Version prefix: **`/v1`**.

### 1.1 Health

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | None | Liveness |
| GET | `/health/ready` | None | Readiness (DB + Redis checks when wired) |

### 1.2 Slack ingress (adapter)

Raw body required for signature verification on POST handlers.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/v1/integrations/slack/events` | Slack signing secret | Events API (URL verification, messages, etc.) |
| POST | `/v1/integrations/slack/interactions` | Slack signing secret | Block actions: Approve / Refine / Reject, shortcuts |
| POST | `/v1/integrations/slack/commands` | Slack signing secret | Slash commands (includes `/set-repeat <cron>`) |

### 1.3 Slack OAuth (connector)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/v1/oauth/slack/install` | Browser session optional | Start Slack OAuth install flow |
| GET | `/v1/oauth/slack/callback` | OAuth `state` validation | OAuth redirect; persist tokens into `connectors` |

Exact callback URL must match Slack app configuration.

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

#### Workflow preferences + schedule

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/me/workflow-preferences` | Load writing style, weekly calendar, carousel style, cron schedule |
| PUT | `/v1/me/workflow-preferences` | Update workflow preferences and optional cron expression |
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

Same domain events as Slack buttons; omit from MVP if Slack-only.

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
| POST | `/v1/inbound` | Temporary stub; replace with Slack-driven canonical inbound |

---

## 2) Next.js web app (App Router)

Protect app routes with **Clerk middleware** except marketing/legal/sign-in as configured.

### 2.1 Public

| Route | Purpose |
|-------|---------|
| `/` | Landing / marketing shell |
| `/sign-in` | Clerk sign-in (or Clerk-hosted redirect URL — align with `@clerk/nextjs` config) |
| `/sign-up` | Clerk sign-up |
| `/privacy`, `/terms` | Legal (if required for Clerk / OAuth directories) |

### 2.2 Authenticated (Clerk session required)

| Route | Purpose |
|-------|---------|
| `/onboarding` | Tenant context, Slack connect, default instruction profile |
| `/settings/slack` | Connector status, reinstall, test |
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

Background jobs (BullMQ / similar): `workflow.generate`, `workflow.deliver-slack`, `audit.write`, DLQ processing. See ARCHITECTURE.md §11.

---

## 4) Implementation checklist

- [ ] Register Slack Request URLs → `/v1/integrations/slack/events` and interactions URL → `/v1/integrations/slack/interactions`.
- [ ] Register Slack OAuth redirect → `/v1/oauth/slack/callback`.
- [ ] Register Clerk JWT issuer/JWKS in API middleware; map `sub` to `users.clerkUserId`.
- [ ] Register Clerk webhook URL → `/v1/webhooks/clerk` (or Next handler) with signing secret.
- [ ] Align Next.js `middleware.ts` matcher with §2.2 routes.
- [ ] Replace `/v1/inbound` stub with real Slack → workflow path.
- [ ] Publish OpenAPI for `/v1/me/*` and Slack-facing contracts where stable.
