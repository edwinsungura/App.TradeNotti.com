-- AlterTable: mark a day as done or explicitly missed (X)
ALTER TABLE "HabitEntry" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'done';
