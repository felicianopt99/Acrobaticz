#!/bin/sh
# ============================================================
# Docker Dev Entrypoint Script - Acrobaticz Elite
# Version: 3.0 - Unified Dev/Prod Seeding
# 
# Features:
# - Auto-detects if database needs seeding
# - Runs prisma db push for schema sync
# - Controlled via SEED_ON_START environment variable
# - Works identically in Dev and Prod environments
# - Idempotent seeding (safe to run multiple times)
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_section() {
    echo ""
    echo "${CYAN}════════════════════════════════════════════════════════${NC}"
    echo "${CYAN}  $1${NC}"
    echo "${CYAN}════════════════════════════════════════════════════════${NC}"
}

log_info() { echo "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo "${GREEN}✅ $1${NC}"; }
log_warning() { echo "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo "${RED}❌ $1${NC}"; }

# ============================================================
# URL Encode Helper
# ============================================================
urlencode() {
  local string="$1"
  echo "$string" | sed 's/ /%20/g; s/!/%21/g; s/"/%22/g; s/#/%23/g; s/\$/%24/g; s/&/%26/g; s/'\''/%27/g; s/(/%28/g; s/)/%29/g; s/\*/%2A/g; s/+/%2B/g; s/,/%2C/g; s/\//%2F/g; s/:/%3A/g; s/;/%3B/g; s/=/%3D/g; s/?/%3F/g; s/@/%40/g; s/\[/%5B/g; s/\]/%5D/g; s/{/%7B/g; s/}/%7D/g'
}

# ============================================================
# Read Docker Secrets (if available)
# ============================================================
if [ -f /run/secrets/db_user ]; then DB_USER=$(cat /run/secrets/db_user); fi
if [ -f /run/secrets/db_password ]; then DB_PASSWORD=$(cat /run/secrets/db_password); fi
if [ -f /run/secrets/db_name ]; then DB_NAME=$(cat /run/secrets/db_name); fi
if [ -f /run/secrets/jwt_secret ]; then export JWT_SECRET="$(cat /run/secrets/jwt_secret)"; fi
if [ -f /run/secrets/deepl_api_key ]; then export DEEPL_API_KEY="$(cat /run/secrets/deepl_api_key)"; fi

# Build DATABASE_URL from secrets if not already set
if [ -z "${DATABASE_URL:-}" ] && [ -n "${DB_USER:-}" ] && [ -n "${DB_PASSWORD:-}" ] && [ -n "${DB_NAME:-}" ]; then
  ENCODED_PASSWORD=$(urlencode "$DB_PASSWORD")
  export DATABASE_URL="postgresql://${DB_USER}:${ENCODED_PASSWORD}@postgres:5432/${DB_NAME}?schema=public"
fi

log_section "🚀 ACROBATICZ DEV ENVIRONMENT STARTUP"
log_info "NODE_ENV: ${NODE_ENV:-development}"
log_info "SEED_ON_START: ${SEED_ON_START:-false}"

# Log redacted DATABASE_URL presence for diagnostics
if [ -n "${DATABASE_URL:-}" ]; then
  REDACTED_DBURL=$(printf "%s" "$DATABASE_URL" | sed 's/:[^@]*@/:***@/' | sed 's/?.*$//') || true
  log_info "DATABASE_URL: ${REDACTED_DBURL}..."
else
  log_error "DATABASE_URL is not set. Database operations will fail."
  exit 1
fi

# ============================================================
# Step 1: Wait for PostgreSQL
# ============================================================
log_section "Step 1: Waiting for PostgreSQL"

ATTEMPTS=0
MAX_ATTEMPTS=30

until pg_isready -h postgres -p 5432 -U "${DB_USER:-acrobaticz_user}" 2>/dev/null; do
    ATTEMPTS=$((ATTEMPTS+1))
    if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
        log_error "PostgreSQL not ready after $MAX_ATTEMPTS attempts"
        exit 1
    fi
    log_info "Waiting for PostgreSQL... (attempt $ATTEMPTS/$MAX_ATTEMPTS)"
    sleep 2
done

log_success "PostgreSQL is ready!"

# ============================================================
# Step 2: Schema Sync with Prisma
# ============================================================
log_section "Step 2: Syncing Database Schema"

if [ -z "${SKIP_MIGRATIONS:-}" ]; then
    # Use db push for dev (faster, handles schema changes) or migrate deploy for prod
    if [ "${NODE_ENV:-development}" = "development" ]; then
        log_info "Running prisma db push (development mode)..."
        if npx prisma db push --accept-data-loss 2>&1; then
            log_success "Schema pushed successfully"
        else
            log_warning "prisma db push failed, trying migrate deploy..."
            npx prisma migrate deploy 2>&1 || log_warning "Migration also failed"
        fi
    else
        log_info "Running prisma migrate deploy (production mode)..."
        MIGRATE_ATTEMPTS=0
        until npx prisma migrate deploy 2>&1; do
            MIGRATE_ATTEMPTS=$((MIGRATE_ATTEMPTS+1))
            if [ $MIGRATE_ATTEMPTS -ge 10 ]; then
                log_error "Migration failed after $MIGRATE_ATTEMPTS attempts"
                exit 1
            fi
            log_info "Retrying migration... (attempt $MIGRATE_ATTEMPTS)"
            sleep 3
        done
        log_success "Migrations applied successfully"
    fi
else
    log_info "Skipping migrations (SKIP_MIGRATIONS is set)"
fi

# ============================================================
# Step 3: Generate Prisma Client
# ============================================================
log_section "Step 3: Generating Prisma Client"

npx prisma generate 2>&1 || log_warning "Prisma generate had warnings"
log_success "Prisma client generated"

# ============================================================
# Step 4: Auto-Seed Check
# ============================================================
log_section "Step 4: Checking Database Seed Status"

# Function to check if database needs seeding
needs_seeding() {
    # Check if admin user exists
    ADMIN_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"User\" WHERE username='feliciano';" 2>/dev/null | tr -d ' ' || echo "0")
    
    # Check if categories exist
    CATEGORY_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"Category\";" 2>/dev/null | tr -d ' ' || echo "0")
    
    # Check if products exist
    PRODUCT_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"EquipmentItem\";" 2>/dev/null | tr -d ' ' || echo "0")
    
    log_info "Current DB state: Users=$ADMIN_COUNT, Categories=$CATEGORY_COUNT, Products=$PRODUCT_COUNT"
    
    # Return 0 (true/needs seeding) if any are zero
    [ "$ADMIN_COUNT" -eq 0 ] || [ "$CATEGORY_COUNT" -eq 0 ] || [ "$PRODUCT_COUNT" -eq 0 ]
}

