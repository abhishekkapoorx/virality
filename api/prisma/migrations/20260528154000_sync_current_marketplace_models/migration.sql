-- Sync the live dev database with the current Prisma schema.
-- This migration preserves existing marketplace content and backfills the
-- new day-row schedule model expected by the app.

-- Marketplace post styles: add the new normalized template columns.
ALTER TABLE "MarketplacePostStyle"
  ADD COLUMN IF NOT EXISTS "templateShortDescription" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "templateLongDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "templateIcon" TEXT,
  ADD COLUMN IF NOT EXISTS "templateStructure" TEXT,
  ADD COLUMN IF NOT EXISTS "templateExpectedHooks" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "templateOutcome" TEXT;

UPDATE "MarketplacePostStyle"
SET
  "templateShortDescription" = COALESCE(
    NULLIF(BTRIM(COALESCE("template"->>'shortDescription', "description", '')), ''),
    ''
  ),
  "templateLongDescription" = NULLIF(
    BTRIM(COALESCE("template"->>'longDescription', "description", '')),
    ''
  ),
  "templateIcon" = NULLIF(BTRIM(COALESCE("template"->>'icon', '')), ''),
  "templateStructure" = NULLIF(BTRIM(COALESCE("template"->>'structure', '')), ''),
  "templateExpectedHooks" = CASE
    WHEN jsonb_typeof("template"->'expectedHooks') = 'array' THEN COALESCE(
      ARRAY(
        SELECT jsonb_array_elements_text("template"->'expectedHooks')
      ),
      ARRAY[]::TEXT[]
    )
    ELSE ARRAY[]::TEXT[]
  END,
  "templateOutcome" = NULLIF(BTRIM(COALESCE("template"->>'outcome', '')), '')
WHERE TRUE;

-- Marketplace hooks: add the new normalized definition columns.
ALTER TABLE "MarketplaceHook"
  ADD COLUMN IF NOT EXISTS "defShortDescription" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "defLongDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "defIcon" TEXT,
  ADD COLUMN IF NOT EXISTS "defExamples" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "defWhenToUse" TEXT,
  ADD COLUMN IF NOT EXISTS "defPsychologicalEffect" TEXT;

UPDATE "MarketplaceHook"
SET
  "defShortDescription" = COALESCE(
    NULLIF(BTRIM(COALESCE("definition"->>'shortDescription', "description", '')), ''),
    ''
  ),
  "defLongDescription" = NULLIF(
    BTRIM(COALESCE("definition"->>'longDescription', "description", '')),
    ''
  ),
  "defIcon" = NULLIF(BTRIM(COALESCE("definition"->>'icon', '')), ''),
  "defExamples" = CASE
    WHEN jsonb_typeof("definition"->'examples') = 'array' THEN COALESCE(
      ARRAY(
        SELECT jsonb_array_elements_text("definition"->'examples')
      ),
      ARRAY[]::TEXT[]
    )
    ELSE ARRAY[]::TEXT[]
  END,
  "defWhenToUse" = NULLIF(BTRIM(COALESCE("definition"->>'whenToUse', '')), ''),
  "defPsychologicalEffect" = NULLIF(BTRIM(COALESCE("definition"->>'psychologicalEffect', '')), '')
WHERE TRUE;

-- Day-row schedule model: add the current fields and backfill from the old table shape.
ALTER TABLE "UserSelectedPostStyle"
  ADD COLUMN IF NOT EXISTS "dayKey" VARCHAR(16),
  ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'UTC';

UPDATE "UserSelectedPostStyle"
SET "timezone" = COALESCE(NULLIF("timezone", ''), 'UTC');

WITH ranked AS (
  SELECT
    id,
    "userId",
    ROW_NUMBER() OVER (
      PARTITION BY "userId"
      ORDER BY "ordering", "createdAt", id
    ) AS rn
  FROM "UserSelectedPostStyle"
),
extra_rows AS (
  SELECT id
  FROM ranked
  WHERE rn > 7
),
backfill AS (
  SELECT
    id,
    CASE rn
      WHEN 1 THEN 'monday'
      WHEN 2 THEN 'tuesday'
      WHEN 3 THEN 'wednesday'
      WHEN 4 THEN 'thursday'
      WHEN 5 THEN 'friday'
      WHEN 6 THEN 'saturday'
      WHEN 7 THEN 'sunday'
    END AS day_key
  FROM ranked
  WHERE rn <= 7
)
DELETE FROM "UserSelectedPostStyle"
WHERE id IN (SELECT id FROM extra_rows);

UPDATE "UserSelectedPostStyle" u
SET "dayKey" = backfill.day_key
FROM (
  SELECT
    id,
    CASE rn
      WHEN 1 THEN 'monday'
      WHEN 2 THEN 'tuesday'
      WHEN 3 THEN 'wednesday'
      WHEN 4 THEN 'thursday'
      WHEN 5 THEN 'friday'
      WHEN 6 THEN 'saturday'
      WHEN 7 THEN 'sunday'
    END AS day_key
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY "userId"
        ORDER BY "ordering", "createdAt", id
      ) AS rn
    FROM "UserSelectedPostStyle"
  ) ranked_again
  WHERE rn <= 7
) backfill
WHERE u.id = backfill.id
  AND u."dayKey" IS NULL;

ALTER TABLE "UserSelectedPostStyle"
  ALTER COLUMN "dayKey" SET NOT NULL;

-- Keep the Prisma-backed indexes current so queries stay fast and unique by day.
CREATE UNIQUE INDEX IF NOT EXISTS "UserSelectedPostStyle_userId_dayKey_key"
  ON "UserSelectedPostStyle" ("userId", "dayKey");

CREATE INDEX IF NOT EXISTS "UserSelectedPostStyle_styleId_idx"
  ON "UserSelectedPostStyle" ("styleId");

CREATE INDEX IF NOT EXISTS "UserSelectedPostStyle_dayKey_idx"
  ON "UserSelectedPostStyle" ("dayKey");

CREATE INDEX IF NOT EXISTS "UserSelectedHook_hookId_idx"
  ON "UserSelectedHook" ("hookId");

CREATE INDEX IF NOT EXISTS "MarketplacePostStyle_ownerUserId_idx"
  ON "MarketplacePostStyle" ("ownerUserId");

CREATE INDEX IF NOT EXISTS "MarketplaceHook_ownerUserId_idx"
  ON "MarketplaceHook" ("ownerUserId");
