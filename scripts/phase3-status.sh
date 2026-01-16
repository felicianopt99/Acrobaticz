#!/bin/bash

# ============================================================
# 📊 Migration Consolidation Status Dashboard
# ============================================================
# Shows current status and progress of Phase 3

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="$PROJECT_DIR/prisma/migrations"

# Colors
BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# ============================================================
# Helper Functions
# ============================================================

print_header() {
    echo ""
    echo -e "${CYAN}${BOLD}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}${BOLD}║${NC} $1"
    echo -e "${CYAN}${BOLD}╚════════════════════════════════════════════════════════╝${NC}"
}

print_row() {
    printf "${CYAN}│${NC} %-30s ${CYAN}│${NC} %s\n" "$1" "$2"
}

print_status() {
    local status=$1
    local text=$2
    if [ "$status" == "✓" ]; then
        echo -e "${GREEN}${BOLD}✓${NC} $text"
    elif [ "$status" == "✗" ]; then
        echo -e "${RED}${BOLD}✗${NC} $text"
    elif [ "$status" == "○" ]; then
        echo -e "${YELLOW}${BOLD}○${NC} $text"
    elif [ "$status" == "ⓘ" ]; then
        echo -e "${BLUE}ⓘ${NC} $text"
    fi
}

# ============================================================
# SECTION 1: Current Status
# ============================================================

print_header "📊 Phase 3: Migration Consolidation - Status"

echo ""
echo -e "${CYAN}${BOLD}MIGRATION ANALYSIS${NC}"
echo ""

# Count migrations
CURRENT_INIT=$(find "$MIGRATIONS_DIR" -maxdepth 1 -name "20260114000000_01_init" -type d 2>/dev/null)
OLD_MIGRATIONS=$(find "$MIGRATIONS_DIR" -maxdepth 1 -type d ! -name "*01_init" ! -name "migrations" 2>/dev/null | wc -l)

if [ -n "$CURRENT_INIT" ]; then
    print_status "✓" "Consolidation COMPLETE"
    echo ""
    
    # Get SQL file info
    SQL_FILE="$MIGRATIONS_DIR/20260114000000_01_init/migration.sql"
    if [ -f "$SQL_FILE" ]; then
        LINES=$(wc -l < "$SQL_FILE")
        SIZE=$(du -h "$SQL_FILE" | cut -f1)
        TABLES=$(grep "^CREATE TABLE" "$SQL_FILE" | wc -l)
        INDEXES=$(grep "^CREATE INDEX" "$SQL_FILE" | wc -l)
        
        echo -e "${CYAN}Migration Info:${NC}"
        print_row "Location" "prisma/migrations/20260114000000_01_init/"
        print_row "SQL Lines" "$LINES"
        print_row "File Size" "$SIZE"
        print_row "Tables" "$TABLES"
        print_row "Indexes" "$INDEXES"
    fi
    
    echo ""
    echo -e "${CYAN}Backups:${NC}"
    if ls "$PROJECT_DIR/backups/pre_consolidation_"* 1>/dev/null 2>&1; then
        BACKUP_COUNT=$(ls "$PROJECT_DIR/backups/pre_consolidation_"* 2>/dev/null | wc -l)
        TOTAL_SIZE=$(du -sh "$PROJECT_DIR/backups" | cut -f1)
        print_row "Backup Files" "$BACKUP_COUNT files"
        print_row "Total Size" "$TOTAL_SIZE"
    else
        print_row "Backup Files" "None found"
    fi
    
    echo ""
    echo -e "${CYAN}Git Status:${NC}"
    if git -C "$PROJECT_DIR" log --oneline -1 2>/dev/null | grep -q "Consolidate"; then
        COMMIT=$(git -C "$PROJECT_DIR" log --oneline -1)
        print_row "Latest Commit" "${COMMIT:0:60}..."
    else
        print_row "Consolidation Commit" "Not found"
    fi
else
    print_status "✗" "Consolidation NOT YET DONE"
    if [ "$OLD_MIGRATIONS" -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}${BOLD}Action Required:${NC}"
        echo -e "  Run: ${BOLD}bash scripts/consolidate-migrations.sh${NC}"
        echo ""
    fi
fi

# ============================================================
# SECTION 2: Quick Commands
# ============================================================

echo ""
print_header "🚀 Quick Commands"

echo ""
echo -e "${CYAN}${BOLD}Start Consolidation:${NC}"
echo "  ${BOLD}bash scripts/consolidate-migrations.sh${NC}"
echo ""

echo -e "${CYAN}${BOLD}Test Consolidation:${NC}"
echo "  ${BOLD}bash scripts/test-consolidation.sh${NC}"
echo ""

echo -e "${CYAN}${BOLD}View Full Guide:${NC}"
echo "  ${BOLD}cat docs/MIGRATION_CONSOLIDATION_GUIDE.md${NC}"
echo ""

echo -e "${CYAN}${BOLD}Docker Test:${NC}"
echo "  ${BOLD}docker-compose down -v${NC}"
echo "  ${BOLD}docker-compose up -d${NC}"
echo "  ${BOLD}sleep 40 && docker-compose logs app${NC}"
echo ""

# ============================================================
# SECTION 3: Checklist
# ============================================================

echo ""
print_header "✓ Consolidation Checklist"

echo ""

# Check 1: Migration directory
if [ -d "$MIGRATIONS_DIR/20260114000000_01_init" ]; then
    print_status "✓" "Migration directory created"
