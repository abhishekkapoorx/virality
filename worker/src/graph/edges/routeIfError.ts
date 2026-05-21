import type { GraphState } from "../state.js";

/** Routes to handleFailure when any upstream node captured an error. */
export function routeIfError(state: GraphState): "continue" | "handleFailure" {
  return state.error ? "handleFailure" : "continue";
}
