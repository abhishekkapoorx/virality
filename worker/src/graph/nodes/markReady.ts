import type { Container } from "../../container.js";
import type { GraphState } from "../state.js";
import { WORKFLOW_STATES } from "../state.js";

/**
 * markReadyNode — terminal success node. Records the
 * `DraftGenerating -> DraftReady` transition. Future slices will also enqueue
 * outbound delivery (Slack post + web payload) from here via `ctx.slack`.
 */
export async function markReadyNode(
  _state: GraphState,
  ctx: Container
): Promise<Partial<GraphState>> {
  return {
    transitions: [
      {
        ts: ctx.clock.isoNow(),
        from: WORKFLOW_STATES.DraftGenerating,
        to: WORKFLOW_STATES.DraftReady
      }
    ]
  };
}
