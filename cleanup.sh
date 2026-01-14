#!/bin/bash

# 🧹 Cleanup Script for Acrobaticz
# Removes obsolete files, documentation, and build artifacts
# Usage: bash cleanup.sh [--dry-run]

set -e

DRY_RUN=false
REMOVED_COUNT=0
FREED_SPACE=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check for --dry-run flag
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    echo -e "${BLUE}🧪 Running in DRY-RUN mode (no files will be deleted)${NC}\n"
fi

echo -e "${BLUE}🧹 Acrobaticz Cleanup Script${NC}"
echo -e "${BLUE}===========================${NC}\n"

# Function to safely remove files
remove_file() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        local size=$(du -h "$file" | cut -f1)
        if [ "$DRY_RUN" = true ]; then
            echo -e "${YELLOW}[DRY-RUN]${NC} Would remove: ${file} (${size}) - ${description}"
        else
            rm -f "$file"
            echo -e "${GREEN}✓${NC} Removed: ${file} (${size}) - ${description}"
            ((REMOVED_COUNT++))
        fi
    fi
}

# Function to safely remove directories
remove_dir() {
    local dir="$1"
    local description="$2"
    
    if [ -d "$dir" ]; then
        local size=$(du -sh "$dir" | cut -f1)
        if [ "$DRY_RUN" = true ]; then
            echo -e "${YELLOW}[DRY-RUN]${NC} Would remove: ${dir}/ (${size}) - ${description}"
        else
            rm -rf "$dir"
            echo -e "${GREEN}✓${NC} Removed: ${dir}/ (${size}) - ${description}"
            ((REMOVED_COUNT++))
        fi
    fi
}

echo -e "${BLUE}1. Cleaning obsolete documentation files...${NC}"
# Remove obsolete documentation files that were consolidated
FILES_TO_REMOVE=(
    "QUICK_START_PRISMA.txt"
)

for file in "${FILES_TO_REMOVE[@]}"; do
    remove_file "$file" "Obsolete documentation"
done

echo -e "\n${BLUE}2. Cleaning up build artifacts...${NC}"
# Remove build and cache directories
remove_dir ".next" "Next.js build cache"
remove_dir ".turbo" "Turbo cache"
remove_dir "out" "Static export directory"
remove_dir ".eslintcache" "ESLint cache"

echo -e "\n${BLUE}3. Cleaning up node_modules cache...${NC}"
remove_dir "node_modules/.cache" "Node modules cache"
remove_dir ".npm" "NPM cache"

echo -e "\n${BLUE}4. Cleaning up IDE and editor files...${NC}"
# These are typically in .gitignore but may exist locally
remove_dir ".vscode/cache" "VS Code cache"
remove_dir ".idea/cache" "IntelliJ cache"

echo -e "\n${BLUE}5. Cleaning up temporary files...${NC}"
# Remove any .tmp files
find . -maxdepth 2 -name "*.tmp" -type f -delete 2>/dev/null || true
find . -maxdepth 2 -name "*.log" -type f -delete 2>/dev/null || true

echo -e "\n${BLUE}6. Validating critical files...${NC}"
# Check that essential files still exist
CRITICAL_FILES=(
    "package.json"
    "README.md"
    "CONTRIBUTING.md"
    "DEPLOYMENT.md"
    "prisma/schema.prisma"
    "next.config.ts"
    "tsconfig.json"
)

MISSING_FILES=false
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} Found: ${file}"
    else
        echo -e "${RED}✗${NC} Missing: ${file}"
        MISSING_FILES=true
    fi
done

if [ "$MISSING_FILES" = true ]; then
    echo -e "\n${RED}❌ ERROR: Some critical files are missing!${NC}"
    exit 1
fi

echo -e "\n${BLUE}7. Checking documentation structure...${NC}"
DOCS_DIRS=(
    "docs"
    "docs/API"
    "docs/DATABASE"
    "docs/SETUP"
    "docs/FEATURES"
    "docs/DEPLOYMENT"
)

for dir in "${DOCS_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} Found: ${dir}/"
    else
        echo -e "${RED}✗${NC} Missing: ${dir}/"
    fi
done

echo -e "\n${BLUE}8. Summary${NC}"
echo -e "${BLUE}==========${NC}"

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}DRY-RUN MODE:${NC} No files were actually deleted."
    echo -e "${YELLOW}Run without --dry-run to execute cleanup${NC}"
else
    if [ "$REMOVED_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓ Cleanup completed!${NC}"
        echo -e "  Removed items: ${REMOVED_COUNT}"
    else
        echo -e "${YELLOW}No files needed cleanup${NC}"
    fi
fi

echo -e "\n${BLUE}Next steps:${NC}"
echo -e "  1. Review the cleanup results above"
echo -e "  2. Run: npm install"
echo -e "  3. Run: npm run build"
echo -e "  4. Test the application: npm run dev"
echo -e "  5. Commit changes: git add -A && git commit -m 'chore: cleanup obsolete files'"

echo ""
