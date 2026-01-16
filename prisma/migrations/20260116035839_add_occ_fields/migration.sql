-- AlterTable
ALTER TABLE "Rental" ADD COLUMN     "scannedIn" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scannedOut" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "EquipmentScanLog" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "userId" TEXT,
    "eventId" TEXT NOT NULL,
    "scanType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "deviceInfo" TEXT,
    "conflictVersion" INTEGER,

    CONSTRAINT "EquipmentScanLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EquipmentScanLog_rentalId_idx" ON "EquipmentScanLog"("rentalId");

-- CreateIndex
CREATE INDEX "EquipmentScanLog_equipmentId_idx" ON "EquipmentScanLog"("equipmentId");

-- CreateIndex
CREATE INDEX "EquipmentScanLog_eventId_idx" ON "EquipmentScanLog"("eventId");

-- CreateIndex
CREATE INDEX "EquipmentScanLog_timestamp_idx" ON "EquipmentScanLog"("timestamp");

-- CreateIndex
CREATE INDEX "EquipmentScanLog_scanType_idx" ON "EquipmentScanLog"("scanType");

-- CreateIndex
CREATE INDEX "EquipmentScanLog_status_idx" ON "EquipmentScanLog"("status");

-- CreateIndex
CREATE INDEX "Rental_eventId_equipmentId_idx" ON "Rental"("eventId", "equipmentId");

-- CreateIndex
CREATE INDEX "Rental_prepStatus_idx" ON "Rental"("prepStatus");

-- CreateIndex
CREATE INDEX "Rental_version_idx" ON "Rental"("version");

-- AddForeignKey
ALTER TABLE "EquipmentScanLog" ADD CONSTRAINT "EquipmentScanLog_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentScanLog" ADD CONSTRAINT "EquipmentScanLog_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "EquipmentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentScanLog" ADD CONSTRAINT "EquipmentScanLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_equipment_deletedat" RENAME TO "EquipmentItem_deletedAt_idx";
