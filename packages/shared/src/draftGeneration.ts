import type { PromptContext } from "./prompts/promptContext.js";

type DeliveryChannel = "telegram" | "web";

function extractDraftContent(rawDraft: string): string {
  const trimmed = rawDraft.trim();
  if (!trimmed) {
    return "";
  }

  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;

  const jsonStart = candidate.indexOf("{");
  const jsonEnd = candidate.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    try {
      const parsed = JSON.parse(candidate.slice(jsonStart, jsonEnd + 1)) as {
        draft?: unknown;
      };

      if (typeof parsed.draft === "string") {
        return parsed.draft.trim();
      }
    } catch {
      // Fall through to the plain-text cleanup below.
    }
  }

  if (candidate.startsWith("{")) {
    try {
      const parsed = JSON.parse(candidate) as { draft?: unknown };
      if (typeof parsed.draft === "string") {
        return parsed.draft.trim();
      }
    } catch {
      // Fall through to returning the original text.
    }
  }

  return candidate;
}

function summarizeContext(text: string, maxLength: number = 120): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) {
    return "";
  }

  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength - 1).trimEnd()}…`;
}

function chooseDraftTopic(context: PromptContext, updateRequest?: string): string {
  const requested = updateRequest?.trim();
  if (requested) {
    return requested.replace(/[.]+$/, "");
  }

  const sourceText = [
    context.configText,
    context.styleText,
    context.scheduleText,
    context.hookSystemText
  ]
    .join(" ")
    .toLowerCase();

  if (sourceText.includes("ai agent")) {
    return "the future of AI agents";
  }

  if (sourceText.includes("workflow") || sourceText.includes("system")) {
    return "repeatable content systems";
  }

  return "building a sharper content cadence";
}

export async function buildGenerateDraftResponse(
  userId: string,
  context: PromptContext,
  updateRequest: string | undefined,
  graph: any,
  tenantId: string = "tenant-1"
) {
  const finalState = await graph.invoke({
    conversationId: `draft-${userId}-${Date.now()}`,
    tenantId,
    userId,
    inboundText: updateRequest || "generate draft",
    userFeedback: updateRequest,
    transitions: []
  });

  if (finalState.error) {
    throw new Error(`Graph execution failed: ${finalState.error}`);
  }

  const targets: DeliveryChannel[] = ["telegram", "web"];
  const post = extractDraftContent(finalState.draftText || "");

  return {
    userId,
    post,
    carouselArtifactUrl: finalState.imageStorageUrl || finalState.imageUrl || "",
    targets,
    usedUpdateRequest: updateRequest?.trim() || null
  };
}