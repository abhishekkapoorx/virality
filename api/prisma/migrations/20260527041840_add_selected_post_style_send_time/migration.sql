-- AlterTable: add selected post send time
ALTER TABLE "UserSelectedPostStyle"
ADD COLUMN IF NOT EXISTS "sendTime" VARCHAR(5);

-- AlterTable: convert structured ICPs without losing existing data
ALTER TABLE "UserSetupProfile"
ADD COLUMN IF NOT EXISTS "icps_new" TEXT[];

UPDATE "UserSetupProfile"
SET "icps_new" = CASE
  WHEN "icps" IS NULL THEN ARRAY[]::TEXT[]
  ELSE ARRAY(SELECT jsonb_array_elements_text(("icps")::jsonb))
END;

ALTER TABLE "UserSetupProfile"
DROP COLUMN IF EXISTS "icps";

ALTER TABLE "UserSetupProfile"
RENAME COLUMN "icps_new" TO "icps";

ALTER TABLE "UserSetupProfile"
ALTER COLUMN "icps" SET NOT NULL;
