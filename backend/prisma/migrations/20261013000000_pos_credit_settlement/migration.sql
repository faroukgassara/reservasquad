-- AlterTable
ALTER TABLE "CreditPayment" ADD COLUMN     "posOrderLineId" TEXT;

-- AlterTable
ALTER TABLE "PosOrderLine" ADD COLUMN     "creditClientId" TEXT;

-- CreateIndex
CREATE INDEX "CreditPayment_posOrderLineId_idx" ON "CreditPayment"("posOrderLineId");

-- CreateIndex
CREATE INDEX "PosOrderLine_creditClientId_idx" ON "PosOrderLine"("creditClientId");

-- AddForeignKey
ALTER TABLE "CreditPayment" ADD CONSTRAINT "CreditPayment_posOrderLineId_fkey" FOREIGN KEY ("posOrderLineId") REFERENCES "PosOrderLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosOrderLine" ADD CONSTRAINT "PosOrderLine_creditClientId_fkey" FOREIGN KEY ("creditClientId") REFERENCES "CreditClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
