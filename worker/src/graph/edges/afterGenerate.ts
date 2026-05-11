import type { GraphState } from "../state.js";

export type AfterGenerateRoute = "markReady" | "handleFailure";

/**
 * Conditional edge from `generateDraft`. If the node captured an error, route
 * to the failure handler; otherwise, advance to the success branch.
 */
export function routeAfterGenerate(state: GraphState): AfterGenerateRoute {
  return state.error ? "handleFailure" : "markReady";
}
