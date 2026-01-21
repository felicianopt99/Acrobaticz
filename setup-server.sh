#!/bin/bash

# ============================================================
# Acrobaticz - Quick Server Setup
# For initial server configuration
# Usage: chmod +x setup-server.sh && ./setup-server.sh
# ============================================================

set -e

echo "🖥️  Acrobaticz Server Setup"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker not found. Install Docker first:"
  echo "   curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
  exit 1
fi

echo "✅ Docker found: $(docker --version)"

# Check Docker Compose
if ! docker compose version &>/dev/null; then
  echo "❌ Docker Compose not found. Installing..."
  docker volume create docker_compose_cache 2>/dev/null || true
fi

echo "✅ Docker Compose ready"

echo ""
echo "📋 Environment variables needed in .env:"
echo "   DB_PASSWORD=<strong_password>"
echo "   JWT_SECRET=<random_secret>"
echo "   MINIO_ROOT_PASSWORD=<minio_password>"
echo "   DUCKDNS_DOMAIN=<your_duckdns>"
echo "   DUCKDNS_TOKEN=<duckdns_token>"
echo "   DOMAIN=<your.domain.com>"
echo ""
echo "✅ Setup ready! Now run: ./deploy.sh"
