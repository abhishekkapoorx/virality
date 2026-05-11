import { END, START, StateGraph } from "@langchain/langgraph";

import { createContainer, type Container } from "../container.js";
import { routeAfterGenerate } from "./edges/afterGenerate.js";
import { generateDraftNode } from "./nodes/generateDraft.js";
import { handleFailureNode } from "./nodes/handleFailure.js";
import { intakeNode } from "./nodes/intake.js";
import { markReadyNode } from "./nodes/markReady.js";
import { GraphAnnotation, type GraphState } from "./state.js";

/**
 * Graph assembly — the ONLY file allowed to import both nodes and edges.
 *
 * Wires LangGraph channels (state.ts) to node functions (nodes/*.ts) using
 * conditional + linear edges (edges/*.ts). The container is bound here so
 * nodes can stay pure `(state, ctx) => Partial<State>` functions.
 *
 * To run the graph with custom adapters (e.g. a failing LLM stub in a test):
 *
 *   const graph = buildGraph(createContainer({ llm: failingLlm }));
 *   const final = await graph.invoke(initialState);
 */
export function buildGraph(container: Container = createContainer()) {
  const builder = new StateGraph(GraphAnnotation)
    .addNode("intake", (state: GraphState) => intakeNode(state, container))
    .addNode("generateDraft", (state: GraphState) =>
      generateDraftNode(state, container)
    )
    .addNode("markReady", (state: GraphState) =>
      markReadyNode(state, container)
    )
    .addNode("handleFailure", (state: GraphState) =>
      handleFailureNode(state, container)
    )
    .addEdge(START, "intake")
    .addEdge("intake", "generateDraft")
    .addConditionalEdges("generateDraft", routeAfterGenerate, {
      markReady: "markReady",
      handleFailure: "handleFailure"
    })
    .addEdge("markReady", END)
    .addEdge("handleFailure", END);

  return builder.compile();
}

export { GraphAnnotation, type GraphState } from "./state.js";
export { createContainer } from "../container.js";
