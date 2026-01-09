-- AddColumn quantityByStatus to EquipmentItem
ALTER TABLE "EquipmentItem" ADD COLUMN "quantityByStatus" JSONB NOT NULL DEFAULT '{"good": 0, "damaged": 0, "maintenance": 0}';

-- Migrate existing data: populate quantityByStatus based on current status
UPDATE "EquipmentItem"
SET "quantityByStatus" = jsonb_build_object(
  'good', CASE WHEN "status" = 'good' THEN "quantity" ELSE 0 END,
  'damaged', CASE WHEN "status" = 'damaged' THEN "quantity" ELSE 0 END,
  'maintenance', CASE WHEN "status" = 'maintenance' THEN "quantity" ELSE 0 END
)
WHERE "status" IS NOT NULL;

-- For any equipment without a status, default all to 'good'
UPDATE "EquipmentItem"
SET "quantityByStatus" = jsonb_build_object(
  'good', "quantity",
  'damaged', 0,
  'maintenance', 0
)
WHERE "status" IS NULL OR "quantityByStatus" = '{"good": 0, "damaged": 0, "maintenance": 0}'::JSONB;
