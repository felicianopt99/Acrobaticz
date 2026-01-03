# Unified Cloud Storage & Backup System - Implementation Plan

## PART 1: CUSTOM PER-USER QUOTAS

### How It Works (Simple Explanation)

**Think of it like apartment sizes:**
- **Default = Everyone gets a studio apartment (10 GB)**
- **But you can upgrade individual apartments:**
  - John → Penthouse (50 GB)
  - Jane → 2-bedroom (20 GB)
  - Mike → Studio (10 GB)
  - Sarah → Small studio (5 GB)

---

### Quota System Structure

#### Level 1: Role-Based Defaults
```
When a new user is created, their quota is automatically set based on their role:

Admin          → 50 GB  (full access, managing system)
Manager        → 20 GB  (managing teams, projects)
Technician     → 15 GB  (equipment docs, invoices, technical files)
Employee       → 10 GB  (general documents)
Viewer         → 5 GB   (read-only, minimal storage)
```

#### Level 2: Individual Overrides
```
Admin can change ANY user's quota at any time:

John Smith (Admin):       50 GB → 100 GB (he needs more for projects)
Jane Doe (Manager):       20 GB → 30 GB  (managing large events)
Mike Johnson (Technician): 15 GB → 10 GB (he's on vacation, less needed)
```

---

### Database Changes

#### Update StorageQuota Table
```sql
ALTER TABLE storage_quota ADD COLUMN IF NOT EXISTS role_quota_bytes BIGINT;
-- role_quota_bytes = the default quota based on their role
-- quotaBytes = the actual current quota (can be overridden)

-- This allows us to see: "Role default was 10GB, but admin set it to 20GB"
```

#### Create QuotaHistory Table (for audit trail)
```sql
CREATE TABLE quota_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  oldQuotaBytes BIGINT NOT NULL,
  newQuotaBytes BIGINT NOT NULL,
  changedBy UUID NOT NULL REFERENCES "User"(id), -- which admin changed it
  reason VARCHAR(255), -- why it was changed
  changedAt TIMESTAMP DEFAULT now(),
  
  INDEX idx_user_id (userId),
  INDEX idx_changed_at (changedAt)
);

-- This creates an audit trail:
-- "Jan 2 2026 - Admin Sally changed John's quota from 10GB to 50GB (reason: Large project storage)"
```

---

### Admin Interface for Quota Management

#### View 1: Quick Quota Editor (Simple)
```
┌──────────────────────────────────────────────────────────┐
│ User Quotas                                              │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ John Smith (Admin)          Current: 50 GB               │
│ ├─ Role Default: 50 GB                                   │
│ ├─ Used: 9.2 GB (18%)                                    │
│ ├─ New Quota: [100] GB   [Save] [Reset to Role]          │
│ └─ Change Reason: [Large video project___] (optional)    │
│                                                           │
│ Jane Doe (Manager)          Current: 20 GB               │
│ ├─ Role Default: 20 GB                                   │
│ ├─ Used: 8.5 GB (42%)                                    │
│ ├─ New Quota: [20] GB    [Save] [Reset to Role]          │
│ └─ Change Reason: [________________________]              │
│                                                           │
│ Mike Johnson (Technician)   Current: 15 GB               │
│ ├─ Role Default: 15 GB                                   │
│ ├─ Used: 2.1 GB (14%)                                    │
│ ├─ New Quota: [15] GB    [Save] [Reset to Role]          │
│ └─ Change Reason: [________________________]              │
│                                                           │
│ [Bulk Actions ▼]                                          │
│ • Set all Employees to 15GB                              │
│ • Reset all to role defaults                             │
│ • Export quota list                                      │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

#### View 2: Quota History (Audit Trail)
```
┌──────────────────────────────────────────────────────────┐
│ Quota Changes for: John Smith                        [✕] │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ Jan 2, 2026 - Admin Sally                                │
│ ├─ Changed: 10 GB → 50 GB                                │
│ ├─ Reason: "Large video project storage"                 │
│ └─ [Revert this change]                                  │
│                                                           │
│ Dec 15, 2025 - Admin John                                │
│ ├─ Changed: 10 GB → 10 GB (no change)                    │
│ ├─ Reason: "Account created - set to role default"       │
│ └─ [Revert this change]                                  │
│                                                           │
│ Showing 2 of 2 changes                                   │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

