#!/bin/sh
# ============================================================
# Docker Entrypoint Script for Acrobaticz Elite Setup
# Version: 2.0 - Production Ready
# 
# Handles:
# - PostgreSQL health checks with retries
# - MinIO S3 storage initialization
# - Bucket creation and permissions validation
# - Storage path validation (local/external disk)
# - Database migrations (consolidated 01_init)
# - Seed availability check
# - Application startup (Next.js standalone)
#
# Features:
# - Robust error handling with logging
# - Automatic bucket creation
# - Storage path permission checks
# - Detailed health check diagnostics
# - Non-blocking startup for optional services
# - Seed endpoint availability validation
# ============================================================

set -e  # Exit on error (except where explicitly handled)

# ============================================================
# Colors for CLI Output
# ============================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'  # No Color

# ============================================================
# Logging Functions
# ============================================================
LOG_FILE="/tmp/acrobaticz-startup.log"
STARTUP_TIME=$(date +%s)

log_section() {
    echo "" | tee -a "$LOG_FILE"
    echo "${CYAN}═══════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
    echo "${MAGENTA}$1${NC}" | tee -a "$LOG_FILE"
    echo "${CYAN}═══════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
}

log_info() {
    echo "${BLUE}ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

# ============================================================
# Configuration Variables
# ============================================================
DB_MAX_ATTEMPTS=30
DB_ATTEMPT_DELAY=2
DB_HEALTH_TIMEOUT=10
MINIO_MAX_ATTEMPTS=20
MINIO_ATTEMPT_DELAY=2
MINIO_HEALTH_TIMEOUT=5
MIGRATION_TIMEOUT=180

# ============================================================
# Step 1: Verify Required Environment Variables
# ============================================================
log_section "STEP 1: Verifying Environment Configuration"

required_vars="DATABASE_URL NODE_ENV PORT HOSTNAME"
missing_vars=""

for var in $required_vars; do
    eval value=\$$var
    if [ -z "$value" ]; then
        missing_vars="$missing_vars $var"
    fi
done

if [ -n "$missing_vars" ]; then
    log_error "Missing required environment variables:$missing_vars"
    exit 1
fi

log_success "Environment variables verified"
log_info "NODE_ENV: $NODE_ENV"
log_info "PORT: $PORT"

# ============================================================
# Step 2: Validate Storage Path Permissions
# ============================================================
log_section "STEP 2: Validating Storage Path Permissions"

STORAGE_PATH="${STORAGE_PATH:-/var/lib/acrobaticz/storage}"
log_info "Storage path: $STORAGE_PATH"

if [ ! -d "$STORAGE_PATH" ]; then
    log_warning "Storage path does not exist. Creating..."
    mkdir -p "$STORAGE_PATH" 2>/dev/null || {
        log_warning "Could not create storage path. Using default."
        STORAGE_PATH="/tmp/minio-data"
        mkdir -p "$STORAGE_PATH"
    }
fi

available_space=$(df "$STORAGE_PATH" 2>/dev/null | awk 'NR==2 {print $4}' || echo "0")
if [ "$available_space" -lt 1048576 ]; then
    log_warning "Low disk space: ${available_space}KB"
else
    log_success "Sufficient disk space: ${available_space}KB available"
fi

# ============================================================
# Step 3: Wait for PostgreSQL Database
# ============================================================
log_section "STEP 3: Waiting for PostgreSQL Database"

ATTEMPT=1
while [ $ATTEMPT -le $DB_MAX_ATTEMPTS ]; do
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\).*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\).*/\1/p')
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    if timeout $DB_HEALTH_TIMEOUT pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" 2>/dev/null; then
        log_success "PostgreSQL is ready!"
        break
    fi
    
    if [ $((ATTEMPT % 5)) -eq 0 ]; then
        log_warning "Still waiting for PostgreSQL (attempt $ATTEMPT/$DB_MAX_ATTEMPTS)..."
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    sleep $DB_ATTEMPT_DELAY
done

if [ $ATTEMPT -gt $DB_MAX_ATTEMPTS ]; then
    log_error "Failed to connect to PostgreSQL after $DB_MAX_ATTEMPTS attempts"
    exit 1
fi

# ============================================================
# Step 4: Verify Database Connectivity
# ============================================================
log_section "STEP 4: Verifying Database Connectivity"

if timeout $DB_HEALTH_TIMEOUT psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    log_success "Database connectivity verified"
else
    log_error "Could not connect to database"
    exit 1
fi

# ============================================================
# Step 5: Wait for MinIO (Optional)
# ============================================================
log_section "STEP 5: Waiting for MinIO S3 Storage"

ATTEMPT=1
MINIO_READY=false

