import type {
  TelegramAdapter,
  TelegramAnswerCallbackInput,
  TelegramSendMessageInput,
  TelegramSendResult
} from "./telegram.js";

export class TelegramStub implements TelegramAdapter {
  public readonly sent: TelegramSendMessageInput[] = [];
  public readonly answeredCallbacks: TelegramAnswerCallbackInput[] = [];

  async sendMessage(input: TelegramSendMessageInput): Promise<TelegramSendResult> {
    this.sent.push(input);
    return { ok: true, messageId: this.sent.length };
  }

  async answerCallbackQuery(
    input: TelegramAnswerCallbackInput
  ): Promise<{ ok: boolean; error?: string }> {
    this.answeredCallbacks.push(input);
    return { ok: true };
  }
}
