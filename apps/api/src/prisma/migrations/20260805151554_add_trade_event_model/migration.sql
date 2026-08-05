-- CreateEnum
CREATE TYPE "TradeEventType" AS ENUM ('SESSION_START', 'ANALYSIS', 'SETUP_FOUND', 'ENTRY', 'MANAGEMENT', 'PARTIAL_EXIT', 'EXIT', 'REVIEW');

-- CreateTable
CREATE TABLE "TradeEvent" (
    "id" TEXT NOT NULL,
    "trade_id" TEXT NOT NULL,
    "type" "TradeEventType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TradeEvent_trade_id_idx" ON "TradeEvent"("trade_id");

-- CreateIndex
CREATE INDEX "TradeEvent_trade_id_timestamp_idx" ON "TradeEvent"("trade_id", "timestamp");

-- AddForeignKey
ALTER TABLE "TradeEvent" ADD CONSTRAINT "TradeEvent_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
