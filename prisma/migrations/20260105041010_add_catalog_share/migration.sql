-- AlterTable
ALTER TABLE "EventSubClient" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CatalogShare" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "selectedEquipmentIds" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogShare_token_key" ON "CatalogShare"("token");

-- CreateIndex
CREATE INDEX "CatalogShare_token_idx" ON "CatalogShare"("token");

-- CreateIndex
CREATE INDEX "CatalogShare_partnerId_idx" ON "CatalogShare"("partnerId");

-- CreateIndex
CREATE INDEX "CatalogShare_expiresAt_idx" ON "CatalogShare"("expiresAt");

-- AddForeignKey
ALTER TABLE "CatalogShare" ADD CONSTRAINT "CatalogShare_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
