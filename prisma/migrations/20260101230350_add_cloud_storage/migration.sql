-- CreateTable CloudFolder
CREATE TABLE "CloudFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "ownerId" TEXT NOT NULL,
    "color" TEXT DEFAULT '#1F2937',
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isTrashed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable CloudFile
CREATE TABLE "CloudFile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "url" TEXT,
    "folderId" TEXT,
    "ownerId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isTrashed" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable FileShare
CREATE TABLE "FileShare" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "sharedWith" TEXT,
    "permission" TEXT NOT NULL DEFAULT 'view',
    "shareToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable FolderShare
CREATE TABLE "FolderShare" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "sharedWith" TEXT,
    "permission" TEXT NOT NULL DEFAULT 'view',
    "shareToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FolderShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable FileVersion
CREATE TABLE "FileVersion" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "versionNum" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT,

    CONSTRAINT "FileVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable FileActivity
CREATE TABLE "FileActivity" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable StorageQuota
CREATE TABLE "StorageQuota" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usedBytes" BIGINT NOT NULL DEFAULT 0,
    "quotaBytes" BIGINT NOT NULL DEFAULT 10737418240,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorageQuota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CloudFolder_ownerId_idx" ON "CloudFolder"("ownerId");

-- CreateIndex
CREATE INDEX "CloudFolder_parentId_idx" ON "CloudFolder"("parentId");

-- CreateIndex
CREATE INDEX "CloudFolder_isTrashed_idx" ON "CloudFolder"("isTrashed");

-- CreateIndex
CREATE INDEX "CloudFolder_isStarred_idx" ON "CloudFolder"("isStarred");

-- CreateIndex
CREATE INDEX "CloudFile_ownerId_idx" ON "CloudFile"("ownerId");

-- CreateIndex
CREATE INDEX "CloudFile_folderId_idx" ON "CloudFile"("folderId");

-- CreateIndex
CREATE INDEX "CloudFile_isTrashed_idx" ON "CloudFile"("isTrashed");

-- CreateIndex
CREATE INDEX "CloudFile_isStarred_idx" ON "CloudFile"("isStarred");

-- CreateIndex
CREATE INDEX "CloudFile_createdAt_idx" ON "CloudFile"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FileShare_shareToken_key" ON "FileShare"("shareToken");

-- CreateIndex
CREATE INDEX "FileShare_fileId_idx" ON "FileShare"("fileId");

-- CreateIndex
CREATE INDEX "FileShare_shareToken_idx" ON "FileShare"("shareToken");

-- CreateIndex
CREATE INDEX "FileShare_expiresAt_idx" ON "FileShare"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "FolderShare_shareToken_key" ON "FolderShare"("shareToken");

-- CreateIndex
CREATE INDEX "FolderShare_folderId_idx" ON "FolderShare"("folderId");

-- CreateIndex
CREATE INDEX "FolderShare_shareToken_idx" ON "FolderShare"("shareToken");

-- CreateIndex
CREATE INDEX "FolderShare_expiresAt_idx" ON "FolderShare"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "FileVersion_fileId_versionNum_key" ON "FileVersion"("fileId", "versionNum");

-- CreateIndex
CREATE INDEX "FileVersion_fileId_idx" ON "FileVersion"("fileId");

-- CreateIndex
CREATE INDEX "FileActivity_fileId_idx" ON "FileActivity"("fileId");

-- CreateIndex
CREATE INDEX "FileActivity_userId_idx" ON "FileActivity"("userId");

-- CreateIndex
CREATE INDEX "FileActivity_action_idx" ON "FileActivity"("action");

-- CreateIndex
CREATE INDEX "FileActivity_createdAt_idx" ON "FileActivity"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StorageQuota_userId_key" ON "StorageQuota"("userId");

-- CreateIndex
CREATE INDEX "StorageQuota_userId_idx" ON "StorageQuota"("userId");

-- AddForeignKey
ALTER TABLE "CloudFolder" ADD CONSTRAINT "CloudFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CloudFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CloudFolder" ADD CONSTRAINT "CloudFolder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CloudFile" ADD CONSTRAINT "CloudFile_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "CloudFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CloudFile" ADD CONSTRAINT "CloudFile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileShare" ADD CONSTRAINT "FileShare_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "CloudFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FolderShare" ADD CONSTRAINT "FolderShare_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "CloudFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileVersion" ADD CONSTRAINT "FileVersion_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "CloudFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileActivity" ADD CONSTRAINT "FileActivity_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "CloudFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileActivity" ADD CONSTRAINT "FileActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageQuota" ADD CONSTRAINT "StorageQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
