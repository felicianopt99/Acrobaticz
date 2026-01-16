#!/bin/bash

# ============================================================
# 🧪 Migration Consolidation Test Suite
# ============================================================
# 
# Executa testes automáticos para validar a consolidação
#
# Usage:
#   bash scripts/test-consolidation.sh
#   bash scripts/test-consolidation.sh --full
#
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="$PROJECT_DIR/prisma/migrations"
FULL_TEST=false

# ============================================================
# Logging Functions
# ============================================================

log_test() {
    echo -e "${BLUE}TEST${NC}  $1"
}

log_pass() {
    echo -e "${GREEN}PASS${NC}  $1"
}

log_fail() {
    echo -e "${RED}FAIL${NC}  $1"
}

log_skip() {
    echo -e "${YELLOW}SKIP${NC}  $1"
}

log_section() {
    echo ""
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}${BOLD}$1${NC}"
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}"
}

# ============================================================
# Parse Arguments
# ============================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --full)
            FULL_TEST=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# ============================================================
# TEST 1: File Structure
# ============================================================

log_section "TEST SUITE 1: File Structure"

TEST_PASS=0
TEST_FAIL=0

log_test "Checking if 01_init migration exists..."
if [ -d "$MIGRATIONS_DIR/20260114000000_01_init" ]; then
    log_pass "Migration directory found: 20260114000000_01_init"
    TEST_PASS=$((TEST_PASS + 1))
else
    log_fail "Migration directory NOT found"
    TEST_FAIL=$((TEST_FAIL + 1))
fi

log_test "Checking if migration.sql exists..."
if [ -f "$MIGRATIONS_DIR/20260114000000_01_init/migration.sql" ]; then
    LINES=$(wc -l < "$MIGRATIONS_DIR/20260114000000_01_init/migration.sql")
    SIZE=$(du -h "$MIGRATIONS_DIR/20260114000000_01_init/migration.sql" | cut -f1)
    log_pass "migration.sql found ($LINES lines, $SIZE)"
    TEST_PASS=$((TEST_PASS + 1))
else
    log_fail "migration.sql NOT found"
    TEST_FAIL=$((TEST_FAIL + 1))
fi

log_test "Checking if migration_lock.toml exists..."
if [ -f "$MIGRATIONS_DIR/migration_lock.toml" ]; then
    log_pass "migration_lock.toml found"
    TEST_PASS=$((TEST_PASS + 1))
else
    log_fail "migration_lock.toml NOT found"
    TEST_FAIL=$((TEST_FAIL + 1))
fi

log_test "Checking if old migrations are archived..."
OLD_MIGRATIONS=$(find "$MIGRATIONS_DIR" -maxdepth 1 -type d ! -name "*01_init" ! -name "migrations" | wc -l)
if [ "$OLD_MIGRATIONS" -eq 0 ]; then
    log_pass "Old migrations are NOT in migration directory (good!)"
    TEST_PASS=$((TEST_PASS + 1))
else
    log_fail "Found $OLD_MIGRATIONS old migrations (should be archived)"
    TEST_FAIL=$((TEST_FAIL + 1))
fi

log_test "Checking if migration archive exists..."
if ls "$MIGRATIONS_DIR".archive.* 1> /dev/null 2>&1; then
    ARCHIVE=$(ls -d "$MIGRATIONS_DIR".archive.* | head -1)
    COUNT=$(find "$ARCHIVE" -maxdepth 1 -type d | wc -l)
    log_pass "Migration archive found with $COUNT migrations: $(basename $ARCHIVE)"
    TEST_PASS=$((TEST_PASS + 1))
else
    log_skip "No migration archive found (may be OK if using git rollback)"
fi

log_test "Checking if backups exist..."
if ls "$PROJECT_DIR/backups/pre_consolidation_"* 1> /dev/null 2>&1; then
    BACKUP_COUNT=$(ls "$PROJECT_DIR/backups/pre_consolidation_"* 2>/dev/null | wc -l)
    SIZE=$(du -sh "$PROJECT_DIR/backups" | cut -f1)
    log_pass "Found $BACKUP_COUNT backup files (total: $SIZE)"
    TEST_PASS=$((TEST_PASS + 1))
else
    log_skip "No backups found (may be OK if using --no-backup flag)"
fi

# ============================================================
# TEST 2: SQL Content
# ============================================================

log_section "TEST SUITE 2: SQL Content Validation"

log_test "Checking if SQL contains CREATE TABLE statements..."
if grep -q "CREATE TABLE" "$MIGRATIONS_DIR/20260114000000_01_init/migration.sql"; then
    TABLE_COUNT=$(grep "^CREATE TABLE" "$MIGRATIONS_DIR/20260114000000_01_init/migration.sql" | wc -l)
    log_pass "Found $TABLE_COUNT CREATE TABLE statements"
    TEST_PASS=$((TEST_PASS + 1))
else
    log_fail "No CREATE TABLE statements found"
    TEST_FAIL=$((TEST_FAIL + 1))
fi

log_test "Checking if SQL contains indexes..."
if grep -q "CREATE INDEX" "$MIGRATIONS_DIR/20260114000000_01_init/migration.sql"; then
    INDEX_COUNT=$(grep "^CREATE INDEX" "$MIGRATIONS_DIR/20260114000000_01_init/migration.sql" | wc -l)
    log_pass "Found $INDEX_COUNT CREATE INDEX statements"
    TEST_PASS=$((TEST_PASS + 1))
else
    log_fail "No indexes found"
    TEST_FAIL=$((TEST_FAIL + 1))
fi

