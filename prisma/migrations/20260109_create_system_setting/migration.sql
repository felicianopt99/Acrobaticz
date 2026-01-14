-- CreateTable SystemSetting
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "encryptedValue" TEXT,
    "description" TEXT,
    "isEditable" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex SystemSetting_category_key
CREATE UNIQUE INDEX "SystemSetting_category_key_key" ON "SystemSetting"("category", "key");

-- CreateIndex SystemSetting_category
CREATE INDEX "SystemSetting_category_idx" ON "SystemSetting"("category");
