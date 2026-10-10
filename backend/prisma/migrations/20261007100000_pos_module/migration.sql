-- CreateEnum
CREATE TYPE "EPosProductType" AS ENUM ('STOCKABLE', 'CONSUMABLE');

-- CreateEnum
CREATE TYPE "EPosSessionStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "EPosCashMoveType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "EPosOrderStatus" AS ENUM ('PAID', 'REFUND');

-- CreateEnum
CREATE TYPE "EPosPaymentMethod" AS ENUM ('CASH', 'BANK', 'CLIENT_ACCOUNT');

-- CreateTable
CREATE TABLE "PosCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PosCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT,
    "imageUrl" TEXT,
    "price" DECIMAL(12,3) NOT NULL,
    "cost" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "type" "EPosProductType" NOT NULL DEFAULT 'CONSUMABLE',
    "availableInPos" BOOLEAN NOT NULL DEFAULT true,
    "stockQty" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "barcode" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PosProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosStockEntry" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitCost" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "supplier" TEXT,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosStockEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosSession" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "status" "EPosSessionStatus" NOT NULL DEFAULT 'OPEN',
    "openedById" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openingCash" DECIMAL(12,3) NOT NULL,
    "closedById" TEXT,
    "closedAt" TIMESTAMP(3),
    "countedCash" DECIMAL(12,3),
    "expectedCash" DECIMAL(12,3),
    "difference" DECIMAL(12,3),
    "closingNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosCashMove" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "EPosCashMoveType" NOT NULL,
    "amount" DECIMAL(12,3) NOT NULL,
    "reason" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosCashMove_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosOrder" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "cashierId" TEXT,
    "creditClientId" TEXT,
    "status" "EPosOrderStatus" NOT NULL DEFAULT 'PAID',
    "refundOfId" TEXT,
    "note" TEXT,
    "total" DECIMAL(12,3) NOT NULL,
    "amountPaid" DECIMAL(12,3) NOT NULL,
    "change" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosOrderLine" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitPrice" DECIMAL(12,3) NOT NULL,
    "discountPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,3) NOT NULL,
    "refundOfLineId" TEXT,

    CONSTRAINT "PosOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosPayment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" "EPosPaymentMethod" NOT NULL,
    "amount" DECIMAL(12,3) NOT NULL,
    "creditId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PosCategory_sortOrder_idx" ON "PosCategory"("sortOrder");

-- CreateIndex
CREATE INDEX "PosCategory_deletedAt_idx" ON "PosCategory"("deletedAt");

-- CreateIndex
CREATE INDEX "PosProduct_name_idx" ON "PosProduct"("name");

-- CreateIndex
CREATE INDEX "PosProduct_categoryId_idx" ON "PosProduct"("categoryId");

-- CreateIndex
CREATE INDEX "PosProduct_barcode_idx" ON "PosProduct"("barcode");

-- CreateIndex
CREATE INDEX "PosProduct_deletedAt_idx" ON "PosProduct"("deletedAt");

-- CreateIndex
CREATE INDEX "PosStockEntry_productId_idx" ON "PosStockEntry"("productId");

-- CreateIndex
CREATE INDEX "PosStockEntry_createdAt_idx" ON "PosStockEntry"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PosSession_number_key" ON "PosSession"("number");

-- CreateIndex
CREATE INDEX "PosSession_status_idx" ON "PosSession"("status");

-- CreateIndex
CREATE INDEX "PosSession_openedAt_idx" ON "PosSession"("openedAt");

-- CreateIndex
CREATE INDEX "PosCashMove_sessionId_idx" ON "PosCashMove"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "PosOrder_number_key" ON "PosOrder"("number");

-- CreateIndex
CREATE INDEX "PosOrder_sessionId_idx" ON "PosOrder"("sessionId");

-- CreateIndex
CREATE INDEX "PosOrder_cashierId_idx" ON "PosOrder"("cashierId");

-- CreateIndex
CREATE INDEX "PosOrder_creditClientId_idx" ON "PosOrder"("creditClientId");

-- CreateIndex
CREATE INDEX "PosOrder_status_idx" ON "PosOrder"("status");

-- CreateIndex
CREATE INDEX "PosOrder_refundOfId_idx" ON "PosOrder"("refundOfId");

-- CreateIndex
CREATE INDEX "PosOrder_createdAt_idx" ON "PosOrder"("createdAt");

-- CreateIndex
CREATE INDEX "PosOrderLine_orderId_idx" ON "PosOrderLine"("orderId");

-- CreateIndex
CREATE INDEX "PosOrderLine_productId_idx" ON "PosOrderLine"("productId");

-- CreateIndex
CREATE INDEX "PosOrderLine_refundOfLineId_idx" ON "PosOrderLine"("refundOfLineId");

-- CreateIndex
CREATE INDEX "PosPayment_orderId_idx" ON "PosPayment"("orderId");

-- CreateIndex
CREATE INDEX "PosPayment_method_idx" ON "PosPayment"("method");

-- CreateIndex
CREATE INDEX "PosPayment_creditId_idx" ON "PosPayment"("creditId");

-- AddForeignKey
ALTER TABLE "PosProduct" ADD CONSTRAINT "PosProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PosCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosStockEntry" ADD CONSTRAINT "PosStockEntry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PosProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosStockEntry" ADD CONSTRAINT "PosStockEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosSession" ADD CONSTRAINT "PosSession_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosSession" ADD CONSTRAINT "PosSession_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosCashMove" ADD CONSTRAINT "PosCashMove_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PosSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosCashMove" ADD CONSTRAINT "PosCashMove_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosOrder" ADD CONSTRAINT "PosOrder_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PosSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosOrder" ADD CONSTRAINT "PosOrder_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosOrder" ADD CONSTRAINT "PosOrder_creditClientId_fkey" FOREIGN KEY ("creditClientId") REFERENCES "CreditClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosOrder" ADD CONSTRAINT "PosOrder_refundOfId_fkey" FOREIGN KEY ("refundOfId") REFERENCES "PosOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosOrderLine" ADD CONSTRAINT "PosOrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PosOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosOrderLine" ADD CONSTRAINT "PosOrderLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PosProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosOrderLine" ADD CONSTRAINT "PosOrderLine_refundOfLineId_fkey" FOREIGN KEY ("refundOfLineId") REFERENCES "PosOrderLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosPayment" ADD CONSTRAINT "PosPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PosOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosPayment" ADD CONSTRAINT "PosPayment_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "Credit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
