import { Router } from "express";
import {
  UserWorkflowContextUpsertSchema,
  type WorkflowPreferencesRecord
} from "@linkedin-agent/shared";

import {
  getOrCreateWorkflowContext,
  upsertWorkflowContext
} from "../services/workflowContextService.js";
import { getAuth } from "../types/auth.js";

export const meWorkflowContextRouter = Router();

meWorkflowContextRouter.get("/workflow-context", async (req, res) => {
  try {
    const userId = getAuth(req).internalUserId;
    const record = await getOrCreateWorkflowContext(userId);
    return res.json(record);
  } catch {
    return res.status(500).json({ error: "Failed to load workflow context" });
  }
});

meWorkflowContextRouter.put("/workflow-context", async (req, res) => {
  const userId = getAuth(req).internalUserId;
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
  } catch {
    return res.status(500).json({ error: "Failed to save workflow context" });
  }
});

meWorkflowContextRouter.get("/workflow-preferences", async (req, res) => {
  try {
    const userId = getAuth(req).internalUserId;
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
  } catch {
    return res.status(500).json({ error: "Failed to load preferences" });
  }
});

meWorkflowContextRouter.put("/workflow-preferences", async (req, res) => {
  const userId = getAuth(req).internalUserId;
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
  } catch {
    return res.status(500).json({ error: "Failed to save preferences" });
  }
});

/** Authenticated profile stub until full profile routes ship. */
meWorkflowContextRouter.get("/profile", async (req, res) => {
  const auth = getAuth(req);
  return res.json({
    userId: auth.internalUserId,
    clerkUserId: auth.clerkUserId,
    tenantId: auth.tenantId
  });
});
