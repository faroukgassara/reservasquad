-- CreateEnum
CREATE TYPE "ESubscriptionUnit" AS ENUM ('DAY', 'MONTH');

-- CreateEnum
CREATE TYPE "ESaleOrderStatus" AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EInvoiceType" AS ENUM ('INVOICE', 'CREDIT_NOTE');

-- CreateEnum
CREATE TYPE "EInvoiceStatus" AS ENUM ('DRAFT', 'POSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EInvoicePaymentMethod" AS ENUM ('CASH', 'BANK');

-- AlterTable
ALTER TABLE "CreditClient" ADD COLUMN     "address" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "taxId" TEXT;

-- AlterTable
ALTER TABLE "PosProduct" ADD COLUMN     "isSubscription" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subscriptionDuration" INTEGER,
ADD COLUMN     "subscriptionUnit" "ESubscriptionUnit",
ADD COLUMN     "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PosOrderLine" ADD COLUMN     "saleOrderId" TEXT;

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'Biblio Squad',
    "addressLine" TEXT,
    "city" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "taxId" TEXT,
    "logoUrl" TEXT,
    "instagramUrl" TEXT,
    "facebookUrl" TEXT,
    "stampDuty" DECIMAL(12,3) NOT NULL DEFAULT 1,
    "footerNote" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleOrder" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "status" "ESaleOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "clientId" TEXT NOT NULL,
    "salespersonId" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" DATE,
    "confirmedAt" TIMESTAMP(3),
    "note" TEXT,
    "untaxed" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SaleOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleOrderLine" (
    "id" TEXT NOT NULL,
    "saleOrderId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitPrice" DECIMAL(12,3) NOT NULL,
    "discountPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,3) NOT NULL,
    "taxAmount" DECIMAL(12,3) NOT NULL,
    "total" DECIMAL(12,3) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SaleOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "type" "EInvoiceType" NOT NULL DEFAULT 'INVOICE',
    "status" "EInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "year" INTEGER,
    "sequence" INTEGER,
    "clientId" TEXT NOT NULL,
    "saleOrderId" TEXT,
    "reversedInvoiceId" TEXT,
    "invoiceDate" DATE NOT NULL,
    "dueDate" DATE,
    "note" TEXT,
    "untaxed" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "stampDuty" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitPrice" DECIMAL(12,3) NOT NULL,
    "discountPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,3) NOT NULL,
    "taxAmount" DECIMAL(12,3) NOT NULL,
    "total" DECIMAL(12,3) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoicePayment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "method" "EInvoicePaymentMethod" NOT NULL,
    "amount" DECIMAL(12,3) NOT NULL,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoicePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "saleOrderId" TEXT,
    "posOrderId" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "note" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SaleOrder_number_key" ON "SaleOrder"("number");

-- CreateIndex
CREATE INDEX "SaleOrder_clientId_idx" ON "SaleOrder"("clientId");

-- CreateIndex
CREATE INDEX "SaleOrder_status_idx" ON "SaleOrder"("status");

-- CreateIndex
CREATE INDEX "SaleOrder_orderDate_idx" ON "SaleOrder"("orderDate");

-- CreateIndex
CREATE INDEX "SaleOrder_deletedAt_idx" ON "SaleOrder"("deletedAt");

-- CreateIndex
CREATE INDEX "SaleOrderLine_saleOrderId_idx" ON "SaleOrderLine"("saleOrderId");

-- CreateIndex
CREATE INDEX "SaleOrderLine_productId_idx" ON "SaleOrderLine"("productId");

-- CreateIndex
CREATE INDEX "Invoice_clientId_idx" ON "Invoice"("clientId");

-- CreateIndex
CREATE INDEX "Invoice_saleOrderId_idx" ON "Invoice"("saleOrderId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_invoiceDate_idx" ON "Invoice"("invoiceDate");

-- CreateIndex
CREATE INDEX "Invoice_deletedAt_idx" ON "Invoice"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_type_year_sequence_key" ON "Invoice"("type", "year", "sequence");

-- CreateIndex
CREATE INDEX "InvoiceLine_invoiceId_idx" ON "InvoiceLine"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceLine_productId_idx" ON "InvoiceLine"("productId");

-- CreateIndex
CREATE INDEX "InvoicePayment_invoiceId_idx" ON "InvoicePayment"("invoiceId");

-- CreateIndex
CREATE INDEX "Subscription_clientId_idx" ON "Subscription"("clientId");

-- CreateIndex
CREATE INDEX "Subscription_productId_idx" ON "Subscription"("productId");

-- CreateIndex
CREATE INDEX "Subscription_saleOrderId_idx" ON "Subscription"("saleOrderId");

-- CreateIndex
CREATE INDEX "Subscription_posOrderId_idx" ON "Subscription"("posOrderId");

-- CreateIndex
CREATE INDEX "Subscription_endDate_idx" ON "Subscription"("endDate");

-- CreateIndex
CREATE INDEX "PosOrderLine_saleOrderId_idx" ON "PosOrderLine"("saleOrderId");

-- AddForeignKey
ALTER TABLE "PosOrderLine" ADD CONSTRAINT "PosOrderLine_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "SaleOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrder" ADD CONSTRAINT "SaleOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CreditClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrder" ADD CONSTRAINT "SaleOrder_salespersonId_fkey" FOREIGN KEY ("salespersonId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrderLine" ADD CONSTRAINT "SaleOrderLine_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "SaleOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrderLine" ADD CONSTRAINT "SaleOrderLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PosProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CreditClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "SaleOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_reversedInvoiceId_fkey" FOREIGN KEY ("reversedInvoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PosProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CreditClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PosProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "SaleOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_posOrderId_fkey" FOREIGN KEY ("posOrderId") REFERENCES "PosOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
