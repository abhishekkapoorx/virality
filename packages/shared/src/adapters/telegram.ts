export interface TelegramSendMessageInput {
  chatId: number;
  text: string;
  /** Optional inline keyboard JSON (Telegram reply_markup.inline_keyboard). */
  replyMarkup?: {
    inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
  };
}

export type TelegramSendResult =
  | { ok: true; messageId: number }
  | { ok: false; error: string };

export interface TelegramAnswerCallbackInput {
  callbackQueryId: string;
  text?: string;
  showAlert?: boolean;
}

export interface TelegramAdapter {
  sendMessage(input: TelegramSendMessageInput): Promise<TelegramSendResult>;
  answerCallbackQuery(input: TelegramAnswerCallbackInput): Promise<{ ok: boolean; error?: string }>;
}
