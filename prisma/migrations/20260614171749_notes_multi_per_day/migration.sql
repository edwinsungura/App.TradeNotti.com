-- DropIndex
DROP INDEX "Note_userId_date_key";

-- CreateIndex
CREATE INDEX "Note_userId_date_idx" ON "Note"("userId", "date");
