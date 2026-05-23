import { Bot } from "grammy";

import { dedupeUpdatesMiddleware } from "./idempotency.js";
import { registerTelegramHandlers } from "./handlers.js";
import { getTelegramBotToken } from "./config.js";

let botInstance: Bot | null = null;

/** Singleton grammY bot with handlers registered once. */
export function getTelegramBot(): Bot | null {
  const token = getTelegramBotToken();
  if (!token) return null;

  if (!botInstance) {
    botInstance = new Bot(token);
    botInstance.use(dedupeUpdatesMiddleware);
    registerTelegramHandlers(botInstance);
  }
  return botInstance;
}
