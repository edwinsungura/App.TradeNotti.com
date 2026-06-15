-- CreateEnum
CREATE TYPE "PinDirection" AS ENUM ('LONG', 'SHORT');

-- CreateTable
CREATE TABLE "Pin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "symbol" TEXT,
    "timeframe" TEXT,
    "direction" "PinDirection",
    "note" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pin_userId_idx" ON "Pin"("userId");

-- AddForeignKey
ALTER TABLE "Pin" ADD CONSTRAINT "Pin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
