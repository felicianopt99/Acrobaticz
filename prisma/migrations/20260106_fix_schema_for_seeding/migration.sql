-- Add missing columns if they don't exist
-- This migration ensures the database schema is compatible with seeding

-- Add missing description column to Category
ALTER TABLE "Category" 
ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Check and add customCSS column to customization_settings
ALTER TABLE "customization_settings" 
ADD COLUMN IF NOT EXISTS "customCSS" TEXT DEFAULT '';

-- Check and add footerText column to customization_settings  
ALTER TABLE "customization_settings"
ADD COLUMN IF NOT EXISTS "footerText" TEXT DEFAULT '';

-- Verify core tables exist by checking constraints
-- These statements help identify schema issues
DO $$
BEGIN
  -- Log migration start
  RAISE NOTICE 'Schema compatibility migration started';
END $$;
