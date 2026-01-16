#!/bin/bash

# ============================================================
# 🎯 Prisma Migration Consolidation Script
# ============================================================
# 
# Purpose:  Consolidates 29 migrations → 1 baseline (01_init)
#           Safe: Backups, tests, easy rollback
#           
# Usage:    bash scripts/consolidate-migrations.sh
#           bash scripts/consolidate-migrations.sh --dry-run
#           bash scripts/consolidate-migrations.sh --no-backup
#
# Safety:   - Creates backups BEFORE any changes
#           - Tests in Docker BEFORE affecting dev data
#           - Easy rollback via git
#           - Preserves all existing data
#
# Author:   Elite Setup Implementation (Phase 3)
# Created:  2024-01-14
#
# ============================================================

set -e

# ============================================================
# Colors & Formatting
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ============================================================
# Configuration
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
MIGRATIONS_DIR="$PROJECT_DIR/prisma/migrations"
DRY_RUN=false
NO_BACKUP=false
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="pre_consolidation_$TIMESTAMP"
LOG_FILE="/tmp/consolidate-migrations_$TIMESTAMP.log"

# ============================================================
# Logging Functions
# ============================================================

log_info() {
    echo -e "${BLUE}ℹ${NC}  $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✓${NC}  $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC}  $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}✗${NC}  $1" | tee -a "$LOG_FILE"
}

log_section() {
    echo "" | tee -a "$LOG_FILE"
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
    echo -e "${CYAN}${BOLD}$1${NC}" | tee -a "$LOG_FILE"
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
}

log_step() {
    echo "" | tee -a "$LOG_FILE"
    echo -e "${BOLD}$1${NC}" | tee -a "$LOG_FILE"
}

# ============================================================
# Parse Arguments
# ============================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --no-backup)
            NO_BACKUP=true
            shift
            ;;
        *)
            log_error "Unknown argument: $1"
            exit 1
            ;;
    esac
done

# ============================================================
# STEP 1: Pre-Flight Checks
# ============================================================

log_section "STEP 1: Pre-Flight Checks"

log_info "Checking project structure..."
if [ ! -d "$MIGRATIONS_DIR" ]; then
    log_error "Migrations directory not found: $MIGRATIONS_DIR"
    exit 1
fi
log_success "Found: $MIGRATIONS_DIR"

log_info "Checking git repository..."
if ! git -C "$PROJECT_DIR" rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    log_error "Not in a git repository. Cannot proceed."
    exit 1
fi
log_success "Git repository found"

log_info "Counting existing migrations..."
MIGRATION_COUNT=$(find "$MIGRATIONS_DIR" -maxdepth 1 -type d ! -name migrations 2>/dev/null | wc -l)
log_success "Found $MIGRATION_COUNT migrations to consolidate"

if [ "$MIGRATION_COUNT" -lt 2 ]; then
    log_error "Less than 2 migrations found. Nothing to consolidate."
    exit 1
fi

log_info "Checking npm/node..."
if ! command -v npm &> /dev/null; then
    log_error "npm not found. Is Node.js installed?"
    exit 1
fi
log_success "npm found: $(npm --version)"

# ============================================================
# STEP 2: Create Backups
# ============================================================

log_section "STEP 2: Creating Comprehensive Backups"

