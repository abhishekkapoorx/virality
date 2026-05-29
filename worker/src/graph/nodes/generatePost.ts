import type { Container } from "../../container.js";
import type { GraphState } from "../state.js";
import { WORKFLOW_STATES } from "../state.js";

/** n8n: Generate Post */
export async function generatePostNode(
  state: GraphState,
  ctx: Container
): Promise<Partial<GraphState>> {
  if (state.error) return {};
    if (!state.promptContext || !state.postType || !state.hookChoice) {
      return {
        error: "missing context for generatePost"
      };
  }

  const entering = {
    ts: ctx.clock.isoNow(),
    from: WORKFLOW_STATES.HookSelected,
    to: WORKFLOW_STATES.DraftGenerating
  };

  try {
    const result = await ctx.llm.generatePost({
      conversationId: state.conversationId,
      tenantId: state.tenantId,
      userId: state.userId,
        context: state.promptContext,
      postType: state.postType,
      hook: state.hookChoice
    });

    return {
      draftText: result.draft,
      transitions: [entering]
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
      transitions: [entering]
    };
  }
}
