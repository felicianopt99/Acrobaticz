-- AlterTable - Add clientId to Partner for linking to Client
ALTER TABLE "Partner" ADD COLUMN "clientId" TEXT;

-- CreateIndex - Partner clientId index
CREATE INDEX "Partner_clientId_idx" ON "Partner"("clientId");

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
