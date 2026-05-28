import { Router } from "express";

import { resolveUserId } from "../lib/resolveUserId.js";
import {
  getOrCreateWorkflowContext,
  toWorkflowContextBundle
} from "../services/workflowContextService.js";

export const internalPromptContextRouter = Router();

/** Worker / internal: bundle shape for LangGraph loadContext. */
internalPromptContextRouter.get("/prompt-context", async (req, res) => {
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
    console.error("GET internal prompt-context failed", err);
    return res.status(500).json({ error: "Failed to load prompt context bundle" });
  }
});
