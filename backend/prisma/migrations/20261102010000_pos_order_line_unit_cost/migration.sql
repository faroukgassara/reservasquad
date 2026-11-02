-- AlterTable
ALTER TABLE "PosOrderLine" ADD COLUMN "unitCost" DECIMAL(12,3);

-- One-time backfill: past product sales take the product's current cost (unknown when it is 0).
UPDATE "PosOrderLine" AS pol
SET "unitCost" = p."cost"
FROM "PosProduct" AS p
WHERE pol."productId" = p."id"
  AND p."cost" > 0;
