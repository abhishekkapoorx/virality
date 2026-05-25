import { prisma } from "../lib/prisma.js";
import { ChatGroq } from "@langchain/groq";
import { z } from "zod";
import type {
  OnboardingAnswers,
  OnboardingAnswersDraft,
  SetupDetailedDocs,
  SetupProfile
} from "@linkedin-agent/shared";
import {
  OnboardingAnswersDraftSchema,
  OnboardingAnswersSchema,
  SetupProfileSchema,
  buildSetupDetailedDocsPrompt,
  buildSetupEnrichmentPrompt
} from "@linkedin-agent/shared";

export type PersistedSetupProfile = {
  profile: SetupProfile;
  version: number;
};

export type SetupEnrichmentResult = {
  proofPoint: string;
  targetOutcome: string;
  constraint: string;
  enrichedAnswer: string;
};

const SetupEnrichmentResultSchema = z.object({
  proofPoint: z.string().min(1),
  targetOutcome: z.string().min(1),
  constraint: z.string().min(1),
  enrichedAnswer: z.string().min(1)
});

const TARGET_ICP_CARD_COUNT = 3;

function extractJsonObject(content: string): string {
  const trimmed = content.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

export class SetupValidationError extends Error {}

function normalizeDraftAnswers(draft: OnboardingAnswersDraft): OnboardingAnswersDraft {
  const cleanedIcps = Array.isArray(draft.icps)
    ? draft.icps.map((item) => item.trim()).filter(Boolean)
    : undefined;

  return {
    industry: draft.industry?.trim() || undefined,
    icps: cleanedIcps,
    topics: draft.topics?.trim() || undefined,
    writingStyle: draft.writingStyle?.trim() || undefined,
    brandVoice: draft.brandVoice?.trim() || undefined,
    personalizationNotes: draft.personalizationNotes?.trim() || undefined
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function generateDetailedDocs(answers: OnboardingAnswers): Promise<SetupDetailedDocs> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new SetupValidationError("GROQ_API_KEY is required to generate detailed setup docs.");
  }

  const model = process.env.GROQ_MODEL?.trim() || "llama-3.1-70b-versatile";
  const llm = new ChatGroq({
    apiKey,
    model,
    temperature: 0.2
  });

  const response = await llm.invoke([
    {
      role: "system",
      content:
        "You generate editable setup docs for LinkedIn writing. Return strict JSON only with the requested shape."
    },
    {
      role: "user",
      content: buildSetupDetailedDocsPrompt({ answers })
    }
  ]);

  const content = typeof response.content === "string" ? response.content.trim() : "";
  if (!content) {
    throw new SetupValidationError("Groq detailed-doc generation returned an empty response.");
  }

  const parsed = SetupProfileSchema.shape.detailedDocs.safeParse(JSON.parse(extractJsonObject(content)));
  if (!parsed.success || !parsed.data) {
    throw new SetupValidationError("Groq detailed-doc response did not match the expected enriched shape.");
  }

  if (parsed.data.icpCards.length !== TARGET_ICP_CARD_COUNT) {
    throw new SetupValidationError("Groq detailed-doc response must include exactly 3 ICP cards.");
  }

  return parsed.data;
}

export async function saveOnboardingAnswers(userId: string, answers: OnboardingAnswersDraft) {
  const parsed = OnboardingAnswersDraftSchema.parse(answers);
  const normalized = normalizeDraftAnswers(parsed);
  const previous = await prisma.userSetupAnswer.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  const previousAnswers = previous?.answers as Record<string, unknown> | undefined;
  const merged: OnboardingAnswersDraft = {
    industry:
      normalized.industry ??
      (typeof previousAnswers?.industry === "string" ? previousAnswers.industry : undefined),
    icps:
      normalized.icps ??
      (Array.isArray(previousAnswers?.icps)
        ? previousAnswers.icps.filter((item): item is string => typeof item === "string")
        : undefined),
    topics:
      normalized.topics ??
      (typeof previousAnswers?.topics === "string" ? previousAnswers.topics : undefined),
    writingStyle:
      normalized.writingStyle ??
      (typeof previousAnswers?.writingStyle === "string" ? previousAnswers.writingStyle : undefined),
    brandVoice:
      normalized.brandVoice ??
      (typeof previousAnswers?.brandVoice === "string" ? previousAnswers.brandVoice : undefined),
    personalizationNotes:
      normalized.personalizationNotes ??
      (typeof previousAnswers?.personalizationNotes === "string"
        ? previousAnswers.personalizationNotes
        : undefined)
  };

  return prisma.userSetupAnswer.create({
    data: {
      userId,
      answers: merged
    }
  });
}

/**
 * Very small stub extractor: in production this should call the LLM adapter.
 * For now, transform answers into a basic structured profile.
 */
export async function generateStructuredProfileFromAnswers(
  userId: string
): Promise<PersistedSetupProfile> {
  const row = await prisma.userSetupAnswer.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
  if (!row) {
    throw new SetupValidationError("No onboarding answers found for user");
  }

  const parsed = OnboardingAnswersSchema.safeParse(row.answers);
  if (!parsed.success) {
    throw new SetupValidationError("Please answer industry and at least one ICP before generating.");
  }

  const answers: OnboardingAnswers = parsed.data;

  const exampleAngles = answers.topics
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const detailedDocs = await generateDetailedDocs(answers);

  const profile: SetupProfile = {
    industry: answers.industry,
    icps: answers.icps,
    topics: answers.topics ?? undefined,
    writingStyle: answers.writingStyle ?? undefined,
    brandVoice: answers.brandVoice ?? undefined,
    personalizationNotes: answers.personalizationNotes ?? undefined,
    postConstraints: { detailedDocs },
    exampleAngles,
    detailedDocs
  };

  // Upsert profile
  const record = await prisma.userSetupProfile.upsert({
    where: { userId },
    create: {
      userId,
      industry: profile.industry,
      icps: profile.icps,
      writingStyle: profile.writingStyle,
      brandVoice: profile.brandVoice,
      personalizationNotes: profile.personalizationNotes,
      postConstraints: { detailedDocs },
      exampleAngles: exampleAngles ?? [],
      detailedDocs
    },
    update: {
      industry: profile.industry,
      icps: profile.icps,
      writingStyle: profile.writingStyle,
      brandVoice: profile.brandVoice,
      personalizationNotes: profile.personalizationNotes,
      postConstraints: { detailedDocs },
      exampleAngles: exampleAngles ?? [],
      detailedDocs,
      version: { increment: 1 }
    }
  });

  const postConstraints = isRecord(record.postConstraints) ? record.postConstraints : {};
  const persistedDocs = SetupProfileSchema.shape.detailedDocs.parse(record.detailedDocs ?? postConstraints.detailedDocs);

  return {
    version: record.version,
    profile: {
      industry: record.industry ?? profile.industry,
      icps: Array.isArray(record.icps) ? (record.icps as string[]) : profile.icps,
      topics: answers.topics ?? undefined,
      writingStyle: record.writingStyle ?? profile.writingStyle,
      brandVoice: record.brandVoice ?? profile.brandVoice,
      personalizationNotes: record.personalizationNotes ?? profile.personalizationNotes,
      postConstraints,
      exampleAngles: Array.isArray(record.exampleAngles)
        ? (record.exampleAngles as string[])
        : [],
      detailedDocs: persistedDocs
    }
  };
}

export async function updateSetupDetailedDocs(userId: string, detailedDocs: SetupDetailedDocs) {
  const existing = await prisma.userSetupProfile.findUnique({ where: { userId } });
  if (!existing) {
    throw new SetupValidationError("Generate your setup profile before editing detailed docs.");
  }

  const postConstraints = isRecord(existing.postConstraints) ? existing.postConstraints : {};
  const nextPostConstraints = {
    ...postConstraints,
    detailedDocs
  };

  const updated = await prisma.userSetupProfile.update({
    where: { userId },
    data: {
      detailedDocs,
      postConstraints: nextPostConstraints,
      version: { increment: 1 }
    }
  });

  return {
    detailedDocs,
    version: updated.version
  };
}

export async function updateSetupProfileSummary(
  userId: string,
  summary: Pick<SetupProfile, "industry" | "icps" | "writingStyle" | "brandVoice" | "personalizationNotes">
) {
  const existing = await prisma.userSetupProfile.findUnique({ where: { userId } });
  if (!existing) {
    throw new SetupValidationError("Generate your setup profile before editing the profile summary.");
  }

  const updated = await prisma.userSetupProfile.update({
    where: { userId },
    data: {
      industry: summary.industry,
      icps: summary.icps,
      writingStyle: summary.writingStyle,
      brandVoice: summary.brandVoice,
      personalizationNotes: summary.personalizationNotes,
      version: { increment: 1 }
    }
  });

  return {
    profile: {
      industry: updated.industry,
      icps: Array.isArray(updated.icps) ? (updated.icps as string[]) : summary.icps,
      writingStyle: updated.writingStyle,
      brandVoice: updated.brandVoice,
      personalizationNotes: updated.personalizationNotes
    },
    version: updated.version
  };
}

export async function generateAndPersistSetupDetailedDocs(userId: string) {
  const profile = await prisma.userSetupProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new SetupValidationError("Generate your setup profile before generating detailed docs.");
  }

  const row = await prisma.userSetupAnswer.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
  if (!row) {
    throw new SetupValidationError("No onboarding answers found for user");
  }

  const parsed = OnboardingAnswersSchema.safeParse(row.answers);
  if (!parsed.success) {
    throw new SetupValidationError("Please answer industry and at least one ICP before generating detailed docs.");
  }

  const detailedDocs = await generateDetailedDocs(parsed.data);
  const postConstraints = isRecord(profile.postConstraints) ? profile.postConstraints : {};

  const updated = await prisma.userSetupProfile.update({
    where: { userId },
    data: {
      detailedDocs,
      postConstraints: {
        ...postConstraints,
        detailedDocs
      },
      version: { increment: 1 }
    }
  });

  return {
    detailedDocs,
    version: updated.version
  };
}

