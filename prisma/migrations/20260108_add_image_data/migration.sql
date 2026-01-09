-- Add imageData column to store images as base64 in database
ALTER TABLE "EquipmentItem" ADD COLUMN "imageData" TEXT;

-- Add imageContentType to store MIME type
ALTER TABLE "EquipmentItem" ADD COLUMN "imageContentType" VARCHAR(50);

-- Add index for future queries
CREATE INDEX "EquipmentItem_imageData_idx" ON "EquipmentItem"("imageData") WHERE "imageData" IS NOT NULL;
