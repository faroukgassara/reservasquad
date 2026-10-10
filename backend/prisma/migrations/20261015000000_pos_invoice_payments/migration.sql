-- AlterEnum
ALTER TYPE "EInvoicePaymentMethod" ADD VALUE 'CLIENT_ACCOUNT';

-- AlterTable
ALTER TABLE "InvoicePayment" ADD COLUMN     "posOrderLineId" TEXT;

-- AlterTable
ALTER TABLE "PosOrderLine" ADD COLUMN     "invoiceId" TEXT;

-- CreateIndex
CREATE INDEX "InvoicePayment_posOrderLineId_idx" ON "InvoicePayment"("posOrderLineId");

-- CreateIndex
CREATE INDEX "PosOrderLine_invoiceId_idx" ON "PosOrderLine"("invoiceId");

-- AddForeignKey
ALTER TABLE "PosOrderLine" ADD CONSTRAINT "PosOrderLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_posOrderLineId_fkey" FOREIGN KEY ("posOrderLineId") REFERENCES "PosOrderLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
