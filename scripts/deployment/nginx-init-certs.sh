#!/bin/bash

# Initialize SSL certificates for nginx
# Creates self-signed cert if Let's Encrypt cert doesn't exist
# This allows nginx to start immediately, then certbot replaces it

set -e

DOMAIN="${DOMAIN:-acrobaticzrental.duckdns.org}"
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
WEBROOT="/var/www/certbot"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Ensure directories exist
mkdir -p "$CERT_DIR" "$WEBROOT"

# Check if real certificate exists
if [ -f "$CERT_DIR/fullchain.pem" ] && [ -f "$CERT_DIR/privkey.pem" ]; then
  log "✅ Real certificate found, skipping self-signed cert"
  exit 0
fi

# Create self-signed certificate for bootstrap
log "⚠️  Real certificate not found, generating self-signed certificate..."

openssl req -x509 \
  -newkey rsa:2048 \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/fullchain.pem" \
  -days 365 \
  -nodes \
  -subj "/CN=$DOMAIN" \
  2>/dev/null

log "✅ Self-signed certificate created at $CERT_DIR"
log "ℹ️  Certbot will replace this with a real Let's Encrypt certificate"
