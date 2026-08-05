-- DropIndex
DROP INDEX "TradeSetup_trade_id_key";

-- AlterTable
ALTER TABLE "TradeSetup" ADD CONSTRAINT "TradeSetup_pkey" PRIMARY KEY ("trade_id", "concept_id");
