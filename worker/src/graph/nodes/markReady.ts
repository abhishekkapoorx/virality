import type { Container } from "../../container.js";
import type { GraphState } from "../state.js";
import { WORKFLOW_STATES } from "../state.js";

/** Terminal success — workflow complete after delivery + persistence. */
export async function markReadyNode(
  state: GraphState,
  ctx: Container
): Promise<Partial<GraphState>> {
  return {
    transitions: [
      {
        ts: ctx.clock.isoNow(),
        from: WORKFLOW_STATES.Delivered,
        to: WORKFLOW_STATES.Completed,
        note: "workflow complete"
      }
    ]
  };
}
