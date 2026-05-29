import { Router } from "express";
import { z } from "zod";

import { getAuth } from "../types/auth.js";
import { analyzePostDissection, PostDissectionValidationError } from "../services/postDissectionService.js";

export const mePostDissectionRouter = Router();

const AnalyzeRequestSchema = z.object({
  postText: z.string().min(1)
});

mePostDissectionRouter.post("/post-disection/analyze", async (req, res) => {
  try {
    const parsed = AnalyzeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
    }

    getAuth(req).internalUserId;
    const result = await analyzePostDissection(parsed.data.postText);
    return res.json(result);
  } catch (error) {
    if (error instanceof PostDissectionValidationError) {
      return res.status(400).json({ error: error.message });
    }

    console.error("POST /me/post-disection/analyze failed", error);
    return res.status(500).json({ error: "Failed to analyze post" });
  }
});