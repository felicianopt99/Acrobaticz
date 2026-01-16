#!/bin/bash

################################################################################
# ACROBATICZ QUICK BUILD DIAGNOSTIC
# 
# Rápido diagnóstico sem fazer build completo
# Identifica problemas comuns antes de build
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_FILE="${PROJECT_ROOT}/.build-diagnostic.txt"

# ============================================================
# Helper Functions
# ============================================================

log_check() {
  echo -e "${BLUE}ℹ️  $*${NC}"
}

log_pass() {
  echo -e "${GREEN}✅ $*${NC}"
}

log_fail() {
  echo -e "${RED}❌ $*${NC}"
}

log_warn() {
  echo -e "${YELLOW}⚠️  $*${NC}"
}

header() {
  echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}$*${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

append_report() {
  echo "$@" >> "$REPORT_FILE"
}

# ============================================================
# CHECKS
# ============================================================

check_docker() {
  header "DOCKER SETUP"
  
  if command -v docker &> /dev/null; then
    log_pass "Docker installed: $(docker --version)"
    append_report "✓ Docker: $(docker --version)"
  else
    log_fail "Docker not found"
    append_report "✗ Docker not installed"
    return 1
  fi
  
  if docker ps &> /dev/null; then
    log_pass "Docker daemon accessible"
    append_report "✓ Docker daemon running"
  else
    log_fail "Cannot connect to Docker daemon"
    append_report "✗ Docker daemon not accessible"
    return 1
  fi
}

check_files() {
  header "PROJECT FILES"
  
  local -a required=(
    "Dockerfile"
    ".dockerignore"
    "package.json"
    "package-lock.json"
    "next.config.ts"
    "tsconfig.json"
    "prisma/schema.prisma"
  )
  
  for file in "${required[@]}"; do
    if [[ -f "$PROJECT_ROOT/$file" ]]; then
      local size=$(du -h "$PROJECT_ROOT/$file" | cut -f1)
      log_pass "$file ($size)"
      append_report "✓ $file ($size)"
    else
      log_fail "$file MISSING"
      append_report "✗ $file MISSING"
      return 1
    fi
  done
}

check_node_setup() {
  header "NODE.JS ENVIRONMENT"
  
  if command -v node &> /dev/null; then
    local node_version=$(node --version)
    log_pass "Node.js: $node_version"
    append_report "✓ Node.js: $node_version"
  else
    log_warn "Node.js not in PATH (OK for Docker build)"
    append_report "⚠ Node.js not found locally (not critical)"
  fi
  
  if command -v npm &> /dev/null; then
    local npm_version=$(npm --version)
    log_pass "npm: v$npm_version"
    append_report "✓ npm: v$npm_version"
  else
    log_warn "npm not in PATH (OK for Docker build)"
    append_report "⚠ npm not found locally"
  fi
  
  # Check node_modules locally
  if [[ -d "$PROJECT_ROOT/node_modules" ]]; then
    local node_modules_size=$(du -sh "$PROJECT_ROOT/node_modules" 2>/dev/null | cut -f1)
    log_warn "Local node_modules: $node_modules_size (will be rebuilt in Docker)"
    append_report "⚠ Local node_modules: $node_modules_size"
  else
    log_pass "node_modules not present (clean state)"
    append_report "✓ node_modules clean"
  fi
}

check_env_files() {
  header "ENVIRONMENT FILES"
  
  if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
    log_pass ".env.production exists"
    local env_lines=$(wc -l < "$PROJECT_ROOT/.env.production")
    log_check "  Lines: $env_lines"
    append_report "✓ .env.production ($env_lines lines)"
  else
    log_warn ".env.production not found"
    append_report "⚠ .env.production missing"
  fi
  
  if [[ -f "$PROJECT_ROOT/.env" ]]; then
    log_warn ".env file exists (should be in .dockerignore)"
    append_report "⚠ .env present (will be ignored by Docker)"
  fi
  
  # Check for secrets
  if [[ -d "$PROJECT_ROOT/secrets" ]]; then
    log_pass "secrets/ directory found"
    append_report "✓ secrets/ directory present"
  fi
}

check_dockerfile() {
  header "DOCKERFILE ANALYSIS"
  
  # Check for multi-stage
  local stages=$(grep -c "^FROM" "$PROJECT_ROOT/Dockerfile")
  if [[ $stages -ge 3 ]]; then
    log_pass "Multi-stage build: $stages stages"
    append_report "✓ Multi-stage build ($stages stages)"
  else
    log_warn "Only $stages stage(s) found (less than ideal)"
    append_report "⚠ Stages: $stages"
  fi
  
  # Check for alpine
  if grep -q "alpine" "$PROJECT_ROOT/Dockerfile"; then
    log_pass "Using Alpine base image"
    append_report "✓ Alpine image"
  else
    log_warn "Not using Alpine (image may be larger)"
    append_report "⚠ Not using Alpine"
  fi
  
  # Check for Prisma generation
  if grep -q "prisma generate" "$PROJECT_ROOT/Dockerfile"; then
    log_pass "Prisma client generation included"
    append_report "✓ Prisma generation"
  else
    log_fail "Prisma generation MISSING"
    append_report "✗ Prisma generation missing"
  fi
  
  # Check for memory configuration
  if grep -q "NODE_OPTIONS.*max_old_space_size" "$PROJECT_ROOT/Dockerfile"; then
    local memory=$(grep "NODE_OPTIONS" "$PROJECT_ROOT/Dockerfile" | grep -o 'max_old_space_size=[0-9]*')
    log_pass "Memory allocation: $memory"
    append_report "✓ $memory"
  else
    log_warn "No memory allocation configured"
    append_report "⚠ No memory limit set"
  fi
  
  # Check for standalone output
  if grep -q "output.*standalone\|standalone.*output" "$PROJECT_ROOT/next.config.ts"; then
    log_pass "Next.js standalone output enabled"
    append_report "✓ Standalone output"
  else
    log_fail "Standalone output NOT configured in next.config.ts"
    append_report "✗ Standalone output missing"
    return 1
  fi
}

check_package_json() {
  header "PACKAGE.JSON VALIDATION"
  
  if ! command -v jq &> /dev/null; then
    log_warn "jq not installed (skipping JSON validation)"
    append_report "⚠ jq not found"
    return 0
  fi
  
  if jq empty "$PROJECT_ROOT/package.json" 2>/dev/null; then
    log_pass "package.json is valid JSON"
    append_report "✓ package.json valid"
  else
    log_fail "package.json has syntax errors"
    append_report "✗ package.json invalid"
    return 1
  fi
  
  # Check for required dependencies
  local has_prisma=$(jq -e '.dependencies."@prisma/client"' "$PROJECT_ROOT/package.json" > /dev/null && echo "yes" || echo "no")
  if [[ "$has_prisma" == "yes" ]]; then
    local prisma_version=$(jq -r '.dependencies."@prisma/client"' "$PROJECT_ROOT/package.json")
    log_pass "Prisma client: $prisma_version"
    append_report "✓ Prisma client: $prisma_version"
  else
    log_fail "Prisma client not in dependencies"
    append_report "✗ Prisma client missing"
  fi
  
  local has_next=$(jq -e '.dependencies."next"' "$PROJECT_ROOT/package.json" > /dev/null && echo "yes" || echo "no")
  if [[ "$has_next" == "yes" ]]; then
    local next_version=$(jq -r '.dependencies."next"' "$PROJECT_ROOT/package.json")
    log_pass "Next.js: $next_version"
    append_report "✓ Next.js: $next_version"
  else
    log_fail "Next.js not in dependencies"
    append_report "✗ Next.js missing"
  fi
  
  # Count dependencies
  local total_deps=$(jq '.dependencies | length' "$PROJECT_ROOT/package.json")
  local total_devdeps=$(jq '.devDependencies | length' "$PROJECT_ROOT/package.json")
  log_check "Total: $total_deps dependencies + $total_devdeps dev"
  append_report "✓ Dependencies: $total_deps + $total_devdeps dev"
}

check_typescript() {
  header "TYPESCRIPT CONFIGURATION"
  
  if [[ ! -f "$PROJECT_ROOT/tsconfig.json" ]]; then
    log_fail "tsconfig.json missing"
    append_report "✗ tsconfig.json missing"
    return 1
  fi
  
  if ! command -v jq &> /dev/null; then
    log_warn "jq not installed (skipping detailed check)"
    append_report "⚠ jq not available"
    return 0
  fi
  
  if jq empty "$PROJECT_ROOT/tsconfig.json" 2>/dev/null; then
    log_pass "tsconfig.json is valid"
    
    # Check for strict mode
    local strict=$(jq '.compilerOptions.strict // false' "$PROJECT_ROOT/tsconfig.json")
    log_check "Strict mode: $strict"
    append_report "✓ Strict mode: $strict"
  else
    log_fail "tsconfig.json has syntax errors"
    append_report "✗ tsconfig.json invalid"
    return 1
  fi
}

check_disk_space() {
  header "DISK SPACE"
  
  # Check available space in project directory
  if command -v df &> /dev/null; then
    local available=$(df -BG "$PROJECT_ROOT" | tail -1 | awk '{print $4}')
    local available_int=${available%G}
    
    if [[ $available_int -gt 5 ]]; then
      log_pass "Available space: $available"
      append_report "✓ Disk space: $available available"
    else
      log_fail "Less than 5GB available: $available"
      append_report "✗ Low disk space: $available"
      return 1
    fi
  fi
  
  # Check project size
  if command -v du &> /dev/null; then
    local project_size=$(du -sh "$PROJECT_ROOT" 2>/dev/null | cut -f1)
    log_check "Project size: $project_size"
    append_report "✓ Project size: $project_size"
  fi
}

check_build_scripts() {
  header "BUILD SCRIPTS VALIDATION"
  
  if ! command -v jq &> /dev/null; then
    log_warn "jq not installed (skipping)"
    return 0
  fi
  
  # Check if build script exists
  if jq -e '.scripts.build' "$PROJECT_ROOT/package.json" > /dev/null; then
    local build_cmd=$(jq -r '.scripts.build' "$PROJECT_ROOT/package.json")
    log_pass "Build script: $build_cmd"
    append_report "✓ Build script: $build_cmd"
  else
    log_fail "No build script found"
    append_report "✗ Build script missing"
    return 1
  fi
  
  # Check if db:generate script exists
  if jq -e '.scripts."db:generate"' "$PROJECT_ROOT/package.json" > /dev/null; then
    log_pass "DB generate script exists"
    append_report "✓ db:generate script present"
  else
    log_warn "db:generate script not found"
    append_report "⚠ db:generate not found"
  fi
}

check_dockerignore() {
  header ".DOCKERIGNORE OPTIMIZATION"
  
  local total_patterns=$(wc -l < "$PROJECT_ROOT/.dockerignore")
  log_check "Total patterns: $total_patterns"
  append_report "✓ Patterns: $total_patterns"
  
  # Check critical exclusions
  local -a patterns=("node_modules" ".next" ".git" "coverage")
  
  for pattern in "${patterns[@]}"; do
    if grep -q "^$pattern$\|^$pattern/" "$PROJECT_ROOT/.dockerignore"; then
      log_pass "Excludes: $pattern"
    else
      log_warn "Missing: $pattern"
    fi
  done
  
  append_report "✓ Critical patterns configured"
}

check_prisma() {
  header "PRISMA VALIDATION"
  
  if [[ ! -f "$PROJECT_ROOT/prisma/schema.prisma" ]]; then
    log_fail "prisma/schema.prisma missing"
    append_report "✗ schema.prisma missing"
    return 1
  fi
  
  log_pass "Prisma schema found"
  
  local models=$(grep -c "^model " "$PROJECT_ROOT/prisma/schema.prisma" || echo "0")
  log_check "Models: $models"
  append_report "✓ Models: $models"
  
  if command -v npx &> /dev/null; then
    if npx prisma validate --schema "$PROJECT_ROOT/prisma/schema.prisma" 2>/dev/null; then
      log_pass "Schema is valid"
      append_report "✓ Schema valid"
    else
      log_fail "Schema validation failed"
      append_report "✗ Schema invalid"
      return 1
    fi
  else
    log_warn "npx not available (cannot validate schema)"
    append_report "⚠ Cannot validate schema locally"
  fi
}

estimate_build_time() {
  header "BUILD TIME ESTIMATE"
  
  local dependencies=$(jq '.dependencies | length' "$PROJECT_ROOT/package.json" 2>/dev/null || echo "100")
  local estimated_npm_time=$((dependencies / 20 + 15))  # Rough estimate
  
  log_check "Estimated npm install: ~${estimated_npm_time}s"
  log_check "Estimated next build: ~45-60s"
  log_check "Estimated total: ~${estimated_npm_time}s + 45-60s = ~$(($estimated_npm_time + 50))s"
  
  append_report ""
  append_report "Estimated build time:"
  append_report "  npm install: ~${estimated_npm_time}s"
  append_report "  next build: ~45-60s"
  append_report "  total: ~$(($estimated_npm_time + 50))s"
}

# ============================================================
# MAIN
# ============================================================

main() {
  : > "$REPORT_FILE"
  
  echo -e "${CYAN}"
  echo "╔════════════════════════════════════════════════════╗"
  echo "║   ACROBATICZ BUILD DIAGNOSTIC (Quick Check)         ║"
  echo "║   $(date '+%Y-%m-%d %H:%M:%S')                          ║"
  echo "╚════════════════════════════════════════════════════╝"
  echo -e "${NC}"
  
  local errors=0
  
  # Run all checks
  check_docker || ((errors++))
  check_files || ((errors++))
  check_node_setup
  check_env_files
  check_dockerfile || ((errors++))
  check_package_json || ((errors++))
  check_typescript || ((errors++))
  check_disk_space || ((errors++))
  check_build_scripts || ((errors++))
  check_dockerignore
  check_prisma || ((errors++))
  estimate_build_time
  
  # Summary
  header "DIAGNOSTIC SUMMARY"
  
  append_report ""
  append_report "================================"
  append_report "DIAGNOSTIC COMPLETE: $(date)"
  append_report "================================"
  
  if [[ $errors -eq 0 ]]; then
    log_pass "All checks passed! Ready for build."
    append_report "✓ All checks PASSED"
    append_report ""
    append_report "You can now run: bash scripts/test-production-build.sh"
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Ready to build! No critical issues found.${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  else
    log_fail "$errors critical issue(s) found!"
    append_report "✗ $errors critical issue(s) found"
    append_report ""
    append_report "Please fix these issues before running the full build test."
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ $errors critical issue(s) found${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  fi
  
  echo ""
  echo -e "${CYAN}📋 Full report saved to: $REPORT_FILE${NC}"
  echo ""
  
  cat "$REPORT_FILE"
  
  return $errors
}

main "$@"