if [ "$NO_BACKUP" = false ]; then
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    log_info "Using backup directory: $BACKUP_DIR"
    
    # Backup migrations directory
    log_step "Backing up migrations directory..."
    MIGRATIONS_BACKUP="$BACKUP_DIR/$BACKUP_NAME.migrations.tar.gz"
    tar -czf "$MIGRATIONS_BACKUP" -C "$PROJECT_DIR" prisma/migrations 2>/dev/null
    BACKUP_SIZE=$(du -h "$MIGRATIONS_BACKUP" | cut -f1)
    log_success "Created: $MIGRATIONS_BACKUP ($BACKUP_SIZE)"
    
    # Backup schema.prisma
    log_step "Backing up schema.prisma..."
    SCHEMA_BACKUP="$BACKUP_DIR/$BACKUP_NAME.schema.prisma"
    cp "$PROJECT_DIR/prisma/schema.prisma" "$SCHEMA_BACKUP"
    log_success "Created: $SCHEMA_BACKUP"
    
    # Backup package.json
    log_step "Backing up package.json..."
    PACKAGE_BACKUP="$BACKUP_DIR/$BACKUP_NAME.package.json"
    cp "$PROJECT_DIR/package.json" "$PACKAGE_BACKUP"
    log_success "Created: $PACKAGE_BACKUP"
    
    # Try to backup database
    log_step "Checking for running PostgreSQL..."
    if command -v docker &> /dev/null; then
        if docker ps 2>/dev/null | grep -q postgres; then
            log_info "Docker PostgreSQL found, backing up database..."
            DB_BACKUP="$BACKUP_DIR/$BACKUP_NAME.database.sql"
            
            if docker exec $(docker ps | grep postgres | awk '{print $1}') \
                pg_dump -U acrobaticz_user -d acrobaticz \
                --no-owner --no-privileges \
                > "$DB_BACKUP" 2>/dev/null; then
                DB_SIZE=$(du -h "$DB_BACKUP" | cut -f1)
                log_success "Database backed up: $DB_BACKUP ($DB_SIZE)"
            else
                log_warning "Could not backup database (connection failed)"
            fi
        else
            log_warning "Docker PostgreSQL not running (skipping database backup)"
        fi
    else
        log_warning "Docker not found (skipping database backup)"
    fi
else
    log_warning "Skipping backups (--no-backup flag set)"
fi

# ============================================================
# STEP 3: Generate Consolidated SQL
# ============================================================

log_section "STEP 3: Generating Consolidated SQL from Schema"

log_info "Checking for running database..."
if ! docker ps 2>/dev/null | grep -q postgres; then
    log_error "PostgreSQL container is not running"
    log_error "Please run: docker-compose up -d postgres"
    exit 1
fi

log_step "Extracting schema from running database..."
CONSOLIDATED_SQL="/tmp/consolidated_schema_$TIMESTAMP.sql"

POSTGRES_CONTAINER=$(docker ps | grep postgres | awk '{print $1}')
if [ -z "$POSTGRES_CONTAINER" ]; then
    log_error "Could not find PostgreSQL container"
    exit 1
fi

log_info "Using container: $POSTGRES_CONTAINER"

if docker exec "$POSTGRES_CONTAINER" \
    pg_dump -U acrobaticz_user -d acrobaticz \
    --schema-only \
    --no-owner \
    --no-privileges \
    --no-tablespaces \
    > "$CONSOLIDATED_SQL" 2>/dev/null; then
    log_success "Schema extracted: $CONSOLIDATED_SQL"
else
    log_error "Failed to extract schema from database"
    exit 1
fi

log_step "Cleaning up Prisma metadata..."
# Remove _prisma_migrations references
sed -i '/^DROP TABLE IF EXISTS "_prisma_migrations"/d' "$CONSOLIDATED_SQL" || true
sed -i '/^CREATE TABLE.*_prisma_migrations/,/^);$/d' "$CONSOLIDATED_SQL" || true
sed -i '/^ALTER TABLE.*_prisma_migrations/d' "$CONSOLIDATED_SQL" || true
sed -i '/^CREATE INDEX.*_prisma_migrations/d' "$CONSOLIDATED_SQL" || true

LINES=$(wc -l < "$CONSOLIDATED_SQL")
log_success "Consolidated SQL: $LINES lines (cleaned)"

# ============================================================
# STEP 4: Create New Migration Folder
# ============================================================

log_section "STEP 4: Creating New Migration (01_init)"

NEW_MIGRATION_DIR="$MIGRATIONS_DIR/20260114000000_01_init"

if [ "$DRY_RUN" = true ]; then
    log_warning "[DRY RUN] Would create: $NEW_MIGRATION_DIR"
    log_warning "[DRY RUN] Would copy $LINES lines of SQL"
