import type { Container } from "../../container.js";
import type { GraphState } from "../state.js";
import { WORKFLOW_STATES } from "../state.js";

/** n8n: Generate an image */
export async function generateImageNode(
  state: GraphState,
  ctx: Container
): Promise<Partial<GraphState>> {
  if (state.error) return {};
  if (!state.imagePrompt) {
    return { error: "imagePrompt missing before generateImage" };
  }

  try {
    const result = await ctx.image.generate({
      prompt: state.imagePrompt,
      conversationId: state.conversationId
    });

    return {
      imageUrl: result.imageUrl,
      transitions: [
        {
          ts: ctx.clock.isoNow(),
          from: WORKFLOW_STATES.DraftReady,
          to: WORKFLOW_STATES.ImageReady
        }
      ]
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
      transitions: [
        {
          ts: ctx.clock.isoNow(),
          from: WORKFLOW_STATES.DraftReady,
          to: WORKFLOW_STATES.Failed,
          note: "generateImage failed"
        }
      ]
    };
  }
}
