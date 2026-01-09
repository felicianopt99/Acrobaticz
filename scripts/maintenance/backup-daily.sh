#!/bin/bash

# Daily Backup Script with 5-day Retention
# This script:
# 1. Creates a daily database backup
# 2. Keeps only the last 5 days of backups
# 3. Logs the result
# 4. Sends email alert if backup fails

set -e

# Configuration
BACKUP_DIR="/mnt/backup_drive/av-rentals/backups/daily"
BACKUP_LOGS="/mnt/backup_drive/av-rentals/backups/logs"
DB_USER="avrentals_user"
DB_NAME="avrentals_db"
DB_HOST="postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"
LOG_FILE="$BACKUP_LOGS/backup_$(date +%Y%m%d).log"
RETENTION_DAYS=5
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@acrobaticzrental.com}"

# Create directories if they don't exist
mkdir -p "$BACKUP_DIR" "$BACKUP_LOGS"

# Log function
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "Starting daily database backup"
log "=========================================="

# Create backup using Docker
log "Creating backup: $BACKUP_FILE"
if docker exec av-postgres pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE" 2>> "$LOG_FILE"; then
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  log "✅ Backup successful!"
  log "Backup size: $BACKUP_SIZE"
  
  # Delete backups older than $RETENTION_DAYS days
  log "Cleaning up backups older than $RETENTION_DAYS days..."
  DELETED_COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql" -mtime +$RETENTION_DAYS -delete -print | wc -l)
  log "Deleted $DELETED_COUNT old backups"
  
  # Count remaining backups
  BACKUP_COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql" | wc -l)
  log "Current backups in retention: $BACKUP_COUNT"
  
  log "=========================================="
  log "Backup completed successfully"
  log "=========================================="
  exit 0
else
  log "❌ Backup failed!"
  ERROR_MSG=$(tail -20 "$LOG_FILE")
  log "Error details: $ERROR_MSG"
  
  # Send alert email (if mail utility is available)
  if command -v mail &> /dev/null; then
    echo "Database backup failed on $(hostname) at $(date)" | \
      mail -s "🚨 Backup Alert: Daily Backup Failed" "$ADMIN_EMAIL"
  fi
  
  log "=========================================="
  log "Backup failed - check logs above"
  log "=========================================="
  exit 1
fi
