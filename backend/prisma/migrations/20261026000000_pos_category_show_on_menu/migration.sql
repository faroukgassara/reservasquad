-- AlterTable
ALTER TABLE "PosCategory" ADD COLUMN "showOnMenu" BOOLEAN NOT NULL DEFAULT true;

-- The library category is not part of the café menu.
UPDATE "PosCategory" SET "showOnMenu" = false WHERE lower("name") IN ('bibliotheque', 'bibliothèque');
