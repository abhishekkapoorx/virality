import type { Middleware } from "grammy";

const seenUpdateIds = new Set<number>();
const MAX_SEEN = 10_000;

/** Skip duplicate webhook deliveries (Telegram may retry the same update_id). */
export const dedupeUpdatesMiddleware: Middleware = async (ctx, next) => {
  const updateId = ctx.update.update_id;
  if (seenUpdateIds.has(updateId)) {
    return;
  }
  seenUpdateIds.add(updateId);
  if (seenUpdateIds.size > MAX_SEEN) {
    const oldest = seenUpdateIds.values().next().value;
    if (oldest !== undefined) seenUpdateIds.delete(oldest);
  }
  await next();
};

/** Test-only: reset dedupe state between tests. */
export function resetTelegramUpdateDedupeForTests(): void {
  seenUpdateIds.clear();
}
