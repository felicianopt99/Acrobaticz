#!/bin/sh
set -eu

# Function to URL encode special characters
urlencode() {
  local string="$1"
  echo "$string" | sed 's/ /%20/g; s/!/%21/g; s/"/%22/g; s/#/%23/g; s/\$/%24/g; s/&/%26/g; s/'\''/%27/g; s/(/%28/g; s/)/%29/g; s/\*/%2A/g; s/+/%2B/g; s/,/%2C/g; s/\//%2F/g; s/:/%3A/g; s/;/%3B/g; s/=/%3D/g; s/?/%3F/g; s/@/%40/g; s/\[/%5B/g; s/\]/%5D/g; s/{/%7B/g; s/}/%7D/g'
}

echo "🚀 Starting AV-Rentals..."

# Read secrets (fast - just file reads)
if [ -f /run/secrets/db_user ]; then DB_USER=$(cat /run/secrets/db_user); fi
if [ -f /run/secrets/db_password ]; then DB_PASSWORD=$(cat /run/secrets/db_password); fi
if [ -f /run/secrets/db_name ]; then DB_NAME=$(cat /run/secrets/db_name); fi
if [ -f /run/secrets/jwt_secret ]; then export JWT_SECRET="$(cat /run/secrets/jwt_secret)"; fi
if [ -f /run/secrets/deepl_api_key ]; then export DEEPL_API_KEY="$(cat /run/secrets/deepl_api_key)"; fi

# Construct DATABASE_URL if not provided
if [ -z "${DATABASE_URL:-}" ] && [ -n "${DB_USER:-}" ] && [ -n "${DB_PASSWORD:-}" ] && [ -n "${DB_NAME:-}" ]; then
  ENCODED_PASSWORD=$(urlencode "$DB_PASSWORD")
  export DATABASE_URL="postgresql://${DB_USER}:${ENCODED_PASSWORD}@postgres:5432/${DB_NAME}?schema=public"
fi

# Wait for database with exponential backoff (faster than fixed retry)
echo "⏳ Waiting for database..."
ATTEMPTS=0
WAIT=1
until pg_isready -h postgres -U "${DB_USER:-postgres}" -q 2>/dev/null; do
  ATTEMPTS=$((ATTEMPTS+1))
  if [ $ATTEMPTS -ge 15 ]; then
    echo "❌ Database not ready after $ATTEMPTS attempts"
    exit 1
  fi
  sleep $WAIT
  WAIT=$((WAIT < 5 ? WAIT + 1 : 5))
done
echo "✅ Database ready"

# Run Prisma migrations (single attempt since DB is ready)
echo "📦 Running database migrations..."
if ./node_modules/.bin/prisma migrate deploy 2>&1; then
  echo "✅ Migrations complete"
else
  echo "⚠️  Migration warning (may be already up to date)"
fi

# Fast seeding check using psql
if [ "${APP_MODE:-}" != "cron" ] && [ "${1:-}" != "cron" ]; then
  ADMIN_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"User\" WHERE username='feliciano';" 2>/dev/null | tr -d ' ' || echo "0")
  
  if [ "$ADMIN_COUNT" = "0" ]; then
    echo "🌱 Seeding database..."
    node scripts/seed.js 2>&1 || echo "⚠️ Seeding skipped"
  else
    echo "✅ Database already seeded"
  fi
fi

# Cron mode handler
if [ "${APP_MODE:-}" = "cron" ] || [ "${1:-}" = "cron" ]; then
  [ "${1:-}" = "cron" ] && shift
  exec "$@"
fi

# Log connection status
if [ -n "${DATABASE_URL:-}" ]; then
  echo "✅ DATABASE_URL configured"
else
  echo "⚠️ WARNING: DATABASE_URL not set"
fi

echo "🎉 Starting Node.js server..."
exec node server.js
