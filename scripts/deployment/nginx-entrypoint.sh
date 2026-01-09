#!/bin/sh

# Nginx entrypoint that initializes certificates before starting
# Creates self-signed certificate for bootstrap, then runs the nginx docker entrypoint

set -e

DOMAIN="${DOMAIN:-acrobaticzrental.duckdns.org}"
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "🚀 Initializing nginx with SSL bootstrap..."

# Ensure certificate directory exists
mkdir -p "$CERT_DIR"

# Generate self-signed cert if real cert doesn't exist
if [ ! -f "$CERT_DIR/fullchain.pem" ] || [ ! -f "$CERT_DIR/privkey.pem" ]; then
  log "⚠️  Real certificate not found, generating self-signed bootstrap certificate..."
  
  openssl req -x509 \
    -newkey rsa:2048 \
    -keyout "$CERT_DIR/privkey.pem" \
    -out "$CERT_DIR/fullchain.pem" \
    -days 365 \
    -nodes \
    -subj "/CN=$DOMAIN" \
    2>&1 | grep -v "^Generating" || true
  
  log "✅ Self-signed bootstrap certificate created"
else
  log "✅ Certificate found at $CERT_DIR"
fi

log "Starting nginx with template substitution..."

# Process templates and start nginx
# This uses the official nginx docker-entrypoint.sh logic
if [ -f /docker-entrypoint.sh ]; then
  exec /docker-entrypoint.sh "$@"
else
  # Fallback if docker-entrypoint.sh doesn't exist
  log "⚠️  Using direct nginx start (no template substitution)"
  exec "$@"
fi
