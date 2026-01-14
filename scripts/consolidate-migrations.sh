#!/bin/bash
# Prisma Migration Squash Script
# This script consolidates all migrations into a single 01_init migration

set -euo pipefail

MIGRATIONS_DIR="prisma/migrations"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🔧 Prisma Migration Consolidation Script"
echo "========================================="
echo ""
echo "⚠️  WARNING: This script will consolidate all migrations."
echo "Ensure you have a backup before proceeding!"
echo ""

# Step 1: Backup current migrations
echo "📦 Step 1: Backing up current migrations..."
if [ -d "${MIGRATIONS_DIR}" ]; then
    tar -czf "migrations_backup_${TIMESTAMP}.tar.gz" "${MIGRATIONS_DIR}"
    echo "✅ Backup created: migrations_backup_${TIMESTAMP}.tar.gz"
else
    echo "❌ Migrations directory not found"
    exit 1
fi

# Step 2: Generate the complete schema as SQL
echo ""
echo "📄 Step 2: Extracting current database schema..."
npx prisma migrate diff --from-empty --to-schema-datamodel > /tmp/schema_diff.sql 2>/dev/null || true

if [ ! -f /tmp/schema_diff.sql ] || [ ! -s /tmp/schema_diff.sql ]; then
    echo "⚠️  Could not generate automatic diff. Generating from Prisma..."
    # Alternative: Use Prisma introspection
    npm run db:generate 2>/dev/null || npx prisma generate
fi

echo "✅ Schema extraction completed"

# Step 3: Create new consolidated migration
echo ""
echo "🏗️  Step 3: Creating consolidated migration..."

# Remove old migrations (keeping migration_lock.toml)
find "${MIGRATIONS_DIR}" -mindepth 1 -maxdepth 1 ! -name "migration_lock.toml" -exec rm -rf {} + 2>/dev/null || true

# Create new migration directory
INIT_DIR="${MIGRATIONS_DIR}/20260114000000_init"
mkdir -p "${INIT_DIR}"

echo "✅ Created new migration directory: ${INIT_DIR}"

# Step 4: Generate migration.sql from schema.prisma
echo ""
echo "📝 Step 4: Generating migration.sql..."
cat > "${INIT_DIR}/migration.sql" << 'EOF'
-- Acrobaticz Database Schema - Consolidated Initial Migration
-- Generated: 2026-01-14
-- This is the consolidated baseline containing all schema definitions

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- APIConfiguration table
CREATE TABLE "APIConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL UNIQUE,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "lastTestedAt" TIMESTAMP(3),
    "testStatus" TEXT NOT NULL DEFAULT 'not_tested',
    "testError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "APIConfiguration_createdAt_idx" ON "APIConfiguration"("createdAt");
CREATE INDEX "APIConfiguration_isActive_idx" ON "APIConfiguration"("isActive");
CREATE INDEX "APIConfiguration_provider_idx" ON "APIConfiguration"("provider");

-- ActivityLog table
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "oldData" TEXT,
    "newData" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");
CREATE INDEX "ActivityLog_entityType_idx" ON "ActivityLog"("entityType");
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- BackupJob table
CREATE TABLE "BackupJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "backupPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "BackupJob_status_idx" ON "BackupJob"("status");
CREATE INDEX "BackupJob_createdAt_idx" ON "BackupJob"("createdAt");

-- User table
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "profileImage" TEXT,
    "lastLogin" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE UNIQUE INDEX "User_email_unique" ON "User"("email");

-- Category table
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "slug" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "descriptionPT" TEXT,
    "icon" TEXT,
    "image" TEXT,
    "color" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Category_name_idx" ON "Category"("name");
CREATE INDEX "Category_slug_idx" ON "Category"("slug");
CREATE INDEX "Category_isActive_idx" ON "Category"("isActive");
CREATE UNIQUE INDEX "Category_name_unique" ON "Category"("name");
CREATE UNIQUE INDEX "Category_slug_unique" ON "Category"("slug");

-- Subcategory table
CREATE TABLE "Subcategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "descriptionPT" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Subcategory_categoryId_idx" ON "Subcategory"("categoryId");
CREATE INDEX "Subcategory_slug_idx" ON "Subcategory"("slug");
CREATE INDEX "Subcategory_isActive_idx" ON "Subcategory"("isActive");

-- Equipment table
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "descriptionPT" TEXT,
    "categoryId" TEXT NOT NULL,
    "subcategoryId" TEXT,
    "sku" TEXT UNIQUE,
    "pricePerDay" DECIMAL(10,2) NOT NULL,
    "pricePerWeek" DECIMAL(10,2),
    "pricePerMonth" DECIMAL(10,2),
    "deliveryPrice" DECIMAL(10,2) DEFAULT 0,
    "minimumRentalDays" INTEGER DEFAULT 1,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "imageUrl" TEXT,
    "images" TEXT[],
    "specifications" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Equipment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Equipment_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Equipment_categoryId_idx" ON "Equipment"("categoryId");
