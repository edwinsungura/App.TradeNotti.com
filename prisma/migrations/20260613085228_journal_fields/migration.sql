-- CreateEnum
CREATE TYPE "ScreenshotKind" AS ENUM ('BEFORE', 'AFTER');

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "marketDirection" TEXT,
ADD COLUMN     "phaseOfMarket" TEXT;

-- CreateTable
CREATE TABLE "Screenshot" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "kind" "ScreenshotKind" NOT NULL,
    "dataUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Screenshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Screenshot_tradeId_idx" ON "Screenshot"("tradeId");

-- CreateIndex
CREATE UNIQUE INDEX "Screenshot_tradeId_kind_key" ON "Screenshot"("tradeId", "kind");

-- AddForeignKey
ALTER TABLE "Screenshot" ADD CONSTRAINT "Screenshot_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
