-- CreateTable
CREATE TABLE "PosSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "defaultOpeningCash" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "allowCashierOverride" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" TEXT,

    CONSTRAINT "PosSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PosSettings" ("id") VALUES ('default') ON CONFLICT ("id") DO NOTHING;
