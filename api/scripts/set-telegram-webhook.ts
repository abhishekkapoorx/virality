/**
 * Register Telegram webhook URL via grammY (run after API is reachable on the public URL).
 *
 * Usage:
 *   TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... WEBHOOK_BASE_URL=https://xxx.ngrok-free.app \
 *     pnpm --filter @linkedin-agent/api telegram:set-webhook
 */
/// <reference types="node" />
import "dotenv/config";
import { Bot } from "grammy";

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const baseUrl = process.env.WEBHOOK_BASE_URL?.trim().replace(/\/$/, "");
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

if (!token || !baseUrl) {
  console.error("Set TELEGRAM_BOT_TOKEN and WEBHOOK_BASE_URL");
  process.exit(1);
}

const webhookUrl = `${baseUrl}/v1/integrations/telegram/webhook`;
const bot = new Bot(token);

try {
  await bot.api.setWebhook(webhookUrl, secret ? { secret_token: secret } : undefined);
  console.log("Webhook registered:", webhookUrl);
} catch (err) {
  console.error("setWebhook failed:", err);
  process.exit(1);
}
