-- Soft-delete support for Reservation, DailyIncome, IncomeLine

ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Reservation_deletedAt_idx" ON "Reservation"("deletedAt");

ALTER TABLE "DailyIncome" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "DailyIncome_deletedAt_idx" ON "DailyIncome"("deletedAt");

-- Allow recreating a day after soft-delete (unique only among active rows)
DROP INDEX IF EXISTS "DailyIncome_date_key";
CREATE UNIQUE INDEX IF NOT EXISTS "DailyIncome_date_active_key"
  ON "DailyIncome"("date")
  WHERE "deletedAt" IS NULL;

ALTER TABLE "IncomeLine" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "IncomeLine_deletedAt_idx" ON "IncomeLine"("deletedAt");
