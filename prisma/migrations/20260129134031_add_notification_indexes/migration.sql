-- CreateIndex
CREATE INDEX "idx_notification_user_unread_created" ON "notifications"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "idx_notification_user_created" ON "notifications"("user_id", "created_at");
