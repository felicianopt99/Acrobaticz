-- CreateTable
CREATE TABLE "CatalogShareInquiry" (
    "id" TEXT NOT NULL,
    "catalogShareId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "message" TEXT,
    "items" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogShareInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogShareInquiry_catalogShareId_idx" ON "CatalogShareInquiry"("catalogShareId");

-- CreateIndex
CREATE INDEX "CatalogShareInquiry_partnerId_idx" ON "CatalogShareInquiry"("partnerId");

-- CreateIndex
CREATE INDEX "CatalogShareInquiry_status_idx" ON "CatalogShareInquiry"("status");

-- CreateIndex
CREATE INDEX "CatalogShareInquiry_createdAt_idx" ON "CatalogShareInquiry"("createdAt");

-- AddForeignKey
ALTER TABLE "CatalogShareInquiry" ADD CONSTRAINT "CatalogShareInquiry_catalogShareId_fkey" FOREIGN KEY ("catalogShareId") REFERENCES "CatalogShare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogShareInquiry" ADD CONSTRAINT "CatalogShareInquiry_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
