#!/bin/bash

# ADVANCED: Translation Scripts Cleanup
# Only run if you've completed translation and don't need these scripts anymore

echo "⚠️  ADVANCED CLEANUP: Translation Scripts"
echo "=========================================="
echo ""
echo "This script removes 43+ translation-related scripts."
echo "These are batch processing tools for translations."
echo ""
echo "Only proceed if:"
echo "  ✓ Translation process is complete"
echo "  ✓ No ongoing batch translation jobs"
echo "  ✓ All client translations are finalized"
echo ""
read -p "Continue with translation script cleanup? (type 'yes' to proceed): " response

if [ "$response" != "yes" ]; then
  echo "❌ Cleanup cancelled"
  exit 0
fi

PROJECT_DIR="/home/feli/Acrobaticz rental/AV-RENTALS"
cd "$PROJECT_DIR" || exit 1

echo ""
echo "Removing translation-related scripts..."
REMOVED=0

# Translation scripts to remove
SCRIPTS=(
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
  "scripts/extract-ui-texts.js"
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

for script in "${SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    rm -f "$script"
    ((REMOVED++))
  fi
done

# Remove old duplicate
rm -f scripts/extract-ui-texts.js

echo "✓ Removed $REMOVED translation scripts"
echo ""
echo "✅ Advanced Cleanup Complete!"
echo ""
echo "Kept (still in use):"
echo "  ✓ scripts/seed.js"
echo "  ✓ scripts/seed-comprehensive.ts"
echo "  ✓ scripts/seed-complete.ts"
echo "  ✓ scripts/extract-seed-data.ts"
echo "  ✓ scripts/notifications/run-generators.ts"
echo ""