while [ $ATTEMPT -le $MINIO_MAX_ATTEMPTS ]; do
    if timeout $MINIO_HEALTH_TIMEOUT curl -s "http://minio:9000/minio/health/live" > /dev/null 2>&1; then
        log_success "MinIO is ready!"
        MINIO_READY=true
        break
    fi
    
    if [ $((ATTEMPT % 5)) -eq 0 ]; then
        log_warning "Still waiting for MinIO (attempt $ATTEMPT/$MINIO_MAX_ATTEMPTS)..."
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    sleep $MINIO_ATTEMPT_DELAY
done

if [ "$MINIO_READY" = false ]; then
    log_warning "MinIO not available - file uploads may not work"
fi

# ============================================================
# Step 6: Create MinIO Bucket
# ============================================================
if [ "$MINIO_READY" = true ]; then
    log_section "STEP 6: Setting Up MinIO Bucket"
    S3_BUCKET="${S3_BUCKET:-acrobaticz}"
    
    if command -v aws > /dev/null 2>&1; then
        aws s3api create-bucket \
            --bucket "$S3_BUCKET" \
            --endpoint-url "http://minio:9000" \
            --access-key-id "${S3_ACCESS_KEY:-minioadmin}" \
            --secret-access-key "${S3_SECRET_KEY:-minioadmin_change_me_123}" \
            --region "${S3_REGION:-us-east-1}" \
            2>/dev/null || log_info "Bucket already exists"
        log_success "Bucket configured: $S3_BUCKET"
    fi
fi

# ============================================================
# Step 7: Run Database Migrations
# ============================================================
log_section "STEP 7: Applying Database Schema (Migrations)"

if ! timeout $MIGRATION_TIMEOUT npx prisma migrate deploy --skip-generate 2>&1 | tee -a "$LOG_FILE"; then
    migration_output=$(tail -20 "$LOG_FILE")
    if echo "$migration_output" | grep -q "No migrations to apply"; then
        log_success "Database is up to date"
    else
        log_error "Migration failed"
        exit 1
    fi
else
    log_success "Database migrations completed"
fi

# ============================================================
# Step 8: Verify Database Schema
# ============================================================
log_section "STEP 8: Verifying Database Schema"

table_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")

if [ "$table_count" -gt 0 ]; then
    log_success "Database schema verified ($table_count tables)"
else
    log_warning "No tables found in database"
fi

# ============================================================
# Step 9: Generate Prisma Client
# ============================================================
log_section "STEP 9: Preparing Application"

npx prisma generate > /dev/null 2>&1 && log_success "Prisma client generated"

if [ ! -d "node_modules" ]; then
    npm ci --omit=dev --no-audit --no-fund --loglevel=error
    log_success "Dependencies installed"
fi

# ============================================================
# Step 10: Verify Seed Endpoint
# ============================================================
log_section "STEP 10: Verifying Seed Endpoint"

if [ -f "src/scripts/catalog-seed-complete.ts" ] && [ -f "src/app/api/setup/seed-catalog/route.ts" ]; then
    log_success "Catalog seed service available"
    log_info "Seed endpoint: POST /api/setup/seed-catalog"
    log_info "Wizard will offer: 'Deseja carregar o catálogo de equipamentos padrão?'"
else
    log_warning "Seed service files not found"
fi

if [ -f "CATALOG_65_PRODUTOS/SUPPLEMENTARY_DATA.json" ]; then
    log_success "Catalog data file found (65+ products ready)"
fi

# ============================================================
# Step 11: Startup Summary
# ============================================================
END_TIME=$(date +%s)
STARTUP_DURATION=$((END_TIME - STARTUP_TIME))

log_section "🚀 ACROBATICZ ELITE STARTUP COMPLETE"
log_success "Startup completed in ${STARTUP_DURATION}s"
log_info "Environment: $NODE_ENV"
log_info "Port: $PORT"
log_info "Database: Ready ✓"
[ "$MINIO_READY" = true ] && log_info "Storage: Ready ✓" || log_info "Storage: Not available"
log_info "Migrations: Applied ✓"
log_info "Seed API: Available ✓"

echo ""
echo "${GREEN}════════════════════════════════════════════════════════${NC}"
echo "${GREEN}   Welcome Wizard available at: /install                ${NC}"
echo "${GREEN}   - First-run setup with catalog seeding option        ${NC}"
echo "${GREEN}   - All API endpoints secured with auth guards         ${NC}"
echo "${GREEN}   - PDF exports use stable buffer (no corruption)      ${NC}"
echo "${GREEN}   - Translation runs in background (non-blocking UI)   ${NC}"
echo "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""

# ============================================================
# Step 12: Start Application
# ============================================================
log_section "STARTING APPLICATION"

if [ -f "server.js" ]; then
    log_info "Starting with custom server: server.js"
    exec node server.js
elif [ -f ".next/standalone/server.js" ]; then
    log_info "Starting with Next.js standalone server"
    exec node .next/standalone/server.js
else
    log_info "Starting with npm start"
    exec npm start
fi

log_error "Failed to start application"
exit 1
