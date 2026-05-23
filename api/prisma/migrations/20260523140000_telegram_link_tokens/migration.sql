-- Telegram account linking for Clerk users.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "telegramUserId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "telegramLinkedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_telegramUserId_key" ON "User"("telegramUserId");

CREATE TABLE IF NOT EXISTS "TelegramLinkToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramLinkToken_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TelegramLinkToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "TelegramLinkToken_token_key" ON "TelegramLinkToken"("token");
CREATE INDEX IF NOT EXISTS "TelegramLinkToken_userId_idx" ON "TelegramLinkToken"("userId");