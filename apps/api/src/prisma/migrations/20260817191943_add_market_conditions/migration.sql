-- CreateEnum
CREATE TYPE "MarketCondition" AS ENUM ('TRENDING', 'TRENDING_RANGE', 'SIDEWAYS');

-- AlterTable
ALTER TABLE "TradeAnnotation" ADD COLUMN     "market_condition" "MarketCondition";
