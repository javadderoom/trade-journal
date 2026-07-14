-- CreateIndex
CREATE INDEX "Trade_open_time_idx" ON "Trade"("open_time");

-- CreateIndex
CREATE INDEX "Trade_user_id_open_time_idx" ON "Trade"("user_id", "open_time");
