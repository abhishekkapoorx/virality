import { ChatGroq } from "@langchain/groq";
import { z } from "zod";

const AnalysisHookSchema = z.object({
  title: z.string().min(1),
  shortDescription: z.string().min(1),
  longDescription: z.string().min(1),
  icon: z.string().optional(),
  tags: z.array(z.string().min(1)).default([]),
  examples: z.array(z.string().min(1)).default([]),
  whenToUse: z.string().min(1),
  psychologicalEffect: z.string().min(1)
});

const AnalysisPostStyleSchema = z.object({
  title: z.string().min(1),
  shortDescription: z.string().min(1),
  longDescription: z.string().min(1),
  icon: z.string().optional(),
  tags: z.array(z.string().min(1)).default([]),
  structure: z.string().min(1),
  expectedHooks: z.array(z.string().min(1)).default([]),
  outcome: z.string().min(1)
});

const PostDissectionResultSchema = z.object({
  thesis: z.string().min(1),
  audience: z.string().min(1),
  cta: z.string().min(1),
  emotionalTrigger: z.string().min(1),
  proofType: z.string().min(1),
  alternateHooks: z.array(z.string().min(1)).min(3).max(5),
  hook: AnalysisHookSchema,
  postStyle: AnalysisPostStyleSchema
});

export type PostDissectionResult = z.infer<typeof PostDissectionResultSchema>;

type LooseRecord = Record<string, unknown>;

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

function sanitizeJsonText(jsonText: string): string {
  let sanitized = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < jsonText.length; index += 1) {
    const character = jsonText[index];

    if (!inString) {
      sanitized += character;

      if (character === '"') {
        inString = true;
      }

      continue;
    }

    if (escaped) {
      sanitized += character;
      escaped = false;
      continue;
    }

    if (character === "\\") {
      sanitized += character;
      escaped = true;
      continue;
    }

    if (character === '"') {
      sanitized += character;
      inString = false;
      continue;
    }

    switch (character) {
      case "\b":
        sanitized += "\\b";
        break;
      case "\f":
        sanitized += "\\f";
        break;
      case "\n":
        sanitized += "\\n";
        break;
      case "\r":
        sanitized += "\\r";
        break;
      case "\t":
        sanitized += "\\t";
        break;
      default: {
        const code = character.charCodeAt(0);
        if (code < 0x20) {
          sanitized += `\\u${code.toString(16).padStart(4, "0")}`;
        } else {
          sanitized += character;
        }
      }
    }
  }

  return sanitized;
}

function asString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|,/) 
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function asRecord(value: unknown): LooseRecord | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as LooseRecord;
  }

  return null;
}

