import type {
  SlackAdapter,
  SlackSendInput,
  SlackSendResult
} from "./slack.js";

/**
 * In-memory Slack stub. Captures sent messages so tests can assert outbound
 * payloads without touching the network.
 */
export class SlackStub implements SlackAdapter {
  public readonly sent: SlackSendInput[] = [];

  async sendMessage(input: SlackSendInput): Promise<SlackSendResult> {
    this.sent.push(input);
    return { ok: true, ts: `stub-${this.sent.length}` };
  }
}
