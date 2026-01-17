-- L10N Ecosystem Harmonization - Migration Script
-- Adds 6 tables for translation glossary, metrics, fallback strategies

-- 1. TranslationGlossary - Centralizado dinâmico
CREATE TABLE IF NOT EXISTS "TranslationGlossary" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceText" TEXT NOT NULL,
  "translatedText" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 1,
  "category" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "version" INTEGER NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX "idx_glossary_source_lang" ON "TranslationGlossary"("sourceText", "language");
CREATE INDEX "idx_glossary_active" ON "TranslationGlossary"("isActive");
CREATE INDEX "idx_glossary_lang" ON "TranslationGlossary"("language");
CREATE INDEX "idx_glossary_category" ON "TranslationGlossary"("category");
CREATE INDEX "idx_glossary_updated" ON "TranslationGlossary"("updatedAt" DESC);

-- 2. GlossaryAudit - Rastreamento de mudanças
CREATE TABLE IF NOT EXISTS "GlossaryAudit" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "glossaryId" TEXT NOT NULL,
  "sourceText" TEXT NOT NULL,
  "oldTranslation" TEXT,
  "newTranslation" TEXT,
  "changedBy" TEXT NOT NULL,
  "changeReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("changedBy") REFERENCES "User"("id")
);

CREATE INDEX "idx_audit_glossary_id" ON "GlossaryAudit"("glossaryId");
CREATE INDEX "idx_audit_changed_at" ON "GlossaryAudit"("createdAt" DESC);

-- 3. TranslationMetrics - Rastreamento de performance
CREATE TABLE IF NOT EXISTS "TranslationMetrics" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "period" TEXT NOT NULL,
  "cacheHitRate" FLOAT NOT NULL DEFAULT 0.0,
  "cacheMissRate" FLOAT NOT NULL DEFAULT 0.0,
  "totalRequests" INTEGER NOT NULL DEFAULT 0,
  "deeplApiLatencyMs" INTEGER NOT NULL DEFAULT 0,
  "dbLatencyMs" INTEGER NOT NULL DEFAULT 0,
  "memoryLatencyMs" INTEGER NOT NULL DEFAULT 0,
  "failedTranslations" INTEGER NOT NULL DEFAULT 0,
  "staleServingCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_metrics_period" ON "TranslationMetrics"("period");
CREATE INDEX "idx_metrics_created" ON "TranslationMetrics"("createdAt" DESC);

-- 4. PendingRetranslation - Fila de re-tradução (fallback marcado)
CREATE TABLE IF NOT EXISTS "PendingRetranslation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceText" TEXT NOT NULL,
  "targetLanguage" TEXT NOT NULL,
  "currentCachedTranslation" TEXT,
  "reason" TEXT NOT NULL,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "maxRetries" INTEGER NOT NULL DEFAULT 3,
  "nextRetryAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "idx_pending_source_lang" ON "PendingRetranslation"("sourceText", "targetLanguage");
CREATE INDEX "idx_pending_status" ON "PendingRetranslation"("status");
CREATE INDEX "idx_pending_retry" ON "PendingRetranslation"("nextRetryAt");

-- 5. TranslationState - Estado de "Pronto para Impressão"
CREATE TABLE IF NOT EXISTS "TranslationState" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "translatedLanguages" TEXT NOT NULL DEFAULT '[]',
  "cacheWarmed" BOOLEAN NOT NULL DEFAULT false,
  "readyForPrint" BOOLEAN NOT NULL DEFAULT false,
  "printReadyAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "idx_translation_state_entity" ON "TranslationState"("entityType", "entityId");
CREATE INDEX "idx_translation_state_ready" ON "TranslationState"("readyForPrint");
CREATE INDEX "idx_translation_state_status" ON "TranslationState"("status");

-- 6. OfflineSyncData - Para app mobile offline
CREATE TABLE IF NOT EXISTS "OfflineSyncData" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "dataType" TEXT NOT NULL,
  "dataBlob" JSONB NOT NULL,
  "version" INTEGER NOT NULL,
  "checksum" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3)
);

CREATE INDEX "idx_offline_type" ON "OfflineSyncData"("dataType");
CREATE INDEX "idx_offline_expires" ON "OfflineSyncData"("expiresAt");

-- 7. CacheInvalidationLog - Rastreamento de invalidação em cascata
CREATE TABLE IF NOT EXISTS "CacheInvalidationLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "triggerId" TEXT NOT NULL,
  "triggerType" TEXT NOT NULL,
  "affectedCaches" TEXT NOT NULL,
  "affectedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_invalidation_trigger" ON "CacheInvalidationLog"("triggerId");
CREATE INDEX "idx_invalidation_created" ON "CacheInvalidationLog"("createdAt" DESC);
