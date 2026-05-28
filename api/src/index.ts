import "dotenv/config";
import cors from "cors";
import express from "express";
import { z } from "zod";

import { clerkAuthMiddleware } from "./middleware/clerkAuth.js";
import { clerkWebhookRouter } from "./routes/clerkWebhook.js";
import { meTelegramRouter } from "./routes/meTelegram.js";
import { meSetupRouter } from "./routes/meSetup.js";
import { meMarketplaceRouter } from "./routes/meMarketplace.js";
import { telegramWebhookRouter } from "./routes/telegramWebhook.js";
import { internalGeneratedPostsRouter } from "./routes/internalGeneratedPosts.js";
import { internalPromptContextRouter } from "./routes/internalPromptContext.js";
import { resolveUserId } from "./lib/resolveUserId.js";
import {
  enqueueDraftGeneration,
  enqueueDraftGenerationAndWait,
  resolveDraftDeliveryTargetForUser
} from "./services/draftQueueService.js";
// workflow-context service and routes removed — using new prompt-context endpoint instead
import { getAuth } from "./types/auth.js";

const app = express();
app.use(cors());

/** Clerk webhooks need raw body for signature verification (before express.json). */
app.use(
  "/v1/webhooks/clerk",
  express.raw({ type: "application/json" }),
  clerkWebhookRouter
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    service: "api",
    status: "ok",
    timestamp: new Date().toISOString(),
    clerk: Boolean(process.env.CLERK_SECRET_KEY?.trim()),
    telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim())
  });
});

app.get("/health/ready", async (_req, res) => {
  const databaseUrlConfigured = Boolean(process.env.DATABASE_URL);
  let databaseReachable = false;
  if (databaseUrlConfigured) {
    try {
      const { prisma } = await import("./lib/prisma.js");
      await prisma.$queryRaw`SELECT 1`;
      databaseReachable = true;
    } catch {
      databaseReachable = false;
    }
  }

  const ok = !databaseUrlConfigured || databaseReachable;
  res.status(ok ? 200 : 503).json({
    service: "api",
    status: ok ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    dependencies: {
      databaseUrlConfigured,
      databaseReachable,
      redisUrlConfigured: Boolean(process.env.REDIS_URL),
      clerkConfigured: Boolean(process.env.CLERK_SECRET_KEY?.trim())
    }
  });
});

app.use("/internal/v1", internalPromptContextRouter);
app.use("/internal/v1", internalGeneratedPostsRouter);
app.use("/v1/integrations/telegram", telegramWebhookRouter);

const meRouter = express.Router();
meRouter.use(clerkAuthMiddleware);
meRouter.use(meTelegramRouter);
meRouter.use(meMarketplaceRouter);
meRouter.use(meSetupRouter);
app.use("/v1/me", meRouter);

const generateDraftSchema = z.object({
  updateRequest: z.string().min(1).optional()
});

const slackCommandSchema = z.object({
  command: z.string().min(1),
  text: z.string().optional(),
  user_id: z.string().min(1)
});

const inboundSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  text: z.string().min(1)
});

app.post("/v1/me/drafts/generate", clerkAuthMiddleware, async (req, res) => {
  const parsed = generateDraftSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }

  const userId = getAuth(req).internalUserId;
  try {
    const target = await resolveDraftDeliveryTargetForUser(userId);
    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }

    const response = await enqueueDraftGenerationAndWait({
      tenantId: target.tenantId,
      telegramUserId: target.telegramUserId,
      userId,
      updateRequest: parsed.data.updateRequest,
      source: "manual"
    });

    return res.json(response);
  } catch (err) {
    console.error("draft generate failed", err);
    return res.status(500).json({ error: "Draft generation failed" });
  }
});

app.post("/v1/integrations/slack/commands", async (req, res) => {
  const parsed = slackCommandSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }

  if (parsed.data.command !== "/set-repeat") {
    return res.status(410).json({
      error: "Slack commands are no longer supported",
      supportedCommand: "/set-repeat"
    });
  }

  const cronExpression = parsed.data.text?.trim();
  if (!cronExpression) {
    return res.status(400).json({ error: "Missing cron expression. Usage: /set-repeat <cron>" });
  }

  return res.status(410).json({
    error: "Slack commands are no longer supported"
  });
});

app.post("/internal/jobs/scheduled-draft-run", async (req, res) => {
  const parsed = generateDraftSchema
    .extend({ userId: z.string().min(1).optional() })
    .safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }

  const userId = parsed.data.userId ?? resolveUserId(req);
  try {
    const target = await resolveDraftDeliveryTargetForUser(userId);
    if (!target) {
      return res.status(404).json({ error: "User tenant not found" });
    }

    const job = await enqueueDraftGeneration({
      tenantId: target.tenantId,
      telegramUserId: target.telegramUserId,
      userId,
      updateRequest: parsed.data.updateRequest,
      source: "manual"
    });

    return res.status(202).json({
      trigger: "scheduled",
      queued: true,
      jobId: job.id ?? null,
      userId
    });
  } catch {
    return res.status(500).json({ error: "Scheduled run failed" });
  }
});

app.post("/v1/inbound", (req, res) => {
  const parsed = inboundSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }

  enqueueDraftGenerationAndWait({
    tenantId: parsed.data.tenantId,
    userId: parsed.data.userId,
    updateRequest: parsed.data.text,
    source: "manual"
  })
    .then((response) => {
      return res.status(200).json({
        workflowState: "draft_ready",
        draft: response
      });
    })
    .catch((error) => {
      console.error("inbound event failed", error);
      return res.status(500).json({ error: "Inbound event failed" });
    });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
  if (!process.env.CLERK_SECRET_KEY?.trim()) {
    console.warn(
      "CLERK_SECRET_KEY unset — /v1/me/* uses demo user fallback (see api/.env.example)"
    );
  }
  if (!process.env.TELEGRAM_BOT_TOKEN?.trim()) {
    console.warn(
      "TELEGRAM_BOT_TOKEN unset — Telegram webhook will return 503 (see api/.env.example)"
    );
  }
});