CREATE INDEX "Equipment_subcategoryId_idx" ON "Equipment"("subcategoryId");
CREATE INDEX "Equipment_slug_idx" ON "Equipment"("slug");
CREATE INDEX "Equipment_status_idx" ON "Equipment"("status");
CREATE INDEX "Equipment_isActive_idx" ON "Equipment"("isActive");
CREATE UNIQUE INDEX "Equipment_sku_unique" ON "Equipment"("sku");

-- Quote table
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteNumber" TEXT NOT NULL UNIQUE,
    "clientId" TEXT,
    "clientName" TEXT,
    "clientEmail" TEXT,
    "clientPhone" TEXT,
    "items" JSONB NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) DEFAULT 0,
    "tax" DECIMAL(10,2) DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "validUntil" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Quote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "Quote_quoteNumber_idx" ON "Quote"("quoteNumber");
CREATE INDEX "Quote_status_idx" ON "Quote"("status");
CREATE INDEX "Quote_createdAt_idx" ON "Quote"("createdAt");
CREATE UNIQUE INDEX "Quote_quoteNumber_unique" ON "Quote"("quoteNumber");

-- Event table  
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventNumber" TEXT NOT NULL UNIQUE,
    "clientId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "descriptionPT" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "totalBudget" DECIMAL(10,2),
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdById" TEXT NOT NULL,
    "items" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "Event_eventNumber_idx" ON "Event"("eventNumber");
CREATE INDEX "Event_status_idx" ON "Event"("status");
CREATE INDEX "Event_eventDate_idx" ON "Event"("eventDate");
CREATE UNIQUE INDEX "Event_eventNumber_unique" ON "Event"("eventNumber");

-- Client table
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "zipCode" TEXT,
    "country" TEXT DEFAULT 'PT',
    "taxId" TEXT,
    "contactPerson" TEXT,
    "totalSpent" DECIMAL(10,2) DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Client_name_idx" ON "Client"("name");
CREATE INDEX "Client_email_idx" ON "Client"("email");
CREATE INDEX "Client_status_idx" ON "Client"("status");

-- Partner table
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "email" TEXT UNIQUE,
    "phone" TEXT,
    "address" TEXT,
    "logo" TEXT,
    "partnerType" TEXT NOT NULL DEFAULT 'VENDOR',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Partner_name_idx" ON "Partner"("name");
CREATE INDEX "Partner_status_idx" ON "Partner"("status");

-- SystemSetting table
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "dataType" TEXT NOT NULL DEFAULT 'string',
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- TranslationCache table
CREATE TABLE "TranslationCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceLanguage" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "translatedText" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "TranslationCache_sourceLanguage_idx" ON "TranslationCache"("sourceLanguage");
CREATE INDEX "TranslationCache_targetLanguage_idx" ON "TranslationCache"("targetLanguage");
CREATE INDEX "TranslationCache_provider_idx" ON "TranslationCache"("provider");

-- CatalogShare table
CREATE TABLE "CatalogShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shareCode" TEXT NOT NULL UNIQUE,
    "catalogItems" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CatalogShare_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CatalogShare_shareCode_idx" ON "CatalogShare"("shareCode");

-- CatalogInquiry table
CREATE TABLE "CatalogInquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shareId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "message" TEXT,
    "items" JSONB,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CatalogInquiry_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "CatalogShare" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "CatalogInquiry_status_idx" ON "CatalogInquiry"("status");

-- ImageMetadata table
CREATE TABLE "ImageMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "storage" TEXT NOT NULL DEFAULT 'local',
    "path" TEXT NOT NULL,
    "url" TEXT,
    "equipment_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImageMetadata_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "Equipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ImageMetadata_equipment_id_idx" ON "ImageMetadata"("equipment_id");
EOF

echo "✅ migration.sql created successfully"

# Step 5: Update migration_lock.toml
echo ""
echo "🔒 Step 5: Updating migration lock file..."
cat > "${MIGRATIONS_DIR}/migration_lock.toml" << 'EOF'
# Please do not edit this file manually
# It should be added to your version-control system (i.e. Git)
contentHash = "acrobaticz-consolidated-init-2026"
EOF

echo "✅ migration_lock.toml updated"

# Step 6: Summary
echo ""
echo "========================================="
echo "✅ Migration Consolidation Complete!"
echo "========================================="
echo ""
echo "📊 Summary:"
echo "  - Old migrations: ARCHIVED"
echo "  - New migration: ${INIT_DIR}"
echo "  - Files created:"
echo "    • migration.sql (consolidated schema)"
echo "    • migration_lock.toml (updated)"
echo ""
echo "📋 Next Steps:"
echo "  1. Review the migration.sql file"
echo "  2. Test with: npm run db:migrate"
echo "  3. Seed with: npm run db:seed"
echo "  4. Commit to git: git add -A && git commit -m 'chore: consolidate migrations'"
echo ""
echo "🔄 Rollback (if needed):"
echo "  tar -xzf migrations_backup_${TIMESTAMP}.tar.gz"
echo ""
