# 0002 — Port n8n LinkedIn-Agent workflow to LangGraph

**Date:** 2026-05-12  
**Status:** Accepted  
**Source:** `linkedin-agent.json` (n8n export)

## Context

The product workflow was prototyped in n8n (`LinkedIn-Agent`): fetch four Google Docs, merge context, run three structured LLM agents (post type → hook → draft), generate a carousel image, upload to Drive, notify Slack, and persist a row for approval tracking.

We need this in the monorepo worker as a **modular, testable LangGraph** graph aligned with `ARCHITECTURE.md` adapter boundaries.

## Decision

Map each n8n step to a dedicated LangGraph node under `worker/src/graph/nodes/`, with prompts in `packages/shared/src/prompts/` and side effects behind adapters in `packages/shared/src/adapters/`.

| n8n node | LangGraph node | Adapter |
|----------|----------------|---------|
| LinkedIn_Config, Style_Guide, Weekly_Post_Schedule, Content_Hook_System, Merge, Concated Context | `loadContext` | `ConfigSourceAdapter` (stub; later DB/docs sync) |
| Get Post Type from Docs | `selectPostType` | `LlmAdapter.selectPostType` |
| Choose Best Hook | `chooseHook` | `LlmAdapter.chooseHook` |
| Generate Post | `generatePost` | `LlmAdapter.generatePost` |
| Generate Prompt to Generate Image | `generateImagePrompt` | `LlmAdapter.generateImagePrompt` |
| Generate an image | `generateImage` | `ImageAdapter` |
| Upload file | `uploadAsset` | `StorageAdapter` |
| Send a message | `notifySlack` | `SlackAdapter.sendDraftNotification` |
| Insert row | `persistDraft` | `DraftStoreAdapter` |

Prompt text is copied verbatim from the n8n agent `text` fields where applicable (see `packages/shared/src/prompts/`).

## Alternatives considered

- **Keep n8n in production** — rejected; want versioned code, unit tests, and shared types with API/web.
- **Single mega-node** — rejected; breaks extensibility and testability.
- **Hand-rolled FSM** — rejected in favor of LangGraph (see `0001-langgraph-as-workflow-engine.md`).

## Consequences

- Google Docs URLs from n8n are **not** called at runtime in the stub path; `ConfigSourceStub` returns deterministic text until Phase 1 schema + profile CRUD land.
- OpenAI model names (`gpt-5-nano`, etc.) are not hard-coded in nodes; real `LlmAdapter` impl will read env in a later slice.
- Slack block kit is simplified in `SlackStub`; full Block Kit JSON can be added when Slack OAuth ships (Phase 6–7).
- n8n data table → `DraftStoreAdapter`; replace with Prisma `Draft` + `AuditEvent` when Phase 8 persistence lands.

## Follow-up

1. Wire `ConfigSourceAdapter` to DB-backed instruction profiles (replace Google Docs).
2. Implement `OpenAiLlmAdapter` with structured JSON outputs matching Zod schemas.
3. Add conditional error routing on `uploadAsset` / `persistDraft` if needed.
4. Commit `linkedin-agent.json` under `Documentation/reference/` for diff audits.
