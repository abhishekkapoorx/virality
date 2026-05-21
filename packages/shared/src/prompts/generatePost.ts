import type { HookSelection, PostTypeSelection } from "../schemas/workflowOutputs.js";
import type { WorkflowContextBundle } from "./workflowContext.js";

/** Port of n8n agent "Generate Post" user prompt. */
export function buildGeneratePostPrompt(
  ctx: WorkflowContextBundle,
  postType: PostTypeSelection,
  hook: HookSelection
): string {
  return [
    "Write a LinkedIn post using:",
    "",
    "CONFIG:",
    ctx.configText,
    "",
    "STYLE GUIDE:",
    ctx.styleText,
    "",
    "HOOK TYPE:",
    hook.hook_type,
    "",
    "HOOK EXAMPLE:",
    hook.sample_hook,
    "",
    "POST TYPE:",
    `${postType.type} - ${postType.description}`,
    "",
    "User Feedback:",
    ctx.userFeedback,
    "",
    "RULES:",
    "- Start with a hook based on the selected hook type.",
    "- Use BUT → THEREFORE storytelling loops.",
    "- Use sentence length variation:",
    "  - SMALL (3–8 words)",
    "  - MEDIUM (12–20 words)",
    "  - LARGE (25+ words)",
    "  Mix them as described in the style guide.",
    "- Add one personal story lens.",
    "- Follow the formula for selected post type.",
    "- Prioritize clarity, simplicity, and visual thinking.",
    "- End with a SMALL punchline sentence.",
    "- Add hashtags from config."
  ].join("\n");
}
