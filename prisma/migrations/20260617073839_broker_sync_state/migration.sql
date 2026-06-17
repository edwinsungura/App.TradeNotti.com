-- AlterTable
ALTER TABLE "Account" ADD COLUMN "lastSyncedAt" TIMESTAMP(3);
ALTER TABLE "Account" ADD COLUMN "syncStatus" TEXT NOT NULL DEFAULT 'idle';
