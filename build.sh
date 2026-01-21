#!/bin/bash

# ============================================================
# Acrobaticz - Local Build Script
# 
# Run locally: ./build.sh
# Then: git commit && git push
# Server: git clone && docker compose up
# ============================================================

set -e

echo "🏗️  Building Acrobaticz locally..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
else
  echo "✅ Dependencies already installed"
fi

echo ""
echo "🔨 Building Next.js application..."
npm run build

echo ""
echo "✅ Build complete!"
echo ""
echo "📋 Next steps:"
echo "  1. git add ."
echo "  2. git commit -m 'chore: update build artifacts'"
echo "  3. git push origin main"
echo ""
echo "🚀 On server:"
echo "  1. git clone <repo>"
echo "  2. cd <project>"
echo "  3. cp .env.example .env"
echo "  4. docker compose up -d"
