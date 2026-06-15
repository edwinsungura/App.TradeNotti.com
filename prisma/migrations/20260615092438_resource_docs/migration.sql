-- CreateTable
CREATE TABLE "ResourceDoc" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled',
    "content" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceDoc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResourceDoc_userId_idx" ON "ResourceDoc"("userId");

-- AddForeignKey
ALTER TABLE "ResourceDoc" ADD CONSTRAINT "ResourceDoc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
