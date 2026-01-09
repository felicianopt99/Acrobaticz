#!/bin/bash

# Certbot initialization script
# Initializes SSL certificate for the first time using Let's Encrypt

set -e

DOMAIN="${DOMAIN:-acrobaticzrental.duckdns.org}"
EMAIL="${CERTBOT_EMAIL:-felizartpt@gmail.com}"
CERT_DIR="/etc/letsencrypt/live"
CERTBOT_DIR="/etc/letsencrypt"
WEBROOT="/var/www/certbot"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Ensure webroot exists
ensure_webroot() {
  if [ ! -d "$WEBROOT" ]; then
    log "Creating webroot directory: $WEBROOT"
    mkdir -p "$WEBROOT"
  fi
  chmod 755 "$WEBROOT"
}

# Check if certificate already exists
cert_exists() {
  [ -d "$CERT_DIR/$DOMAIN" ] && [ -f "$CERT_DIR/$DOMAIN/fullchain.pem" ] && [ -f "$CERT_DIR/$DOMAIN/privkey.pem" ]
}

# Initialize certificate if it doesn't exist
init_certificate() {
  log "Initializing SSL certificate for $DOMAIN..."
  
  if cert_exists; then
    log "✅ Certificate already exists, skipping initialization"
    return 0
  fi
  
  log "Requesting new certificate from Let's Encrypt..."
  
  certbot certonly \
    --webroot \
    -w "$WEBROOT" \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN" \
    --debug \
    --verbose
  
  if [ $? -eq 0 ]; then
    log "✅ Certificate initialized successfully"
    return 0
  else
    log "⚠️  Certificate initialization attempted (may be pending ACME validation)"
    return 0
  fi
}

# Verify certificate
verify_certificate() {
  if cert_exists; then
    log "✅ Certificate found at $CERT_DIR/$DOMAIN"
    ls -la "$CERT_DIR/$DOMAIN/" | grep -E "^-" | awk '{print "   " $NF}'
    return 0
  else
    log "⚠️  Certificate not yet available (may need ACME challenge completion)"
    return 1
  fi
}

main() {
  log "===== Certbot Initialization ====="
  log "Domain: $DOMAIN"
  log "Email: $EMAIL"
  log "Webroot: $WEBROOT"
  
  ensure_webroot
  init_certificate
  verify_certificate
  
  log "===== Initialization Complete ====="
}

main "$@"
