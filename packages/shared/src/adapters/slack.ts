/**
 * SlackAdapter — outbound-only for this slice. Inbound Slack ingress lands in Phase 7.
 * Workflow nodes use this to post drafts and confirmations; real Bolt/HTTP client
 * is wired through the worker DI container in a later slice.
 */
export interface SlackSendInput {
  channel: string;
  text: string;
  conversationId: string;
}

export type SlackSendResult =
  | { ok: true; ts: string }
  | { ok: false; error: string };

export interface SlackAdapter {
  sendMessage(input: SlackSendInput): Promise<SlackSendResult>;
}
