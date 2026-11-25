-- CreateTable
CREATE TABLE "ChargeCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ChargeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChargeCategory_deletedAt_idx" ON "ChargeCategory"("deletedAt");

-- CreateIndex
CREATE INDEX "ChargeCategory_name_idx" ON "ChargeCategory"("name");

-- AlterTable: add new columns before dropping label
ALTER TABLE "IncomeLine" ADD COLUMN "description" TEXT;
ALTER TABLE "IncomeLine" ADD COLUMN "categoryId" TEXT;

-- Backfill: create categories from distinct CHARGE labels
INSERT INTO "ChargeCategory" ("id", "name", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, trimmed.label, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT TRIM("label") AS label
    FROM "IncomeLine"
    WHERE "type" = 'CHARGE'
      AND "deletedAt" IS NULL
      AND TRIM("label") <> ''
) AS trimmed
WHERE NOT EXISTS (
    SELECT 1 FROM "ChargeCategory" c WHERE c."name" = trimmed.label AND c."deletedAt" IS NULL
);

-- Link CHARGE lines to their category; description stays null (category replaces old label)
UPDATE "IncomeLine" AS il
SET "categoryId" = c."id"
FROM "ChargeCategory" AS c
WHERE il."type" = 'CHARGE'
  AND il."deletedAt" IS NULL
  AND c."deletedAt" IS NULL
  AND TRIM(il."label") = c."name";

-- Non-CHARGE lines: keep the old label as description
UPDATE "IncomeLine"
SET "description" = NULLIF(TRIM("label"), '')
WHERE "type" <> 'CHARGE';

-- Drop old label column
ALTER TABLE "IncomeLine" DROP COLUMN "label";

-- CreateIndex
CREATE INDEX "IncomeLine_categoryId_idx" ON "IncomeLine"("categoryId");

-- AddForeignKey
ALTER TABLE "IncomeLine" ADD CONSTRAINT "IncomeLine_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ChargeCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
