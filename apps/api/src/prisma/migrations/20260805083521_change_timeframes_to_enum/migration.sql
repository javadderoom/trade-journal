/*
  Warnings:

  - The `analysis_timeframe` column on the `TradeAnnotation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `entry_timeframe` column on the `TradeAnnotation` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Timeframe" AS ENUM ('M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN1');

-- AlterTable
ALTER TABLE "TradeAnnotation" DROP COLUMN "analysis_timeframe",
ADD COLUMN     "analysis_timeframe" "Timeframe",
DROP COLUMN "entry_timeframe",
ADD COLUMN     "entry_timeframe" "Timeframe";
