-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN "paidAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Reservation_paidAt_idx" ON "Reservation"("paidAt");

-- Backfill from bulk "mark as paid" audit entries (single updates don't record the paid flag)
UPDATE "Reservation" AS r
SET "paidAt" = sub.paid_at
FROM (
  SELECT ids.id AS reservation_id, MAX(a."createdAt") AS paid_at
  FROM "AuditLog" AS a
  CROSS JOIN LATERAL jsonb_array_elements_text(a."metadata" -> 'ids') AS ids(id)
  WHERE a."entityType" = 'RESERVATION'
    AND a."action" = 'BULK_PAID'
    AND jsonb_typeof(a."metadata" -> 'ids') = 'array'
  GROUP BY ids.id
) AS sub
WHERE r."id" = sub.reservation_id
  AND r."isPaid" = true
  AND r."paidAt" IS NULL;
