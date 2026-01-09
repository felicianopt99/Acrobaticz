#!/bin/bash

# DuckDNS IP Update Script
# Updates DuckDNS with current IP when run
# Used by the duckdns service to keep domain pointing to correct IP

set -e

# Configuration
DOMAIN="${DUCKDNS_DOMAIN:-acrobaticzrental}"
TOKEN="${DUCKDNS_TOKEN}"
UPDATE_URL="https://www.duckdns.org/update"
LOG_DIR="/var/log/duckdns"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/duckdns-update.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Validate token is provided
if [ -z "$TOKEN" ]; then
  log "ERROR: DUCKDNS_TOKEN environment variable not set"
  exit 1
fi

# Get current IP
get_current_ip() {
  # Try multiple IP detection services
  local ip=$(curl -s https://api.ipify.org 2>/dev/null || echo "")
  
  if [ -z "$ip" ]; then
    ip=$(curl -s https://ifconfig.me 2>/dev/null || echo "")
  fi
  
  if [ -z "$ip" ]; then
    ip=$(curl -s https://icanhazip.com 2>/dev/null || echo "")
  fi
  
  echo "$ip"
}

# Get previous IP from cache
get_cached_ip() {
  if [ -f "$LOG_DIR/.last_ip" ]; then
    cat "$LOG_DIR/.last_ip"
  else
    echo ""
  fi
}

# Cache current IP
cache_ip() {
  echo "$1" > "$LOG_DIR/.last_ip"
}

# Main update function
update_duckdns() {
  local current_ip="$1"
  
  log "Updating DuckDNS: $DOMAIN -> $current_ip"
  
  # Call DuckDNS API
  local response=$(curl -s "${UPDATE_URL}?domains=${DOMAIN}&token=${TOKEN}&ip=${current_ip}" -w "\n%{http_code}")
  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | head -n-1)
  
  if [ "$http_code" = "200" ]; then
    if echo "$body" | grep -q "OK"; then
      log "✅ DuckDNS updated successfully"
      cache_ip "$current_ip"
      return 0
    else
      log "❌ DuckDNS API returned: $body"
      return 1
    fi
  else
    log "❌ HTTP Error: $http_code"
    return 1
  fi
}

# Main execution
main() {
  log "Starting DuckDNS update check..."
  
  local current_ip=$(get_current_ip)
  local cached_ip=$(get_cached_ip)
  
  if [ -z "$current_ip" ]; then
    log "⚠️  Could not detect current IP"
    exit 1
  fi
  
  log "Current IP: $current_ip, Cached IP: ${cached_ip:-none}"
  
  # Only update if IP has changed
  if [ "$current_ip" != "$cached_ip" ]; then
    update_duckdns "$current_ip"
  else
    log "ℹ️  IP unchanged, skipping update"
  fi
}

main "$@"
