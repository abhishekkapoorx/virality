import type { Container } from "../../container.js";
import type { GraphState } from "../state.js";
import { WORKFLOW_STATES } from "../state.js";

export async function handleFailureNode(
  state: GraphState,
  ctx: Container
): Promise<Partial<GraphState>> {
  const last = state.transitions.at(-1);
  const from = last?.to ?? WORKFLOW_STATES.DraftGenerating;

  const alreadyFailed = last?.to === WORKFLOW_STATES.Failed;
  if (alreadyFailed) {
    return {};
  }

  return {
    transitions: [
      {
        ts: ctx.clock.isoNow(),
        from,
        to: WORKFLOW_STATES.Failed,
        note: state.error
      }
    ]
  };
}
