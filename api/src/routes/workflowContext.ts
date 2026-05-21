import { Router } from "express";
import {
  UserWorkflowContextUpsertSchema,
  type WorkflowPreferencesRecord
} from "@linkedin-agent/shared";

import { resolveUserId } from "../lib/resolveUserId.js";
import {
  getOrCreateWorkflowContext,
  toWorkflowContextBundle,
  upsertWorkflowContext
} from "../services/workflowContextService.js";

export const workflowContextRouter = Router();

/** User-facing CRUD for prompt context (replaces Google Docs). */
workflowContextRouter.get("/v1/me/workflow-context", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const record = await getOrCreateWorkflowContext(userId);
    return res.json(record);
  } catch (err) {
    console.error("GET workflow-context failed", err);
    return res.status(500).json({ error: "Failed to load workflow context" });
  }
});

workflowContextRouter.put("/v1/me/workflow-context", async (req, res) => {
  const userId = resolveUserId(req);
  const parsed = UserWorkflowContextUpsertSchema.safeParse({
    ...req.body,
    userId
  });
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid payload",
      issues: parsed.error.issues
    });
  }

  try {
    const record = await upsertWorkflowContext(parsed.data);
    return res.json(record);
  } catch (err) {
    console.error("PUT workflow-context failed", err);
    return res.status(500).json({ error: "Failed to save workflow context" });
  }
});

/**
 * Back-compat alias: maps workflow-context → legacy WorkflowPreferences shape
 * so existing web generate flow keeps working during UI migration.
 */
workflowContextRouter.get("/v1/me/workflow-preferences", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const record = await getOrCreateWorkflowContext(userId);
    const legacy: WorkflowPreferencesRecord = {
      userId: record.userId,
      writingStyle: record.styleText,
      weeklyCalendar: record.scheduleText,
      carouselDesignLanguage: record.carouselDesignLanguage,
      cronExpression: record.cronExpression,
      updatedAt: record.updatedAt
    };
    return res.json(legacy);
  } catch (err) {
    return res.status(500).json({ error: "Failed to load preferences" });
  }
});

workflowContextRouter.put("/v1/me/workflow-preferences", async (req, res) => {
  const userId = resolveUserId(req);
  const body = req.body as {
    writingStyle?: string;
    weeklyCalendar?: string;
    carouselDesignLanguage?: string;
    cronExpression?: string;
  };

  try {
    const current = await getOrCreateWorkflowContext(userId);
    const record = await upsertWorkflowContext({
      userId,
      configText: current.configText,
      styleText: body.writingStyle ?? current.styleText,
      scheduleText: body.weeklyCalendar ?? current.scheduleText,
      hookSystemText: current.hookSystemText,
      carouselDesignLanguage:
        body.carouselDesignLanguage ?? current.carouselDesignLanguage,
      cronExpression: body.cronExpression ?? current.cronExpression
    });
    const legacy: WorkflowPreferencesRecord = {
      userId: record.userId,
      writingStyle: record.styleText,
      weeklyCalendar: record.scheduleText,
      carouselDesignLanguage: record.carouselDesignLanguage,
      cronExpression: record.cronExpression,
      updatedAt: record.updatedAt
    };
    return res.json(legacy);
  } catch (err) {
    return res.status(500).json({ error: "Failed to save preferences" });
  }
});

/** Worker / internal: bundle shape for LangGraph loadContext. */
workflowContextRouter.get("/internal/v1/workflow-context", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const feedback =
      typeof req.query.userFeedback === "string"
        ? req.query.userFeedback
        : undefined;
    const record = await getOrCreateWorkflowContext(userId);
    return res.json(
      toWorkflowContextBundle(record, { userFeedback: feedback })
    );
  } catch (err) {
    console.error("GET internal workflow-context failed", err);
    return res.status(500).json({ error: "Failed to load workflow context bundle" });
  }
});
