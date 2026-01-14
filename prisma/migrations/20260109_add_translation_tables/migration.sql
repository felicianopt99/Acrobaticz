-- CreateTable TranslationCache
CREATE TABLE "TranslationCache" (
    "id" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "sourceLanguage" TEXT NOT NULL DEFAULT 'en',
    "targetLanguage" TEXT NOT NULL,
    "translatedText" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT,
    "hash" TEXT NOT NULL,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "TranslationCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex TranslationCache_hash
CREATE UNIQUE INDEX "TranslationCache_hash_key" ON "TranslationCache"("hash");

-- CreateIndex TranslationCache_contentType
CREATE INDEX "TranslationCache_contentType_idx" ON "TranslationCache"("contentType");

-- CreateIndex TranslationCache_contentId
CREATE INDEX "TranslationCache_contentId_idx" ON "TranslationCache"("contentId");

-- CreateIndex TranslationCache_targetLanguage
CREATE INDEX "TranslationCache_targetLanguage_idx" ON "TranslationCache"("targetLanguage");

-- CreateIndex TranslationCache_expiresAt
CREATE INDEX "TranslationCache_expiresAt_idx" ON "TranslationCache"("expiresAt");

-- CreateIndex TranslationCache_createdAt
CREATE INDEX "TranslationCache_createdAt_idx" ON "TranslationCache"("createdAt");

-- CreateTable ProductTranslation
CREATE TABLE "ProductTranslation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex ProductTranslation_productId_language
CREATE UNIQUE INDEX "ProductTranslation_productId_language_key" ON "ProductTranslation"("productId", "language");

-- CreateIndex ProductTranslation_productId
CREATE INDEX "ProductTranslation_productId_idx" ON "ProductTranslation"("productId");

-- CreateIndex ProductTranslation_language
CREATE INDEX "ProductTranslation_language_idx" ON "ProductTranslation"("language");

-- CreateIndex ProductTranslation_createdAt
CREATE INDEX "ProductTranslation_createdAt_idx" ON "ProductTranslation"("createdAt");

-- CreateTable CategoryTranslation
CREATE TABLE "CategoryTranslation" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex CategoryTranslation_categoryId_language
CREATE UNIQUE INDEX "CategoryTranslation_categoryId_language_key" ON "CategoryTranslation"("categoryId", "language");

-- CreateIndex CategoryTranslation_categoryId
CREATE INDEX "CategoryTranslation_categoryId_idx" ON "CategoryTranslation"("categoryId");

-- CreateIndex CategoryTranslation_language
CREATE INDEX "CategoryTranslation_language_idx" ON "CategoryTranslation"("language");

-- CreateIndex CategoryTranslation_createdAt
CREATE INDEX "CategoryTranslation_createdAt_idx" ON "CategoryTranslation"("createdAt");

-- CreateTable SubcategoryTranslation
CREATE TABLE "SubcategoryTranslation" (
    "id" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubcategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex SubcategoryTranslation_subcategoryId_language
CREATE UNIQUE INDEX "SubcategoryTranslation_subcategoryId_language_key" ON "SubcategoryTranslation"("subcategoryId", "language");

-- CreateIndex SubcategoryTranslation_subcategoryId
CREATE INDEX "SubcategoryTranslation_subcategoryId_idx" ON "SubcategoryTranslation"("subcategoryId");

-- CreateIndex SubcategoryTranslation_language
CREATE INDEX "SubcategoryTranslation_language_idx" ON "SubcategoryTranslation"("language");

-- CreateIndex SubcategoryTranslation_createdAt
CREATE INDEX "SubcategoryTranslation_createdAt_idx" ON "SubcategoryTranslation"("createdAt");

-- CreateTable TranslationJob
CREATE TABLE "TranslationJob" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "sourceLanguage" TEXT NOT NULL DEFAULT 'en',
    "targetLanguages" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "totalItems" INTEGER NOT NULL DEFAULT 1,
    "completedItems" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TranslationJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex TranslationJob_status
CREATE INDEX "TranslationJob_status_idx" ON "TranslationJob"("status");

-- CreateIndex TranslationJob_contentType
CREATE INDEX "TranslationJob_contentType_idx" ON "TranslationJob"("contentType");

-- CreateIndex TranslationJob_contentId
CREATE INDEX "TranslationJob_contentId_idx" ON "TranslationJob"("contentId");

-- CreateIndex TranslationJob_createdAt
CREATE INDEX "TranslationJob_createdAt_idx" ON "TranslationJob"("createdAt");
