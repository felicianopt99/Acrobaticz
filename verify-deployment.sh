#!/bin/bash
# ============================================================
# Deployment Verification Script
# Checks if Acrobaticz is properly deployed and ready
# ============================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check_count=0
passed=0
failed=0

test_service() {
    local service=$1
    local check=$2
    local expected=$3
    
    check_count=$((check_count + 1))
    echo -n "[$check_count] $service... "
    
    if eval "$expected" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        passed=$((passed + 1))
    else
        echo -e "${RED}❌${NC}"
        failed=$((failed + 1))
    fi
}

echo -e "${BLUE}╔════════════════════════════════════════════════════╗"
echo "║     Acrobaticz Deployment Verification             ║"
echo "╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Docker checks
echo -e "${BLUE}🐳 Docker Configuration:${NC}"
test_service "Docker" "Docker Installed" "command -v docker"
test_service "Docker Compose" "Docker Compose" "command -v docker-compose"

# Services running
echo ""
echo -e "${BLUE}🚀 Service Status:${NC}"
test_service "Docker Daemon" "Daemon Running" "docker ps 2>/dev/null"

# Container checks
echo ""
echo -e "${BLUE}📦 Containers:${NC}"
test_service "PostgreSQL" "Container Running" "docker-compose ps | grep postgres | grep -q Up"
test_service "MinIO" "Container Running" "docker-compose ps | grep minio | grep -q Up"
test_service "Application" "Container Running" "docker-compose ps | grep app | grep -q Up"

# Health checks
echo ""
echo -e "${BLUE}❤️  Service Health:${NC}"
test_service "PostgreSQL" "Database Ready" "docker-compose exec -T postgres pg_isready -U acrobaticz_user -d acrobaticz"
test_service "MinIO" "S3 Storage Ready" "docker-compose exec -T minio curl -sf http://localhost:9000/minio/health/live"
test_service "Application" "App Ready" "curl -sf http://localhost:3000/api/health"

# Database checks
echo ""
echo -e "${BLUE}🗄️  Database State:${NC}"

# Check if database has data
if docker-compose exec -T postgres psql -U acrobaticz_user -d acrobaticz -c "SELECT COUNT(*) FROM users" 2>/dev/null | grep -q "([0-9]"; then
    check_count=$((check_count + 1))
    echo -n "[$check_count] Database Seeded... "
    USER_COUNT=$(docker-compose exec -T postgres psql -U acrobaticz_user -d acrobaticz -tAc "SELECT COUNT(*) FROM users" 2>/dev/null || echo "0")
    if [ "$USER_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅${NC} ($USER_COUNT users)"
        passed=$((passed + 1))
    else
        echo -e "${YELLOW}⚠️  (No data)${NC}"
    fi
else
    check_count=$((check_count + 1))
    echo -n "[$check_count] Database Seeded... "
    echo -e "${YELLOW}⚠️  (Not checked)${NC}"
fi

# Storage checks
echo ""
echo -e "${BLUE}💾 Storage:${NC}"
test_service "Disk Space" "Available Storage" "[ $(df data/postgres | awk 'NR==2 {print $4}') -gt 1048576 ]"
test_service "Volume Mounts" "Data Directories" "[ -d data/postgres ] && [ -d data/minio ]"

# Ports
echo ""
echo -e "${BLUE}🔌 Port Accessibility:${NC}"
test_service "Port 3000" "Application Port" "curl -sf http://localhost:3000 > /dev/null"
test_service "Port 5432" "Database Port" "nc -zv localhost 5432 2>&1 | grep -q succeeded || echo failed | grep -q -v failed"
test_service "Port 9000" "MinIO API Port" "curl -sf http://localhost:9000/minio/health/live > /dev/null"

# Environment
echo ""
echo -e "${BLUE}⚙️  Environment Configuration:${NC}"
test_service "ENV File" "Config File" "[ -f .env ]"

if [ -f .env ]; then
    test_service "Database URL" "Database Config" "grep -q DATABASE_URL .env || grep -q DB_PASSWORD .env"
    test_service "JWT Secret" "Security Config" "grep -q JWT_SECRET .env"
    test_service "Domain Config" "Domain Setup" "grep -q DOMAIN .env"
fi

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════╗"
echo -e "║                   Test Summary                       ║"
echo "╚════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "Total Checks:  $check_count"
echo -e "Passed:        ${GREEN}$passed${NC}"
echo -e "Failed:        ${RED}$failed${NC}"

if [ $failed -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════╗"
    echo "║     ✅ All checks passed! Deployment ready!         ║"
    echo "╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Access your application:"
    echo -e "  🌐 ${GREEN}http://localhost:3000${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════╗"
    echo "║  ❌ Some checks failed. See details above.          ║"
    echo "╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Troubleshooting tips:"
    echo "  1. Check logs:    docker-compose logs -f app"
    echo "  2. View status:   docker-compose ps"
    echo "  3. Restart:       docker-compose restart"
    echo "  4. Read guide:    cat QUICK_START.md"
    exit 1
fi
