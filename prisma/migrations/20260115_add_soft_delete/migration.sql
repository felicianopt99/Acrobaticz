-- AlterTable
ALTER TABLE "EquipmentItem" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "idx_equipment_deletedat" ON "EquipmentItem"("deletedAt");
