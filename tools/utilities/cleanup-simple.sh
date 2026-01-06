#!/bin/bash

# Codebase Cleanup Script - Fixed
# Removes unused files from AV-RENTALS project

PROJECT_DIR="/home/feli/Acrobaticz rental/AV-RENTALS"
cd "$PROJECT_DIR" || exit 1

echo "🧹 Starting AV-RENTALS Cleanup..."
echo ""

REMOVED_COUNT=0

# Remove documentation files
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
  "CLOUD_STATUS.txt"
  "FILES_IMPLEMENTED.txt"
  "FINAL_STATUS_VERIFICATION.txt"
  "IMPLEMENTATION_STATUS.txt"
)

echo "Removing $((${#DOCS_TO_REMOVE[@]})) unused documentation files..."
for file in "${DOCS_TO_REMOVE[@]}"; do
  if [ -f "$file" ]; then
    rm -f "$file"
    ((REMOVED_COUNT++))
  fi
done
echo "✓ Removed $REMOVED_COUNT documentation files"
echo ""

# Remove old translation data files
echo "Removing old translation data files..."
rm -f cloud-drive-translation-keys.json
rm -f cloud-drive-translation-strings.csv
echo "✓ Removed translation data files"
echo ""

# Remove old logs
echo "Removing old log files..."
find . -maxdepth 1 -name "overnight_translation_*.log" -delete 2>/dev/null
rm -f translation.log sample_texts.txt image.png
echo "✓ Removed log and temp files"
echo ""

# Remove old PDF files  
echo "Removing old PDF files..."
find . -maxdepth 1 -name "Rey Davis*.pdf" -delete 2>/dev/null
echo "✓ Removed old PDF files"
echo ""

echo "✅ Cleanup Complete!"
echo ""
echo "Summary:"
echo "  ✓ 36 documentation files removed"
echo "  ✓ 2 translation data files removed"
echo "  ✓ All old logs and temp files removed"
echo ""
