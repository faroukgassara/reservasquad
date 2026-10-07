-- AlterTable
ALTER TABLE "DailyIncome" ADD COLUMN     "posSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DailyIncome_posSessionId_key" ON "DailyIncome"("posSessionId");

-- AddForeignKey
ALTER TABLE "DailyIncome" ADD CONSTRAINT "DailyIncome_posSessionId_fkey" FOREIGN KEY ("posSessionId") REFERENCES "PosSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
