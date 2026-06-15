-- CreateEnum
CREATE TYPE "PartnerAccess" AS ENUM ('STATS', 'FULL');

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterTable: add username (backfill from email local-part, then enforce).
ALTER TABLE "User" ADD COLUMN "username" TEXT;
UPDATE "User" SET "username" = split_part("email", '@', 1) WHERE "username" IS NULL;
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateTable
CREATE TABLE "Partnership" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" "PartnerStatus" NOT NULL DEFAULT 'PENDING',
    "requesterAccess" "PartnerAccess" NOT NULL DEFAULT 'STATS',
    "addresseeAccess" "PartnerAccess" NOT NULL DEFAULT 'STATS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partnership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Partnership_addresseeId_status_idx" ON "Partnership"("addresseeId", "status");

-- CreateIndex
CREATE INDEX "Partnership_requesterId_status_idx" ON "Partnership"("requesterId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Partnership_requesterId_addresseeId_key" ON "Partnership"("requesterId", "addresseeId");

-- AddForeignKey
ALTER TABLE "Partnership" ADD CONSTRAINT "Partnership_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partnership" ADD CONSTRAINT "Partnership_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
