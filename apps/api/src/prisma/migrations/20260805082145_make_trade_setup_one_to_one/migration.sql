/*
  Warnings:

  - The primary key for the `TradeSetup` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "TradeSetup" DROP CONSTRAINT "TradeSetup_pkey",
ADD CONSTRAINT "TradeSetup_pkey" PRIMARY KEY ("trade_id");
