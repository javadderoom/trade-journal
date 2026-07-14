-- CreateEnum
CREATE TYPE "ExecutionType" AS ENUM ('ENTRY', 'EXIT');

-- CreateTable
CREATE TABLE "Execution" (
    "id" TEXT NOT NULL,
    "trade_id" TEXT NOT NULL,
    "type" "ExecutionType" NOT NULL,
    "lot_size" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "profit_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "swap" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pips" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "r_multiple" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "close_time" TIMESTAMP(3),
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "Execution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Execution_trade_id_idx" ON "Execution"("trade_id");

-- CreateIndex
CREATE INDEX "Execution_executed_at_idx" ON "Execution"("executed_at");

-- AddForeignKey
ALTER TABLE "Execution" ADD CONSTRAINT "Execution_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
