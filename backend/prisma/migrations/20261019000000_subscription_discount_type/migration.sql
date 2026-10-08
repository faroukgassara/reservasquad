-- CreateEnum
CREATE TYPE "EDiscountType" AS ENUM ('PERCENT', 'AMOUNT');

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "discountAmount" DECIMAL(12,3) NOT NULL DEFAULT 0,
ADD COLUMN     "discountType" "EDiscountType" NOT NULL DEFAULT 'PERCENT';
