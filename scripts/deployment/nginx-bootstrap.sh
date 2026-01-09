#!/bin/bash

# Bootstrap script for nginx - creates dummy SSL cert if needed
set -e

DOMAIN="${1:-acrobaticzrental.duckdns.org}"
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
CERT_FILE="$CERT_DIR/fullchain.pem"
KEY_FILE="$CERT_DIR/privkey.pem"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting nginx bootstrap..."

# Create cert directory if it doesn't exist
if [ ! -d "$CERT_DIR" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Creating certificate directory: $CERT_DIR"
  mkdir -p "$CERT_DIR"
  
  # Generate self-signed certificate for bootstrap
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Generating temporary self-signed certificate..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "/CN=$DOMAIN" \
    2>/dev/null
  
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Temporary certificate created"
else
  if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Certificate already exists"
  else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  Certificate directory exists but cert files missing, generating..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout "$KEY_FILE" \
      -out "$CERT_FILE" \
      -subj "/CN=$DOMAIN" \
      2>/dev/null
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Certificate generated"
  fi
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Bootstrap complete - starting nginx"
