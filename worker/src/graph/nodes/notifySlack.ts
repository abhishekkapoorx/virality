import type { Container } from "../../container.js";
import type { GraphState } from "../state.js";
import { WORKFLOW_STATES } from "../state.js";

/** n8n: Send a message (Slack block kit draft for approval) */
export async function notifySlackNode(
  state: GraphState,
  ctx: Container
): Promise<Partial<GraphState>> {
  if (state.error) return {};
  if (!state.draftText || !state.postType || !state.hookChoice) {
    return { error: "draft or metadata missing before notifySlack" };
  }

  try {
    const channel = ctx.slackDraftChannel;
    const result = await ctx.slack.sendDraftNotification({
      channel,
      conversationId: state.conversationId,
      postType: state.postType.type,
      hookType: state.hookChoice.hook_type,
      sampleHook: state.hookChoice.sample_hook,
      draft: state.draftText,
      imageUrl: state.imageStorageUrl ?? state.imageUrl
    });

    if (!result.ok) {
      return { error: result.error };
    }

    return {
      slackChannel: channel,
      slackMessageTs: result.ts,
      transitions: [
        {
          ts: ctx.clock.isoNow(),
          from: WORKFLOW_STATES.ImageReady,
          to: WORKFLOW_STATES.Delivered,
          note: "slack notification sent"
        }
      ]
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