# Check if we should seed
SHOULD_SEED=false

if [ "${SEED_ON_START:-false}" = "true" ]; then
    log_info "SEED_ON_START is enabled"
    if needs_seeding; then
        SHOULD_SEED=true
        log_info "Database is empty - will seed"
    else
        log_success "Database already has data - skipping seed"
    fi
elif [ "${FORCE_SEED:-false}" = "true" ]; then
    SHOULD_SEED=true
    log_warning "FORCE_SEED is enabled - will seed regardless of existing data"
else
    log_info "Auto-seeding disabled (set SEED_ON_START=true to enable)"
    if needs_seeding; then
        log_warning "Database is empty! Run 'npm run db:seed' or use the Setup Wizard at /install"
    fi
fi

# ============================================================
# Step 5: Execute Seeding (if needed)
# ============================================================
if [ "$SHOULD_SEED" = "true" ]; then
    log_section "Step 5: Seeding Database"
    
    # Check if catalog data exists
    if [ -d "CATALOG_65_PRODUTOS" ] && [ -f "CATALOG_65_PRODUTOS/CATALOGO_65_PRODUTOS.md" ]; then
        log_info "Found catalog data - running unified seed script..."
        
        # Build seed command with options
        SEED_CMD="npx tsx src/scripts/seed.ts"
        [ "${SEED_CLEAN:-false}" = "true" ] && SEED_CMD="$SEED_CMD --clean"
        [ "${SEED_VERBOSE:-false}" = "true" ] && SEED_CMD="$SEED_CMD --verbose"
        
        if $SEED_CMD; then
            log_success "Database seeding completed successfully!"
        else
            log_warning "Seeding failed, but continuing startup..."
        fi
    else
        log_warning "Catalog data not found at CATALOG_65_PRODUTOS/"
        log_info "Skipping seed - use Setup Wizard at /install instead"
    fi
else
    log_info "Skipping database seeding"
fi

# ============================================================
# Step 6: Summary
# ============================================================
log_section "🎉 STARTUP COMPLETE"

# Get final counts
FINAL_USERS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | tr -d ' ' || echo "?")
FINAL_CATEGORIES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"Category\";" 2>/dev/null | tr -d ' ' || echo "?")
FINAL_PRODUCTS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"EquipmentItem\";" 2>/dev/null | tr -d ' ' || echo "?")

log_info "Database Status:"
log_info "  • Users: $FINAL_USERS"
log_info "  • Categories: $FINAL_CATEGORIES"
log_info "  • Products: $FINAL_PRODUCTS"

echo ""
echo "${GREEN}════════════════════════════════════════════════════════${NC}"
echo "${GREEN}  App ready at: http://localhost:${PORT:-3000}          ${NC}"
echo "${GREEN}  Setup Wizard: http://localhost:${PORT:-3000}/install  ${NC}"
echo "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""

# ============================================================
# Step 7: Start Application
# ============================================================
log_section "Starting Next.js Development Server"

exec "$@"
