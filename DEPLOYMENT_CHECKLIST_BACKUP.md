# ✅ Deployment Checklist - Backup & Quota System

**Status: READY TO DEPLOY** ✅

All code is written and ready. Follow this checklist to activate the system.

---

## Pre-Deployment (Verify Requirements)

- [ ] External disks mounted: `mount | grep sdb`
  - `/dev/sdb1` → `/mnt/backup_drive` (cloud storage)
  - `/dev/sdb2` → `/mnt/server_data` (backups)
  
- [ ] PostgreSQL running: `docker-compose ps | grep postgres`
- [ ] App container exists: `docker ps | grep av-rentals`
- [ ] Sufficient disk space: `df -h /mnt/server_data/` (need 3+ GB free)

---

## Step 1: Update Database ⏱️ 1 minute

```bash
cd /home/feliciano/AV-RENTALS
npx prisma db push
```

**Expected output:**
```
✔ Database synced, creating migrations folder if needed
```

**Verify:**
```bash
psql $DATABASE_URL -c "\dt public.quota_change_history"
```

**Troubleshooting:**
- If "table already exists" → Already deployed, continue
- If connection error → PostgreSQL not running → `docker-compose up postgres -d`

---

## Step 2: Create Backup Directories ⏱️ 1 minute

```bash
sudo mkdir -p /mnt/server_data/backups/daily
sudo mkdir -p /mnt/server_data/backups/logs
sudo chown -R $(whoami):$(whoami) /mnt/server_data/backups
chmod -R 755 /mnt/server_data/backups
```

**Verify:**
```bash
ls -la /mnt/server_data/backups/
# Should show: daily/ and logs/
```

---

## Step 3: Make Scripts Executable ⏱️ < 1 minute

```bash
chmod +x /home/feliciano/AV-RENTALS/scripts/backup-daily.sh
chmod +x /home/feliciano/AV-RENTALS/scripts/cleanup-backups.sh
```

**Verify:**
```bash
ls -la /home/feliciano/AV-RENTALS/scripts/backup-daily.sh | grep rwx
# Should show: -rwxr-xr-x
```

---

## Step 4: Setup Automatic Backups (Cron) ⏱️ 2 minutes

```bash
crontab -e
```

**Add this line at the end:**
```bash
0 2 * * * /home/feliciano/AV-RENTALS/scripts/backup-daily.sh >> /mnt/server_data/backups/logs/cron.log 2>&1
```

**Save:** Ctrl+X, then Y, then Enter (if using nano)

**Verify:**
```bash
crontab -l | grep backup
# Should show the line you just added
```

---

## Step 5: Test Backup Script ⏱️ 2-5 minutes

```bash
/home/feliciano/AV-RENTALS/scripts/backup-daily.sh
```

**Expected output:**
```
Creating backup...
Backup completed: backup_YYYYMMDD_HHMMSS.sql (609 MB)
✅ Backup successful! Size: XXX MB
```

**Verify backup was created:**
```bash
ls -lh /mnt/server_data/backups/daily/ | tail -5
# Should show your new backup file
```

**Verify log:**
```bash
cat /mnt/server_data/backups/logs/backup_*.log | tail -10
# Should show success message
```

**Troubleshooting:**
- "Permission denied" → Run Step 3 again
- "Directory not found" → Run Step 2 again
- "Database connection error" → PostgreSQL not running
- "pg_dump: command not found" → postgresql-client not installed

---

## Step 6: Rebuild Docker Containers ⏱️ 10-15 minutes

```bash
cd /home/feliciano/AV-RENTALS
docker-compose build --no-cache
docker-compose up -d
```

**Watch build progress:**
```bash
docker-compose logs -f app
# Ctrl+C when you see "Server is running"
```

**Expected completion messages:**
```
✔ Generated Prisma Client
✓ Migrate deploy
Server is running on port 3000
```

**Verify services are running:**
```bash
docker-compose ps
```

Should show all containers as "healthy" or "running":
- postgres (up)
- app (up)
- nginx (up)
- any others

---

## 🧪 Testing - Verify Everything Works

### Test 1: Quota API ⏱️ 1 minute

```bash
# Get your admin token (check docker env or .env.production)
ADMIN_TOKEN="your-admin-jwt-token-here"

# Test GET quotas
curl http://localhost:3000/api/admin/cloud/quotas \
  -H "Cookie: auth-token=$ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Expected: JSON with user quotas
```

**Success indicator:** Should return JSON with `users` array

**If 401 Unauthorized:** 
- You need valid admin token
- Check your auth method
- Verify JWT is being passed correctly

### Test 2: Backup API ⏱️ 1 minute

```bash
ADMIN_TOKEN="your-admin-jwt-token-here"

# Test GET backups
curl http://localhost:3000/api/admin/cloud/backups \
  -H "Cookie: auth-token=$ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Expected: JSON with backups list
```

**Success indicator:** Should return JSON with `backups` array

### Test 3: Database Tables ⏱️ 1 minute

```bash
# Check QuotaChangeHistory table
psql $DATABASE_URL -c "SELECT COUNT(*) FROM quota_change_history;"

# Check BackupJob table
psql $DATABASE_URL -c "SELECT COUNT(*) FROM backup_job;"

# Check for your recent backup job
psql $DATABASE_URL -c "SELECT status, file_size FROM backup_job ORDER BY created_at DESC LIMIT 1;"
```

