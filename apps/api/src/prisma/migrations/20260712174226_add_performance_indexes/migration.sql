-- CreateIndex
CREATE INDEX "ImportJob_user_id_idx" ON "ImportJob"("user_id");

-- CreateIndex
CREATE INDEX "ImportJob_account_id_idx" ON "ImportJob"("account_id");

-- CreateIndex
CREATE INDEX "JournalEntry_user_id_idx" ON "JournalEntry"("user_id");

-- CreateIndex
CREATE INDEX "JournalEntry_user_id_date_idx" ON "JournalEntry"("user_id", "date");

-- CreateIndex
CREATE INDEX "Subscription_user_id_idx" ON "Subscription"("user_id");
