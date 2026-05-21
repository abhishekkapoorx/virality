import type {
  SlackAdapter,
  SlackDraftNotificationInput,
  SlackSendInput,
  SlackSendResult
} from "./slack.js";

export class SlackStub implements SlackAdapter {
  public readonly sent: SlackSendInput[] = [];
  public readonly draftNotifications: SlackDraftNotificationInput[] = [];

  async sendMessage(input: SlackSendInput): Promise<SlackSendResult> {
    this.sent.push(input);
    return { ok: true, ts: `stub-msg-${this.sent.length}` };
  }

  async sendDraftNotification(
    input: SlackDraftNotificationInput
  ): Promise<SlackSendResult> {
    this.draftNotifications.push(input);
    const ts = `stub-draft-${this.draftNotifications.length}`;
    return { ok: true, ts };
  }
}
