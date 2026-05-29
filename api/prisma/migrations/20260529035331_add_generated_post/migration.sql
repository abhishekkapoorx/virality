/*
  Warnings:

  - You are about to drop the column `definition` on the `MarketplaceHook` table. All the data in the column will be lost.
  - You are about to drop the column `template` on the `MarketplacePostStyle` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MarketplaceHook" DROP COLUMN "definition",
ALTER COLUMN "defShortDescription" DROP DEFAULT,
ALTER COLUMN "defExamples" DROP DEFAULT;

-- AlterTable
ALTER TABLE "MarketplacePostStyle" DROP COLUMN "template",
ALTER COLUMN "templateShortDescription" DROP DEFAULT,
ALTER COLUMN "templateExpectedHooks" DROP DEFAULT;

-- CreateTable
CREATE TABLE "GeneratedPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "draft" TEXT NOT NULL,
    "imageUrl" TEXT,
    "messageTs" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneratedPost_userId_createdAt_idx" ON "GeneratedPost"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GeneratedPost_tenantId_createdAt_idx" ON "GeneratedPost"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "GeneratedPost" ADD CONSTRAINT "GeneratedPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
