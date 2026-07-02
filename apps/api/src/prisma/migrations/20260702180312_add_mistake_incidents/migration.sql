-- CreateTable
CREATE TABLE "MistakeIncident" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trade_id" TEXT NOT NULL,
    "rule_key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "cost_usd" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MistakeIncident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MistakeIncident_user_id_idx" ON "MistakeIncident"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "MistakeIncident_trade_id_rule_key_key" ON "MistakeIncident"("trade_id", "rule_key");

-- AddForeignKey
ALTER TABLE "MistakeIncident" ADD CONSTRAINT "MistakeIncident_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MistakeIncident" ADD CONSTRAINT "MistakeIncident_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
