import type { Container } from "../../container.js";
import type { GraphState } from "../state.js";
import { WORKFLOW_STATES } from "../state.js";

/**
 * handleFailureNode — terminal failure node. Records the
 * `DraftGenerating -> Failed` transition, attaching the captured error
 * message as a note for the audit trail.
 */
export async function handleFailureNode(
  state: GraphState,
  ctx: Container
): Promise<Partial<GraphState>> {
  return {
    transitions: [
      {
        ts: ctx.clock.isoNow(),
        from: WORKFLOW_STATES.DraftGenerating,
        to: WORKFLOW_STATES.Failed,
        note: state.error ?? "unknown error"
      }
    ]
  };
}
