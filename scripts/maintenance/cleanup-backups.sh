#!/bin/bash

# Backup Cleanup Script
# Removes backups older than retention period
# Logs statistics to database

set -e

BACKUP_DIR="/mnt/backup_drive/av-rentals/backups/daily"
BACKUP_LOGS="/mnt/backup_drive/av-rentals/backups/logs"
RETENTION_DAYS=5

mkdir -p "$BACKUP_LOGS"

LOG_FILE="$BACKUP_LOGS/cleanup_$(date +%Y%m%d_%H%M%S).log"

{
  echo "Backup Cleanup Report - $(date)"
  echo "===================================="
  echo ""
  
  # Show backups before cleanup
  echo "Backups before cleanup:"
  find "$BACKUP_DIR" -name "backup_*.sql" -printf "%T@ %Tc %s %p\n" | sort -rn | while read timestamp date size file; do
    SIZE_MB=$((size / 1024 / 1024))
    echo "  $date | $SIZE_MB MB | $(basename $file)"
  done
  
  echo ""
  echo "Deleting backups older than $RETENTION_DAYS days..."
  echo ""
  
  # Delete old backups and count them
  DELETED=0
  while IFS= read -r file; do
    rm -f "$file"
    echo "  Deleted: $(basename $file)"
    ((DELETED++))
  done < <(find "$BACKUP_DIR" -name "backup_*.sql" -mtime +$RETENTION_DAYS)
  
  echo ""
  echo "Deleted $DELETED backups"
  echo ""
  
  # Show backups after cleanup
  echo "Backups after cleanup:"
  REMAINING=$(find "$BACKUP_DIR" -name "backup_*.sql" | wc -l)
  TOTAL_SIZE=0
  
  find "$BACKUP_DIR" -name "backup_*.sql" -printf "%T@ %Tc %s %p\n" | sort -rn | while read timestamp date size file; do
    SIZE_MB=$((size / 1024 / 1024))
    echo "  $date | $SIZE_MB MB | $(basename $file)"
    TOTAL_SIZE=$((TOTAL_SIZE + size))
  done
  
  echo ""
  echo "Remaining backups: $REMAINING"
  TOTAL_SIZE_GB=$((TOTAL_SIZE / 1024 / 1024 / 1024))
  echo "Total backup size: ~$TOTAL_SIZE_GB GB"
  echo ""
  echo "Cleanup completed successfully"
} | tee "$LOG_FILE"
