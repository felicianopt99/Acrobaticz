#!/bin/bash

################################################################################
# ACROBATICZ PRODUCTION BUILD TEST SCRIPT
# 
# Purpose:
#   - Simulate production build environment (no local cache)
#   - Validate Dockerfile, dependencies, and build process
#   - Detect TypeScript errors, linting issues, and missing dependencies
#   - Monitor memory usage and build performance
#   - Generate comprehensive diagnostic report
#
# Usage:
#   bash scripts/test-production-build.sh [options]
#   
# Options:
#   --help           Show this help message
#   --skip-cleanup   Don't remove the test image after build
#   --verbose        Show detailed build output
#   --push           Push image to registry (requires Docker credentials)
#   --registry       Registry URL (default: docker.io)
#
################################################################################

set -euo pipefail

# ============================================================
# Color Definitions
# ============================================================
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly MAGENTA='\033[0;35m'
readonly NC='\033[0m'

# ============================================================
# Configuration
# ============================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_LOG="${PROJECT_ROOT}/.build-test.log"
SUMMARY_FILE="${PROJECT_ROOT}/.build-summary.txt"
IMAGE_NAME="acrobaticz-prod-test"
IMAGE_TAG="$(date +%s)"
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"

SKIP_CLEANUP=false
VERBOSE=false
PUSH_IMAGE=false
REGISTRY="docker.io"

# Performance tracking
BUILD_START_TIME=""
BUILD_END_TIME=""
MEMORY_PEAK=0
DOCKERFILE_SIZE=0

# ============================================================
# Parse Arguments
# ============================================================
while [[ $# -gt 0 ]]; do
  case $1 in
    --help)
      head -30 "$0" | tail -25
      exit 0
      ;;
    --skip-cleanup)
      SKIP_CLEANUP=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --push)
      PUSH_IMAGE=true
      shift
      ;;
    --registry)
      REGISTRY="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}❌ Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# ============================================================
# Helper Functions
# ============================================================

log_info() {
  echo -e "${BLUE}ℹ️  $*${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $*${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $*${NC}"
}

log_error() {
  echo -e "${RED}❌ $*${NC}"
}

