import { Bot } from "grammy";

import { dedupeUpdatesMiddleware } from "./idempotency.js";
import { registerTelegramHandlers } from "./handlers.js";

let botInstance: Bot | null = null;

export function getTelegramBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
}

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
