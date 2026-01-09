#!/bin/sh

# Certbot entrypoint script
# Manages Let's Encrypt certificate initialization and renewal

set -e

DOMAIN="${DOMAIN:-acrobaticzrental.duckdns.org}"
EMAIL="${CERTBOT_EMAIL:-felizartpt@gmail.com}"
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
WEBROOT="/var/www/certbot"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Ensure webroot exists and is writable
mkdir -p "$WEBROOT" 2>/dev/null || true

# Check if certificate exists and is valid
cert_valid() {
  if [ ! -f "$CERT_DIR/fullchain.pem" ] || [ ! -f "$CERT_DIR/privkey.pem" ]; then
    return 1
  fi
  # Check if cert will expire in less than 30 days
  openssl x509 -checkend 2592000 -noout -in "$CERT_DIR/fullchain.pem" 2>/dev/null || return 1
}

# Initialize certificate if needed
init_cert() {
  if cert_valid; then
    log "✅ Valid certificate found for $DOMAIN"
    return 0
  fi
  
  log "🔄 Requesting certificate for $DOMAIN..."
  
  certbot certonly \
    --webroot \
    -w "$WEBROOT" \
    --non-interactive \
    --agree-tos \
    --keep-until-expiring \
    --email "$EMAIL" \
    -d "$DOMAIN" \
    --quiet \
    2>&1 || true
  
  if [ -f "$CERT_DIR/fullchain.pem" ] && [ -f "$CERT_DIR/privkey.pem" ]; then
    log "✅ Certificate ready for $DOMAIN"
  else
    log "⚠️  Certificate initialization had issues, will retry"
  fi
}

# Wait for nginx to be ready
wait_for_nginx() {
  log "Waiting for nginx to be ready..."
  max_attempts=30
  attempt=0
  
  while [ $attempt -lt $max_attempts ]; do
    if wget -qO- --no-check-certificate https://localhost/ 2>/dev/null >/dev/null || \
       wget -qO- http://localhost/.well-known/acme-challenge/ 2>/dev/null >/dev/null; then
      log "✅ Nginx is ready"
      return 0
    fi
    
    sleep 3
    attempt=$((attempt + 1))
  done
  
  log "⚠️  Nginx not responding within timeout, but continuing..."
  sleep 5
}

# Main loop
log "🚀 Starting certbot daemon for $DOMAIN"

wait_for_nginx
init_cert

# Renewal loop
log "Entering renewal loop (checks every 12 hours)"
trap "exit 0" TERM INT

while :; do
  sleep 43200  # 12 hours
  log "🔄 Checking for certificate renewal..."
  
  certbot renew \
    --webroot \
    -w "$WEBROOT" \
    --non-interactive \
    --quiet \
    2>&1 || true
done