function firstPresent(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function normalizeHook(value: unknown): LooseRecord {
  const record = asRecord(value) ?? {};

  return {
    title: asString(firstPresent(record.title, record.name, record.hookTitle, record.label)),
    shortDescription: asString(firstPresent(record.shortDescription, record.short_description, record.summary, record.description)),
    longDescription: asString(firstPresent(record.longDescription, record.long_description, record.details, record.notes, record.description)),
    icon: asString(firstPresent(record.icon, record.symbol)),
    tags: asStringArray(firstPresent(record.tags, record.tagList, record.keywords)),
    examples: asStringArray(firstPresent(record.examples, record.exampleLines, record.openers)),
    whenToUse: asString(firstPresent(record.whenToUse, record.when_to_use, record.context)),
    psychologicalEffect: asString(firstPresent(record.psychologicalEffect, record.psychological_effect, record.effect, record.readerEffect))
  };
}

function normalizePostStyle(value: unknown): LooseRecord {
  const record = asRecord(value) ?? {};

  return {
    title: asString(firstPresent(record.title, record.name, record.styleTitle, record.label)),
    shortDescription: asString(firstPresent(record.shortDescription, record.short_description, record.summary, record.description)),
    longDescription: asString(firstPresent(record.longDescription, record.long_description, record.details, record.notes, record.description)),
    icon: asString(firstPresent(record.icon, record.symbol)),
    tags: asStringArray(firstPresent(record.tags, record.tagList, record.keywords)),
    structure: asString(firstPresent(record.structure, record.postStructure, record.format)),
    expectedHooks: asStringArray(firstPresent(record.expectedHooks, record.expected_hooks, record.hooks)),
    outcome: asString(firstPresent(record.outcome, record.expectedOutcome, record.result, record.goal))
  };
}

function normalizeDissectionPayload(value: unknown): LooseRecord {
  const record = asRecord(value) ?? {};

  return {
    thesis: asString(firstPresent(record.thesis, record.angle, record.corePoint, record.core_message)),
    audience: asString(firstPresent(record.audience, record.targetAudience, record.readers)),
    cta: asString(firstPresent(record.cta, record.callToAction, record.nextStep)),
    emotionalTrigger: asString(firstPresent(record.emotionalTrigger, record.emotion, record.primaryEmotion, record.trigger)),
    proofType: asString(firstPresent(record.proofType, record.proof_type, record.evidence, record.credibility, record.proof)),
    alternateHooks: asStringArray(firstPresent(record.alternateHooks, record.alternate_hooks, record.altHooks, record.hooks)),
    hook: normalizeHook(firstPresent(record.hook, record.openingHook, record.opening_hook, record.hookDefinition)),
    postStyle: normalizePostStyle(firstPresent(record.postStyle, record.post_style, record.style, record.postType, record.post_type))
  };
}

export class PostDissectionValidationError extends Error {}

export function parsePostDissectionResult(content: string): PostDissectionResult {
  const jsonText = extractJsonObject(content);
  const parsedJson = JSON.parse(sanitizeJsonText(jsonText)) as unknown;
  const normalizedPayload = normalizeDissectionPayload(parsedJson);
  const parsed = PostDissectionResultSchema.safeParse(normalizedPayload);

  if (!parsed.success) {
    throw new PostDissectionValidationError(
      `Dissection response did not match the expected shape: ${parsed.error.issues.map((issue) => issue.path.join(".") || "root").join(", ")}`
    );
  }

  return parsed.data;
}

function buildPrompt(postText: string): string {
  return [
    "Dissect the LinkedIn post below into reusable content strategy data.",
    "Return exactly one valid JSON object and nothing else.",
    "Do not wrap the response in markdown, code fences, comments, or prose.",
    "Do not omit any required key.",
    "All values must be strings or arrays of strings. No nulls, no numbers, no nested objects except hook and postStyle.",
    "If you are uncertain, infer the best specific answer from the post itself instead of guessing generic advice.",
    "Use this exact JSON structure and keep the keys in the same shape:",
    "{",
    '  "thesis": "string",',
    '  "audience": "string",',
    '  "cta": "string",',
    '  "emotionalTrigger": "string",',
    '  "proofType": "string",',
    '  "alternateHooks": ["string"],',
    '  "hook": {',
    '    "title": "string",',
    '    "shortDescription": "string",',
    '    "longDescription": "string",',
    '    "icon": "string",',
    '    "tags": ["string"],',
    '    "examples": ["string"],',
    '    "whenToUse": "string",',
    '    "psychologicalEffect": "string"',
    "  },",
    '  "postStyle": {',
    '    "title": "string",',
    '    "shortDescription": "string",',
    '    "longDescription": "string",',
    '    "icon": "string",',
    '    "tags": ["string"],',
    '    "structure": "string",',
    '    "expectedHooks": ["string"],',
    '    "outcome": "string"',
    "  }",
    "}",
    "Field rules:",
    "- thesis: one sentence on the post's core point or angle.",
    "- audience: who the post is trying to reach.",
    "- cta: the call-to-action or intended next step.",
    "- emotionalTrigger: the primary emotional lever.",
    "- proofType: what kind of evidence or credibility is used.",
    "- alternateHooks: 3 to 5 alternate opening hooks, each specific to this post.",
    "- hook.title: a reusable label for the hook pattern.",
    "- hook.shortDescription: one sentence summary.",
    "- hook.longDescription: 2 to 4 sentences describing the hook pattern.",
    "- hook.icon: a short icon label such as Sparkles, Target, Lightning, or Quote.",
    "- hook.tags: 3 to 6 short tags.",
    "- hook.examples: 2 to 4 concrete opening lines.",
    "- hook.whenToUse: the post context where this opening works best.",
    "- hook.psychologicalEffect: what the reader feels or notices first.",
    "- postStyle.title: a reusable label for the post structure.",
    "- postStyle.shortDescription: one sentence summary.",
    "- postStyle.longDescription: 2 to 4 sentences describing the structure.",
    "- postStyle.icon: a short icon label such as CalendarDays, ScrollText, Layers, or Compass.",
    "- postStyle.tags: 3 to 6 short tags.",
    "- postStyle.structure: a plain text outline of the actual post structure using ordered steps or bullet lines; this field must never be empty.",
    "- postStyle.expectedHooks: 3 to 6 hooks that fit this structure.",
    "- postStyle.outcome: the reader outcome after reading the post.",
    "Important: postStyle.structure must be a STRING, not an array or object. Format it as a compact outline such as '1. Hook\n2. Tension\n3. Lesson\n4. CTA'.",
    "Use concise language. Keep outputs specific to the post, not generic advice.",
    "",
    "POST:",
    postText.trim()
  ].join("\n");
}

export async function analyzePostDissection(postText: string): Promise<PostDissectionResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new PostDissectionValidationError("GROQ_API_KEY is required to analyze a post.");
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
        "You are a content strategist that returns only valid JSON. Do not use markdown, comments, or trailing text."
    },
    {
      role: "user",
      content: buildPrompt(postText)
    }
  ]);

  const content = typeof response.content === "string" ? response.content.trim() : "";
  console.log("Raw LLM response:", content);
  if (!content) {
    throw new PostDissectionValidationError("Dissection analysis returned an empty response.");
  }

  return parsePostDissectionResult(content);
}