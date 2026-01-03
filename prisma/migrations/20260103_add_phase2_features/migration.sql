-- CreateTable "TagDefinition"
CREATE TABLE "TagDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "color" TEXT DEFAULT '#3B82F6',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TagDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable "FileTag"
CREATE TABLE "FileTag" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable "FolderTag"
CREATE TABLE "FolderTag" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FolderTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable "BatchOperation"
CREATE TABLE "BatchOperation" (
    "id" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "fileCount" INTEGER NOT NULL,
    "folderCount" INTEGER NOT NULL DEFAULT 0,
    "performedBy" TEXT NOT NULL,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "details" TEXT,
    "error" TEXT,

    CONSTRAINT "BatchOperation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TagDefinition_ownerId_idx" ON "TagDefinition"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "TagDefinition_ownerId_name_key" ON "TagDefinition"("ownerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "FileTag_fileId_tagId_key" ON "FileTag"("fileId", "tagId");

-- CreateIndex
CREATE INDEX "FileTag_fileId_idx" ON "FileTag"("fileId");

-- CreateIndex
CREATE INDEX "FileTag_tagId_idx" ON "FileTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "FolderTag_folderId_tagId_key" ON "FolderTag"("folderId", "tagId");

-- CreateIndex
CREATE INDEX "FolderTag_folderId_idx" ON "FolderTag"("folderId");

-- CreateIndex
CREATE INDEX "FolderTag_tagId_idx" ON "FolderTag"("tagId");

-- CreateIndex
CREATE INDEX "BatchOperation_performedBy_idx" ON "BatchOperation"("performedBy");

-- CreateIndex
CREATE INDEX "BatchOperation_status_idx" ON "BatchOperation"("status");

-- CreateIndex
CREATE INDEX "BatchOperation_initiatedAt_idx" ON "BatchOperation"("initiatedAt");

-- AddForeignKey
ALTER TABLE "TagDefinition" ADD CONSTRAINT "TagDefinition_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileTag" ADD CONSTRAINT "FileTag_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "CloudFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileTag" ADD CONSTRAINT "FileTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "TagDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FolderTag" ADD CONSTRAINT "FolderTag_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "CloudFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FolderTag" ADD CONSTRAINT "FolderTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "TagDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchOperation" ADD CONSTRAINT "BatchOperation_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
