import "dotenv/config";
import cors from "cors";
import express from "express";
import { z } from "zod";
import {
  DELIVERY_CHANNELS,
  type GenerateDraftResponse
} from "@linkedin-agent/shared";

import { clerkAuthMiddleware } from "./middleware/clerkAuth.js";
import { clerkWebhookRouter } from "./routes/clerkWebhook.js";
import { meTelegramRouter } from "./routes/meTelegram.js";
import { telegramWebhookRouter } from "./routes/telegramWebhook.js";
import { internalWorkflowContextRouter } from "./routes/internalWorkflowContext.js";
import { meWorkflowContextRouter } from "./routes/meWorkflowContext.js";
import { resolveUserId } from "./lib/resolveUserId.js";
import {
  getOrCreateWorkflowContext,
  upsertWorkflowContext
} from "./services/workflowContextService.js";
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

app.use("/internal/v1", internalWorkflowContextRouter);
app.use("/v1/integrations/telegram", telegramWebhookRouter);

const meRouter = express.Router();
meRouter.use(clerkAuthMiddleware);
meRouter.use(meWorkflowContextRouter);
meRouter.use(meTelegramRouter);
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

async function buildDraftResponse(
  userId: string,
  updateRequest?: string
): Promise<GenerateDraftResponse> {
  const record = await getOrCreateWorkflowContext(userId);
  const usedUpdateRequest = updateRequest?.trim() || null;
  const updateLine = usedUpdateRequest
    ? `Requested update: ${usedUpdateRequest}.`
    : "Requested update: none.";

  return {
    userId,
    post: [
      `Config: ${record.configText.slice(0, 120)}…`,
      `Style: ${record.styleText.slice(0, 120)}…`,
      `Schedule: ${record.scheduleText.slice(0, 120)}…`,
      updateLine,
      "Draft: This week I focused on shipping repeatable content operations that keep quality high while reducing turnaround time."
    ].join(" "),
    carouselArtifactUrl: `https://assets.example.local/carousels/${userId}/latest.png`,
    targets: DELIVERY_CHANNELS,
    usedUpdateRequest
  };
}

app.post("/v1/me/drafts/generate", clerkAuthMiddleware, async (req, res) => {
  const parsed = generateDraftSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }

  const userId = getAuth(req).internalUserId;
  try {
    return res.json(await buildDraftResponse(userId, parsed.data.updateRequest));
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
    return res.status(200).json({
      message: `Command ${parsed.data.command} accepted as placeholder`,
      supportedCommand: "/set-repeat"
    });
  }

  const cronExpression = parsed.data.text?.trim();
  if (!cronExpression) {
    return res.status(400).json({ error: "Missing cron expression. Usage: /set-repeat <cron>" });
  }

  try {
    const current = await getOrCreateWorkflowContext(parsed.data.user_id);
    const updated = await upsertWorkflowContext({
      ...current,
      cronExpression
    });

    return res.status(200).json({
      message: "Repeat schedule updated",
      userId: updated.userId,
      cronExpression: updated.cronExpression
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update schedule" });
  }
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
    return res.status(202).json({
      trigger: "scheduled",
      ...(await buildDraftResponse(userId, parsed.data.updateRequest))
    });
  } catch (err) {
    return res.status(500).json({ error: "Scheduled run failed" });
  }
});

app.post("/v1/inbound", (req, res) => {
  const parsed = inboundSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }

  return res.status(202).json({
    message: "Inbound event accepted",
    workflowState: "intake_received"
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
