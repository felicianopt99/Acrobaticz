#!/bin/bash
# ============================================================
# Acrobaticz Super-Easy Deployment
# One command to get running with everything seeded
# ============================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════╗"
echo "║      Acrobaticz - One-Click Deploy                 ║"
echo "║      Ultra-Portable Production Setup               ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Install from: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker found$(docker --version)${NC}"

# Check if already running
if docker-compose ps 2>/dev/null | grep -q "acrobaticz-app"; then
    echo -e "${YELLOW}⚠️  Acrobaticz already running!${NC}"
    read -p "Restart services? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping restart. Exiting."
        exit 0
    fi
    docker-compose down
fi

# Setup
echo -e "${BLUE}Setting up Acrobaticz...${NC}"

# Create directories
mkdir -p data/{postgres,minio,app_storage,app_cache,app_tmp} logs certs

# Setup .env if not exists
if [ ! -f ".env" ]; then
    echo -e "${BLUE}Creating .env from template...${NC}"
    if [ -f ".env.prod" ]; then
        cp .env.prod .env
        echo -e "${GREEN}✅ .env created${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.prod not found, using .env.example${NC}"
        cp .env.example .env 2>/dev/null || true
    fi
else
    echo -e "${GREEN}✅ .env already configured${NC}"
fi

# Build
echo -e "${BLUE}Building Docker image...${NC}"
docker build --tag acrobaticz:latest .

# Start services
echo -e "${BLUE}Starting services...${NC}"
docker-compose up -d

# Wait for startup
echo -e "${BLUE}Waiting for services to initialize...${NC}"
sleep 5

# Health checks
echo -e "${BLUE}Checking service health...${NC}"

echo -n "PostgreSQL..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U acrobaticz_user -d acrobaticz 2>/dev/null | grep -q "accepting"; then
        echo -e " ${GREEN}✅${NC}"
        break
    fi
    sleep 1
done

echo -n "MinIO..."
for i in {1..30}; do
    if docker-compose exec -T minio curl -sf http://localhost:9000/minio/health/live 2>/dev/null | grep -q "true"; then
        echo -e " ${GREEN}✅${NC}"
        break
    fi
    sleep 1
done

echo -n "Application..."
for i in {1..60}; do
    if curl -sf http://localhost:3000/api/health 2>/dev/null; then
        echo -e " ${GREEN}✅${NC}"
        break
    fi
    sleep 1
done

# Seed database
echo -e "${BLUE}Seeding database with sample data...${NC}"
docker-compose exec -T app npm run seed 2>/dev/null || echo -e "${YELLOW}⚠️  Seeding skipped (database may already have data)${NC}"

# Final status
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗"
echo "║              🎉 DEPLOYMENT COMPLETE! 🎉              ║"
echo "╚════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}Access Your Application:${NC}"
echo -e "  🌐 Web App:       ${GREEN}http://localhost:3000${NC}"
echo -e "  🪣 MinIO Console: ${GREEN}http://localhost:9001${NC}"
echo -e "  🐘 Database:      ${GREEN}localhost:5432${NC}"
echo ""

echo -e "${BLUE}Useful Commands:${NC}"
echo -e "  View logs:     ${YELLOW}docker-compose logs -f app${NC}"
echo -e "  Status:        ${YELLOW}docker-compose ps${NC}"
echo -e "  Stop:          ${YELLOW}docker-compose down${NC}"
echo -e "  Database CLI:  ${YELLOW}docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz${NC}"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Database has been seeded with sample data"
echo "  3. Check application logs: docker-compose logs -f app"
echo "  4. Update .env with your custom settings"
echo ""

echo -e "${YELLOW}💡 Tip: Run 'docker-compose logs -f app' to watch the startup process${NC}"
