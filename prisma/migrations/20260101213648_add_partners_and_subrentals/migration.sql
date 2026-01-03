-- AlterTable
ALTER TABLE "Translation" ALTER COLUMN "model" SET DEFAULT 'deepl';

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subrental" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "eventId" TEXT,
    "equipmentName" TEXT NOT NULL,
    "equipmentDesc" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "dailyRate" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invoiceNumber" TEXT,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subrental_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Partner_name_idx" ON "Partner"("name");

-- CreateIndex
CREATE INDEX "Partner_isActive_idx" ON "Partner"("isActive");

-- CreateIndex
CREATE INDEX "Subrental_partnerId_idx" ON "Subrental"("partnerId");

-- CreateIndex
CREATE INDEX "Subrental_eventId_idx" ON "Subrental"("eventId");

-- CreateIndex
CREATE INDEX "Subrental_status_idx" ON "Subrental"("status");

-- CreateIndex
CREATE INDEX "Subrental_startDate_idx" ON "Subrental"("startDate");

-- CreateIndex
CREATE INDEX "Subrental_endDate_idx" ON "Subrental"("endDate");

-- AddForeignKey
ALTER TABLE "Subrental" ADD CONSTRAINT "Subrental_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subrental" ADD CONSTRAINT "Subrental_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
