import { buildDraftPrompt } from "@linkedin-agent/shared";

import type { Container } from "../../container.js";
import type { GraphState } from "../state.js";
import { WORKFLOW_STATES } from "../state.js";

/**
 * generateDraftNode — calls the LlmAdapter to produce a draft.
 *
 * On success: emits the `IntakeReceived -> DraftGenerating` transition and
 * stores `draftText`. The conditional edge routes downstream to `markReady`.
 *
 * On failure: captures the error message into state and emits the same
 * `DraftGenerating` transition; the conditional edge routes to `handleFailure`,
 * which finalises the `Failed` transition.
 *
 * No vendor SDKs are imported here; the LLM client comes through `ctx.llm`.
 */
export async function generateDraftNode(
  state: GraphState,
  ctx: Container
): Promise<Partial<GraphState>> {
  const enteringTransition = {
    ts: ctx.clock.isoNow(),
    from: WORKFLOW_STATES.IntakeReceived,
    to: WORKFLOW_STATES.DraftGenerating
  };

  try {
    const prompt = buildDraftPrompt({
      inboundText: state.inboundText,
      instructionProfileSnapshot: state.instructionProfileSnapshot
    });

    const draftText = await ctx.llm.generateDraft({
      prompt,
      conversationId: state.conversationId,
      tenantId: state.tenantId,
      userId: state.userId
    });

    return {
      draftText,
      transitions: [enteringTransition]
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      error: message,
      transitions: [enteringTransition]
    };
  }
}
