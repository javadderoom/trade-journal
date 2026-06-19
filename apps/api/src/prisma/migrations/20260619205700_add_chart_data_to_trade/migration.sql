-- AlterTable
ALTER TABLE "Trade" ADD COLUMN IF NOT EXISTS "chart_data" JSONB;