#### View 3: Bulk Quota Management
```
┌──────────────────────────────────────────────────────────┐
│ Bulk Quota Management                                    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ APPLY TO ROLE:                                            │
│ ├─ [ ] All Admins       Current: 50 GB  → New: [50] GB   │
│ ├─ [ ] All Managers     Current: 20 GB  → New: [20] GB   │
│ ├─ [ ] All Technicians  Current: 15 GB  → New: [15] GB   │
│ ├─ [ ] All Employees    Current: 10 GB  → New: [10] GB   │
│ └─ [ ] All Viewers      Current: 5 GB   → New: [5] GB    │
│                                                           │
│ FILTER & BULK EDIT:                                       │
│ ├─ Show users with quota exceeding: [50] GB              │
│ ├─ Show users with usage exceeding: [10] GB              │
│                                                           │
│ [Search/Filter] [Select All] [Apply Changes]             │
│                                                           │
│ Results: 23 users affected by bulk change                │
│ [Preview Changes] [Apply] [Cancel]                       │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

### API Endpoints for Quotas

```typescript
// Get all users with quota info
GET /api/admin/cloud/quotas
Response: {
  users: [
    {
      id: "user123",
      name: "John Smith",
      role: "Admin",
      quotaBytes: 50GB,
      roleDefaultQuotaBytes: 50GB,
      usedBytes: 9.2GB,
      percentUsed: 18,
      lastUsageUpdate: "2026-01-02T10:30:00Z",
      quotaHistory: [{ changed: "2026-01-02", from: 10GB, to: 50GB }]
    },
    ...
  ]
}

// Update single user quota
PUT /api/admin/cloud/quotas/{userId}
Body: {
  newQuotaBytes: 100GB,
  reason: "Large project storage needed"
}
Response: { success: true, message: "..." }

// Bulk update quotas
PUT /api/admin/cloud/quotas/bulk
Body: {
  updates: [
    { userId: "user1", quotaBytes: 50GB },
    { userId: "user2", quotaBytes: 20GB },
    { userId: "user3", quotaBytes: 15GB }
  ],
  reason: "Annual quota reset"
}
Response: { success: true, updated: 3, skipped: 0 }

// Get quota history for user
GET /api/admin/cloud/quotas/{userId}/history
Response: {
  changes: [
    {
      id: "change1",
      oldQuotaBytes: 10GB,
      newQuotaBytes: 50GB,
      changedBy: "Sally Admin",
      reason: "Large video project",
      changedAt: "2026-01-02"
    }
  ]
}

// Reset user quota to role default
POST /api/admin/cloud/quotas/{userId}/reset-to-role
Response: { success: true, newQuota: 10GB (if Employee), reason: "Reset to role default" }
```

---

## PART 2: UNIFIED BACKUP SYSTEM

### Current State (Broken)
```
Your 931.5 GB disk has 2 partitions:
├─ sdb1 (465.8 GB): Cloud Storage files
└─ sdb2 (465.8 GB): Should be backups but NOT CONFIGURED
```

### Proposed State (Unified)
```
Your 931.5 GB disk has 2 partitions:

sdb1 (465.8 GB) - "Cloud Storage Partition"
├─ /mnt/backup_drive/av-rentals/cloud-storage/
│  ├─ {userId}/files/     (user uploaded files)
│  ├─ {userId}/versions/  (file versions)
│  └─ {userId}/temp/      (temporary uploads)
└─ Purpose: Active cloud storage for users

sdb2 (465.8 GB) - "Backup & Archive Partition"
├─ /mnt/server_data/
│  ├─ backups/
│  │  ├─ daily/           (last 30 days of daily DB backups)
│  │  ├─ weekly/          (52 weeks of weekly backups)
│  │  └─ monthly/         (full monthly archives)
│  ├─ archive/            (old files moved from cloud storage)
│  ├─ uploads/            (secondary backup of user uploads)
│  └─ logs/               (system & app logs)
└─ Purpose: Disaster recovery & long-term storage
```

---

### Space Breakdown & Limitations (Easy to Understand)

#### Scenario: Your Current System

```
PARTITION 1 (sdb1): 465.8 GB - CLOUD STORAGE
├─ Cloud Files:           400 GB
├─ File Versions:         50 GB
├─ Temporary/Cache:       15.8 GB
└─ FREE:                  0 GB  ⚠️ CRITICAL - NO BUFFER!

