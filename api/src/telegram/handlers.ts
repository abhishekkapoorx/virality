import { Bot, InlineKeyboard, type Context } from "grammy";

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
  "Account linking from the web app is coming soon."
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
    await ctx.reply(
      "Thanks for opening the link. Account binding will connect this chat to your profile — not enabled yet.\n\nYou can still send a post idea as plain text."
    );
    return;
  }
  await ctx.reply(WELCOME_TEXT);
}

async function onTextMessage(ctx: Context): Promise<void> {
  const text = ctx.message?.text?.trim();
  if (!text || text.startsWith("/")) return;

  const preview = text.length > 400 ? `${text.slice(0, 400)}…` : text;
  await ctx.reply(
    [
      "Got your idea — intake received.",
      "",
      `> ${preview}`,
      "",
      "Draft generation from Telegram is next; for now configure style at the web workflow page."
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
