# 0003 — Per-user workflow context in Postgres (replaces Google Docs)

**Date:** 2026-05-12  
**Status:** Accepted

## Context

The n8n workflow loaded four Google Docs per run (LinkedIn config, style guide, weekly schedule, hook system). Product direction (ARCHITECTURE §2) is DB-backed instruction profiles with no external doc dependency. Users should edit this context in the web UI.

Auth (Clerk) is not wired yet; we need a stable user key for development.

## Decision

### Data model

Single table `UserWorkflowContext` in Postgres (`api/prisma/schema.prisma`):

| Column | n8n source |
|--------|------------|
| `configText` | LinkedIn_Config doc |
| `styleText` | Style_Guide doc |
| `scheduleText` | Weekly_Post_Schedule doc |
| `hookSystemText` | Content_Hook_System doc |
| `carouselDesignLanguage` | (product field, carousel renderer) |
| `cronExpression` | /set-repeat + scheduler |

Primary key: `userId` (string). Pre-auth rows use constant `demo-user` (`DEMO_USER_ID` in `@linkedin-agent/shared`, overridable via `DEMO_USER_ID` env).

Post-auth: same table; `userId` becomes internal `User.id` (or stable slug) once Clerk mapping exists. Optional FK to `User` can be added without changing column names.

### API

| Route | Purpose |
|-------|---------|
| `GET/PUT /v1/me/workflow-context` | Web UI CRUD |
| `GET /internal/v1/workflow-context` | Worker `HttpConfigSourceAdapter` → LangGraph bundle |
| `GET/PUT /v1/me/workflow-preferences` | Legacy alias (`styleText` ↔ writingStyle, etc.) |

`resolveUserId(req)` returns query/body `userId` or `DEMO_USER_ID`.

### Worker

`HttpConfigSourceAdapter` (when `API_URL` is set) fetches the internal bundle from the API. Tests keep `ConfigSourceStub` when `API_URL` is unset.

### Web

`/workflow` edits all four text fields + carousel + cron. User id is read-only (`demo-user`); no manual user id field.

## Consequences

- Postgres required for API readiness (`/health/ready` checks DB).
- Worker must reach API in dev (`API_URL=http://localhost:4000`).
- Google Doc URLs in `linkedin-agent.json` are reference-only until a one-time import tool is built.

## Follow-up

1. Clerk JWT → `resolveUserId` from verified `sub`.
2. Optional `UserWorkflowContext.userId` FK to `User.id`.
3. Version history (`InstructionProfileVersion`) per ARCHITECTURE §8.
