import type { Container } from "../../container.js";
import type { GraphState } from "../state.js";
import { WORKFLOW_STATES } from "../state.js";

/** n8n: LinkedIn_Config + Style_Guide + Weekly_Post_Schedule + Content_Hook_System → Merge → Concated Context */
export async function loadContextNode(
  state: GraphState,
  ctx: Container
): Promise<Partial<GraphState>> {
  try {
    const feedback =
      state.userFeedback ??
      (typeof state.instructionProfileSnapshot?.userFeedback === "string"
        ? state.instructionProfileSnapshot.userFeedback
        : undefined);

    const workflowContext = await ctx.configSource.loadContext({
      userId: state.userId,
      tenantId: state.tenantId,
      userFeedback: feedback ?? state.inboundText
    });

    return {
      workflowContext,
      transitions: [
        {
          ts: ctx.clock.isoNow(),
          from: WORKFLOW_STATES.IntakeReceived,
          to: WORKFLOW_STATES.ContextLoaded
        }
      ]
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
      transitions: [
        {
          ts: ctx.clock.isoNow(),
          from: WORKFLOW_STATES.IntakeReceived,
          to: WORKFLOW_STATES.Failed,
          note: "loadContext failed"
        }
      ]
    };
  }
}
