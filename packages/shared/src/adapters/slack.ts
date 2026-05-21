/**
 * SlackAdapter — outbound notifications for draft review.
 * Inbound Slack ingress lands in Phase 7.
 */
export interface SlackSendInput {
  channel: string;
  text: string;
  conversationId: string;
}

export type SlackSendResult =
  | { ok: true; ts: string }
  | { ok: false; error: string };

/** Mirrors n8n "Send a message" block kit payload (simplified for adapter). */
export interface SlackDraftNotificationInput {
  channel: string;
  conversationId: string;
  postType: string;
  hookType: string;
  sampleHook: string;
  draft: string;
  imageUrl?: string;
}

export interface SlackAdapter {
  sendMessage(input: SlackSendInput): Promise<SlackSendResult>;
  /** Port of n8n draft approval message to #post-drafts. */
  sendDraftNotification(
    input: SlackDraftNotificationInput
  ): Promise<SlackSendResult>;
}