PARTITION 2 (sdb2): 465.8 GB - BACKUPS & ARCHIVE
├─ Database Daily Backups: 30 backups × 580 MB = 17.4 GB
├─ Database Weekly:         52 weeks × 2.3 GB = 120 GB
├─ Database Monthly:        12 months × 30 GB = 360 GB
├─ Upload Backups:          100 GB (mirror of important files)
└─ FREE:                    ~130 GB ✅ Good buffer
```

#### Admin Dashboard - Simple Space View

```
┌─────────────────────────────────────────────────────────────────┐
│ STORAGE OVERVIEW - Easy Breakdown                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ YOUR DISK: 931.5 GB Total                                        │
│                                                                  │
│ ┌────────────────────────────┐  ┌────────────────────────────┐ │
│ │ PARTITION 1 (sdb1)         │  │ PARTITION 2 (sdb2)         │ │
│ │ 465.8 GB - Cloud Storage   │  │ 465.8 GB - Backups         │ │
│ ├────────────────────────────┤  ├────────────────────────────┤ │
│ │                            │  │                            │ │
│ │ User Cloud Files:          │  │ Database Backups:          │ │
│ │ [████████░░░░░░░░░░░░] 400G│  │ [███░░░░░░░░░░░░░░░░░] 17.4G
│ │ (86%)                      │  │ (4%)                       │ │
│ │                            │  │                            │ │
│ │ Versions & Temp:           │  │ Monthly Archives:          │ │
│ │ [████░░░░░░░░░░░░░░░░░] 65G│  │ [████████████░░░░░░░░] 360G
│ │ (14%)                      │  │ (77%)                      │ │
│ │                            │  │                            │ │
│ │ FREE SPACE:                │  │ Upload Backups:            │ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░  0G│  │ [██░░░░░░░░░░░░░░░░░░░] 100G
│ │ (0%) ⚠️ CRITICAL          │  │ (21%)                      │ │
│ │                            │  │                            │ │
│ │ ACTION NEEDED:             │  │ FREE SPACE:                │ │
│ │ • Disk almost full!        │  │ [██████░░░░░░░░░░░░░░░] 130G
│ │ • Archive old files now    │  │ (28%) ✅ Good buffer      │ │
│ │ • Delete trash & versions  │  │                            │ │
│ │ • Consider cleanup policies │  │ Status: ✅ Healthy         │ │
│ │                            │  │                            │ │
│ └────────────────────────────┘  └────────────────────────────┘ │
│                                                                  │
│ RECOMMENDATIONS:                                                 │
│ 1. Archive 50 GB of old cloud files to sdb2/archive/           │
│ 2. Clear trash (156 MB recoverable)                             │
│ 3. Delete file versions older than 30 days (saves 20 GB)       │
│ 4. Once done: sdb1 will have ~70 GB free space                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Backup Strategy Unified

#### What Gets Backed Up & Where

```
DATABASE BACKUPS (PostgreSQL)
├─ Daily Rotation: Keep last 30 days
│  Location: /mnt/server_data/backups/daily/
│  Size: ~30 × 580 MB = 17.4 GB
│  Frequency: Every night at 2 AM
│  
├─ Weekly Archives: Keep 52 weeks (1 year)
│  Location: /mnt/server_data/backups/weekly/
│  Size: ~52 × 2.3 GB = 120 GB
│  Frequency: Every Sunday at 3 AM
│  
└─ Monthly Archives: Keep 24 months (2 years)
   Location: /mnt/server_data/backups/monthly/
   Size: ~24 × 30 GB = 720 GB (optional, stored external)
   Frequency: First day of month at 4 AM

CLOUD FILE BACKUPS (Important files)
├─ Critical Files: Automatically backed up
│  Location: /mnt/server_data/backups/uploads/
│  Size: ~100 GB
│  What: Files marked as "critical" or shared
│  
└─ Manual Backups: On demand
   Location: /mnt/server_data/backups/manual/
   Created by: Admin request

SYSTEM LOGS (Audit trail)
├─ Application Logs
│  Location: /mnt/server_data/logs/app/
│  Retention: 90 days
│  Size: ~5-10 GB
│
└─ System Logs
   Location: /mnt/server_data/logs/system/
   Retention: 90 days
   Size: ~5-10 GB
```

