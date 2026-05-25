import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { getAuth } from "../types/auth.js";
import {
  saveOnboardingAnswers,
  generateStructuredProfileFromAnswers,
  loadSetupBundle,
  SetupValidationError,
  enrichOnboardingAnswer,
  updateSetupDetailedDocs,
  generateAndPersistSetupDetailedDocs,
  updateSetupProfileSummary
} from "../services/setupService.js";
import {
  OnboardingAnswersDraftSchema,
  SetupProfileSchema,
  SetupGenerationResponseSchema
} from "@linkedin-agent/shared";
import { z } from "zod";

export const meSetupRouter = Router();

const EnrichRequestSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1)
});

const SetupDetailedDocsSchema = SetupProfileSchema.shape.detailedDocs;
const SetupProfileSummarySchema = z.object({
  industry: z.string().min(1),
  icps: z.array(z.string().min(1)).min(1),
  writingStyle: z.string().optional(),
  brandVoice: z.string().optional(),
  personalizationNotes: z.string().optional()
});

meSetupRouter.get("/setup", async (req, res) => {
  try {
    const userId = getAuth(req).internalUserId;
    const bundle = await loadSetupBundle(userId);
    return res.json(bundle);
  } catch (err) {
    console.error("GET /me/setup failed", err);
    return res.status(500).json({ error: "Failed to load setup" });
  }
});

meSetupRouter.put("/setup/answers", async (req, res) => {
  try {
    const parsed = OnboardingAnswersDraftSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
    }
    const userId = getAuth(req).internalUserId;
    await saveOnboardingAnswers(userId, parsed.data);
    return res.status(204).send();
  } catch (err) {
    console.error("PUT /me/setup/answers failed", err);
    return res.status(500).json({ error: "Failed to save answers" });
  }
});

meSetupRouter.post("/setup/generate", async (req, res) => {
  try {
    const userId = getAuth(req).internalUserId;
    const bodyParsed = OnboardingAnswersDraftSchema.safeParse(req.body ?? {});
    if (!bodyParsed.success) {
      return res.status(400).json({ error: "Invalid payload", issues: bodyParsed.error.issues });
    }

    if (Object.keys(bodyParsed.data).length > 0) {
      await saveOnboardingAnswers(userId, bodyParsed.data);
    }

    const response = await generateStructuredProfileFromAnswers(userId);
    const parsed = SetupGenerationResponseSchema.safeParse(response);
    if (!parsed.success) {
      console.error("Generated profile validation failed", parsed.error);
      return res.status(500).json({ error: "Profile generation failed validation" });
    }
    return res.json(parsed.data);
  } catch (err) {
    if (err instanceof SetupValidationError) {
      return res.status(400).json({ error: err.message });
    }
    console.error("POST /me/setup/generate failed", err);
    return res.status(500).json({ error: "Failed to generate profile" });
  }
});

meSetupRouter.post("/setup/complete", async (req, res) => {
  try {
    const userId = getAuth(req).internalUserId;
    // create a default (disabled) weekly schedule if none exists
    const existing = await prisma.weeklyPostSchedule.findFirst({ where: { userId } });
    if (!existing) {
      await prisma.weeklyPostSchedule.create({
        data: { userId, schedule: {}, enabled: false, cronExpr: null }
      });
    }
    const bundle = await loadSetupBundle(userId);
    return res.json(bundle);
  } catch (err) {
    console.error("POST /me/setup/complete failed", err);
    return res.status(500).json({ error: "Failed to complete setup" });
  }
});

meSetupRouter.post("/setup/enrich", async (req, res) => {
  try {
    const parsed = EnrichRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
    }

    const enriched = await enrichOnboardingAnswer(parsed.data.question, parsed.data.answer);
    if (!enriched) {
      return res.status(400).json({ error: "Add an answer first, then enrich it with AI." });
    }

    return res.json(enriched);
  } catch (err) {
    console.error("POST /me/setup/enrich failed", err);
    return res.status(500).json({ error: "Failed to enrich answer" });
  }
});

meSetupRouter.put("/setup/profile-docs", async (req, res) => {
  try {
    const parsed = SetupDetailedDocsSchema.safeParse(req.body);
    if (!parsed.success || !parsed.data) {
      return res.status(400).json({ error: "Invalid payload", issues: parsed.error?.issues });
    }

    const userId = getAuth(req).internalUserId;
    const updated = await updateSetupDetailedDocs(userId, parsed.data);
    return res.json(updated);
  } catch (err) {
    if (err instanceof SetupValidationError) {
      return res.status(400).json({ error: err.message });
    }
    console.error("PUT /me/setup/profile-docs failed", err);
    return res.status(500).json({ error: "Failed to update profile docs" });
  }
});

meSetupRouter.put("/setup/profile", async (req, res) => {
  try {
    const parsed = SetupProfileSummarySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
    }

    const userId = getAuth(req).internalUserId;
    const updated = await updateSetupProfileSummary(userId, parsed.data);
    return res.json(updated);
  } catch (err) {
    if (err instanceof SetupValidationError) {
      return res.status(400).json({ error: err.message });
    }
    console.error("PUT /me/setup/profile failed", err);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

meSetupRouter.post("/setup/profile-docs/generate", async (req, res) => {
  try {
    const userId = getAuth(req).internalUserId;
    const updated = await generateAndPersistSetupDetailedDocs(userId);
    return res.json(updated);
  } catch (err) {
    if (err instanceof SetupValidationError) {
      return res.status(400).json({ error: err.message });
    }
    console.error("POST /me/setup/profile-docs/generate failed", err);
    return res.status(500).json({ error: "Failed to generate detailed docs" });
  }
});
