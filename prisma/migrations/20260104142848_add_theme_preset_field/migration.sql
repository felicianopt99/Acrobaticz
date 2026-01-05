-- AlterTable
ALTER TABLE "customization_settings" ADD COLUMN     "themePreset" TEXT;

-- CreateTable
CREATE TABLE "QuotaChangeHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oldQuotaBytes" BIGINT NOT NULL,
    "newQuotaBytes" BIGINT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotaChangeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupJob" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "backupFile" TEXT,
    "fileSize" BIGINT,
    "duration" INTEGER,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuotaChangeHistory_userId_idx" ON "QuotaChangeHistory"("userId");

-- CreateIndex
CREATE INDEX "QuotaChangeHistory_changedAt_idx" ON "QuotaChangeHistory"("changedAt");

-- CreateIndex
CREATE INDEX "QuotaChangeHistory_changedBy_idx" ON "QuotaChangeHistory"("changedBy");

-- CreateIndex
CREATE INDEX "BackupJob_jobType_idx" ON "BackupJob"("jobType");

-- CreateIndex
CREATE INDEX "BackupJob_status_idx" ON "BackupJob"("status");

-- CreateIndex
CREATE INDEX "BackupJob_createdAt_idx" ON "BackupJob"("createdAt");

-- CreateIndex
CREATE INDEX "FileVersion_versionNum_idx" ON "FileVersion"("versionNum");

-- AddForeignKey
ALTER TABLE "QuotaChangeHistory" ADD CONSTRAINT "QuotaChangeHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StorageQuota"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