---

### Admin Backup Control Panel (Easy to Understand)

```
┌─────────────────────────────────────────────────────────────┐
│ BACKUP MANAGEMENT DASHBOARD                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ QUICK STATUS                                                │
│ ├─ Last Daily Backup:   Jan 2, 2026 2:15 AM ✅ Success     │
│ ├─ Last Weekly Backup:  Jan 1, 2026 3:45 AM ✅ Success     │
│ ├─ Last Monthly Backup: Dec 1, 2025 4:30 AM ✅ Success     │
│ └─ Total Backups Stored: 35 backups (145 GB)               │
│                                                             │
│ AUTOMATED BACKUP SCHEDULE                                   │
│ ├─ Daily Backup:   [✓] Enabled - Every day at [2:00 AM]   │
│ ├─ Weekly Backup:  [✓] Enabled - Every Sunday at [3:00 AM]│
│ ├─ Monthly Backup: [✓] Enabled - 1st of month at [4:00 AM]│
│ └─ Retention Policy:                                        │
│    ├─ Keep daily for: [30] days                            │
│    ├─ Keep weekly for: [52] weeks (1 year)                │
│    └─ Keep monthly for: [24] months (2 years)             │
│                                                             │
│ [Save Backup Settings]  [Test Backup]  [View Logs]         │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ RECENT BACKUPS                                              │
│ ├─ Jan 2, 2026 02:15 | daily/backup_20260102_0215.sql    │
│ │  Size: 582 MB | Duration: 45 seconds | Status: ✅       │
│ │  [Download] [Restore] [Delete] [Details]                │
│ │                                                          │
│ ├─ Jan 1, 2026 03:45 | weekly/backup_20260101_0345.sql   │
│ │  Size: 2.3 GB | Duration: 2m 15s | Status: ✅          │
│ │  [Download] [Restore] [Delete] [Details]                │
│ │                                                          │
│ └─ Dec 1, 2025 04:30 | monthly/backup_20251201_0430.sql  │
│    Size: 31 GB | Duration: 8m 42s | Status: ✅           │
│    [Download] [Restore] [Delete] [Details]                │
│                                                             │
│ [Show More] [Search] [Export List]                         │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ BACKUP ACTIONS                                              │
│ ├─ [Create Manual Backup Now]  (on-demand)                │
│ ├─ [Test Restore] (verify backup integrity)               │
│ ├─ [Download Backup] (copy to external USB)               │
│ ├─ [Cleanup Old Backups] (auto-delete based on policy)    │
│ └─ [View Backup Logs] (technical details)                 │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ DISK USAGE FOR BACKUPS                                      │
│ ├─ Daily Backups:   [████░░░░░░░░░░░░░░] 17.4 GB / 50 GB  │
│ ├─ Weekly Backups:  [███████░░░░░░░░░░░] 120 GB / 200 GB  │
│ ├─ Monthly Backups: [██████████░░░░░░░░] 360 GB / 400 GB  │
│ └─ TOTAL PARTITION 2: [███████████░░░░░░] 500 GB / 465.8 GB│
│                       ⚠️ WARNING: Monthly backups not fitting!
│                                                             │
│ RECOMMENDATIONS:                                            │
│ ✓ Move oldest monthly backups to external storage          │
│ ✓ Or change to only 12 months retention (not 24)           │
│ ✓ Or reduce weekly backup retention to 26 weeks             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Backup Automation Scripts

#### 1. Daily Backup Script (runs at 2 AM)
```bash
#!/bin/bash
# /scripts/backup-daily.sh

BACKUP_DIR="/mnt/server_data/backups/daily"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Create backup
pg_dump -U avrentals_user avrentals_db > "$BACKUP_FILE"

# Check success
if [ $? -eq 0 ]; then
  echo "✅ Daily backup success: $BACKUP_FILE"
  # Delete backups older than 30 days
  find "$BACKUP_DIR" -name "*.sql" -mtime +30 -delete
