-- AlterTable
ALTER TABLE "PosProduct" ALTER COLUMN "minStock" SET DEFAULT 10;

-- Backfill existing stockable products with null minStock to 10
UPDATE "PosProduct" SET "minStock" = 10 WHERE "minStock" IS NULL AND "type" = 'STOCKABLE';