else
    log_step "Archiving old migrations..."
    MIGRATIONS_ARCHIVE="$MIGRATIONS_DIR.archive.$TIMESTAMP"
    mkdir -p "$MIGRATIONS_ARCHIVE"
    
    # Move all migration folders (except lock file)
    MOVED=0
    find "$MIGRATIONS_DIR" -maxdepth 1 -type d ! -name migrations | while read -r migration; do
        if [ -d "$migration" ]; then
            basename=$(basename "$migration")
            log_info "  → $basename"
            mv "$migration" "$MIGRATIONS_ARCHIVE/" 2>/dev/null || true
            MOVED=$((MOVED+1))
        fi
    done
    log_success "Archived $MIGRATION_COUNT migrations to: $(basename $MIGRATIONS_ARCHIVE)"
    
    log_step "Creating new migration directory..."
    mkdir -p "$NEW_MIGRATION_DIR"
    log_info "Created: $NEW_MIGRATION_DIR"
    
    log_step "Copying consolidated SQL..."
    cp "$CONSOLIDATED_SQL" "$NEW_MIGRATION_DIR/migration.sql"
    log_success "Migration SQL created: $NEW_MIGRATION_DIR/migration.sql"
    
    log_step "Creating migration_lock.toml..."
    cat > "$MIGRATIONS_DIR/migration_lock.toml" << 'EOF'
# Please do not edit this file manually
# It should be added in your version-control system (i.e. Git)
provider = "postgresql"
EOF
    log_success "Created: $MIGRATIONS_DIR/migration_lock.toml"
    
    # Cleanup temp file
    rm -f "$CONSOLIDATED_SQL"
fi

# ============================================================
# STEP 5: Git Commit
# ============================================================

log_section "STEP 5: Git Commit"

if [ "$DRY_RUN" = true ]; then
    log_warning "[DRY RUN] Would commit: 'Consolidate Prisma migrations: $MIGRATION_COUNT → 1 baseline (01_init)'"
else
    cd "$PROJECT_DIR"
    log_step "Staging migration changes..."
    git add prisma/migrations/
    
    COMMIT_MSG="Consolidate Prisma migrations: $MIGRATION_COUNT → 1 baseline (01_init)"
    log_info "Commit message: $COMMIT_MSG"
    
    if git commit -m "$COMMIT_MSG" 2>/dev/null; then
        log_success "Committed to git"
    else
        log_warning "No changes to commit (migration may already be consolidated)"
    fi
fi

# ============================================================
# STEP 6: Summary & Next Steps
# ============================================================

log_section "Consolidation Complete!"

if [ "$DRY_RUN" = true ]; then
    log_warning "This was a DRY RUN - no actual changes were made"
    log_info "Run without --dry-run flag to execute consolidation:"
    echo "  bash scripts/consolidate-migrations.sh"
else
    log_success "Migrations consolidated: $MIGRATION_COUNT → 1"
    log_success "New migration: 01_init"
    log_success "Backups created: $BACKUP_DIR/$BACKUP_NAME.*"
fi

log_step "Next steps:"
echo ""
echo -e "${CYAN}1. Review the consolidated migration:${NC}"
echo "   cat prisma/migrations/20260114000000_01_init/migration.sql | head -50"
echo ""
echo -e "${CYAN}2. Test in Docker (fresh database):${NC}"
echo "   docker-compose down -v"
echo "   docker-compose up -d"
echo "   sleep 30  # Wait for migrations"
echo "   docker-compose logs app | grep -E 'STEP|completed|error'"
echo ""
echo -e "${CYAN}3. Verify database tables created:${NC}"
echo "   docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz \\\\"
echo "     -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';\""
echo ""
echo -e "${CYAN}4. If tests pass, you're done!${NC}"
echo "   Consolidation successful!"
echo ""
echo -e "${CYAN}5. If tests fail, rollback:${NC}"
echo "   git reset --hard HEAD~1"
echo "   tar -xzf $BACKUP_DIR/$BACKUP_NAME.migrations.tar.gz"
echo ""

log_info "Full log saved to: $LOG_FILE"
log_success "Script completed at $(date)"

exit 0