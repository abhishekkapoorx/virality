import { Router } from "express";

import { resolveUserId } from "../lib/resolveUserId.js";
import {
  getOrCreateWorkflowContext,
  toWorkflowContextBundle
} from "../services/workflowContextService.js";

export const internalWorkflowContextRouter = Router();

/** Worker / internal: bundle shape for LangGraph loadContext. */
internalWorkflowContextRouter.get("/workflow-context", async (req, res) => {
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
