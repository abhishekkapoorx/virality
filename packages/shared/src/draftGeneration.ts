import type { PromptContext } from "./prompts/promptContext.js";

type DeliveryChannel = "slack" | "web";

export function buildGenerateDraftResponse(
  userId: string,
  context: PromptContext,
  updateRequest?: string
) {
  const usedUpdateRequest = updateRequest?.trim() || null;
  const updateLine = usedUpdateRequest
    ? `Requested update: ${usedUpdateRequest}.`
    : "Requested update: none.";

  const targets: DeliveryChannel[] = ["slack", "web"];

  return {
    userId,
    post: [
      `Config: ${context.configText.slice(0, 120)}…`,
      `Style: ${context.styleText.slice(0, 120)}…`,
      `Schedule: ${context.scheduleText.slice(0, 120)}…`,
      updateLine,
      "Draft: This week I focused on shipping repeatable content operations that keep quality high while reducing turnaround time."
    ].join(" "),
    carouselArtifactUrl: `https://assets.example.local/carousels/${userId}/latest.png`,
    targets,
    usedUpdateRequest
  };
}