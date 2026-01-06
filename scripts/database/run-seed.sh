#!/bin/bash
# Convenient script to run database seeding in Docker container
# Usage: bash scripts/run-seed.sh

set -e

echo "🌱 Running database seed in Docker..."

sudo docker exec av-rentals sh -c '
DB_USER=$(cat /run/secrets/db_user)
DB_PASSWORD=$(cat /run/secrets/db_password)
DB_NAME=$(cat /run/secrets/db_name)

# URL encode the password (handle special characters)
ENCODED_PASSWORD=$(printf "%s" "$DB_PASSWORD" | sed "s/ /%20/g; s/\//%2F/g; s/:/%3A/g; s/@/%40/g; s/?/%3F/g; s/#/%23/g; s/=/%3D/g; s/+/%2B/g; s/\&/%26/g")

export DATABASE_URL="postgresql://${DB_USER}:${ENCODED_PASSWORD}@postgres:5432/${DB_NAME}?schema=public"

npx prisma db seed
'

echo ""
echo "✅ Seed complete!"
echo ""
echo "Created users:"
echo "  - Admin: feliciano / superfeliz99"
echo "  - Manager: lourenco / lourenco123"
