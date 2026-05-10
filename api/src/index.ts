import "dotenv/config";
import cors from "cors";
import express from "express";
import { z } from "zod";
import {
  DELIVERY_CHANNELS,
  type GenerateDraftResponse,
  type WorkflowPreferencesRecord
} from "@linkedin-agent/shared";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    service: "api",
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

app.get("/health/ready", (_req, res) => {
  res.json({
    service: "api",
    status: "ok",
    timestamp: new Date().toISOString(),
    dependencies: {
      databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
      redisUrlConfigured: Boolean(process.env.REDIS_URL)
    }
  });
});

const inboundSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  text: z.string().min(1)
});

const workflowPreferencesStore = new Map<string, WorkflowPreferencesRecord>();

const workflowPreferencesSchema = z.object({
  userId: z.string().min(1),
  writingStyle: z.string().min(1),
  weeklyCalendar: z.string().min(1),
  carouselDesignLanguage: z.string().min(1),
  cronExpression: z.string().min(1)
});

const generateDraftSchema = z.object({
  userId: z.string().min(1),
  updateRequest: z.string().min(1).optional()
});

const slackCommandSchema = z.object({
  command: z.string().min(1),
  text: z.string().optional(),
  user_id: z.string().min(1)
});

function defaultPreferences(userId: string): WorkflowPreferencesRecord {
  return {
    userId,
    writingStyle: "Professional, direct, and practical with one clear takeaway.",
    weeklyCalendar: "Mon-Fri 09:00-18:00 local time, avoid weekends.",
    carouselDesignLanguage: "Clean cards with strong headers, concise bullets, high contrast.",
    cronExpression: "0 9 * * 1",
    updatedAt: new Date().toISOString()
  };
}

function getPreferences(userId: string): WorkflowPreferencesRecord {
  return workflowPreferencesStore.get(userId) ?? defaultPreferences(userId);
}

function buildDraftResponse(
  userId: string,
  updateRequest?: string
): GenerateDraftResponse {
  const preferences = getPreferences(userId);
  const usedUpdateRequest = updateRequest?.trim() || null;
  const updateLine = usedUpdateRequest
    ? `Requested update: ${usedUpdateRequest}.`
    : "Requested update: none.";

  return {
    userId,
    post: [
      `Writing style: ${preferences.writingStyle}`,
      `Weekly context: ${preferences.weeklyCalendar}`,
      updateLine,
      "Draft: This week I focused on shipping repeatable content operations that keep quality high while reducing turnaround time."
    ].join(" "),
    carouselArtifactUrl: `https://assets.example.local/carousels/${userId}/latest.png`,
    targets: DELIVERY_CHANNELS,
    usedUpdateRequest
  };
}

app.get("/v1/me/workflow-preferences", (req, res) => {
  const userId = z.string().min(1).safeParse(req.query.userId);
  if (!userId.success) {
    return res.status(400).json({ error: "userId query parameter is required" });
  }

  return res.json(getPreferences(userId.data));
});

app.put("/v1/me/workflow-preferences", (req, res) => {
  const parsed = workflowPreferencesSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }

  const updated: WorkflowPreferencesRecord = {
    ...parsed.data,
    updatedAt: new Date().toISOString()
  };
  workflowPreferencesStore.set(updated.userId, updated);
  return res.json(updated);
});

app.post("/v1/me/drafts/generate", (req, res) => {
  const parsed = generateDraftSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }

  return res.json(buildDraftResponse(parsed.data.userId, parsed.data.updateRequest));
});

app.post("/v1/integrations/slack/commands", (req, res) => {
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

  const current = getPreferences(parsed.data.user_id);
  const updated: WorkflowPreferencesRecord = {
    ...current,
    cronExpression,
    updatedAt: new Date().toISOString()
  };
  workflowPreferencesStore.set(updated.userId, updated);

  return res.status(200).json({
    message: "Repeat schedule updated",
    userId: updated.userId,
    cronExpression: updated.cronExpression
  });
});

app.post("/internal/jobs/scheduled-draft-run", (req, res) => {
  const parsed = generateDraftSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }

  return res.status(202).json({
    trigger: "scheduled",
    ...buildDraftResponse(parsed.data.userId, parsed.data.updateRequest)
  });
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
  // Intentional single startup log for container health diagnostics
  console.log(`API running on http://localhost:${port}`);
});
