import type { PostTypeSelection } from "../schemas/workflowOutputs.js";
import type { WorkflowContextBundle } from "./workflowContext.js";

/** Port of n8n agent "Choose Best Hook" user prompt. */
export function buildChooseHookPrompt(
  ctx: WorkflowContextBundle,
  postType: PostTypeSelection
): string {
  return [
    "You are selecting the best hook type.",
    "",
    "Today's post type:",
    postType.type,
    "",
    "Post goal:",
    postType.goal,
    "",
    "Hook system:",
    ctx.hookSystemText,
    "",
    "User Feedback:",
    ctx.userFeedback
  ].join("\n");
}