else
    print_status "✗" "Migration directory not found"
fi

# Check 2: migration.sql
if [ -f "$MIGRATIONS_DIR/20260114000000_01_init/migration.sql" ]; then
    print_status "✓" "migration.sql file created"
else
    print_status "✗" "migration.sql file not found"
fi

# Check 3: migration_lock.toml
if [ -f "$MIGRATIONS_DIR/migration_lock.toml" ]; then
    print_status "✓" "migration_lock.toml updated"
else
    print_status "✗" "migration_lock.toml not found"
fi

# Check 4: Old migrations archived
if ! find "$MIGRATIONS_DIR" -maxdepth 1 -type d ! -name "*01_init" ! -name "migrations" | grep -q .; then
    print_status "✓" "Old migrations archived/removed"
else
    print_status "✗" "Old migrations still present"
fi

# Check 5: Backups
if ls "$PROJECT_DIR/backups/pre_consolidation_"* 1>/dev/null 2>&1; then
    print_status "✓" "Backups created"
else
    print_status "○" "No backups found (check if consolidation ran)"
fi

# Check 6: Git commit
if git -C "$PROJECT_DIR" log --oneline -1 2>/dev/null | grep -q "Consolidate"; then
    print_status "✓" "Git commit created"
else
    print_status "○" "Consolidation commit not found"
fi

# Check 7: Docker (if available)
if command -v docker &> /dev/null && docker ps > /dev/null 2>&1; then
    if docker ps | grep -q postgres; then
        if docker exec $(docker ps | grep postgres | awk '{print $1}') \
            psql -U acrobaticz_user -d acrobaticz -c "SELECT 1" > /dev/null 2>&1; then
            
            TABLE_COUNT=$(docker exec $(docker ps | grep postgres | awk '{print $1}') \
                psql -U acrobaticz_user -d acrobaticz -t -c \
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "0")
            
            if [ "$TABLE_COUNT" -gt 40 ]; then
                print_status "✓" "Docker database has $TABLE_COUNT tables"
            else
                print_status "✗" "Docker database has only $TABLE_COUNT tables (expected 48+)"
            fi
        else
            print_status "○" "PostgreSQL not responding"
        fi
    else
        print_status "○" "PostgreSQL container not running"
    fi
else
    print_status "ⓘ" "Docker not available for testing"
fi

# ============================================================
# SECTION 4: Timeline
# ============================================================

echo ""
print_header "📅 Timeline & Next Steps"

echo ""
echo -e "${CYAN}${BOLD}Phase 3: Migration Consolidation${NC}"

if [ -n "$CURRENT_INIT" ]; then
    echo -e "  ${GREEN}✓ COMPLETED${NC}"
else
    echo -e "  ${YELLOW}○ IN PROGRESS${NC}"
    echo -e "    Run: ${BOLD}bash scripts/consolidate-migrations.sh${NC}"
fi

echo ""
echo -e "${CYAN}${BOLD}Phase 4: Storage Configuration (Next)${NC}"
echo -e "  ○ NOT STARTED"
echo -e "    - Create StepStorage.tsx component"
echo -e "    - Implement MinIO connectivity tests"
echo -e "    - Add to /setup/install wizard"

echo ""
echo -e "${CYAN}${BOLD}Phase 5: Auto-Redirect Middleware (Final)${NC}"
echo -e "  ○ NOT STARTED"
echo -e "    - Create src/middleware.ts"
echo -e "    - Redirect to /setup if INSTALLATION_COMPLETE=false"
echo -e "    - Enable Elite setup flow"

# ============================================================
# SECTION 5: Resources
# ============================================================

echo ""
print_header "📚 Resources & Documentation"

echo ""
docs_available=0

if [ -f "$PROJECT_DIR/docs/MIGRATION_CONSOLIDATION_GUIDE.md" ]; then
    echo -e "  ${GREEN}✓${NC} MIGRATION_CONSOLIDATION_GUIDE.md (complete guide)"
    docs_available=$((docs_available + 1))
fi

if [ -f "$PROJECT_DIR/docs/PHASE_3_QUICK_START.md" ]; then
    echo -e "  ${GREEN}✓${NC} PHASE_3_QUICK_START.md (quick start)"
    docs_available=$((docs_available + 1))
fi

if [ -f "$PROJECT_DIR/docs/PHASE_3_MIGRATION_CONSOLIDATION_PLAN.md" ]; then
    echo -e "  ${GREEN}✓${NC} PHASE_3_MIGRATION_CONSOLIDATION_PLAN.md (detailed plan)"
    docs_available=$((docs_available + 1))
fi

if [ -f "$PROJECT_DIR/scripts/consolidate-migrations.sh" ]; then
    echo -e "  ${GREEN}✓${NC} scripts/consolidate-migrations.sh (automation)"
    docs_available=$((docs_available + 1))
fi

if [ -f "$PROJECT_DIR/scripts/test-consolidation.sh" ]; then
    echo -e "  ${GREEN}✓${NC} scripts/test-consolidation.sh (testing)"
    docs_available=$((docs_available + 1))
fi

echo ""
echo -e "Total resources available: ${CYAN}${BOLD}$docs_available${NC}"

# ============================================================
# Footer
# ============================================================

echo ""
echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}"
echo -e "  ${BOLD}Phase 3 Implementation Guide${NC}"
echo -e "  For detailed information, see: ${BOLD}docs/MIGRATION_CONSOLIDATION_GUIDE.md${NC}"
echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}"
echo ""
