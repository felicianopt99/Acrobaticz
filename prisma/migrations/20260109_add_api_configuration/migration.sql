-- CreateTable
CREATE TABLE "APIConfiguration" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "lastTestedAt" TIMESTAMP(3),
    "testStatus" TEXT NOT NULL DEFAULT 'not_tested',
    "testError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "APIConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "APIConfiguration_provider_key" ON "APIConfiguration"("provider");

-- CreateIndex
CREATE INDEX "APIConfiguration_provider_idx" ON "APIConfiguration"("provider");

-- CreateIndex
CREATE INDEX "APIConfiguration_isActive_idx" ON "APIConfiguration"("isActive");

-- CreateIndex
CREATE INDEX "APIConfiguration_createdAt_idx" ON "APIConfiguration"("createdAt");
