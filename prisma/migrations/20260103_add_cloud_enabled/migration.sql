-- Add cloudEnabled field to StorageQuota table
ALTER TABLE "StorageQuota" ADD COLUMN "cloudEnabled" BOOLEAN NOT NULL DEFAULT false;
