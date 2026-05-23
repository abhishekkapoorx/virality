import { Router } from "express";

import {
  getTelegramLinkStatus,
  issueTelegramLinkToken,
  unlinkTelegramAccount
} from "../services/telegramLinkService.js";
import { getAuth } from "../types/auth.js";

export const meTelegramRouter = Router();

meTelegramRouter.get("/integrations/telegram", async (req, res) => {
  try {
    const userId = getAuth(req).internalUserId;
    return res.json(await getTelegramLinkStatus(userId));
  } catch (error) {
    console.error("GET telegram status failed", error);
    return res.status(500).json({ error: "Failed to load Telegram link status" });
  }
});

meTelegramRouter.post("/integrations/telegram/link-token", async (req, res) => {
  try {
    const userId = getAuth(req).internalUserId;
    const linkToken = await issueTelegramLinkToken(userId);
    return res.status(201).json(linkToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("username unavailable")) {
      return res.status(503).json({
        error: "Telegram bot username unavailable",
        hint:
          "Set TELEGRAM_BOT_USERNAME or ensure TELEGRAM_BOT_TOKEN can call getMe()"
      });
    }

    console.error("POST telegram link-token failed", error);
    return res.status(500).json({ error: "Failed to issue Telegram link token" });
  }
});

meTelegramRouter.delete("/integrations/telegram", async (req, res) => {
  try {
    const userId = getAuth(req).internalUserId;
    return res.json(await unlinkTelegramAccount(userId));
  } catch (error) {
    console.error("DELETE telegram integration failed", error);
    return res.status(500).json({ error: "Failed to unlink Telegram" });
  }
});