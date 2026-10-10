-- AlterTable
ALTER TABLE "PosOrderLine" ADD COLUMN     "subscriptionId" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "amountPaid" DECIMAL(12,3) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "PosOrderLine_subscriptionId_idx" ON "PosOrderLine"("subscriptionId");

-- AddForeignKey
ALTER TABLE "PosOrderLine" ADD CONSTRAINT "PosOrderLine_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
