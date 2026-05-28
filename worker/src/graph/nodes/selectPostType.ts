import type { Container } from "../../container.js";
import type { GraphState } from "../state.js";
import { WORKFLOW_STATES } from "../state.js";

/** n8n: Get Post Type from Docs */
export async function selectPostTypeNode(
  state: GraphState,
  ctx: Container
): Promise<Partial<GraphState>> {
  if (state.error) return {};
  if (!state.promptContext) {
    return { error: "promptContext missing before selectPostType" };
  }

  try {
    const postType = await ctx.llm.selectPostType({
      conversationId: state.conversationId,
      tenantId: state.tenantId,
      userId: state.userId,
      context: state.promptContext
    });

    return {
      postType,
      transitions: [
        {
          ts: ctx.clock.isoNow(),
          from: WORKFLOW_STATES.ContextLoaded,
          to: WORKFLOW_STATES.PostTypeSelected
        }
      ]
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
      transitions: [
        {
          ts: ctx.clock.isoNow(),
          from: WORKFLOW_STATES.ContextLoaded,
          to: WORKFLOW_STATES.Failed,
          note: "selectPostType failed"
        }
      ]
    };
  }
}
