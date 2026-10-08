-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "cardToken" TEXT;

UPDATE "Subscription" SET "cardToken" = gen_random_uuid()::text WHERE "cardToken" IS NULL;

ALTER TABLE "Subscription" ALTER COLUMN "cardToken" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_cardToken_key" ON "Subscription"("cardToken");
