#!/bin/bash

# ============================================================
# Acrobaticz - Server Deploy Script
# 
# Run on server after git clone
# Usage: ./deploy.sh
# ============================================================

set -e

echo "🚀 Deploying Acrobaticz..."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "⚠️  Creating .env from .env.example..."
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✅ .env created. Update it with your configuration:"
    echo "   - DB_PASSWORD"
    echo "   - JWT_SECRET"
    echo "   - MINIO credentials"
    echo "   - DuckDNS token"
  else
    echo "❌ .env.example not found"
    exit 1
  fi
fi

echo ""
echo "📂 Creating data directories..."
mkdir -p data/{postgres,app_storage,app_cache,app_tmp,duckdns}
mkdir -p certs
mkdir -p nginx

echo ""
echo "🐳 Starting Docker services..."
docker compose down 2>/dev/null || true
docker compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 30

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Services running:"
echo "  - Next.js App: http://localhost:3000"
echo "  - MinIO Console: http://localhost:9001"
echo "  - PostgreSQL: localhost:5432"
echo "  - DuckDNS: Updating domain automatically"
echo ""
echo "🔍 Check logs:"
echo "  docker compose logs -f app"
