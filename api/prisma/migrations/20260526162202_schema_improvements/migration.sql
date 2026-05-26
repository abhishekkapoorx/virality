/*
  Warnings:

  - The `visibility` column on the `MarketplaceHook` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `visibility` column on the `MarketplacePostStyle` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "MarketplaceHook" DROP COLUMN "visibility",
ADD COLUMN     "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "MarketplacePostStyle" DROP COLUMN "visibility",
ADD COLUMN     "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC';

-- CreateIndex
CREATE INDEX "MarketplaceHook_ownerUserId_idx" ON "MarketplaceHook"("ownerUserId");

-- CreateIndex
CREATE INDEX "MarketplacePostStyle_ownerUserId_idx" ON "MarketplacePostStyle"("ownerUserId");

-- CreateIndex
CREATE INDEX "UserSelectedHook_hookId_idx" ON "UserSelectedHook"("hookId");

-- CreateIndex
CREATE INDEX "UserSelectedPostStyle_styleId_idx" ON "UserSelectedPostStyle"("styleId");

-- AddForeignKey
ALTER TABLE "MarketplacePostStyle" ADD CONSTRAINT "MarketplacePostStyle_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceHook" ADD CONSTRAINT "MarketplaceHook_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSelectedPostStyle" ADD CONSTRAINT "UserSelectedPostStyle_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "MarketplacePostStyle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSelectedHook" ADD CONSTRAINT "UserSelectedHook_hookId_fkey" FOREIGN KEY ("hookId") REFERENCES "MarketplaceHook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
