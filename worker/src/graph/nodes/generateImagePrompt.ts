import type { Container } from "../../container.js";
import type { GraphState } from "../state.js";
import { WORKFLOW_STATES } from "../state.js";

/** n8n: Generate Prompt to Generate Image */
export async function generateImagePromptNode(
  state: GraphState,
  ctx: Container
): Promise<Partial<GraphState>> {
  if (state.error) return {};
  if (!state.promptContext || !state.postType || !state.draftText) {
    return { error: "missing context for generateImagePrompt" };
  }

  try {
    const imagePrompt = await ctx.llm.generateImagePrompt({
      conversationId: state.conversationId,
      tenantId: state.tenantId,
      userId: state.userId,
      context: state.promptContext,
      postType: state.postType,
      draft: state.draftText
    });

    return {
      imagePrompt,
      transitions: [
        {
          ts: ctx.clock.isoNow(),
          from: WORKFLOW_STATES.DraftGenerating,
          to: WORKFLOW_STATES.DraftReady,
          note: "image prompt ready"
        }
      ]
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
      transitions: [
        {
          ts: ctx.clock.isoNow(),
          from: WORKFLOW_STATES.DraftGenerating,
          to: WORKFLOW_STATES.Failed,
          note: "generateImagePrompt failed"
        }
      ]
    };
  }
}
