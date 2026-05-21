import type { WorkflowContextBundle } from "./workflowContext.js";

/** Port of n8n agent "Get Post Type from Docs" user prompt. */
export function buildSelectPostTypePrompt(ctx: WorkflowContextBundle): string {
  return [
    "Using this weekly schedule:",
    ctx.scheduleText,
    "",
    `Today is: ${ctx.todayDay}`,
    "",
    "User Feedback:",
    ctx.userFeedback
  ].join("\n");
}
