# Agent Handoff

## Task Summary

Implement Telegram account linking between Clerk-authenticated web users and the Telegram bot using a deep-link token flow.

## Working Plan

- Add a `TelegramLinkToken` persistence model and link state fields on `User`.
- Expose Clerk-protected Telegram link-status and link-token routes.
- Redeem `/start link_<token>` in the bot and surface the flow in `/settings/telegram`.

## Completed Changes

- Added the Telegram link-token schema and migration.
- Added API routes for Telegram link status, token issuance, and unlinking.
- Wired bot `/start link_<token>` redemption to link Telegram chat ids to the current user.
- Added a Telegram settings page with connect, copy-link, open-in-Telegram, and disconnect actions.

## Current Project Structure Relevant to the Task

- `api/src/routes/meTelegram.ts` owns the Clerk-authenticated Telegram integration endpoints.
- `api/src/services/telegramLinkService.ts` owns token issuance, redemption, and unlinking.
- `api/src/telegram/handlers.ts` handles `/start link_<token>` and bot replies.
- `web/app/settings/telegram/page.tsx` exposes the user-facing connect UI.

## Current Status

Feature implementation is in progress and needs lint plus migration/type generation validation.

## Open Follow-ups or Risks

- Telegram deep links rely on resolving the bot username via `TELEGRAM_BOT_USERNAME` or `getMe()`.
- The new Prisma schema needs generate/migration validation before shipping.