**Success indicator:** Tables exist with your recent backup recorded

### Test 4: Admin Panel ⏱️ 2 minutes

1. Open browser: `http://localhost:3000/`
2. Login as admin
3. Navigate to Admin section
4. Look for "Cloud Storage" with tabs:
   - Quotas
   - Backups
5. Click each tab
6. Verify data loads

**Success indicator:** Both tabs load with data (no errors, no blank pages)

### Test 5: Cron Job ⏱️ 1 minute

Check if cron is scheduled:
```bash
crontab -l | grep backup
# Should show: 0 2 * * * /home/feliciano/AV-RENTALS/scripts/backup-daily.sh ...
```

Check cron log (after 2 AM tomorrow):
```bash
tail -10 /mnt/server_data/backups/logs/cron.log
# Should show success messages after 2 AM
```

---

## ✅ Full Test Checklist

- [ ] Step 1: Database synced (npx prisma db push)
- [ ] Step 2: Directories created (/mnt/server_data/backups/)
- [ ] Step 3: Scripts executable (chmod +x)
- [ ] Step 4: Cron job added (crontab -l shows backup line)
- [ ] Step 5: Manual backup works (test file in daily/)
- [ ] Step 6: Docker rebuilt (docker-compose ps shows all running)
- [ ] Test 1: Quota API responds (returns JSON)
- [ ] Test 2: Backup API responds (returns JSON)
- [ ] Test 3: Database tables populated (SELECT returns rows)
- [ ] Test 4: Admin panel loads (Cloud Storage section visible)
- [ ] Test 5: Cron will run (crontab -l confirms schedule)

---

## 🎉 Deployment Complete!

When all items are checked, you have:

✅ **Database Updated** - 2 new tables for quotas and backups
✅ **Quota System Active** - Admins can manage per-user storage limits
✅ **Backup System Active** - Automatic daily backups at 2:00 AM
✅ **Admin Dashboard Active** - Control panel for quotas and backups
✅ **Retention Policy Active** - Old backups auto-delete after 5 days

---

## 📊 What You Have Now

### Automatic (Zero Admin Action Needed)
- Daily backups at 2:00 AM ✅
- 5-day retention automatic cleanup ✅
- Backup job tracking ✅
- Backup logging ✅

### Manual (Admin Controls via Dashboard)
- View all user quotas ✅
- Change any user's quota with reason ✅
- View quota change history ✅
- Create manual backups ✅
- View backup status ✅
- Download backup files ✅

### Monitored & Tracked
- Every quota change logged with: who, when, what, why ✅
- Every backup tracked with: status, duration, size, errors ✅
- All backed-up to PostgreSQL ✅

---

## 🔄 Next Steps

### Immediate (After Tests Pass)
- [ ] Verify all tests pass (see checklist above)
- [ ] Monitor first 24 hours for any issues
- [ ] Check logs: `tail -20 /mnt/server_data/backups/logs/backup_*.log`
- [ ] Review quota API usage in logs

### Soon (Optional Enhancements)
- [ ] Add email alerts on backup failure
- [ ] Add compression to backups (gzip)
- [ ] Add download/restore UI in admin panel
- [ ] Add weekly/monthly backup tiers
- [ ] Add cloud backup sync (AWS S3, Google Drive, etc.)

### Later (Scaling)
- [ ] Monitor backup growth over time
- [ ] Consider off-site backup replication
- [ ] Consider backup encryption for sensitive environments
- [ ] Consider dedicated backup server for large databases

---

## 📞 Quick Support

**Problem:** Backups not running
**Solution:** 
1. Check cron: `crontab -l`
2. Check permissions: `ls -la /home/feliciano/AV-RENTALS/scripts/backup-daily.sh`
3. Test manually: `/home/feliciano/AV-RENTALS/scripts/backup-daily.sh`

**Problem:** Quota API returns 401
**Solution:**
1. Verify you're logged in as admin
2. Check JWT token has role: "admin"
3. Verify auth cookie is being sent

**Problem:** Database migration failed
**Solution:**
1. Check PostgreSQL running: `docker-compose ps postgres`
2. Check connection: `psql $DATABASE_URL -c "SELECT 1;"`
3. Re-run migration: `npx prisma db push`

**Problem:** Can't access admin panel
**Solution:**
1. Verify logged in: Check browser cookies
2. Check role is "admin": `SELECT role FROM users WHERE id=...`
3. Rebuild containers: `docker-compose build --no-cache && docker-compose up -d`

---

## 📝 Notes

- **Backup location:** `/mnt/server_data/backups/daily/`
- **Backup time:** 2:00 AM UTC (change with `crontab -e`)
- **Retention:** 5 days (change in `backup-daily.sh`)
- **Estimated size:** ~600 MB per backup × 5 = ~3 GB total
- **Available space:** 463+ GB (plenty of room)

---

**You're ready to deploy!** 🚀

Follow the 6 steps above, then verify with the tests. Once all tests pass, your system is live and automatic backups will run every day.

Questions? See: `/home/feliciano/AV-RENTALS/BACKUP_QUOTA_IMPLEMENTATION.md`
