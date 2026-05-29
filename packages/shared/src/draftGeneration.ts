import type { PromptContext } from "./prompts/promptContext.js";

type DeliveryChannel = "slack" | "web";

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

  const targets: DeliveryChannel[] = ["slack", "web"];

  return {
    userId,
    post: finalState.draftText || "",
    carouselArtifactUrl: finalState.imageStorageUrl || finalState.imageUrl || "",
    targets,
    usedUpdateRequest: updateRequest?.trim() || null
  };
}