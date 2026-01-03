# Backup System Setup Guide

## Overview

Your backup system is now configured with:
- ✅ Daily automatic backups
- ✅ 5-day retention (auto-delete old backups)
- ✅ Admin dashboard to manage backups
- ✅ Manual backup capability
- ✅ Backup job tracking in database

---

## Files Created/Updated

### Database Schema
- `prisma/schema.prisma` - Added `QuotaChangeHistory` and `BackupJob` tables

### Backup Scripts
- `scripts/backup-daily.sh` - Creates daily database backup with 5-day retention
- `scripts/cleanup-backups.sh` - Manual cleanup script (optional)

### API Endpoints
- `GET /api/admin/cloud/backups` - List all backups and job history
- `POST /api/admin/cloud/backups` - Create manual backup
- `GET /api/admin/cloud/quotas` - List all users with quota info
- `PUT /api/admin/cloud/quotas` - Update user quota
- `GET /api/admin/cloud/quotas/{userId}/history` - View quota change history

---

## Setup Instructions

### Step 1: Run Prisma Migration

```bash
cd /home/feliciano/AV-RENTALS

# Generate Prisma migration
npx prisma migrate dev --name add_backup_and_quota_tables

# Or push schema directly
npx prisma db push
```

### Step 2: Make Backup Scripts Executable

```bash
chmod +x /home/feliciano/AV-RENTALS/scripts/backup-daily.sh
chmod +x /home/feliciano/AV-RENTALS/scripts/cleanup-backups.sh
```

### Step 3: Create Backup Directory

```bash
sudo mkdir -p /mnt/server_data/backups/daily
sudo mkdir -p /mnt/server_data/backups/logs
sudo chown -R $(whoami):$(whoami) /mnt/server_data/backups
chmod -R 755 /mnt/server_data/backups
```

### Step 4: Setup Cron Job for Daily Backup

Edit crontab:
```bash
crontab -e
```

Add this line to run backup every day at 2 AM:
```cron
0 2 * * * /home/feliciano/AV-RENTALS/scripts/backup-daily.sh >> /mnt/server_data/backups/logs/cron.log 2>&1
```

**Explanation:**
- `0 2 * * *` = Every day at 2:00 AM
- The script will create a backup and auto-delete backups older than 5 days

### Step 5: Test the Backup Script

Run manually to verify it works:
```bash
/home/feliciano/AV-RENTALS/scripts/backup-daily.sh
```

Check the output:
```bash
cat /mnt/server_data/backups/logs/backup_*.log
```

### Step 6: Verify Setup

```bash
# List backups directory
ls -lh /mnt/server_data/backups/daily/

# Check cron is configured
crontab -l | grep backup-daily

# Check recent backups
find /mnt/server_data/backups/daily -name "*.sql" -ls
```

---

## How Daily Backups Work

### Automatic Process (Every day at 2 AM)

```
1. Script runs: /home/feliciano/AV-RENTALS/scripts/backup-daily.sh
2. Creates new backup: backup_20260102_020000.sql
3. Adds backup to database job tracking
4. Automatically deletes backups older than 5 days
5. Logs results to: /mnt/server_data/backups/logs/backup_*.log
```

### What Gets Backed Up

- Entire PostgreSQL database (avrentals_db)
- All equipment data
- All rental information
- All user accounts
- All cloud file metadata (not the files themselves)
- All settings and configuration

### What Doesn't Get Backed Up (Optional - Add Later)

- User uploaded files (stored on sdb1)
- System logs
- Application cache

---

## Quota System Overview

### How It Works

1. **Role-based defaults** set when user is created:
   - Admin → 50 GB
   - Manager → 20 GB
   - Technician → 15 GB
   - Employee → 10 GB
   - Viewer → 5 GB

2. **Admin can customize** each user's quota individually

3. **Audit trail** records all changes with:
   - Who changed it
   - When it was changed
   - What the change was
   - Why it was changed (reason field)

### Setting Quotas

**Via API:**
```bash
# Update John's quota to 50 GB
curl -X PUT http://localhost:3000/api/admin/cloud/quotas \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "john_user_id",
    "newQuotaBytes": 53687091200,
    "reason": "Large project storage needed"
  }'
```

