-- Create TradeAnnotation table
CREATE TABLE "TradeAnnotation" (
    "id" TEXT NOT NULL,
    "trade_id" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL DEFAULT '{}',
    "emotion" TEXT,
    "notes" TEXT,
    "screenshots" TEXT[] NOT NULL DEFAULT '{}',
    "analysis_timeframe" TEXT,
    "entry_timeframe" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeAnnotation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TradeAnnotation_trade_id_unique" UNIQUE ("trade_id")
);

-- Add foreign key from TradeAnnotation to Trade
ALTER TABLE "TradeAnnotation" ADD CONSTRAINT "TradeAnnotation_trade_id_fkey"
    FOREIGN KEY ("trade_id") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing data from Trade to TradeAnnotation
INSERT INTO "TradeAnnotation" (
    "id", "trade_id", "tags", "emotion", "notes", "screenshots", "analysis_timeframe", "entry_timeframe", "updated_at"
)
SELECT 
    gen_random_uuid(), "id", "tags", "emotion", "notes", "screenshots", "analysis_timeframe", "entry_timeframe", CURRENT_TIMESTAMP
FROM "Trade"
WHERE array_length("tags", 1) > 0 
   OR "emotion" IS NOT NULL 
   OR "notes" IS NOT NULL 
   OR array_length("screenshots", 1) > 0 
   OR "analysis_timeframe" IS NOT NULL 
   OR "entry_timeframe" IS NOT NULL;

-- Drop user-generated columns from Trade table
ALTER TABLE "Trade" DROP COLUMN "tags";
ALTER TABLE "Trade" DROP COLUMN "emotion";
ALTER TABLE "Trade" DROP COLUMN "notes";
ALTER TABLE "Trade" DROP COLUMN "screenshots";
ALTER TABLE "Trade" DROP COLUMN "analysis_timeframe";
ALTER TABLE "Trade" DROP COLUMN "entry_timeframe";