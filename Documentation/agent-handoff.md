# Agent Handoff

## Task Summary

Remove user-facing placeholder behavior and keep Telegram draft generation fully wired, including the `/generate <idea>` command, the internal inbound queue path, and reliable schedule persistence for weekday send times.

## Working Plan

- Keep `/generate <idea>` on the same queue path as normal Telegram text intake.
- Inject Telegram handler dependencies so the bot tests can stub Prisma-backed helpers.
- Update the Telegram bot tests and user-facing copy for the new command.
- Replace runtime placeholder responses with real queueing behavior where the code already has the necessary plumbing.
- Make weekday send-time edits persist when a post type is already assigned so scheduler sync runs from the saved state.
- Fix repeatable-job cleanup to match the actual BullMQ job id prefix.
- Refresh the Telegram feature documentation and verify the API package with tests, lint, and typecheck.

## Completed Changes

- `api/src/telegram/handlers.ts` now registers `/generate`, reuses the existing draft queue path, and lazy-loads the Prisma-backed defaults so tests can inject stubs.
- `api/src/telegram/bot.test.ts` now covers `/generate <idea>` and the empty `/generate` case with injected test deps.
- `api/src/index.ts` now queues real draft work for `/v1/inbound` and returns a non-placeholder response for legacy Slack commands.
- `api/src/services/draftQueueService.ts` now removes existing repeatable jobs using the real `schedule:${userId}:...` job id prefix.
- `web/components/setup/SetupMarketplaceDashboard.live.tsx` now persists send-time edits when a day already has a selected post type.
- `Documentation/feature-telegram-bot.md` now documents `/generate <idea>` as a user-facing bot command.

## Current Project Structure Relevant to the Task

- `api/src/telegram/handlers.ts`: command registration and draft-queue routing.
- `api/src/telegram/bot.test.ts`: grammY bot behavior tests with injected service deps.
- `api/src/services/draftQueueService.ts`: shared draft queue enqueue path.
- `web/components/setup/SetupMarketplaceDashboard.live.tsx`: live marketplace dashboard and schedule persistence.
- `api/src/services/telegramLinkService.ts`: Telegram account linking and lookup helpers.

## Current Status

The Telegram `/generate` command is implemented, the internal inbound path now performs real work, repeatable schedule jobs exist in Redis, and API/web lint + typecheck all passed.

## Open Follow-ups or Risks

- The handler now lazy-loads production dependencies to keep tests isolated; if more Telegram commands are added, they should follow the same seam.
- The command still requires a linked Telegram account before draft generation, which matches the current manual-text behavior.
- The inline Telegram action buttons were removed rather than left as dead UI; if approve/refine/reject become real endpoints later, they should be reintroduced with backend support.
- Existing repeatable jobs in Redis show the scheduler is registering entries; if a day still does not fire, check the worker logs and the selected send time timezone.
