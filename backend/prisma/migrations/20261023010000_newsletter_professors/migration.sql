-- AlterEnum
ALTER TYPE "ENewsletterAudience" ADD VALUE 'ALL_PROFESSORS';

-- DropForeignKey
ALTER TABLE "NewsletterRecipient" DROP CONSTRAINT "NewsletterRecipient_clientId_fkey";

-- DropIndex
DROP INDEX "NewsletterRecipient_newsletterId_clientId_key";

-- AlterTable
ALTER TABLE "NewsletterRecipient" ALTER COLUMN "clientId" DROP NOT NULL,
ADD COLUMN     "professorId" TEXT;

-- AlterTable
ALTER TABLE "Professor" ADD COLUMN     "newsletterOptOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "newsletterToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterRecipient_newsletterId_email_key" ON "NewsletterRecipient"("newsletterId", "email");

-- CreateIndex
CREATE INDEX "NewsletterRecipient_professorId_idx" ON "NewsletterRecipient"("professorId");

-- CreateIndex
CREATE UNIQUE INDEX "Professor_newsletterToken_key" ON "Professor"("newsletterToken");

-- AddForeignKey
ALTER TABLE "NewsletterRecipient" ADD CONSTRAINT "NewsletterRecipient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CreditClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterRecipient" ADD CONSTRAINT "NewsletterRecipient_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
