import crypto from "node:crypto";

import { Bot } from "grammy";

import { prisma } from "../lib/prisma.js";
import { getTelegramBotToken } from "../telegram/config.js";

const LINK_TOKEN_TTL_MS = 1000 * 60 * 60;

type TelegramLinkStatus = {
  connected: boolean;
  telegramUserId: string | null;
  telegramLinkedAt: Date | null;
};

type TelegramLinkTokenRecord = {
  token: string;
  expiresAt: Date;
  deepLink: string;
};

let botUsernameCache: string | null = null;
let botUsernamePromise: Promise<string | null> | null = null;

export function createTelegramLinkTokenValue(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export async function getTelegramBotUsername(): Promise<string | null> {
  if (botUsernameCache) return botUsernameCache;

  const configured = process.env.TELEGRAM_BOT_USERNAME?.trim();
  if (configured) {
    botUsernameCache = configured.replace(/^@/, "");
    return botUsernameCache;
  }

  const token = getTelegramBotToken();
  if (!token) return null;

  if (!botUsernamePromise) {
    botUsernamePromise = (async () => {
      const bot = new Bot(token);
      const me = await bot.api.getMe();
      botUsernameCache = me.username?.replace(/^@/, "") ?? null;
      return botUsernameCache;
    })().catch((error) => {
      botUsernamePromise = null;
      throw error;
    });
  }

  return botUsernamePromise;
}

export async function getTelegramLinkStatus(userId: string): Promise<TelegramLinkStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { telegramUserId: true, telegramLinkedAt: true }
  });

  return {
    connected: Boolean(user?.telegramUserId),
    telegramUserId: user?.telegramUserId ?? null,
    telegramLinkedAt: user?.telegramLinkedAt ?? null
  };
}

export async function getUserByTelegramUserId(telegramUserId: string): Promise<{
  id: string;
  tenantId: string;
} | null> {
  const user = await prisma.user.findUnique({
    where: { telegramUserId },
    select: { id: true, tenantId: true }
  });

  return user ? { id: user.id, tenantId: user.tenantId } : null;
}

export async function issueTelegramLinkToken(userId: string): Promise<TelegramLinkTokenRecord> {
  const botUsername = await getTelegramBotUsername();
  if (!botUsername) {
    throw new Error("Telegram bot username unavailable");
  }

  const token = createTelegramLinkTokenValue();
  const expiresAt = new Date(Date.now() + LINK_TOKEN_TTL_MS);

  await prisma.telegramLinkToken.deleteMany({
    where: {
      userId,
      consumedAt: null
    }
  });

  await prisma.telegramLinkToken.create({
    data: {
      token,
      userId,
      expiresAt
    }
  });

  return {
    token,
    expiresAt,
    deepLink: `https://t.me/${botUsername}?start=link_${token}`
  };
}

export async function unlinkTelegramAccount(userId: string): Promise<TelegramLinkStatus> {
  await prisma.telegramLinkToken.deleteMany({ where: { userId } });

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      telegramUserId: null,
      telegramLinkedAt: null
    },
    select: { telegramUserId: true, telegramLinkedAt: true }
  });

  return {
    connected: Boolean(user.telegramUserId),
    telegramUserId: user.telegramUserId,
    telegramLinkedAt: user.telegramLinkedAt
  };
}

export async function redeemTelegramLinkToken(params: {
  token: string;
  telegramUserId: string;
}): Promise<
  | { status: "linked"; userId: string }
  | { status: "already-linked"; userId: string }
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "conflict"; userId: string }
> {
  const linkToken = await prisma.telegramLinkToken.findUnique({
    where: { token: params.token }
  });

  if (!linkToken) {
    return { status: "invalid" };
  }

  if (linkToken.consumedAt) {
    return { status: "invalid" };
  }

  if (linkToken.expiresAt.getTime() < Date.now()) {
    return { status: "expired" };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: linkToken.userId },
    select: { id: true, telegramUserId: true }
  });

  if (!targetUser) {
    return { status: "invalid" };
  }

  if (targetUser.telegramUserId && targetUser.telegramUserId !== params.telegramUserId) {
    return { status: "conflict", userId: targetUser.id };
  }

  const existingLinkedUser = await prisma.user.findUnique({
    where: { telegramUserId: params.telegramUserId },
    select: { id: true }
  });

  if (existingLinkedUser && existingLinkedUser.id !== targetUser.id) {
    return { status: "conflict", userId: existingLinkedUser.id };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUser.id },
      data: {
        telegramUserId: params.telegramUserId,
        telegramLinkedAt: new Date()
      }
    }),
    prisma.telegramLinkToken.update({
      where: { id: linkToken.id },
      data: {
        consumedAt: new Date()
      }
    })
  ]);

  return targetUser.telegramUserId === params.telegramUserId
    ? { status: "already-linked", userId: targetUser.id }
    : { status: "linked", userId: targetUser.id };
}