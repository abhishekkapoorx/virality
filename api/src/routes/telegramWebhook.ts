import { Router } from "express";
import { webhookCallback } from "grammy";

import { getTelegramBot } from "../telegram/bot.js";

export const telegramWebhookRouter = Router();

telegramWebhookRouter.post("/webhook", (req, res) => {
  const bot = getTelegramBot();
  if (!bot) {
    console.error("TELEGRAM_BOT_TOKEN unset — cannot handle Telegram updates");
    return res.status(503).json({ error: "Telegram bot not configured" });
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (secret && req.header("x-telegram-bot-api-secret-token") !== secret) {
    return res.status(401).json({ error: "Invalid webhook secret" });
  }

  return webhookCallback(bot, "express")(req, res);
});