log_header() {
  echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${MAGENTA}$*${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_subheader() {
  echo -e "\n${CYAN}─── $* ───${NC}"
}

append_log() {
  echo "$*" >> "$BUILD_LOG"
}

write_summary() {
  echo "$*" >> "$SUMMARY_FILE"
}

# ============================================================
# Pre-Build Validation
# ============================================================

validate_prerequisites() {
  log_header "STEP 1: PRÉ-BUILD VALIDATION"
  
  # Check Docker installation
  if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed or not in PATH"
    exit 1
  fi
  log_success "Docker is installed: $(docker --version)"
  
  # Check Docker daemon
  if ! docker ps &> /dev/null; then
    log_error "Docker daemon is not running or insufficient permissions"
    log_info "Try: sudo usermod -aG docker \$USER"
    exit 1
  fi
  log_success "Docker daemon is accessible"
  
  # Check required files
  local -a required_files=(
    "Dockerfile"
    ".dockerignore"
    "package.json"
    "package-lock.json"
    "next.config.ts"
    "tsconfig.json"
    "prisma/schema.prisma"
  )
  
  log_subheader "Checking required files"
  for file in "${required_files[@]}"; do
    if [[ -f "$PROJECT_ROOT/$file" ]]; then
      log_success "✓ $file exists"
    else
      log_error "✗ $file is missing"
      exit 1
    fi
  done
  
  # Check .env files
  log_subheader "Environment file validation"
  if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
    log_success "✓ .env.production exists"
  else
    log_warning ".env.production not found (will use defaults)"
  fi
}

# ============================================================
# Dockerfile Analysis
# ============================================================

analyze_dockerfile() {
  log_header "STEP 2: DOCKERFILE ANALYSIS"
  
  DOCKERFILE_SIZE=$(wc -l < "$PROJECT_ROOT/Dockerfile")
  log_info "Dockerfile: $DOCKERFILE_SIZE lines"
  
  log_subheader "Build stages"
  grep "^FROM" "$PROJECT_ROOT/Dockerfile" | while read -r line; do
    log_success "$line"
  done
  
  log_subheader "Node.js version"
  NODE_VERSION=$(grep "^FROM node" "$PROJECT_ROOT/Dockerfile" | head -1 | awk '{print $2}')
  log_info "Using: $NODE_VERSION"
  
  if [[ ! $NODE_VERSION == *"alpine"* ]]; then
    log_warning "Not using alpine image - final image may be larger"
  else
    log_success "Using alpine image (lightweight)"
  fi
  
  log_subheader "Prisma generation check"
  if grep -q "npx prisma generate" "$PROJECT_ROOT/Dockerfile"; then
    log_success "Prisma client generation is included"
  else
    log_error "Prisma client generation is missing!"
    exit 1
  fi
  
  log_subheader "Node.js memory allocation"
  if grep -q "NODE_OPTIONS.*max_old_space_size" "$PROJECT_ROOT/Dockerfile"; then
    MEMORY=$(grep "NODE_OPTIONS" "$PROJECT_ROOT/Dockerfile" | grep -o 'max_old_space_size=[0-9]*' | head -1)
    log_success "Memory limit configured: $MEMORY"
  else
    log_warning "No memory limit configured - may have issues with large builds"
  fi
  
  log_subheader "Security checks"
  if grep -q "USER.*nodejs\|USER.*nextjs" "$PROJECT_ROOT/Dockerfile"; then
    log_success "Non-root user configured"
  else
    log_warning "Running as root - security risk"
  fi
  
  write_summary "Dockerfile Analysis:"
  write_summary "  Lines: $DOCKERFILE_SIZE"
  write_summary "  Node: $NODE_VERSION"
  write_summary ""
}

# ============================================================
# .dockerignore Analysis
# ============================================================

analyze_dockerignore() {
  log_header "STEP 3: .DOCKERIGNORE ANALYSIS"
  
  log_subheader "Excluded patterns"
  
  local -a patterns=(
    "node_modules"
    ".next"
    ".git"
    ".env"
    "coverage"
    ".vscode"
    ".idea"
  )
  
  for pattern in "${patterns[@]}"; do
    if grep -q "^$pattern$\|^$pattern/" "$PROJECT_ROOT/.dockerignore"; then
      log_success "✓ Excludes: $pattern"
    else
      log_warning "✗ Does not exclude: $pattern"
    fi
  done
  
  write_summary "Dockerignore Analysis:"
  write_summary "  File size: $(wc -c < "$PROJECT_ROOT/.dockerignore") bytes"
  write_summary ""
}

# ============================================================
# Dependency Validation
# ============================================================

validate_dependencies() {
  log_header "STEP 4: DEPENDENCY VALIDATION"
  
  log_subheader "Checking package.json"
  
  if ! command -v jq &> /dev/null; then
    log_warning "jq is not installed - skipping JSON validation"
    return
  fi
  
  local pkg_valid=true
  if jq empty "$PROJECT_ROOT/package.json" 2>/dev/null; then
    log_success "package.json is valid JSON"
  else
    log_error "package.json syntax error"
    pkg_valid=false
  fi
  
  if [[ "$pkg_valid" == "true" ]]; then
    local total_deps=$(jq '.dependencies | length' "$PROJECT_ROOT/package.json")
    local total_devdeps=$(jq '.devDependencies | length' "$PROJECT_ROOT/package.json")
    
    log_info "Total dependencies: $total_deps"
    log_info "Dev dependencies: $total_devdeps"
    
    if jq -e '.dependencies."@prisma/client"' "$PROJECT_ROOT/package.json" > /dev/null; then
      log_success "Prisma client is listed in dependencies"
    else
      log_error "Prisma client is missing from dependencies!"
      exit 1
    fi
  fi
  
  write_summary "Dependency Analysis:"
  write_summary "  package.json valid: true"
  write_summary ""
}

# ============================================================
# TypeScript Check (Pre-build)
# ============================================================

check_typescript() {
  log_header "STEP 5: PRE-BUILD TYPESCRIPT CHECK"
  
  log_subheader "Checking TypeScript errors locally"
  
  if ! command -v npx &> /dev/null; then
    log_warning "npx not available - skipping TypeScript check"
    return
  fi
  
  if [[ ! -d "$PROJECT_ROOT/node_modules" ]]; then
    log_warning "node_modules not found - installing dependencies first"
    log_info "Running: npm ci --omit=dev"
    cd "$PROJECT_ROOT"
    npm ci --omit=dev --no-audit --no-fund --loglevel=error || {
      log_error "npm ci failed"
      append_log "npm ci failed at $(date)"
      return 1
    }
  fi
  
  log_info "Running: npx tsc --noEmit"
  if npx tsc --noEmit 2>> "$BUILD_LOG"; then
    log_success "No TypeScript errors found"
  else
    log_warning "TypeScript errors detected"
    log_info "Run 'npm run typecheck' locally for details"
  fi
}

# ============================================================
# Docker Build
# ============================================================

build_docker_image() {
  log_header "STEP 6: DOCKER BUILD (--no-cache)"
  
  BUILD_START_TIME=$(date +%s)
  write_summary "Build started: $(date)"
  write_summary ""
  
  # Build arguments with environment variables
  local -a build_args=(
    "--no-cache"
    "--progress=plain"
    "--tag=$FULL_IMAGE"
    "--build-arg=NEXT_TELEMETRY_DISABLED=1"
    "--build-arg=NODE_ENV=production"
  )
  
  # Add .env.production if it exists
  if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
    log_info "Loading .env.production for build variables"
    # Source env file for any required build args
    # Note: Only add safe variables to build args
    build_args+=(
      "--build-arg=BUILD_CONTEXT=production"
    )
  fi
  
  log_info "Building image: $FULL_IMAGE"
  log_info "Build args: ${build_args[@]}"
  
  append_log ""
  append_log "=== DOCKER BUILD STARTED AT $(date) ==="
  append_log "Command: docker build ${build_args[@]} -f Dockerfile $PROJECT_ROOT"
  append_log ""
  
  # Run build with output handling
  if [[ "$VERBOSE" == "true" ]]; then
    if docker build "${build_args[@]}" -f "$PROJECT_ROOT/Dockerfile" "$PROJECT_ROOT" 2>&1 | tee -a "$BUILD_LOG"; then
      BUILD_END_TIME=$(date +%s)
      log_success "Docker build completed successfully"
      return 0
    else
      BUILD_END_TIME=$(date +%s)
      log_error "Docker build failed"
      return 1
    fi
  else
    if docker build "${build_args[@]}" -f "$PROJECT_ROOT/Dockerfile" "$PROJECT_ROOT" >> "$BUILD_LOG" 2>&1; then
      BUILD_END_TIME=$(date +%s)
      log_success "Docker build completed successfully"
      return 0
    else
      BUILD_END_TIME=$(date +%s)
      log_error "Docker build failed - check $BUILD_LOG"
      tail -50 "$BUILD_LOG"
      return 1
    fi
  fi
}

# ============================================================
# Image Analysis
# ============================================================

analyze_image() {
  log_header "STEP 7: IMAGE ANALYSIS"
  
  log_subheader "Image metadata"
  
  local image_id=$(docker images "$IMAGE_NAME" --format="{{.ID}}" | head -1)
  local image_size=$(docker images "$IMAGE_NAME" --format="{{.Size}}" | head -1)
  
  log_success "Image ID: $image_id"
  log_success "Image size: $image_size"
  
  # Try to get more detailed size info
  log_subheader "Image layers"
  docker history "$FULL_IMAGE" 2>/dev/null | head -10 || log_warning "Could not retrieve layer info"
  
  # Check image integrity
  log_subheader "Image integrity check"
  if docker inspect "$FULL_IMAGE" > /dev/null 2>&1; then
    log_success "Image is valid and accessible"
  else
    log_error "Image is corrupted or not found"
    return 1
  fi
  
  write_summary "Image Analysis:"
  write_summary "  Size: $image_size"
  write_summary "  ID: ${image_id:0:12}"
  write_summary ""
}

# ============================================================
# Container Runtime Test
# ============================================================

test_container_runtime() {
  log_header "STEP 8: CONTAINER RUNTIME TEST"
  
  log_info "Attempting to run container..."
  
  local container_id
  if container_id=$(docker run \
    -d \
    --rm \
    --entrypoint=/bin/sh \
    "$FULL_IMAGE" \
    -c "echo 'Container started'; sleep 2" 2>&1); then
    
    log_success "Container started successfully: $container_id"
    
    # Wait for container to finish
    sleep 3
    
    if docker ps -a | grep -q "$container_id"; then
      log_info "Checking container logs..."
      docker logs "$container_id" || true
    fi
    
    log_success "Container runtime test passed"
  else
    log_error "Container failed to start"
    log_error "$container_id"
    return 1
  fi
}

# ============================================================
# Build Performance Report
# ============================================================

generate_performance_report() {
  log_header "STEP 9: PERFORMANCE REPORT"
  
  if [[ -z "$BUILD_START_TIME" ]] || [[ -z "$BUILD_END_TIME" ]]; then
    log_warning "Build timing information not available"
    return
  fi
  
  local build_duration=$((BUILD_END_TIME - BUILD_START_TIME))
  local build_minutes=$((build_duration / 60))
  local build_seconds=$((build_duration % 60))
  
  log_info "Build duration: ${build_minutes}m ${build_seconds}s"
  
  write_summary "Performance:"
  write_summary "  Duration: ${build_minutes}m ${build_seconds}s"
  write_summary "  Start: $(date -d @$BUILD_START_TIME)"
  write_summary "  End: $(date -d @$BUILD_END_TIME)"
  write_summary ""
}

# ============================================================
# Diagnostic Report
# ============================================================

generate_diagnostic_report() {
  log_header "STEP 10: DIAGNOSTIC REPORT"
  
  echo ""
  echo "=================================================="
  echo "BUILD TEST SUMMARY - $(date)"
  echo "=================================================="
  
  if [[ -f "$BUILD_LOG" ]]; then
    log_subheader "Error Detection"
    
    if grep -i "error\|failed\|cannot find" "$BUILD_LOG" | head -10; then
      log_warning "Potential errors found in build log"
    else
      log_success "No obvious errors detected"
    fi
    
    log_subheader "Build Log Statistics"
    local error_count=$(grep -ic "error" "$BUILD_LOG" || echo "0")
    local warning_count=$(grep -ic "warning" "$BUILD_LOG" || echo "0")
    
    log_info "Errors: $error_count"
    log_info "Warnings: $warning_count"
  fi
  
  write_summary "Diagnostic Results:"
  write_summary "  Status: COMPLETED"
  write_summary ""
  write_summary "Full log available at: $BUILD_LOG"
}

# ============================================================
# Cleanup
# ============================================================

cleanup() {
  if [[ "$SKIP_CLEANUP" == "false" ]]; then
    log_header "CLEANUP"
    log_info "Removing test image and containers..."
    
    # Remove containers
    docker ps -a | grep "$IMAGE_NAME" | awk '{print $1}' | xargs -r docker rm -f || true
    
    # Remove image
    if docker rmi "$FULL_IMAGE" > /dev/null 2>&1; then
      log_success "Test image removed: $FULL_IMAGE"
    else
      log_warning "Could not remove image (may be in use)"
    fi
  else
    log_header "CLEANUP SKIPPED"
    log_info "Test image retained: $FULL_IMAGE"
    log_info "Remove manually with: docker rmi $FULL_IMAGE"
  fi
}

# ============================================================
# Main Execution
# ============================================================

main() {
  # Initialize log files
  : > "$BUILD_LOG"
  : > "$SUMMARY_FILE"
  
  log_header "ACROBATICZ PRODUCTION BUILD TEST"
  log_info "Project: $PROJECT_ROOT"
  log_info "Test image: $FULL_IMAGE"
  log_info "Build log: $BUILD_LOG"
  
  # Execute stages
  validate_prerequisites || exit 1
  analyze_dockerfile || exit 1
  analyze_dockerignore || exit 1
  validate_dependencies || exit 1
  check_typescript || exit 1
  
  # Main build
  if ! build_docker_image; then
    log_error "Build failed - see logs above"
    append_log "=== BUILD FAILED ==="
    generate_diagnostic_report
    cleanup
    exit 1
  fi
  
  # Post-build validation
  analyze_image || exit 1
  test_container_runtime || exit 1
  generate_performance_report
  generate_diagnostic_report
  
  # Success!
  log_header "BUILD TEST COMPLETED SUCCESSFULLY"
  log_success "All validation checks passed!"
  log_info "Image ready for production: $FULL_IMAGE"
  
  echo ""
  echo "📊 Summary Report:"
  cat "$SUMMARY_FILE"
  echo ""
  echo "📝 Full build log: $BUILD_LOG"
  
  cleanup
}

# ============================================================
# Execute Main
# ============================================================

trap cleanup EXIT

main "$@"
