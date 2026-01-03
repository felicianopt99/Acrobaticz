-- Add missing PDF footer columns to customization_settings table
-- These were part of the schema but missing from the migration
ALTER TABLE "customization_settings" 
ADD COLUMN "pdfFooterMessage" TEXT,
ADD COLUMN "pdfFooterContactText" TEXT,
ADD COLUMN "pdfShowFooterContact" BOOLEAN;

-- Add missing terms column to Quote table
-- This field is defined in the Prisma schema but was never added to the initial migration
ALTER TABLE "Quote" 
ADD COLUMN "terms" TEXT;