export async function loadSetupBundle(userId: string) {
  const profile = await prisma.userSetupProfile.findUnique({ where: { userId } });
  const latestAnswers = await prisma.userSetupAnswer.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
  const schedule = await prisma.weeklyPostSchedule.findFirst({ where: { userId } });

  return {
    profile,
    latestAnswers,
    schedule,
    isComplete: Boolean(profile && schedule)
  };
}

async function callSetupEnrichmentLlm(prompt: string): Promise<SetupEnrichmentResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new SetupValidationError("GROQ_API_KEY is required for Generate with AI.");
  }

  const model = process.env.GROQ_MODEL?.trim() || "llama-3.1-70b-versatile";
  const llm = new ChatGroq({
    apiKey,
    model,
    temperature: 0.4
  });

  const response = await llm.invoke([
    {
      role: "system",
      content:
        "You refine onboarding answers for LinkedIn post writing. Return JSON only with proofPoint, targetOutcome, constraint, and enrichedAnswer."
    },
    {
      role: "user",
      content: prompt
    }
  ]);

  const content = typeof response.content === "string" ? response.content.trim() : "";
  if (!content) {
    throw new SetupValidationError("Groq enrichment returned an empty response.");
  }

  const jsonText = extractJsonObject(content);
  const parsed = SetupEnrichmentResultSchema.safeParse(JSON.parse(jsonText));
  if (!parsed.success) {
    throw new SetupValidationError("Groq enrichment response did not match the expected shape.");
  }

  return parsed.data;
}

export async function enrichOnboardingAnswer(
  question: string,
  answer: string
): Promise<SetupEnrichmentResult | null> {
  const trimmedQuestion = question.trim();
  const trimmedAnswer = answer.trim();

  if (!trimmedAnswer) {
    return null;
  }

  const prompt = buildSetupEnrichmentPrompt({
    question: trimmedQuestion,
    answer: trimmedAnswer
  });

  return callSetupEnrichmentLlm(prompt);
}
