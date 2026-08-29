-- AlterTable
ALTER TABLE "DailyIncome" ADD COLUMN IF NOT EXISTS "savingsForCharges" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Backfill from total income (10%)
UPDATE "DailyIncome"
SET "savingsForCharges" = ROUND(("totalIncome"::numeric * 0.1), 2)
WHERE "savingsForCharges" = 0 AND "totalIncome" > 0;
