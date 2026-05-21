import type { Container } from "../../container.js";
import type { GraphState } from "../state.js";

/** n8n: Insert row (data table) */
export async function persistDraftNode(
  state: GraphState,
  ctx: Container
): Promise<Partial<GraphState>> {
  if (state.error) return {};
  if (!state.draftText || !state.postType || !state.hookChoice) {
    return { error: "draft metadata missing before persistDraft" };
  }

  try {
    await ctx.draftStore.insertRow({
      conversationId: state.conversationId,
      type: state.postType.type,
      hook: state.hookChoice.hook_type,
      draft: state.draftText,
      msgTs: state.slackMessageTs ?? "",
      imgLink: state.imageStorageUrl ?? ""
    });
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
