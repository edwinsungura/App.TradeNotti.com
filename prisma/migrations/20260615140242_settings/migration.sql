-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;

-- AlterTable
ALTER TABLE "Account" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
