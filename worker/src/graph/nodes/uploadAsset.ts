import type { Container } from "../../container.js";
import type { GraphState } from "../state.js";

/** n8n: Upload file (Google Drive) */
export async function uploadAssetNode(
  state: GraphState,
  ctx: Container
): Promise<Partial<GraphState>> {
  if (state.error) return {};
  if (!state.imageUrl) {
    return { error: "imageUrl missing before uploadAsset" };
  }

  try {
    const fileName = `linkedin-post-${ctx.clock.isoNow().replace(/[:.]/g, "-")}.png`;
    const uploaded = await ctx.storage.uploadImage({
      conversationId: state.conversationId,
      fileName,
      imageUrl: state.imageUrl
    });

    return {
      imageStorageUrl: uploaded.webViewLink
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
