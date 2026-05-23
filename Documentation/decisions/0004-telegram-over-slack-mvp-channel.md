# ADR 0004: Telegram as MVP channel (Slack deferred)

**Status:** Accepted  
**Date:** 2026-05-23  
**Supersedes:** Slack-first assumptions in PRD, ARCHITECTURE, and feature-plan1 (phases 6–11) as of 2026-05-21.

## Context

Early plans and landing copy assumed **Slack** as the primary draft loop (OAuth install, Events API, Block Kit buttons). Pilot feedback and build cost favor starting with a **Telegram bot**: simpler install (no workspace OAuth), mobile-native UX, and one webhook ingress path.

Existing code still contains Slack stubs (`SlackAdapter`, `/v1/integrations/slack/commands`, landing copy). Those are **legacy / not MVP** until explicitly removed or repurposed.

## Decision

1. **MVP primary channel:** Telegram Bot API (webhook ingress, inline keyboard actions, bot commands).
2. **Web remains canonical** for Clerk auth, instruction profiles, workflow context, and linking Telegram identity to an internal user.
3. **Slack connector** is **out of MVP scope** — do not implement new Slack OAuth, Events API, or Block Kit work until after Telegram pilot gates (PRD §9).
4. **Adapter boundary unchanged:** `InboundMessage` / `OutboundPayload` / `ActionPayload` stay channel-agnostic; add `TelegramAdapter` instead of extending Slack-specific types into the workflow engine.

## Consequences

- Update [ARCHITECTURE.md](../ARCHITECTURE.md), [PRD.md](../PRD.md), [planned-routes.md](../planned-routes.md), and [feature-plan1.md](../feature-plan1.md).
- New settings surface: `/settings/telegram` (link bot, connection status).
- Scheduling command: `/set_repeat` (or web-only cron) instead of Slack `/set-repeat`.
- Marketing/landing copy should say **Telegram** where it currently says Slack (tracked in [feature-landing-page.md](../feature-landing-page.md)).
- Worker `notifySlack` node and shared `SlackAdapter` may be renamed/replaced in a later implementation slice; docs treat Telegram delivery as the target.

## Telegram linking (product sketch)

1. Signed-in user opens **Connect Telegram** on the web.
2. API issues a short-lived `link_token` stored on the user/connector row.
3. User opens `https://t.me/<bot>?start=link_<token>`; bot webhook resolves token → binds `telegram_user_id` to internal `user_id`.
4. Subsequent messages from that Telegram user route to the same tenant/conversation model as other channels.

## Implementation log

| Date | Change |
|------|--------|
| 2026-05-23 | **Webhook + handler shipped:** `POST /v1/integrations/telegram/webhook`, grammY handlers (`api/src/telegram/*`), `api/scripts/set-telegram-webhook.ts`. See [feature-telegram-bot.md](../feature-telegram-bot.md). |
| 2026-05-23 | **Refactor:** Replaced hand-rolled `fetch` Bot API client with **grammY** (`webhookCallback`, `InlineKeyboard`, `bot.api.setWebhook`). |
| — | **Still open:** link-token API, `/settings/telegram`, user/conversation mapping, LangGraph trigger from inbound text, Redis idempotency. |