log_test "Checking if Prisma metadata is removed..."
if grep -q "_prisma_migrations" "$MIGRATIONS_DIR/20260114000000_01_init/migration.sql"; then
    log_fail "SQL still contains _prisma_migrations references"
    TEST_FAIL=$((TEST_FAIL + 1))
else
    log_pass "_prisma_migrations properly removed"
    TEST_PASS=$((TEST_PASS + 1))
fi

log_test "Checking core tables (APIConfiguration, User, Equipment, etc)..."
CORE_TABLES=("APIConfiguration" "ActivityLog" "User" "Category" "Equipment" "Quote")
FOUND_TABLES=0
for table in "${CORE_TABLES[@]}"; do
    if grep -q "CREATE TABLE \"$table\"" "$MIGRATIONS_DIR/20260114000000_01_init/migration.sql"; then
        FOUND_TABLES=$((FOUND_TABLES + 1))
    fi
done

if [ "$FOUND_TABLES" -eq "${#CORE_TABLES[@]}" ]; then
    log_pass "All core tables found ($FOUND_TABLES/${#CORE_TABLES[@]})"
    TEST_PASS=$((TEST_PASS + 1))
else
    log_fail "Missing some core tables ($FOUND_TABLES/${#CORE_TABLES[@]})"
    TEST_FAIL=$((TEST_FAIL + 1))
fi

# ============================================================
# TEST 3: Git Integration
# ============================================================

log_section "TEST SUITE 3: Git Integration"

if git -C "$PROJECT_DIR" rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    log_test "Checking git status..."
    if [ -z "$(git -C "$PROJECT_DIR" status --porcelain)" ]; then
        log_pass "Git working directory is clean"
        TEST_PASS=$((TEST_PASS + 1))
    else
        log_skip "Git working directory has uncommitted changes (normal if adding more changes)"
    fi
    
    log_test "Checking for consolidation commit..."
    if git -C "$PROJECT_DIR" log --oneline -10 | grep -q "Consolidate Prisma migrations"; then
        COMMIT=$(git -C "$PROJECT_DIR" log --oneline -1 | head -c 40)
        log_pass "Found consolidation commit: $COMMIT"
        TEST_PASS=$((TEST_PASS + 1))
    else
        log_fail "Consolidation commit not found"
        TEST_FAIL=$((TEST_FAIL + 1))
    fi
else
    log_skip "Not in a git repository"
fi

# ============================================================
# TEST 4: Docker Integration (Optional)
# ============================================================

if [ "$FULL_TEST" = true ]; then
    log_section "TEST SUITE 4: Docker Integration (Full Test)"
    
    log_test "Checking if Docker is running..."
    if command -v docker &> /dev/null && docker ps > /dev/null 2>&1; then
        log_pass "Docker is available"
        TEST_PASS=$((TEST_PASS + 1))
        
        log_test "Checking if PostgreSQL container exists..."
        if docker ps -a | grep -q postgres; then
            log_pass "PostgreSQL container found"
            TEST_PASS=$((TEST_PASS + 1))
            
            log_test "Checking if PostgreSQL is running..."
            if docker ps | grep -q postgres; then
                log_pass "PostgreSQL is running"
                TEST_PASS=$((TEST_PASS + 1))
                
                log_test "Testing database connectivity..."
                if docker exec $(docker ps | grep postgres | awk '{print $1}') \
                    psql -U acrobaticz_user -d acrobaticz -c "SELECT 1" > /dev/null 2>&1; then
                    log_pass "Database is accessible"
                    TEST_PASS=$((TEST_PASS + 1))
                    
                    log_test "Checking if migration was applied..."
                    TABLE_COUNT=$(docker exec $(docker ps | grep postgres | awk '{print $1}') \
                        psql -U acrobaticz_user -d acrobaticz -t -c \
                        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "0")
                    
                    if [ "$TABLE_COUNT" -gt 40 ]; then
                        log_pass "Database has $TABLE_COUNT tables (expected: 48+)"
                        TEST_PASS=$((TEST_PASS + 1))
                    else
                        log_fail "Database has only $TABLE_COUNT tables (expected: 48+)"
                        TEST_FAIL=$((TEST_FAIL + 1))
                    fi
                    
                    log_test "Listing main tables..."
                    TABLES=$(docker exec $(docker ps | grep postgres | awk '{print $1}') \
                        psql -U acrobaticz_user -d acrobaticz -t -c \
                        "SELECT tablename FROM pg_tables WHERE schemaname='public' LIMIT 10;" 2>/dev/null)
                    echo "$TABLES" | sed 's/^/         /'
                else
                    log_fail "Cannot connect to database"
                    TEST_FAIL=$((TEST_FAIL + 1))
                fi
            else
                log_skip "PostgreSQL is not running (start with: docker-compose up -d postgres)"
            fi
        else
            log_skip "PostgreSQL container not found"
        fi
    else
        log_skip "Docker is not available"
    fi
fi

# ============================================================
# Summary
# ============================================================

log_section "Test Summary"

TOTAL=$((TEST_PASS + TEST_FAIL))
echo ""
echo -e "${GREEN}✓ Passed:${NC}  $TEST_PASS"
echo -e "${RED}✗ Failed:${NC}  $TEST_FAIL"
echo -e "${BOLD}Total:${NC}   $TOTAL"
echo ""

if [ "$TEST_FAIL" -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✅ All tests passed! Consolidation looks good.${NC}"
    exit 0
else
    echo -e "${RED}${BOLD}❌ Some tests failed. Check the output above.${NC}"
    exit 1
fi