else
  echo "❌ Daily backup failed!"
  # Send alert to admin
fi
```

#### 2. Weekly Backup Script (runs every Sunday at 3 AM)
```bash
#!/bin/bash
# /scripts/backup-weekly.sh

BACKUP_DIR="/mnt/server_data/backups/weekly"
WEEK=$(date +%Y_W%V)
BACKUP_FILE="$BACKUP_DIR/backup_week_$WEEK.sql"

# Create backup with compression
pg_dump -U avrentals_user avrentals_db | gzip > "$BACKUP_FILE.gz"

# Check success and keep 52 weeks
if [ $? -eq 0 ]; then
  echo "✅ Weekly backup success"
  find "$BACKUP_DIR" -name "*.gz" -mtime +365 -delete
else
  echo "❌ Weekly backup failed!"
fi
```

#### 3. Clean Old Backups (runs daily)
```bash
#!/bin/bash
# /scripts/cleanup-backups.sh

# Delete daily backups older than 30 days
find /mnt/server_data/backups/daily -name "*.sql" -mtime +30 -delete

# Delete weekly backups older than 52 weeks
find /mnt/server_data/backups/weekly -name "*.sql.gz" -mtime +365 -delete

# Optional: Archive monthly backups to external drive
# rsync -av /mnt/server_data/backups/monthly /media/external_usb/av-rentals-backup/
```

---

### Simple Backup Terminology for Admin

| Term | What It Means | Example |
|------|---------------|---------|
| **Daily Backup** | Database copied every night, keeps last 30 days | "Backup from Jan 2 at 2 AM" |
| **Weekly Backup** | Compressed backup from one week, keeps 52 weeks | "Backup from Week 1 of January" |
| **Monthly Backup** | Full backup stored long-term, keeps 24 months | "Backup from January 2026" |
| **Restore** | Putting the backed-up data back into the system | "Restore database from Jan 1 backup" |
| **Retention** | How long we keep backups before deleting | "Keep daily for 30 days" |
| **Rotation** | Automatic delete of old backups | "After 30 days, delete oldest daily" |
| **Compression** | Squeezing files to take less space | "2.3 GB compressed to 800 MB" |
| **Archive** | Move to long-term storage (external disk) | "Move 2024 backups to USB drive" |

---

## Implementation Summary

### What We're Creating:

**1. Per-User Custom Quotas:**
- Role-based defaults (Admin 50GB, Manager 20GB, etc.)
- Individual overrides (change any user's quota)
- Audit trail of all changes
- Bulk management tools

**2. Unified Backup System:**
- Daily backups (auto-rotate last 30 days)
- Weekly backups (full year)
- Monthly backups (2 years)
- Easy admin dashboard
- One-click restore
- Clear space tracking

### Space You'll Have After Setup:

```
sdb1 (Cloud Storage): 465.8 GB
├─ User Files: ~400 GB (active)
├─ Versions: ~50 GB
├─ Temp: ~15 GB
└─ FREE: Keep 5-10% buffer (~23 GB minimum)

sdb2 (Backups): 465.8 GB
├─ Daily Backups: 17 GB (30 days)
├─ Weekly Backups: 120 GB (52 weeks)
├─ Monthly Backups: 360 GB (24 months)
├─ Upload Backups: 100 GB (mirrors)
└─ FREE: ~130 GB (good buffer for growth)

TOTAL SAFE BACKUP STORAGE: ~145 GB backing up 400 GB of files ✅
```

---

## Questions Before Implementation:

1. **Custom Quotas:**
   - ✅ Each user should have custom quota (yes/no)?
   - Should roles have different defaults? (Admin 50GB, Manager 20GB, etc.?)
   - Should we keep history of all quota changes?

2. **Backups:**
   - How many months of monthly backups to keep? (24 months = 2 years?)
   - Should we also backup user upload files or just database?
   - Should daily backups auto-delete after 30 days?
   - Store monthly backups externally (USB drive) or on sdb2?

3. **Notifications:**
   - Email admin when backup fails?
   - Email admin when disk space low?
   - Email user when quota is exceeded?

---

**Ready to implement? Answer the 3 questions above and I'll build the entire system!**
