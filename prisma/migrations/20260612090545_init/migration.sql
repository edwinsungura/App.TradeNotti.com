-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('LIVE', 'DEMO');

-- CreateEnum
CREATE TYPE "TradeDirection" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "TradeGrade" AS ENUM ('HIGH_PROBABILITY', 'LOW_PROBABILITY');

-- CreateEnum
CREATE TYPE "RuleCategory" AS ENUM ('TIMING', 'RISK', 'ENTRY', 'MANAGEMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "broker" TEXT NOT NULL DEFAULT 'MetaTrader 5',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "type" "AccountType" NOT NULL DEFAULT 'LIVE',
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "metaApiAccountId" TEXT,
    "brokerLogin" TEXT,
    "brokerServer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "externalId" TEXT,
    "symbol" TEXT NOT NULL,
    "direction" "TradeDirection" NOT NULL,
    "status" "TradeStatus" NOT NULL DEFAULT 'OPEN',
    "grade" "TradeGrade",
    "entry" DECIMAL(18,5) NOT NULL,
    "stopLoss" DECIMAL(18,5),
    "takeProfit" DECIMAL(18,5),
    "exitPrice" DECIMAL(18,5),
    "volume" DECIMAL(18,2),
    "pnl" DECIMAL(18,2),
    "rMultiple" DECIMAL(8,2),
    "openedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagsOnTrades" (
    "tradeId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "TagsOnTrades_pkey" PRIMARY KEY ("tradeId","tagId")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" "RuleCategory" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyInsight" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "category" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "metrics" JSONB,
    "source" TEXT NOT NULL DEFAULT 'stub',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Trade_accountId_status_idx" ON "Trade"("accountId", "status");

-- CreateIndex
CREATE INDEX "Trade_accountId_openedAt_idx" ON "Trade"("accountId", "openedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Trade_accountId_externalId_key" ON "Trade"("accountId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "TagsOnTrades_tagId_idx" ON "TagsOnTrades"("tagId");

-- CreateIndex
CREATE INDEX "Rule_accountId_active_idx" ON "Rule"("accountId", "active");

-- CreateIndex
CREATE INDEX "DailyInsight_accountId_date_idx" ON "DailyInsight"("accountId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyInsight_accountId_date_key" ON "DailyInsight"("accountId", "date");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagsOnTrades" ADD CONSTRAINT "TagsOnTrades_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagsOnTrades" ADD CONSTRAINT "TagsOnTrades_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyInsight" ADD CONSTRAINT "DailyInsight_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
