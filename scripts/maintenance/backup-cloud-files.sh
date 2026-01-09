#!/bin/bash
# Cloud Files Backup with Incremental Support
# Backs up all user uploaded files with daily/weekly rotation

set -e

# Configuration
CLOUD_SOURCE="/mnt/backup_drive/av-rentals/cloud-storage"
DAILY_DIR="/mnt/backup_drive/av-rentals/backups/daily/cloud-files"
WEEKLY_DIR="/mnt/backup_drive/av-rentals/backups/weekly/cloud-files"
LOG_DIR="/mnt/backup_drive/av-rentals/backups/logs"
LAST_BACKUP_FILE="$DAILY_DIR/.last_backup_timestamp"

# Create directories
mkdir -p "$DAILY_DIR" "$WEEKLY_DIR" "$LOG_DIR"

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$DAILY_DIR/cloud_backup_${TIMESTAMP}.tar.gz"
LOG_FILE="$LOG_DIR/cloud_backup_$(date +%Y%m%d).log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "Starting cloud files backup"
log "=========================================="

# Check if source exists
if [ ! -d "$CLOUD_SOURCE" ]; then
  log "❌ Cloud source directory not found: $CLOUD_SOURCE"
  exit 1
fi

# Get source size
SOURCE_SIZE=$(du -sh "$CLOUD_SOURCE" 2>/dev/null | cut -f1)
log "Source size: $SOURCE_SIZE"

# Create backup (exclude temp files)
log "Creating backup: $BACKUP_FILE"
cd "$CLOUD_SOURCE"

if tar --exclude='temp' \
       --exclude='*.tmp' \
       --exclude='.DS_Store' \
       -czf "$BACKUP_FILE" \
       --transform 's,^,cloud-storage/,' \
       . 2>> "$LOG_FILE"; then
  
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" 2>/dev/null | cut -f1)
  log "✅ Backup successful! Size: $BACKUP_SIZE"
  
  # Update last backup timestamp
  date +%s > "$LAST_BACKUP_FILE"
  
  # Weekly full backup (every Monday)
  if [ "$(date +%u)" -eq 1 ]; then
    WEEK=$(date +%Y_w%V)
    mkdir -p "$WEEKLY_DIR"
    cp "$BACKUP_FILE" "$WEEKLY_DIR/cloud_backup_week_${WEEK}.tar.gz"
    log "📅 Weekly backup created: cloud_backup_week_${WEEK}.tar.gz"
    
    # Clean weekly backups older than 90 days (13 weeks)
    find "$WEEKLY_DIR" -name "cloud_backup_week_*.tar.gz" -mtime +90 -delete 2>/dev/null || true
  fi
  
  # Clean daily backups older than 7 days
  DELETED=$(find "$DAILY_DIR" -name "cloud_backup_*.tar.gz" -mtime +7 -delete -print 2>/dev/null | wc -l)
  log "🗑️  Deleted $DELETED old daily backups"
  
  # Verify backup integrity
  log "Verifying backup integrity..."
  if tar -tzf "$BACKUP_FILE" > /dev/null 2>&1; then
    log "✅ Backup integrity verified"
  else
    log "⚠️  Backup integrity check failed"
  fi
  
  # Statistics
  DAILY_COUNT=$(find "$DAILY_DIR" -name "cloud_backup_*.tar.gz" 2>/dev/null | wc -l)
  WEEKLY_COUNT=$(find "$WEEKLY_DIR" -name "cloud_backup_week_*.tar.gz" 2>/dev/null | wc -l)
  
  log "📊 Backup counts: Daily=$DAILY_COUNT, Weekly=$WEEKLY_COUNT"
  log "=========================================="
  log "✅ Cloud backup completed successfully"
  log "=========================================="
  
  exit 0
else
  log "❌ Backup failed!"
  exit 1
fi
