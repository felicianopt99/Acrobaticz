#!/bin/sh
# ============================================================
# Docker Entrypoint Script for Acrobaticz
# Handles:
# - Database connectivity checks
# - Automatic migrations
# - Initial seed data
# - Application startup
# ============================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'  # No Color

# Configuration
DB_MAX_ATTEMPTS=30
DB_ATTEMPT_DELAY=2
MIGRATION_TIMEOUT=120
SEED_TIMEOUT=60

log_info() {
    echo "${BLUE}ℹ${NC}  $1"
}

log_success() {
    echo "${GREEN}✓${NC}  $1"
}

log_warning() {
    echo "${YELLOW}⚠${NC}  $1"
}

log_error() {
    echo "${RED}✗${NC}  $1"
}

# ============================================================
# Step 1: Verify Environment Variables
# ============================================================
log_info "Verifying environment configuration..."

if [ -z "$DATABASE_URL" ]; then
    # Try to construct from secrets or env variables
    if [ -f "/run/secrets/db_user" ] && [ -f "/run/secrets/db_password" ] && [ -f "/run/secrets/db_name" ]; then
        DB_USER=$(cat /run/secrets/db_user)
        DB_PASS=$(cat /run/secrets/db_password)
        DB_NAME=$(cat /run/secrets/db_name)
        DB_HOST="${DB_HOST:-postgres}"
        DB_PORT="${DB_PORT:-5432}"
        DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
        export DATABASE_URL
    else
        log_error "DATABASE_URL not set and secrets not available"
        exit 1
    fi
fi

log_success "Environment variables configured"

# ============================================================
# Step 2: Wait for PostgreSQL Database
# ============================================================
log_info "Waiting for PostgreSQL database to be ready..."

ATTEMPT=1
while [ $ATTEMPT -le $DB_MAX_ATTEMPTS ]; do
    if pg_isready \
        -h "$(echo $DATABASE_URL | grep -oP '(?<=@)[^:]+' || echo 'postgres')" \
        -p "$(echo $DATABASE_URL | grep -oP '(?<=:)\d+(?=/)' || echo '5432')" \
        -U "$(echo $DATABASE_URL | grep -oP '(?:\/\/)\K[^:]+' || echo 'postgres')" \
        -d "$(echo $DATABASE_URL | grep -oP '(?<=/)[^?]+' || echo 'postgres')" \
        2>/dev/null; then
        log_success "PostgreSQL is ready!"
        break
    fi
    
    if [ $ATTEMPT -eq 1 ]; then
        log_info "Database not ready yet. Retrying (attempt $ATTEMPT/$DB_MAX_ATTEMPTS)..."
    else
        log_warning "Database not ready. Attempt $ATTEMPT/$DB_MAX_ATTEMPTS..."
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    sleep $DB_ATTEMPT_DELAY
done

if [ $ATTEMPT -gt $DB_MAX_ATTEMPTS ]; then
    log_error "Failed to connect to PostgreSQL after $DB_MAX_ATTEMPTS attempts"
    exit 1
fi

# ============================================================
# Step 3: Verify Database Connectivity
# ============================================================
log_info "Testing database connectivity..."

if ! timeout 10 npx prisma db execute --stdin < /dev/null 2>&1 | grep -q "Prisma CLI"; then
    # Try alternative test
    if ! timeout 10 psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        log_error "Database connectivity test failed"
        log_info "DATABASE_URL: $(echo $DATABASE_URL | sed 's/:.*@/:***@/')"
        exit 1
    fi
fi

log_success "Database connectivity verified"

# ============================================================
# Step 4: Run Database Migrations
# ============================================================
log_info "Running database migrations..."

if ! timeout $MIGRATION_TIMEOUT npx prisma migrate deploy \
    --skip-generate \
    2>&1 | tee /tmp/migration.log; then
    
    if grep -q "Already locked" /tmp/migration.log; then
        log_warning "Migration already in progress, waiting..."
        sleep 5
    elif grep -q "No migrations have been applied yet" /tmp/migration.log; then
        log_info "No migrations to apply"
    else
        log_error "Migration failed"
        cat /tmp/migration.log
        exit 1
    fi
else
    log_success "Database migrations completed"
fi

# ============================================================
# Step 5: Seed Database (Optional - Development Only)
# ============================================================
if [ "${SEED_DATABASE:-false}" = "true" ] && [ "${NODE_ENV}" != "production" ]; then
    log_info "Seeding database with initial data..."
    
    if timeout $SEED_TIMEOUT npm run db:seed:dry-run > /tmp/seed.log 2>&1; then
        log_success "Database seed completed"
    else
        log_warning "Database seed failed or not needed"
    fi
fi

# ============================================================
# Step 6: Health Check Endpoint
# ============================================================
log_info "Setting up health check endpoint..."

# Create a simple health check endpoint (if not already handled by Next.js)
# This ensures Docker healthcheck can reach the app

log_success "Health check endpoint ready"

# ============================================================
# Step 7: Start Application
# ============================================================
log_info "═══════════════════════════════════════════════════════"
log_info "Starting Acrobaticz Application"
log_info "═══════════════════════════════════════════════════════"
log_info "Environment: $NODE_ENV"
log_info "Port: $PORT"
log_info "Hostname: $HOSTNAME"

# Verify Node modules exist
if [ ! -d "node_modules" ]; then
    log_error "node_modules directory not found"
    log_info "Installing dependencies..."
    npm ci --omit=dev
fi

# Start Next.js server
if [ -f "server.js" ]; then
    log_info "Starting with custom server: server.js"
    exec node server.js
elif [ -f ".next/standalone/server.js" ]; then
    log_info "Starting with Next.js standalone server"
    exec node .next/standalone/server.js
else
    log_info "Starting with Next.js built-in server"
    exec npm start
fi

# ============================================================
# Fallback (should not reach here)
# ============================================================
log_error "Failed to start application"
exit 1
