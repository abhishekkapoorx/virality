import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";

import { Bot } from "grammy";

import { registerTelegramHandlers } from "./handlers.js";
import {
  dedupeUpdatesMiddleware,
  resetTelegramUpdateDedupeForTests
} from "./idempotency.js";

type RecordedCall = { method: string; payload: unknown };

function createTestBot(): { bot: Bot; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const bot = new Bot("test-token", {
    botInfo: {
      id: 1,
      is_bot: true,
      first_name: "Test",
      username: "testbot",
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false,
      can_connect_to_business: false,
      has_main_web_app: false,
      has_topics_enabled: false,
      allows_users_to_create_topics: false,
      can_manage_bots: false
    }
  });

  bot.api.config.use((async (_prev, method, payload) => {
    calls.push({ method, payload });
    if (method === "sendMessage") {
      return {
        ok: true,
        result: {
          message_id: calls.length,
          date: 0,
          chat: { id: 0, type: "private", first_name: "Test" }
        }
      };
    }
    if (method === "answerCallbackQuery") {
      return { ok: true, result: true };
    }
    return { ok: false, error_code: 400, description: "unmocked method" };
  }) as Parameters<typeof bot.api.config.use>[0]);

  bot.use(dedupeUpdatesMiddleware);
  registerTelegramHandlers(bot);

  return { bot, calls };
}

beforeEach(() => {
  resetTelegramUpdateDedupeForTests();
});

test("grammY bot acknowledges user text", async () => {
  const { bot, calls } = createTestBot();

  await bot.handleUpdate({
    update_id: 1,
    message: {
      message_id: 10,
      date: 1,
      chat: { id: 99, type: "private", first_name: "User" },
      text: "Ship notes on platform engineering"
    }
  } as Parameters<Bot["handleUpdate"]>[0]);

  const send = calls.find((c) => c.method === "sendMessage");
  assert.ok(send);
  assert.match(String((send!.payload as { text: string }).text), /Got your idea/);
});

test("grammY bot sends welcome on /start", async () => {
  const { bot, calls } = createTestBot();

  await bot.handleUpdate({
    update_id: 2,
    message: {
      message_id: 11,
      date: 1,
      chat: { id: 42, type: "private", first_name: "User" },
      text: "/start",
      entities: [{ offset: 0, length: 6, type: "bot_command" }]
    }
  } as Parameters<Bot["handleUpdate"]>[0]);

  const send = calls.find((c) => c.method === "sendMessage");
  assert.match(String((send!.payload as { text: string }).text), /LinkedIn Agent/);
});

test("grammY bot dedupes update_id", async () => {
  const { bot, calls } = createTestBot();
  const update = {
    update_id: 3,
    message: {
      message_id: 12,
      date: 1,
      chat: { id: 1, type: "private", first_name: "User" },
      text: "hello"
    }
  } as Parameters<Bot["handleUpdate"]>[0];

  await bot.handleUpdate(update);
  await bot.handleUpdate(update);

  const sends = calls.filter((c) => c.method === "sendMessage");
  assert.equal(sends.length, 1);
});

test("grammY bot answers callback queries", async () => {
  const { bot, calls } = createTestBot();

  await bot.handleUpdate({
    update_id: 4,
    callback_query: {
      id: "cq-1",
      from: { id: 7, is_bot: false, first_name: "Test" },
      chat_instance: "x",
      data: "approve",
      message: {
        message_id: 20,
        date: 1,
        chat: { id: 55, type: "private", first_name: "User" },
        text: "draft"
      }
    }
  } as Parameters<Bot["handleUpdate"]>[0]);

  assert.ok(calls.some((c) => c.method === "answerCallbackQuery"));
});
