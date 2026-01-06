#!/bin/bash

# Translation Scripts Cleanup
# Remove translation-related scripts if no longer needed
# Run with: bash cleanup-translation-scripts.sh

set -e

PROJECT_DIR="/home/feli/Acrobaticz rental/AV-RENTALS"
cd "$PROJECT_DIR"

echo "🧹 Translation Scripts Cleanup"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "${BLUE}⚠️  WARNING: This script removes translation-related scripts${NC}"
echo "These are batch processing tools for translations."
echo ""
echo "${YELLOW}ARE YOU SURE? (yes/no)${NC}"
read -r response

if [ "$response" != "yes" ]; then
  echo "${RED}Cleanup cancelled${NC}"
  exit 0
fi

echo ""
echo "${YELLOW}Removing translation scripts...${NC}"
REMOVED=0

# Old duplicate scripts
OLD_SCRIPTS=(
  "scripts/extract-ui-texts.js"
)

TRANSLATION_SCRIPTS=(
  "scripts/add-submit-translation.ts"
  "scripts/add-translations-to-pages.ts"
  "scripts/advanced-batch-translate.ts"
  "scripts/analyze-api-savings.ts"
  "scripts/analyze-rate-limits.ts"
  "scripts/apply-translation-fixes.js"
  "scripts/batch-translate-missing.ts"
  "scripts/check-critical-translations.ts"
  "scripts/check-db-translations.ts"
  "scripts/check-i18n-drift.ts"
  "scripts/check-quality.ts"
  "scripts/check-quota.ts"
  "scripts/check-translations.sh"
  "scripts/check-translations.ts"
  "scripts/cleanup-analysis.ts"
  "scripts/efficient-batch-translate.ts"
  "scripts/enhanced-translation-integration.ts"
  "scripts/enhanced-ui-text-extractor.ts"
  "scripts/filter-translations.ts"
  "scripts/final-analysis.ts"
  "scripts/find-missing-translations.ts"
  "scripts/find-successful-translations.ts"
  "scripts/focused-translate.ts"
  "scripts/identify-missing-translations.js"
  "scripts/identify-missing-translations.ts"
  "scripts/investigate-keys.ts"
  "scripts/migrate-translation-categories.js"
  "scripts/optimize-batch-queue.ts"
  "scripts/preload-translations.ts"
  "scripts/refresh-pt-translations.ts"
  "scripts/restore-from-backup.ts"
  "scripts/seed-cloud-drive-translations.ts"
  "scripts/seed-partners-translations.ts"
  "scripts/seed-rey-davis-catalog.ts"
  "scripts/seed-translations.ts"
  "scripts/smart-retry.ts"
  "scripts/translate-critical-terms.ts"
  "scripts/translation-coverage-report.ts"
  "scripts/ultimate-translation-integration.ts"
  "scripts/verify-permanent-cache.ts"
  "scripts/verify-zero-redundancy.ts"
  "scripts/wrap-jsx-strings.cjs"
)

echo ""
echo "${BLUE}Removing old/duplicate scripts:${NC}"
for file in "${OLD_SCRIPTS[@]}"; do
  if [ -f "$file" ]; then
    rm -f "$file"
    echo "  ✓ Removed: $file"
    ((REMOVED++))
  fi
done

echo ""
echo "${BLUE}Removing translation batch processing scripts:${NC}"
for file in "${TRANSLATION_SCRIPTS[@]}"; do
  if [ -f "$file" ]; then
    rm -f "$file"
    echo "  ✓ Removed: $file"
    ((REMOVED++))
  fi
done

echo ""
echo "${GREEN}✅ Translation Scripts Cleanup Complete!${NC}"
echo "Removed $REMOVED files"
echo ""
echo "Kept (still in use):"
echo "  ✓ scripts/seed.js"
echo "  ✓ scripts/seed-comprehensive.ts"
echo "  ✓ scripts/seed-complete.ts"
echo "  ✓ scripts/extract-seed-data.ts"
echo "  ✓ scripts/notifications/run-generators.ts"
echo ""
