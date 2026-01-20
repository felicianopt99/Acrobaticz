#!/bin/bash
# ============================================================
# Acrobaticz Deployment Script - Ultra-Portable
# Works on: Linux (x86/ARM), macOS, Windows (WSL2)
# ============================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_COMPOSE_VERSION="2.24.0"

# ============================================================
# Functions
# ============================================================

print_header() {
  echo -e "${BLUE}============================================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}============================================================${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Detect OS and Architecture
detect_system() {
  OS=$(uname -s)
  ARCH=$(uname -m)
  
  case "$OS" in
    Linux*)
      OS_TYPE="Linux"
      if grep -q "WSL" /proc/version 2>/dev/null; then
        OS_TYPE="WSL2"
      fi
      ;;
    Darwin*)
      OS_TYPE="macOS"
      ;;
    MINGW*|MSYS*)
      OS_TYPE="Windows"
      ;;
    *)
      OS_TYPE="Unknown"
      ;;
  esac
  
  case "$ARCH" in
    x86_64)
      ARCH_TYPE="x86_64 (amd64)"
      ;;
    aarch64)
      ARCH_TYPE="ARM64 (aarch64)"
      ;;
    armv7l)
      ARCH_TYPE="ARM32 (armv7l)"
      ;;
    *)
      ARCH_TYPE="$ARCH"
      ;;
  esac
}

# Check Docker installation
check_docker() {
  print_header "Checking Docker Installation"
  
  if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    print_info "Install Docker from: https://docs.docker.com/get-docker/"
    return 1
  fi
  
  DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
  print_success "Docker installed: $DOCKER_VERSION"
  
  if ! command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose not found. Installing..."
    curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
      -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed"
  fi
  
  COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
  print_success "Docker Compose installed: $COMPOSE_VERSION"
}

# Check Docker daemon
check_docker_daemon() {
  print_info "Checking Docker daemon..."
  
  if ! docker ps &> /dev/null; then
    print_error "Docker daemon is not running"
    print_info "Start Docker and try again"
    return 1
  fi
  
  print_success "Docker daemon is running"
}

# Create data directories
create_directories() {
  print_header "Creating Data Directories"
  
  mkdir -p data/{postgres,minio,app_storage,app_cache,app_tmp}
  mkdir -p logs
  mkdir -p certs
  mkdir -p scripts/database
  
  print_success "Data directories created"
}

# Setup environment file
setup_env() {
  print_header "Setting Up Environment Configuration"
  
  if [ -f ".env" ]; then
    print_warning ".env file already exists"
    read -p "Overwrite with production settings? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      print_info "Keeping existing .env file"
      return 0
    fi
  fi
  
  if [ -f ".env.prod" ]; then
    cp .env.prod .env
    print_success ".env created from .env.prod"
    
    print_warning "IMPORTANT: Update .env with your configuration:"
    print_warning "  - DB_PASSWORD: Set a strong password"
    print_warning "  - JWT_SECRET & ENCRYPTION_KEY: Generate with: openssl rand -base64 32"
    print_warning "  - MINIO_ROOT_PASSWORD: Set a strong password"
    print_warning "  - Domain and API keys: Update as needed"
  else
    print_error ".env.prod not found"
    return 1
  fi
}

# Build Docker image
build_image() {
  print_header "Building Docker Image"
  
  print_info "Platform: $OS_TYPE / $ARCH_TYPE"
  
  docker build \
    --tag acrobaticz:latest \
    --tag acrobaticz:$(date +%Y%m%d) \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    .
  
  print_success "Docker image built successfully"
}

# Start services
start_services() {
  print_header "Starting Docker Compose Services"
  
  docker-compose up -d
  
  print_success "Services starting... waiting for health checks"
  sleep 5
  
  docker-compose ps
  
  print_success "All services started"
}

# Run health checks
health_checks() {
  print_header "Performing Health Checks"
  
  print_info "Waiting for PostgreSQL..."
  docker-compose exec -T postgres pg_isready -U acrobaticz_user -d acrobaticz || print_warning "PostgreSQL not ready yet"
  
  print_info "Waiting for MinIO..."
  docker-compose exec -T minio curl -f http://localhost:9000/minio/health/live || print_warning "MinIO not ready yet"
  
  print_info "Waiting for Application..."
  sleep 10
  
  if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "Application is healthy"
  else
    print_warning "Application not ready yet (may take longer on slow systems)"
    print_info "Check logs: docker-compose logs -f app"
  fi
}

# Show deployment summary
show_summary() {
  print_header "Deployment Summary"
  
  echo -e "${GREEN}System Information:${NC}"
  echo "  OS: $OS_TYPE"
  echo "  Architecture: $ARCH_TYPE"
  echo ""
  
  echo -e "${GREEN}Services:${NC}"
  docker-compose ps
  echo ""
  
  echo -e "${GREEN}Access Points:${NC}"
  echo "  🌐 Application: http://localhost:3000"
  echo "  🪣 MinIO Console: http://localhost:9001"
  echo "  🐘 PostgreSQL: localhost:5432"
  echo ""
  
  echo -e "${GREEN}Useful Commands:${NC}"
  echo "  View logs: docker-compose logs -f app"
  echo "  Check status: docker-compose ps"
  echo "  Stop services: docker-compose down"
  echo "  Stop & remove data: docker-compose down -v"
  echo "  Database shell: docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz"
  echo ""
  
  echo -e "${YELLOW}Next Steps:${NC}"
  echo "  1. Update .env with your configuration"
  echo "  2. Verify services are healthy: docker-compose ps"
  echo "  3. Check application logs: docker-compose logs -f app"
  echo "  4. Access application at: http://localhost:3000"
}

# ============================================================
# Main Deployment Flow
# ============================================================

main() {
  print_header "Acrobaticz Ultra-Portable Deployment"
  
  # Detect system
  detect_system
  print_info "Detected: $OS_TYPE / $ARCH_TYPE"
  
  # Check prerequisites
  check_docker || exit 1
  check_docker_daemon || exit 1
  
  # Prepare environment
  create_directories
  setup_env
  
  # Build and deploy
  read -p "Build Docker image? (recommended first run) (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    build_image
  fi
  
  # Start services
  read -p "Start Docker Compose services? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    start_services
    health_checks
  fi
  
  # Show summary
  show_summary
  
  print_success "Deployment completed!"
  print_warning "Remember to update .env with your production values"
}

# Run main function
main "$@"
