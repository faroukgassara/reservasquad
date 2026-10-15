-- CreateEnum
CREATE TYPE "ENewsletterCategory" AS ENUM ('UPDATE', 'PROMOTION', 'DIGEST', 'EDITORIAL');

-- CreateEnum
CREATE TYPE "ENewsletterAudience" AS ENUM ('ALL_CLIENTS', 'ACTIVE_SUBSCRIBERS', 'EXPIRED_SUBSCRIBERS');

-- CreateEnum
CREATE TYPE "ENewsletterStatus" AS ENUM ('DRAFT', 'SENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "ENewsletterRecipientStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "CreditClient" ADD COLUMN "newsletterOptOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "newsletterToken" TEXT;

-- CreateTable
CREATE TABLE "Newsletter" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "preheader" TEXT,
    "body" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "category" "ENewsletterCategory" NOT NULL,
    "audience" "ENewsletterAudience" NOT NULL,
    "status" "ENewsletterStatus" NOT NULL DEFAULT 'DRAFT',
    "recipientsCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Newsletter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterRecipient" (
    "id" TEXT NOT NULL,
    "newsletterId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "ENewsletterRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreditClient_newsletterToken_key" ON "CreditClient"("newsletterToken");

-- CreateIndex
CREATE INDEX "Newsletter_status_idx" ON "Newsletter"("status");

-- CreateIndex
CREATE INDEX "Newsletter_category_idx" ON "Newsletter"("category");

-- CreateIndex
CREATE INDEX "Newsletter_createdAt_idx" ON "Newsletter"("createdAt");

-- CreateIndex
CREATE INDEX "Newsletter_deletedAt_idx" ON "Newsletter"("deletedAt");

-- CreateIndex
CREATE INDEX "NewsletterRecipient_newsletterId_status_idx" ON "NewsletterRecipient"("newsletterId", "status");

-- CreateIndex
CREATE INDEX "NewsletterRecipient_clientId_idx" ON "NewsletterRecipient"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterRecipient_newsletterId_clientId_key" ON "NewsletterRecipient"("newsletterId", "clientId");

-- AddForeignKey
ALTER TABLE "Newsletter" ADD CONSTRAINT "Newsletter_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterRecipient" ADD CONSTRAINT "NewsletterRecipient_newsletterId_fkey" FOREIGN KEY ("newsletterId") REFERENCES "Newsletter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterRecipient" ADD CONSTRAINT "NewsletterRecipient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CreditClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
