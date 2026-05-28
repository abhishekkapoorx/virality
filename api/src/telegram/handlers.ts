import { Bot, InlineKeyboard, type Context } from "grammy";

import { enqueueDraftGeneration } from "../services/draftQueueService.js";
import { getUserByTelegramUserId } from "../services/telegramLinkService.js";
import { redeemTelegramLinkToken } from "../services/telegramLinkService.js";

const WELCOME_TEXT = [
  "Hi — I'm LinkedIn Agent.",
  "",
  "Send a rough idea for your next LinkedIn post and I'll draft it for you.",
  "Use the web app to set your voice, schedule, and carousel style.",
  "",
  "Commands: /help"
].join("\n");

const HELP_TEXT = [
  "Send any message with your post idea.",
  "",
  "Later you'll get drafts here with Approve / Refine / Reject buttons.",
  "Link your account from the web app to connect this chat to your profile."
].join("\n");

const draftActionKeyboard = new InlineKeyboard()
  .text("Approve", "approve")
  .text("Refine", "refine")
  .text("Reject", "reject");

function parseLinkTokenFromStart(args: string): string | null {
  const payload = args.trim();
  if (!payload.startsWith("link_")) return null;
  return payload.slice("link_".length);
}

async function onStart(ctx: Context): Promise<void> {
  const args =
    ctx.message?.text?.replace(/^\/start(?:@\S+)?\s*/i, "").trim() ?? "";
  const linkToken = parseLinkTokenFromStart(args);
  if (linkToken) {
    const telegramUserId = ctx.from?.id;
    if (!telegramUserId) {
      await ctx.reply("I could not read your Telegram user id. Please try again.");
      return;
    }

    const result = await redeemTelegramLinkToken({
      token: linkToken,
      telegramUserId: String(telegramUserId)
    });

    if (result.status === "linked") {
      await ctx.reply(
        "Telegram is now connected to your account. Send a draft idea anytime and I’ll use your saved workflow context."
      );
      return;
    }

    if (result.status === "already-linked") {
      await ctx.reply(
        "This Telegram account is already linked to your profile. Send a draft idea anytime."
      );
      return;
    }

    if (result.status === "expired") {
      await ctx.reply(
        "That link expired. Go back to the web app and generate a fresh Telegram connect link."
      );
      return;
    }

    if (result.status === "conflict") {
      await ctx.reply(
        "That Telegram account is already linked to another user. If this is a mistake, unlink it from the web app first."
      );
      return;
    }

    await ctx.reply(
      "That link is invalid. Go back to the web app and generate a fresh Telegram connect link."
    );
    return;
  }
  await ctx.reply(WELCOME_TEXT);
}

async function onTextMessage(ctx: Context): Promise<void> {
  const text = ctx.message?.text?.trim();
  if (!text || text.startsWith("/")) return;

  const telegramUserId = ctx.from?.id ? String(ctx.from.id) : null;
  if (!telegramUserId) {
    await ctx.reply("I could not read your Telegram user id. Please try again.");
    return;
  }

  const linkedUser = await getUserByTelegramUserId(telegramUserId);
  if (!linkedUser) {
    await ctx.reply(
      "Link this Telegram account from the web app first, then send your idea again."
    );
    return;
  }

  await enqueueDraftGeneration({
    tenantId: linkedUser.tenantId,
    userId: linkedUser.id,
    telegramUserId,
    updateRequest: text,
    source: "manual"
  });

  const preview = text.length > 400 ? `${text.slice(0, 400)}…` : text;
  await ctx.reply(
    [
      "Got your idea — generating a draft now.",
      "",
      `> ${preview}`,
      "",
      "I’ll send the draft back here as soon as it’s ready."
    ].join("\n"),
    { reply_markup: draftActionKeyboard }
  );
}

async function onCallbackQuery(ctx: Context): Promise<void> {
  await ctx.answerCallbackQuery({
    text: "Received — workflow actions coming soon."
  });

  const data = ctx.callbackQuery?.data;
  if (data && ctx.chat?.id != null) {
    await ctx.api.sendMessage(
      ctx.chat.id,
      `Action \`${data}\` noted. Full approve/refine flow is not wired yet.`
    );
  }
}

export function registerTelegramHandlers(bot: Bot): void {
  bot.command("start", onStart);
  bot.command("help", async (ctx) => {
    await ctx.reply(HELP_TEXT);
  });
  bot.on("message:text", onTextMessage);
  bot.on("callback_query:data", onCallbackQuery);
}
