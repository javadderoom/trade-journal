-- CreateTable
CREATE TABLE "BacktestSession" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Backtest Session',
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "initial_balance" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "final_balance" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "total_trades" INTEGER NOT NULL DEFAULT 0,
    "win_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profit_factor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max_drawdown" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trade_log" JSONB,
    "equity_curve" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BacktestSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandleCache" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "candles" JSONB NOT NULL,
    "count" INTEGER NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandleCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BacktestSession_user_id_idx" ON "BacktestSession"("user_id");

-- CreateIndex
CREATE INDEX "BacktestSession_user_id_created_at_idx" ON "BacktestSession"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "CandleCache_symbol_timeframe_idx" ON "CandleCache"("symbol", "timeframe");

-- CreateIndex
CREATE UNIQUE INDEX "CandleCache_symbol_timeframe_key" ON "CandleCache"("symbol", "timeframe");

-- CreateIndex
CREATE INDEX "Account_user_id_idx" ON "Account"("user_id");

-- CreateIndex
CREATE INDEX "Conversation_user_id_updated_at_idx" ON "Conversation"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "Conversation_status_updated_at_idx" ON "Conversation"("status", "updated_at");

-- CreateIndex
CREATE INDEX "Execution_trade_id_type_idx" ON "Execution"("trade_id", "type");

-- CreateIndex
CREATE INDEX "Trade_user_id_account_id_open_time_idx" ON "Trade"("user_id", "account_id", "open_time");

-- CreateIndex
CREATE INDEX "Trade_user_id_close_time_idx" ON "Trade"("user_id", "close_time");

-- AddForeignKey
ALTER TABLE "BacktestSession" ADD CONSTRAINT "BacktestSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
