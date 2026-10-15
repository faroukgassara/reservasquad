-- AlterEnum
ALTER TYPE "ENewsletterAudience" ADD VALUE 'SPECIFIC_RECIPIENTS';

-- AlterTable
ALTER TABLE "Newsletter"
ADD COLUMN "specificClientIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "specificProfessorIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "specificEmails" TEXT[] DEFAULT ARRAY[]::TEXT[];
