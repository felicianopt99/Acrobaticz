-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "groupKey" TEXT;

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conflictAlerts" BOOLEAN NOT NULL DEFAULT true,
    "statusChanges" BOOLEAN NOT NULL DEFAULT true,
    "eventReminders" BOOLEAN NOT NULL DEFAULT true,
    "overdueAlerts" BOOLEAN NOT NULL DEFAULT true,
    "criticalAlerts" BOOLEAN NOT NULL DEFAULT true,
    "stockAlerts" BOOLEAN NOT NULL DEFAULT true,
    "equipmentAvailable" BOOLEAN NOT NULL DEFAULT true,
    "monthlySummary" BOOLEAN NOT NULL DEFAULT true,
    "toastCritical" BOOLEAN NOT NULL DEFAULT true,
    "toastHigh" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "Notification_priority_idx" ON "Notification"("priority");

-- CreateIndex
CREATE INDEX "Notification_groupKey_idx" ON "Notification"("groupKey");

-- CreateIndex
CREATE INDEX "Notification_expiresAt_idx" ON "Notification"("expiresAt");

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
