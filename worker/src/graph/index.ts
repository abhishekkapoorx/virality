import { END, START, StateGraph } from "@langchain/langgraph";

import { createContainer, type Container } from "../container.js";
import { routeIfError } from "./edges/routeIfError.js";
import { chooseHookNode } from "./nodes/chooseHook.js";
import { generateImageNode } from "./nodes/generateImage.js";
import { generateImagePromptNode } from "./nodes/generateImagePrompt.js";
import { generatePostNode } from "./nodes/generatePost.js";
import { handleFailureNode } from "./nodes/handleFailure.js";
import { intakeNode } from "./nodes/intake.js";
import { loadContextNode } from "./nodes/loadContext.js";
import { markReadyNode } from "./nodes/markReady.js";
import { notifySlackNode } from "./nodes/notifySlack.js";
import { persistDraftNode } from "./nodes/persistDraft.js";
import { selectPostTypeNode } from "./nodes/selectPostType.js";
import { uploadAssetNode } from "./nodes/uploadAsset.js";
import { GraphAnnotation, type GraphState } from "./state.js";

/**
 * LinkedIn-Agent workflow — LangGraph port of linkedin-agent.json (n8n).
 *
 * Flow:
 *   intake → loadContext → selectPostType → chooseHook → generatePost
 *   → generateImagePrompt → generateImage → uploadAsset → notifySlack
 *   → persistDraft → markReady
 *
 * Conditional `routeIfError` after generatePost and notifySlack.
 */
export function buildGraph(container: Container = createContainer()) {
  const bind =
    <T extends (state: GraphState, ctx: Container) => ReturnType<T>>(
      fn: T
    ) =>
    (state: GraphState) =>
      fn(state, container);

  const builder = new StateGraph(GraphAnnotation)
    .addNode("intake", bind(intakeNode))
    .addNode("loadContext", bind(loadContextNode))
    .addNode("selectPostType", bind(selectPostTypeNode))
    .addNode("chooseHook", bind(chooseHookNode))
    .addNode("generatePost", bind(generatePostNode))
    .addNode("generateImagePrompt", bind(generateImagePromptNode))
    .addNode("generateImage", bind(generateImageNode))
    .addNode("uploadAsset", bind(uploadAssetNode))
    .addNode("notifySlack", bind(notifySlackNode))
    .addNode("persistDraft", bind(persistDraftNode))
    .addNode("markReady", bind(markReadyNode))
    .addNode("handleFailure", bind(handleFailureNode))
    .addEdge(START, "intake")
    .addEdge("intake", "loadContext")
    .addConditionalEdges("loadContext", routeIfError, {
      continue: "selectPostType",
      handleFailure: "handleFailure"
    })
    .addEdge("selectPostType", "chooseHook")
    .addEdge("chooseHook", "generatePost")
    .addConditionalEdges("generatePost", routeIfError, {
      continue: "generateImagePrompt",
      handleFailure: "handleFailure"
    })
    .addEdge("generateImagePrompt", "generateImage")
    .addEdge("generateImage", "uploadAsset")
    .addEdge("uploadAsset", "notifySlack")
    .addConditionalEdges("notifySlack", routeIfError, {
      continue: "persistDraft",
      handleFailure: "handleFailure"
    })
    .addEdge("persistDraft", "markReady")
    .addEdge("markReady", END)
    .addEdge("handleFailure", END);

  return builder.compile();
}

export { GraphAnnotation, type GraphState } from "./state.js";
export { createContainer } from "../container.js";
