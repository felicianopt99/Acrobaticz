#!/bin/bash
# Backup Verification Script
# Verifies all backups are healthy and reports status

BACKUP_ROOT="/mnt/backup_drive/av-rentals/backups"
LOG_FILE="/mnt/backup_drive/av-rentals/backups/logs/verify_$(date +%Y%m%d_%H%M%S).log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "Backup Verification Report"
log "=========================================="
log "Generated: $(date)"
log ""

# Check partition health
log "📋 Partition Health:"
df -h /mnt/backup_drive | tee -a "$LOG_FILE"
log ""

# Check database backups
log "📊 Database Backups:"
log "Daily backups:"
DAILY_COUNT=$(find "$BACKUP_ROOT/daily" -name "backup_*.sql" 2>/dev/null | wc -l)
DAILY_SIZE=$(du -sh "$BACKUP_ROOT/daily" 2>/dev/null | cut -f1)
log "  Count: $DAILY_COUNT | Size: $DAILY_SIZE" | tee -a "$LOG_FILE"

if [ -d "$BACKUP_ROOT/weekly" ]; then
  log "Weekly backups:"
  WEEKLY_COUNT=$(find "$BACKUP_ROOT/weekly" -name "backup_week_*.sql" 2>/dev/null | wc -l)
  WEEKLY_SIZE=$(du -sh "$BACKUP_ROOT/weekly" 2>/dev/null | cut -f1)
  log "  Count: $WEEKLY_COUNT | Size: $WEEKLY_SIZE" | tee -a "$LOG_FILE"
fi

if [ -d "$BACKUP_ROOT/monthly" ]; then
  log "Monthly backups:"
  MONTHLY_COUNT=$(find "$BACKUP_ROOT/monthly" -name "backup_month_*.sql" 2>/dev/null | wc -l)
  MONTHLY_SIZE=$(du -sh "$BACKUP_ROOT/monthly" 2>/dev/null | cut -f1)
  log "  Count: $MONTHLY_COUNT | Size: $MONTHLY_SIZE" | tee -a "$LOG_FILE"
fi

log ""

# Check cloud file backups
if [ -d "$BACKUP_ROOT/daily/cloud-files" ]; then
  log "📁 Cloud File Backups:"
  log "Daily backups:"
  CLOUD_DAILY_COUNT=$(find "$BACKUP_ROOT/daily/cloud-files" -name "cloud_backup_*.tar.gz" 2>/dev/null | wc -l)
  CLOUD_DAILY_SIZE=$(du -sh "$BACKUP_ROOT/daily/cloud-files" 2>/dev/null | cut -f1)
  log "  Count: $CLOUD_DAILY_COUNT | Size: $CLOUD_DAILY_SIZE" | tee -a "$LOG_FILE"
  
  if [ -d "$BACKUP_ROOT/weekly/cloud-files" ]; then
    log "Weekly backups:"
    CLOUD_WEEKLY_COUNT=$(find "$BACKUP_ROOT/weekly/cloud-files" -name "cloud_backup_week_*.tar.gz" 2>/dev/null | wc -l)
    CLOUD_WEEKLY_SIZE=$(du -sh "$BACKUP_ROOT/weekly/cloud-files" 2>/dev/null | cut -f1)
    log "  Count: $CLOUD_WEEKLY_COUNT | Size: $CLOUD_WEEKLY_SIZE" | tee -a "$LOG_FILE"
  fi
  log ""
fi

# Check for recent backups
log "⏰ Recent Backups (last 24 hours):"
RECENT_COUNT=$(find "$BACKUP_ROOT" -type f -mtime -1 2>/dev/null | wc -l)
log "  Count: $RECENT_COUNT files" | tee -a "$LOG_FILE"
log ""

# Overall health
log "=========================================="
log "Verification Summary:"
log "=========================================="

ISSUES=0

if [ "$DAILY_COUNT" -eq 0 ]; then
  log "⚠️  WARNING: No daily database backups found!"
  ISSUES=$((ISSUES+1))
else
  log "✅ Database backups: $DAILY_COUNT daily"
fi

if [ -n "$CLOUD_DAILY_COUNT" ] && [ "$CLOUD_DAILY_COUNT" -eq 0 ] && [ -d "$BACKUP_ROOT/daily/cloud-files" ]; then
  log "⚠️  WARNING: No daily cloud file backups found!"
  ISSUES=$((ISSUES+1))
elif [ "$CLOUD_DAILY_COUNT" -gt 0 ]; then
  log "✅ Cloud file backups: $CLOUD_DAILY_COUNT daily"
fi

if [ "$ISSUES" -eq 0 ]; then
  log "✅ All backup systems operational"
else
  log "⚠️  $ISSUES issues detected - review above"
fi

log "=========================================="
log "Report saved: $LOG_FILE"
log "=========================================="
