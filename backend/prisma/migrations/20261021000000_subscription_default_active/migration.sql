-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"ESubscriptionStatus";

-- Update existing DRAFT subscriptions to ACTIVE
UPDATE "Subscription"
SET "status" = 'ACTIVE'::"ESubscriptionStatus",
    "activatedAt" = COALESCE("activatedAt", NOW())
WHERE "status" = 'DRAFT'::"ESubscriptionStatus";
