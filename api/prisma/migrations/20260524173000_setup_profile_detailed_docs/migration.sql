-- Add a dedicated detailed docs column to the setup profile table.
ALTER TABLE "UserSetupProfile"
ADD COLUMN "detailedDocs" JSONB;

-- Backfill from existing postConstraints payload when present.
UPDATE "UserSetupProfile"
SET "detailedDocs" = "postConstraints" -> 'detailedDocs'
WHERE "detailedDocs" IS NULL
  AND "postConstraints" IS NOT NULL
  AND "postConstraints" ? 'detailedDocs';