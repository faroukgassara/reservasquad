-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "seriesId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Reservation_seriesId_idx" ON "Reservation"("seriesId");
