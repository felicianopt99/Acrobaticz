-- AlterTable - Add partnerType and commission to Partner
ALTER TABLE "Partner" ADD COLUMN "partnerType" TEXT NOT NULL DEFAULT 'provider',
ADD COLUMN "commission" DOUBLE PRECISION;

-- CreateTable - JobReference
CREATE TABLE "JobReference" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "eventId" TEXT,
    "quoteId" TEXT,
    "clientName" TEXT,
    "referralNotes" TEXT,
    "commission" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "referralDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobReference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex - Partner partnerType index
CREATE INDEX "Partner_partnerType_idx" ON "Partner"("partnerType");

-- CreateIndex - JobReference indexes
CREATE INDEX "JobReference_partnerId_idx" ON "JobReference"("partnerId");
CREATE INDEX "JobReference_eventId_idx" ON "JobReference"("eventId");
CREATE INDEX "JobReference_quoteId_idx" ON "JobReference"("quoteId");
CREATE INDEX "JobReference_status_idx" ON "JobReference"("status");
CREATE INDEX "JobReference_referralDate_idx" ON "JobReference"("referralDate");

-- AddForeignKey
ALTER TABLE "JobReference" ADD CONSTRAINT "JobReference_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobReference" ADD CONSTRAINT "JobReference_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobReference" ADD CONSTRAINT "JobReference_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
