-- AlterTable
ALTER TABLE "Credit" ADD COLUMN     "productId" TEXT,
ADD COLUMN     "quantity" DECIMAL(12,3);

-- AlterTable
ALTER TABLE "PosOrderLine" ADD COLUMN     "creditId" TEXT;

-- Existing register credit payments point to the first credit they paid
UPDATE "PosOrderLine" AS l
SET "creditId" = (
    SELECT p."creditId" FROM "CreditPayment" AS p
    WHERE p."posOrderLineId" = COALESCE(l."refundOfLineId", l."id")
    ORDER BY p."createdAt" ASC
    LIMIT 1
)
WHERE l."creditClientId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "PosOrderLine" DROP CONSTRAINT "PosOrderLine_creditClientId_fkey";

-- DropIndex
DROP INDEX "PosOrderLine_creditClientId_idx";

-- AlterTable
ALTER TABLE "PosOrderLine" DROP COLUMN "creditClientId";

-- CreateIndex
CREATE INDEX "PosOrderLine_creditId_idx" ON "PosOrderLine"("creditId");

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PosProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosOrderLine" ADD CONSTRAINT "PosOrderLine_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "Credit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
