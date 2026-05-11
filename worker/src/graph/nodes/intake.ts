import type { Container } from "../../container.js";
import type { GraphState } from "../state.js";
import { WORKFLOW_STATES } from "../state.js";

/**
 * intakeNode — first stop after START. Records the IntakeReceived transition
 * so the audit trail begins from the canonical entry point.
 *
 * No vendor SDKs are imported here; all side-effecting deps come through `ctx`.
 */
export async function intakeNode(
  _state: GraphState,
  ctx: Container
): Promise<Partial<GraphState>> {
  return {
    transitions: [
      {
        ts: ctx.clock.isoNow(),
        from: WORKFLOW_STATES.Start,
        to: WORKFLOW_STATES.IntakeReceived
      }
    ]
  };
}
