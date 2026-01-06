#!/bin/bash
set -e

# AV-Rentals Production Deployment Script
# Usage: ./deploy.sh [--clean] [--logs]

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 AV-Rentals Deployment${NC}"
echo "================================"

# Parse arguments
CLEAN_BUILD=false
SHOW_LOGS=false
for arg in "$@"; do
  case $arg in
    --clean) CLEAN_BUILD=true ;;
    --logs) SHOW_LOGS=true ;;
  esac
done

cd /home/feliciano/AV-RENTALS

# Step 1: Pre-flight checks
echo -e "\n${YELLOW}📋 Pre-flight checks...${NC}"

# Check Docker
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not running${NC}"
  exit 1
fi
echo "✅ Docker running"

# Check secrets
for secret in db_user db_password db_name jwt_secret; do
  if [ ! -f "secrets/$secret" ]; then
    echo -e "${RED}❌ Missing secret: secrets/$secret${NC}"
    exit 1
  fi
done
echo "✅ Secrets configured"

# Check env file
if [ ! -f "env" ]; then
  echo -e "${RED}❌ Missing env file${NC}"
  exit 1
fi
echo "✅ Environment file present"

# Step 2: Clean up if requested
if [ "$CLEAN_BUILD" = true ]; then
  echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
  docker-compose down --remove-orphans 2>/dev/null || true
  docker system prune -f
  echo "✅ Cleanup complete"
fi

# Step 3: Build images
echo -e "\n${YELLOW}🔨 Building images...${NC}"
export DOCKER_BUILDKIT=0

# Build with standard output
docker-compose build

echo "✅ Build complete"

# Step 4: Start services
echo -e "\n${YELLOW}🎬 Starting services...${NC}"
docker-compose up -d

# Step 5: Wait for healthy status
echo -e "\n${YELLOW}⏳ Waiting for services to be healthy...${NC}"
TIMEOUT=120
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  # Check postgres
  PG_STATUS=$(docker inspect --format='{{.State.Health.Status}}' av-postgres 2>/dev/null || echo "starting")
  
  # Check app
  APP_STATUS=$(docker inspect --format='{{.State.Health.Status}}' av-rentals 2>/dev/null || echo "starting")
  
  echo -ne "\r  postgres: $PG_STATUS | app: $APP_STATUS | ${ELAPSED}s elapsed    "
  
  if [ "$PG_STATUS" = "healthy" ] && [ "$APP_STATUS" = "healthy" ]; then
    echo -e "\n${GREEN}✅ All services healthy!${NC}"
    break
  fi
  
  sleep 5
  ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
  echo -e "\n${YELLOW}⚠️ Timeout waiting for services (may still be starting)${NC}"
fi

# Step 6: Show status
echo -e "\n${GREEN}📊 Service Status:${NC}"
docker-compose ps

# Step 7: Test endpoints
echo -e "\n${YELLOW}🧪 Testing endpoints...${NC}"
sleep 3

if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "✅ Health endpoint OK"
else
  echo "⚠️ Health endpoint not responding yet"
fi

if curl -sf http://localhost:3000 > /dev/null 2>&1; then
  echo "✅ Main app accessible"
else
  echo "⚠️ Main app not responding yet"
fi

# Show logs if requested
if [ "$SHOW_LOGS" = true ]; then
  echo -e "\n${YELLOW}📜 Recent logs:${NC}"
  docker-compose logs --tail=30 app
fi

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "  Local:  http://localhost:3000"
echo "  Domain: https://acrobaticzrental.duckdns.org"
echo ""
echo "Commands:"
echo "  View logs:    docker-compose logs -f app"
echo "  Stop:         docker-compose down"
echo "  Restart:      docker-compose restart app"
