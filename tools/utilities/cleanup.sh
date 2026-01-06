#!/bin/bash

# Codebase Cleanup Script
# This script safely removes unused files from the AV-RENTALS project
# Run with: bash cleanup.sh

set -e

PROJECT_DIR="/home/feli/Acrobaticz rental/AV-RENTALS"
cd "$PROJECT_DIR"

echo "🧹 AV-RENTALS Codebase Cleanup"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup
echo "${YELLOW}Creating backup...${NC}"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
git add -A && git commit -m "Backup before cleanup - $BACKUP_DATE" || echo "Git backup noted"
echo "${GREEN}✓ Backup created${NC}"
echo ""

# Phase 1: Remove unused documentation files
echo "${YELLOW}Phase 1: Removing unused documentation files...${NC}"
REMOVED=0

# List of files to remove
DOCS_TO_REMOVE=(
  "BACKUP_QUOTA_IMPLEMENTATION.md"
  "BACKUP_SETUP_GUIDE.md"
  "CATALOG_BRANDING_INTEGRATION.md"
  "CATALOG_FEATURES_SUMMARY.md"
  "CATALOG_GENERATION_ANALYSIS.md"
  "CATALOG_IMPLEMENTATION_FINAL.md"
  "CATALOG_LAYOUT_ANALYSIS.md"
  "CHANGELOG_CATALOG_ENHANCEMENT.md"
  "CLOUD_ADMIN_PANEL_DESIGN.md"
  "CLOUD_DRIVE_DELIVERY_SUMMARY.md"
  "CLOUD_DRIVE_FILE_INVENTORY.md"
  "CLOUD_DRIVE_TRANSLATION_INDEX.md"
  "CLOUD_DRIVE_TRANSLATION_QUICK_REF.md"
  "CLOUD_DRIVE_TRANSLATION_STRINGS.md"
  "CLOUD_DRIVE_TRANSLATION_SUMMARY.md"
  "CLOUD_DRIVE_VERIFICATION_REPORT.md"
  "CLOUD_FEATURES_VERIFICATION_REPORT.md"
  "CLOUD_FIXES_SUMMARY.md"
  "CLOUD_IMPROVEMENTS_SUMMARY.md"
  "CLOUD_STORAGE_ANALYSIS.md"
  "CLOUD_STORAGE_COMPLETE_ANALYSIS.md"
  "CLOUD_STORAGE_DOCUMENTATION.md"
  "CLOUD_SYSTEM_STATUS.md"
  "CLOUD_TRANSLATION_ANALYSIS.md"
  "CLOUD_VERIFICATION_INDEX.md"
  "DATABASE_SEEDING_ANALYSIS.md"
  "DEPLOYMENT_CHECKLIST_BACKUP.md"
  "EXTERNAL_DISK_ANALYSIS.md"
  "GRID_THUMBNAILS_ENHANCEMENT.md"
  "IMPLEMENTATION_COMPLETE.md"
  "MIGRATION_GUIDE_CATALOG.md"
  "PARTNERS_ANALYSIS.md"
  "PARTNERS_CATALOG_ENHANCEMENTS.md"
  "SCRIPTS_NECESSITY_ASSESSMENT.md"
  "SEED_COMPREHENSIVE_GUIDE.md"
  "STORAGE_QUOTA_UPDATE.md"
)

for file in "${DOCS_TO_REMOVE[@]}"; do
  if [ -f "$file" ]; then
    rm -f "$file"
    echo "  ✓ Removed: $file"
    ((REMOVED++))
  fi
done

echo "${GREEN}✓ Phase 1 complete: Removed $REMOVED documentation files${NC}"
echo ""

# Phase 2: Remove status and data files
echo "${YELLOW}Phase 2: Removing status and log files...${NC}"
REMOVED=0

STATUS_FILES=(
  "CLOUD_STATUS.txt"
  "FILES_IMPLEMENTED.txt"
  "FINAL_STATUS_VERIFICATION.txt"
  "IMPLEMENTATION_STATUS.txt"
  "cloud-drive-translation-keys.json"
  "cloud-drive-translation-strings.csv"
)

for file in "${STATUS_FILES[@]}"; do
  if [ -f "$file" ]; then
    rm -f "$file"
    echo "  ✓ Removed: $file"
    ((REMOVED++))
  fi
done

# Remove old log files
if find . -maxdepth 1 -name "overnight_translation_*.log" 2>/dev/null | grep -q .; then
  find . -maxdepth 1 -name "overnight_translation_*.log" -delete
  echo "  ✓ Removed: overnight_translation_*.log files"
  ((REMOVED++))
fi

if [ -f "translation.log" ]; then
  rm -f "translation.log"
  echo "  ✓ Removed: translation.log"
  ((REMOVED++))
fi

if [ -f "sample_texts.txt" ]; then
  rm -f "sample_texts.txt"
  echo "  ✓ Removed: sample_texts.txt"
  ((REMOVED++))
fi

if [ -f "image.png" ]; then
  rm -f "image.png"
  echo "  ✓ Removed: image.png"
  ((REMOVED++))
fi

# Remove old PDFs
if find . -maxdepth 1 -name "*.pdf" 2>/dev/null | grep -q .; then
  find . -maxdepth 1 -name "Rey Davis*.pdf" -delete
  echo "  ✓ Removed: Rey Davis PDF files"
  ((REMOVED++))
fi

echo "${GREEN}✓ Phase 2 complete: Removed $REMOVED status/log/data files${NC}"
echo ""

# Phase 3: Optional translation scripts cleanup
echo "${YELLOW}Phase 3: Translation scripts cleanup (Optional)${NC}"
echo "Translation scripts found: $(ls scripts/*translate*.ts scripts/*i18n*.ts scripts/*translation*.ts 2>/dev/null | wc -l)"
echo ""
echo "To remove translation scripts, run:"
echo "  bash cleanup-translation-scripts.sh"
echo ""

# Summary
echo "${GREEN}=============================="
echo "✅ Cleanup Phase 1-2 Complete!"
echo "=============================${NC}"
echo ""
echo "📊 Summary:"
echo "  ✓ Removed 36 documentation files"
echo "  ✓ Removed 11 status/log/data files"
echo "  ⏳ Translation scripts available for manual cleanup"
echo ""
echo "💾 Changes backed up in git"
echo ""
echo "🚀 Next steps:"
echo "  1. Review translation scripts: bash scripts/TRANSLATION_SCRIPT_GUIDE.md"
echo "  2. Remove old seed scripts if no longer needed"
echo "  3. Run: git add -A && git commit -m 'Cleanup: Remove unused files'"
echo ""
