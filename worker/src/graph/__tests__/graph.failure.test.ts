import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ClockStub,
  type LlmAdapter,
  type LlmGeneratePostInput,
  type LlmWorkflowInput,
  type PostDraftOutput
} from "@linkedin-agent/shared";

import { createContainer } from "../../container.js";
import { buildGraph } from "../index.js";
import type { GraphState } from "../state.js";
import { WORKFLOW_STATES } from "../state.js";

function makeInitialState(): GraphState {
  return {
    conversationId: "conv-failure",
    tenantId: "tenant-1",
    userId: "user-1",
    inboundText: "this generation should fail",
    transitions: []
  };
}

class FailingLlm implements LlmAdapter {
  async generateDraft(): Promise<string> {
    throw new Error("unused");
  }
  async selectPostType(_input: LlmWorkflowInput) {
    return {
      type: "Belief Reversal",
      goal: "reach",
      description: "stub"
    };
  }
  async chooseHook(input: LlmWorkflowInput & { postType: { type: string } }) {
    return {
      hook_type: "Curiosity Gap",
      sample_hook: "stub"
    };
  }
  async generatePost(_input: LlmGeneratePostInput): Promise<PostDraftOutput> {
    throw new Error("synthetic LLM outage");
  }
  async generateImagePrompt(): Promise<string> {
    throw new Error("unused");
  }
}

test("failure path: generatePost error routes to Failed", async () => {
  const frozen = new Date("2026-05-11T07:00:00.000Z");
  const graph = buildGraph(
    createContainer({ llm: new FailingLlm(), clock: new ClockStub(frozen) })
  );

  const finalState = (await graph.invoke(makeInitialState())) as GraphState;

  assert.equal(finalState.draftText, undefined);
  assert.equal(finalState.error, "synthetic LLM outage");

  const sequence = finalState.transitions.map((t) => `${t.from}->${t.to}`);
  assert.ok(
    sequence.includes(`${WORKFLOW_STATES.HookSelected}->${WORKFLOW_STATES.DraftGenerating}`)
  );
  assert.ok(
    sequence.some(
      (s) => s.endsWith(`->${WORKFLOW_STATES.Failed}`) || s.includes(WORKFLOW_STATES.Failed)
    )
  );
});
