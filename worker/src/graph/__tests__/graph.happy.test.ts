import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ClockStub,
  DraftStoreStub,
  LlmStub,
  SlackStub
} from "@linkedin-agent/shared";

import { createContainer } from "../../container.js";
import { buildGraph } from "../index.js";
import type { GraphState } from "../state.js";
import { WORKFLOW_STATES } from "../state.js";

function makeInitialState(overrides: Partial<GraphState> = {}): GraphState {
  return {
    conversationId: "conv-happy",
    tenantId: "tenant-1",
    userId: "user-1",
    inboundText: "ship a quick recap of this week",
    transitions: [],
    ...overrides
  };
}

test("happy path: full n8n workflow through LangGraph", async () => {
  const frozen = new Date("2026-05-11T05:00:00.000Z");
  const draftStore = new DraftStoreStub();
  const slack = new SlackStub();
  const container = createContainer({
    llm: new LlmStub(),
    clock: new ClockStub(frozen),
    draftStore,
    slack
  });

  const graph = buildGraph(container);
  const finalState = (await graph.invoke(makeInitialState())) as GraphState;

  assert.equal(finalState.error, undefined);
  assert.ok(finalState.promptContext);
  assert.ok(finalState.postType?.type);
  assert.ok(finalState.hookChoice?.hook_type);
  assert.equal(typeof finalState.draftText, "string");
  assert.ok(finalState.draftText?.includes("STUB_POST"));
  assert.ok(finalState.imagePrompt);
  assert.ok(finalState.imageUrl);
  assert.ok(finalState.imageStorageUrl);
  assert.ok(finalState.slackMessageTs);
  assert.equal(slack.draftNotifications.length, 1);
  assert.equal(draftStore.rows.length, 1);
  assert.equal(draftStore.rows[0]?.draft, finalState.draftText);

  const sequence = finalState.transitions.map((t) => `${t.from}->${t.to}`);
  assert.ok(sequence.includes(`${WORKFLOW_STATES.Start}->${WORKFLOW_STATES.IntakeReceived}`));
  assert.ok(
    sequence.includes(`${WORKFLOW_STATES.IntakeReceived}->${WORKFLOW_STATES.ContextLoaded}`)
  );
  assert.ok(
    sequence.includes(`${WORKFLOW_STATES.HookSelected}->${WORKFLOW_STATES.DraftGenerating}`)
  );
  assert.ok(
    sequence.includes(`${WORKFLOW_STATES.Delivered}->${WORKFLOW_STATES.Completed}`)
  );
});