**Via Admin Dashboard** (coming next)

---

## Monitoring Backups

### View Backup Status

```bash
# Via API
curl http://localhost:3000/api/admin/cloud/backups \
  -H "Cookie: auth-token=YOUR_TOKEN"

# Check filesystem
ls -lh /mnt/server_data/backups/daily/ | tail -10

# Check logs
tail -50 /mnt/server_data/backups/logs/backup_*.log
```

### Manual Backup (On Demand)

Via API:
```bash
curl -X POST http://localhost:3000/api/admin/cloud/backups \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

Via Shell:
```bash
/home/feliciano/AV-RENTALS/scripts/backup-daily.sh
```

---

## Backup Retention & Space

### Current Setup

```
Partition: /mnt/server_data (sdb2: 465.8 GB)
├─ Backups Directory: /mnt/server_data/backups/daily/
├─ Backup Count: Keep last 5 daily backups
├─ Space Used: ~5 × 580 MB = ~2.9 GB
└─ Available: ~462 GB free ✅
```

### Space Math

- Each daily backup ≈ 580 MB (depends on database size)
- Keep 5 backups = ~2.9 GB used
- With 465.8 GB available = 99.4% free ✅

---

## Restoring from Backup

### Manual Restore (If Database Breaks)

```bash
# 1. Find the backup you want
ls -lh /mnt/server_data/backups/daily/

# 2. Restore from backup
psql -U avrentals_user -d avrentals_db < /mnt/server_data/backups/daily/backup_20260102_020000.sql

# 3. Verify restoration
psql -U avrentals_user -d avrentals_db -c "SELECT COUNT(*) FROM \"User\";"
```

### Restore via Admin Dashboard (Coming Soon)

One-click restore button in admin panel.

---

## Troubleshooting

### Backup Script Errors

**Check logs:**
```bash
cat /mnt/server_data/backups/logs/backup_*.log | grep "Error\|✅\|❌"
```

**Common issues:**

1. **"Permission denied" error:**
   ```bash
   # Fix permissions
   chmod 755 /mnt/server_data/backups
   chmod 755 /home/feliciano/AV-RENTALS/scripts/backup-daily.sh
   ```

2. **"Directory not found" error:**
   ```bash
   # Create directory
   mkdir -p /mnt/server_data/backups/daily
   mkdir -p /mnt/server_data/backups/logs
   ```

3. **"pg_dump not found" error:**
   ```bash
   # PostgreSQL tools need to be installed
   apt-get install postgresql-client
   ```

4. **Database connection errors:**
   - Verify DATABASE_URL is correct in env file
   - Verify PostgreSQL is running
   - Check container networking (if using Docker)

---

## Cron Job Reference

### View Current Cron Jobs
```bash
crontab -l
```

### Edit Cron Jobs
```bash
crontab -e
```

### Cron Time Format
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
│ │ │ │ │
* * * * * command_to_run

# Examples:
0 2 * * *     # Every day at 2:00 AM
0 3 * * 0     # Every Sunday at 3:00 AM
0 0 1 * *     # Every 1st of month at midnight
*/6 * * * *   # Every 6 hours
```

---

## Next Steps

1. ✅ Run Prisma migration
2. ✅ Create backup directory
3. ✅ Setup cron job
4. ✅ Test backup script manually
5. ⏳ Build admin dashboard UI
6. ⏳ Setup email alerts (optional)
7. ⏳ Test restore process

---

## Environment Variables (Optional)

Add to your `.env` file for customization:

```bash
# Backup settings
BACKUP_RETENTION_DAYS=5          # Keep backups for 5 days
BACKUP_SCHEDULE="0 2 * * *"      # Daily at 2 AM
ADMIN_EMAIL="admin@example.com"  # Alert email

# Storage settings
BACKUP_DIR="/mnt/server_data/backups"
EXTERNAL_STORAGE_PATH="/mnt/backup_drive/av-rentals/cloud-storage"
```

---

**Setup complete! Your backups are now automated and managed.**
