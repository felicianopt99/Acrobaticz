#!/bin/sh
set -eu

# Function to URL encode special characters
urlencode() {
  local string="$1"
  echo "$string" | sed 's/ /%20/g; s/!/%21/g; s/"/%22/g; s/#/%23/g; s/\$/%24/g; s/&/%26/g; s/'\''/%27/g; s/(/%28/g; s/)/%29/g; s/\*/%2A/g; s/+/%2B/g; s/,/%2C/g; s/\//%2F/g; s/:/%3A/g; s/;/%3B/g; s/=/%3D/g; s/?/%3F/g; s/@/%40/g; s/\[/%5B/g; s/\]/%5D/g; s/{/%7B/g; s/}/%7D/g'
}

# Read secrets if available (for production-like deployments)
if [ -f /run/secrets/db_user ]; then DB_USER=$(cat /run/secrets/db_user); fi
if [ -f /run/secrets/db_password ]; then DB_PASSWORD=$(cat /run/secrets/db_password); fi
if [ -f /run/secrets/db_name ]; then DB_NAME=$(cat /run/secrets/db_name); fi
if [ -f /run/secrets/jwt_secret ]; then export JWT_SECRET="$(cat /run/secrets/jwt_secret)"; fi
if [ -f /run/secrets/deepl_api_key ]; then export DEEPL_API_KEY="$(cat /run/secrets/deepl_api_key)"; fi

# Only override DATABASE_URL from secrets if secrets are available AND DATABASE_URL is not already set from env file
if [ -z "${DATABASE_URL:-}" ] && [ -n "${DB_USER:-}" ] && [ -n "${DB_PASSWORD:-}" ] && [ -n "${DB_NAME:-}" ]; then
  ENCODED_PASSWORD=$(urlencode "$DB_PASSWORD")
  export DATABASE_URL="postgresql://${DB_USER}:${ENCODED_PASSWORD}@postgres:5432/${DB_NAME}?schema=public"
fi

# For dev mode, run migrations with retries before starting the app
if [ -z "${SKIP_MIGRATIONS:-}" ]; then
  echo "Running prisma migrate deploy with retries..."
  ATTEMPTS=0
  until ./node_modules/.bin/prisma migrate deploy; do
    ATTEMPTS=$((ATTEMPTS+1))
    if [ $ATTEMPTS -ge 20 ]; then
      echo "Prisma migrate deploy failed after $ATTEMPTS attempts."
      exit 1
    fi
    echo "Database not ready yet. Retrying in 3s... (attempt $ATTEMPTS)"
    sleep 3
  done
  
  # Run seeding if not skipped
  if [ -z "${SKIP_SEED:-}" ]; then
    echo "Checking if database needs seeding..."
    # Use psql to check if admin user exists (faster and more reliable)
    ADMIN_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"User\" WHERE username='feliciano';" 2>/dev/null || echo "0")
    
    if [ "$ADMIN_COUNT" -eq 0 ]; then
      echo "Database not seeded. Running seed..."
      if node scripts/seed.js; then
        echo "✅ Database seeding completed successfully"
      else
        echo "⚠️  Database seeding failed, but continuing startup"
      fi
    else
      echo "✅ Database already seeded, skipping seed script"
    fi
  fi
fi

# Log redacted DATABASE_URL presence for diagnostics
if [ -n "${DATABASE_URL:-}" ]; then
  REDACTED_DBURL=$(printf "%s" "$DATABASE_URL" | sed 's/:[^@]*@/:***@/' | sed 's/?.*$//') || true
  echo "DATABASE_URL is set (redacted): ${REDACTED_DBURL}..."
else
  echo "WARNING: DATABASE_URL is not set. Database operations will fail."
fi

# Start the app using Next.js dev server with Turbopack for fast compilation
echo "Starting Next.js dev server with Turbopack..."
exec npm run dev
