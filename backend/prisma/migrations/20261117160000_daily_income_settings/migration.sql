-- CreateTable
CREATE TABLE "DailyIncomeSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "chargesPercentage" DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    "savingsPercentage" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "benefitsPercentage" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "savingsForChargesPercentage" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" TEXT,

    CONSTRAINT "DailyIncomeSettings_pkey" PRIMARY KEY ("id")
);

-- Insert default row
INSERT INTO "DailyIncomeSettings" ("id") VALUES ('default') ON CONFLICT ("id") DO NOTHING;
