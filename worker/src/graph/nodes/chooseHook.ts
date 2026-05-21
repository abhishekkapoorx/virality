import type { Container } from "../../container.js";
import type { GraphState } from "../state.js";
import { WORKFLOW_STATES } from "../state.js";

/** n8n: Choose Best Hook */
export async function chooseHookNode(
  state: GraphState,
  ctx: Container
): Promise<Partial<GraphState>> {
  if (state.error) return {};
  if (!state.workflowContext || !state.postType) {
    return { error: "workflowContext or postType missing before chooseHook" };
  }

  try {
    const hookChoice = await ctx.llm.chooseHook({
      conversationId: state.conversationId,
      tenantId: state.tenantId,
      userId: state.userId,
      context: state.workflowContext,
      postType: state.postType
    });

    return {
      hookChoice,
      transitions: [
        {
          ts: ctx.clock.isoNow(),
          from: WORKFLOW_STATES.PostTypeSelected,
          to: WORKFLOW_STATES.HookSelected
        }
      ]
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
      transitions: [
        {
          ts: ctx.clock.isoNow(),
          from: WORKFLOW_STATES.PostTypeSelected,
          to: WORKFLOW_STATES.Failed,
          note: "chooseHook failed"
        }
      ]
    };
  }
}
