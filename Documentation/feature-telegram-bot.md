# Telegram bot (webhook + message handling)

Last updated: 2026-05-23  
Status: **Phase 6–7 partial** — webhook live via **grammY**; account linking and workflow integration not yet shipped.

Cross-links: [decisions/0004-telegram-over-slack-mvp-channel.md](./decisions/0004-telegram-over-slack-mvp-channel.md), [planned-routes.md](./planned-routes.md) §1.2, [feature-plan1.md](./feature-plan1.md) phases 6–7.

---

## What shipped (2026-05-23)

| Area | Detail |
|------|--------|
| **SDK** | [grammY](https://grammy.dev) (`grammy` in `api`) — `webhookCallback`, `bot.api.setWebhook`, handlers, `InlineKeyboard` |
| **Webhook** | `POST /v1/integrations/telegram/webhook` — grammY `webhookCallback` with optional `secretToken` |
| **Handlers** | `api/src/telegram/handlers.ts` — `/start`, `/help`, text intake ack, inline keyboard stubs |
| **Idempotency** | grammY middleware `dedupeUpdatesMiddleware` (in-process `update_id`; Redis not wired yet) |
| **Config** | `TELEGRAM_BOT_TOKEN`, optional `TELEGRAM_WEBHOOK_SECRET` in `api/.env` |
| **Ops script** | `pnpm --filter @linkedin-agent/api telegram:set-webhook` (uses `bot.api.setWebhook`) |

### User-visible bot behavior (current)

- **`/start`** — welcome copy
- **`/start link_<token>`** — placeholder reply (binding to Clerk user **not** implemented)
- **`/help`** — short usage text
- **Plain text** — “intake received” reply + Approve / Refine / Reject inline buttons (callbacks acknowledged; **no** LangGraph / DB conversation yet)
- **Callback queries** — `answerCallbackQuery` + short confirmation message

### Code map

```text
api/src/telegram/bot.ts              # Singleton Bot + middleware
api/src/telegram/handlers.ts         # Commands, messages, callbacks
api/src/telegram/idempotency.ts      # update_id dedupe middleware
api/src/routes/telegramWebhook.ts    # webhookCallback(express)
api/scripts/set-telegram-webhook.ts  # bot.api.setWebhook
packages/shared/src/adapters/telegram.stub.ts  # Stub for future worker/tests
```

Tests: `api/src/telegram/bot.test.ts` (mocked `bot.api` via grammY config).

---

## Not shipped yet

- `POST /v1/me/integrations/telegram/link-token` and DB `connectors` row for `telegram_user_id`
- `/settings/telegram` web page
- Map Telegram chat → internal user / `conversation_id`
- Trigger worker LangGraph pipeline from inbound text
- Redis idempotency for `update_id`
- Replace worker `notifySlack` with Telegram delivery

---

## Local development

1. Create a bot via [@BotFather](https://t.me/BotFather); copy token into `api/.env`:

   ```env
   TELEGRAM_BOT_TOKEN=...
   TELEGRAM_WEBHOOK_SECRET=choose_a_random_string
   ```

2. Start API: `pnpm dev` (API on port 4000).

3. Expose HTTPS (Telegram requires it), e.g. root `pnpm ngrok:webhook` → port 4000.

4. Register webhook:

   ```powershell
   $env:WEBHOOK_BASE_URL="https://YOUR-NGROK-HOST"
   pnpm --filter @linkedin-agent/api telegram:set-webhook
   ```

   The script calls Telegram `setWebhook` with `url` = `{WEBHOOK_BASE_URL}/v1/integrations/telegram/webhook` and `secret_token` when `TELEGRAM_WEBHOOK_SECRET` is set.

5. Message the bot in Telegram; check API logs for handler output.

**Health:** `GET /health` includes `telegram: true` when `TELEGRAM_BOT_TOKEN` is set.

---

## Security notes

- If `TELEGRAM_WEBHOOK_SECRET` is unset, the webhook accepts any POST (dev convenience only — set a secret for staging/prod).
- Bot token must never be committed; use `api/.env` only.
