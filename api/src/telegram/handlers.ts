import { Bot, type Context } from "grammy";

export type TelegramHandlerDeps = {
  enqueueDraftGeneration: (payload: {
    tenantId: string;
    userId: string;
    telegramUserId?: string | null;
    updateRequest?: string;
    source: "manual" | "schedule";
    dayKey?: string;
  }) => Promise<unknown>;
  getUserByTelegramUserId: (telegramUserId: string) => Promise<{
    id: string;
    tenantId: string;
  } | null>;
  redeemTelegramLinkToken: (params: {
    token: string;
    telegramUserId: string;
  }) => Promise<
    | { status: "linked"; userId: string }
    | { status: "already-linked"; userId: string }
    | { status: "invalid" }
    | { status: "expired" }
    | { status: "conflict"; userId: string }
  >;
};

const defaultDeps: TelegramHandlerDeps = {
  enqueueDraftGeneration: async (payload) => {
    const { enqueueDraftGeneration } = await import("../services/draftQueueService.js");
    return enqueueDraftGeneration(payload);
  },
  getUserByTelegramUserId: async (telegramUserId) => {
    const { getUserByTelegramUserId } = await import("../services/telegramLinkService.js");
    return getUserByTelegramUserId(telegramUserId);
  },
  redeemTelegramLinkToken: async (params) => {
    const { redeemTelegramLinkToken } = await import("../services/telegramLinkService.js");
    return redeemTelegramLinkToken(params);
  }
};

const WELCOME_TEXT = [
  "Hi — I'm LinkedIn Agent.",
  "",
  "Send a rough idea for your next LinkedIn post and I'll draft it for you.",
  "Use the web app to set your voice, schedule, and carousel style.",
  "",
  "Commands: /generate <idea>, /help"
].join("\n");

const HELP_TEXT = [
  "Send any message with your post idea.",
  "",
  "Or use /generate <idea> to explicitly queue a draft.",
  "",
  "Later you'll get drafts here with Approve / Refine / Reject buttons.",
  "Link your account from the web app to connect this chat to your profile."
].join("\n");

function parseLinkTokenFromStart(args: string): string | null {
  const payload = args.trim();
  if (!payload.startsWith("link_")) return null;
  return payload.slice("link_".length);
}

async function onStart(ctx: Context, deps: TelegramHandlerDeps): Promise<void> {
  const args =
    ctx.message?.text?.replace(/^\/start(?:@\S+)?\s*/i, "").trim() ?? "";
  const linkToken = parseLinkTokenFromStart(args);
  if (linkToken) {
    const telegramUserId = ctx.from?.id;
    if (!telegramUserId) {
      await ctx.reply("I could not read your Telegram user id. Please try again.");
      return;
    }

    const result = await deps.redeemTelegramLinkToken({
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

async function onTextMessage(ctx: Context, deps: TelegramHandlerDeps): Promise<void> {
  const text = ctx.message?.text?.trim();
  if (!text || text.startsWith("/")) return;

  await queueDraftFromIdea(ctx, text, deps);
}

async function queueDraftFromIdea(ctx: Context, idea: string, deps: TelegramHandlerDeps): Promise<void> {
  const text = idea.trim();
  if (!text) {
    await ctx.reply("Add an idea first, then send it again.");
    return;
  }

  const telegramUserId = ctx.from?.id ? String(ctx.from.id) : null;
  if (!telegramUserId) {
    await ctx.reply("I could not read your Telegram user id. Please try again.");
    return;
  }

  const linkedUser = await deps.getUserByTelegramUserId(telegramUserId);
  if (!linkedUser) {
    await ctx.reply(
      "Link this Telegram account from the web app first, then send your idea again."
    );
    return;
  }

  await deps.enqueueDraftGeneration({
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
  );
}

async function onGenerate(ctx: Context, deps: TelegramHandlerDeps): Promise<void> {
  const idea = ctx.message?.text?.replace(/^\/generate(?:@\S+)?\s*/i, "") ?? "";
  const trimmedIdea = idea.trim();
  if (!trimmedIdea) {
    await ctx.reply("Use /generate <idea> to queue a draft.");
    return;
  }

  await queueDraftFromIdea(ctx, trimmedIdea, deps);
}

async function onCallbackQuery(ctx: Context): Promise<void> {
  await ctx.answerCallbackQuery({
    text: "Use /generate <idea> to queue a new draft."
  });

  const data = ctx.callbackQuery?.data;
  if (data && ctx.chat?.id != null) {
    await ctx.api.sendMessage(
      ctx.chat.id,
      `Action \`${data}\` received.`
    );
  }
}

export function registerTelegramHandlers(bot: Bot, deps: Partial<TelegramHandlerDeps> = {}): void {
  const resolvedDeps: TelegramHandlerDeps = { ...defaultDeps, ...deps };

  bot.command("start", (ctx) => onStart(ctx, resolvedDeps));
  bot.command("generate", (ctx) => onGenerate(ctx, resolvedDeps));
  bot.command("help", async (ctx) => {
    await ctx.reply(HELP_TEXT);
  });
  bot.on("message:text", (ctx) => onTextMessage(ctx, resolvedDeps));
  bot.on("callback_query:data", onCallbackQuery);
}
