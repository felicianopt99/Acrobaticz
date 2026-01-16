#!/bin/bash
# ============================================================
# Development Docker Setup Script
# 
# Usage:
#   ./scripts/dev-docker-setup.sh start    # Start all services
#   ./scripts/dev-docker-setup.sh stop     # Stop all services
#   ./scripts/dev-docker-setup.sh logs     # View logs
#   ./scripts/dev-docker-setup.sh reset    # Reset everything
#   ./scripts/dev-docker-setup.sh status   # Check service status
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

COMMAND=${1:-start}

# ============================================================
# Helper Functions
# ============================================================

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# ============================================================
# Configuration
# ============================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.dev.yml"
ENV_FILE="${PROJECT_ROOT}/.env"
ENV_DEV_FILE="${PROJECT_ROOT}/.env.dev"

# ============================================================
# Main Commands
# ============================================================

start() {
    log_info "Starting development environment (production-like)..."
    
    # Create .env from .env.dev if not exists
    if [ ! -f "$ENV_FILE" ]; then
        log_warn ".env file not found, creating from .env.dev..."
        if [ -f "$ENV_DEV_FILE" ]; then
            cp "$ENV_DEV_FILE" "$ENV_FILE"
            log_success ".env created from .env.dev"
        else
            log_error ".env.dev not found!"
            exit 1
        fi
    fi
    
    # Create dev-storage directory if not exists
    mkdir -p "${PROJECT_ROOT}/dev-storage/minio"
    mkdir -p "${PROJECT_ROOT}/dev-storage/cloud-storage"
    mkdir -p "${PROJECT_ROOT}/dev-storage/temp"
    
    log_info "Starting services..."
    cd "$PROJECT_ROOT"
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log_success "Services started!"
    log_info ""
    log_info "Access points:"
    log_info "  App:              http://localhost:3000"
    log_info "  MinIO Web:        http://localhost:9001"
    log_info "  PostgreSQL:       localhost:5432"
    log_info "  Nginx (Reverse):  http://localhost:80"
    log_info ""
    log_info "MinIO Credentials:"
    log_info "  Username: minioadmin"
    log_info "  Password: minioadmin_dev_123"
    log_info ""
    log_info "Run: docker-compose -f docker-compose.dev.yml logs -f"
    log_info "     to view live logs"
}

stop() {
    log_info "Stopping services..."
    cd "$PROJECT_ROOT"
    docker-compose -f "$COMPOSE_FILE" down
    log_success "Services stopped"
}

reset() {
    log_warn "This will delete all data and containers. Continue? (y/N)"
    read -r response
    
    if [[ "$response" != "y" && "$response" != "Y" ]]; then
        log_info "Reset cancelled"
        return
    fi
    
    log_info "Resetting development environment..."
    cd "$PROJECT_ROOT"
    
    docker-compose -f "$COMPOSE_FILE" down -v
    rm -rf "${PROJECT_ROOT}/dev-storage/minio"
    rm -rf "${PROJECT_ROOT}/dev-storage/cloud-storage"
    rm -rf "${PROJECT_ROOT}/dev-storage/temp"
    
    mkdir -p "${PROJECT_ROOT}/dev-storage/minio"
    mkdir -p "${PROJECT_ROOT}/dev-storage/cloud-storage"
    mkdir -p "${PROJECT_ROOT}/dev-storage/temp"
    
    log_success "Environment reset. Run './scripts/dev-docker-setup.sh start' to begin"
}

logs() {
    log_info "Showing live logs (Ctrl+C to exit)..."
    cd "$PROJECT_ROOT"
    docker-compose -f "$COMPOSE_FILE" logs -f
}

status() {
    log_info "Checking service status..."
    cd "$PROJECT_ROOT"
    docker-compose -f "$COMPOSE_FILE" ps
    
    log_info ""
    log_info "Health checks:"
    
    # PostgreSQL
    if docker exec acrobaticz-postgres-dev pg_isready -U acrobaticz_user -d acrobaticz_dev &>/dev/null; then
        log_success "PostgreSQL: Healthy"
    else
        log_error "PostgreSQL: Unhealthy"
    fi
    
    # MinIO
    if curl -s http://localhost:9000/minio/health/live &>/dev/null; then
        log_success "MinIO: Healthy"
    else
        log_error "MinIO: Unhealthy"
    fi
    
    # App
    if curl -s http://localhost:3000/api/health &>/dev/null; then
        log_success "App: Healthy"
    else
        log_error "App: Unhealthy (may still be initializing)"
    fi
}

shell() {
    log_info "Opening shell in app container..."
    cd "$PROJECT_ROOT"
    docker exec -it acrobaticz-app-dev /bin/bash
}

psql() {
    log_info "Connecting to PostgreSQL..."
    docker exec -it acrobaticz-postgres-dev psql -U acrobaticz_user -d acrobaticz_dev
}

# ============================================================
# Execute Command
# ============================================================

case "$COMMAND" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    reset)
        reset
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    shell)
        shell
        ;;
    psql)
        psql
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        echo ""
        echo "Usage: $0 {start|stop|reset|logs|status|shell|psql}"
        echo ""
        echo "Commands:"
        echo "  start   - Start all services"
        echo "  stop    - Stop all services"
        echo "  reset   - Reset everything (destructive)"
        echo "  logs    - View live logs"
        echo "  status  - Check service status"
        echo "  shell   - Open shell in app container"
        echo "  psql    - Connect to PostgreSQL database"
        exit 1
        ;;
esac
