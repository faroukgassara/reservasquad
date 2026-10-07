-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_productId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_saleOrderId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_posOrderId_fkey";

-- AlterTable
ALTER TABLE "PosProduct" DROP COLUMN "isSubscription",
DROP COLUMN "subscriptionDuration",
DROP COLUMN "subscriptionUnit";

-- DropTable
DROP TABLE "Subscription";

-- DropEnum
DROP TYPE "ESubscriptionUnit";
