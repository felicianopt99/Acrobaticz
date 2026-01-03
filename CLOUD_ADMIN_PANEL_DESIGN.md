# Cloud Storage Admin Control Panel - Design Proposal

## Current State vs. Proposed State

### What You Currently Have ✅
- **Basic Storage Dashboard** (`/admin/storage-dashboard`)
  - Shows overall disk health
  - Displays total capacity, used, available space
  - Shows usage percentage with warnings
  - Last check timestamp
  - Admin-only access

### What's Missing ❌
- **Per-user storage management**
- **User quota controls**
- **Individual user storage breakdown**
- **Quota increase/decrease functionality**
- **User file management** (view, delete, manage files)
- **Storage alerts & thresholds**
- **Backup and archive management**
- **Storage analytics & reports**

---

## Proposed Enhanced Admin Panel

### **Main Page: Dashboard Overview**

#### Section 1: System Health (Current + Enhanced)
```
┌─────────────────────────────────────────────────────┐
│ DISK STATUS: Healthy (85% Full) 🟠 Warning          │
├─────────────────────────────────────────────────────┤
│ Total Capacity:    465.8 GB  (sdb1 - Cloud Storage) │
│ Used:              393.1 GB  │████████░│ 85%        │
│ Available:         72.7 GB   (Critical at 90%)       │
│ System Health:     ✅ Accessible, ✅ Writable        │
│ Last Check:        2 minutes ago                     │
└─────────────────────────────────────────────────────┘
```

---

#### Section 2: Quick Stats (NEW)
```
┌──────────────────┬──────────────────┬──────────────────┐
│ Active Users     │ Total Files      │ Avg Usage/User   │
│       18/46      │    2,847         │   21.8 GB        │
│ (39% capacity)   │                  │                  │
└──────────────────┴──────────────────┴──────────────────┘
```

---

#### Section 3: Top Storage Users (NEW)
```
┌─────────────────────────────────────────────────────────┐
│ User                Usage      Quota     % Used Status  │
├─────────────────────────────────────────────────────────┤
│ 1. John Smith      9.8 GB   / 10 GB      98% ⚠️         │
│ 2. Jane Doe        8.2 GB   / 10 GB      82% ✅         │
│ 3. Mike Johnson    7.5 GB   / 10 GB      75% ✅         │
│ 4. Sarah Lee       6.3 GB   / 10 GB      63% ✅         │
│ 5. Robert Brown    5.9 GB   / 10 GB      59% ✅         │
│                                                          │
│ [View All Users] [Export Report]                       │
└─────────────────────────────────────────────────────────┘
```

---

#### Section 4: Storage Alerts (NEW)
```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ ALERTS                                               │
├─────────────────────────────────────────────────────────┤
│ • John Smith (98% full) - May need quota increase       │
│ • System disk at 85% - Consider cleanup                 │
│ • 3 users above 80% quota                               │
│                                                          │
│ [Configure Alert Thresholds]                            │
└─────────────────────────────────────────────────────────┘
```

---

### **Page 2: User Management & Quotas**

#### View: All Users with Storage Control
```
┌─────────────────────────────────────────────────────────────────────┐
│ Users                          │ Storage │ Quota │ Actions          │
├─────────────────────────────────────────────────────────────────────┤
│ John Smith                     │ 9.8 GB  │ 10 GB │ [Manage] [More]  │
│ ├─ Folders: 5                  │         │       │                  │
│ ├─ Files: 234                  │         │       │                  │
│ ├─ Last Activity: 2 hours ago  │         │       │                  │
│                                │         │       │                  │
│ Jane Doe                       │ 8.2 GB  │ 10 GB │ [Manage] [More]  │
│ ├─ Folders: 3                  │         │       │                  │
│ ├─ Files: 189                  │         │       │                  │
│ ├─ Last Activity: 30 mins ago  │         │       │                  │
│                                │         │       │                  │
│ Mike Johnson                   │ 7.5 GB  │ 10 GB │ [Manage] [More]  │
│                                │         │       │                  │
│ [Search] [Filter] [Export]                                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

#### Modal: User Storage Management
When clicking **[Manage]** on a user:

```
┌──────────────────────────────────────────────────────────┐
│ Manage Storage - John Smith                         [✕]  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ CURRENT USAGE                                             │
│ ├─ Files: 234 files, 9.8 GB total                        │
│ ├─ Folders: 5 folders                                    │
│ ├─ Versions: 48 old versions stored                      │
│ ├─ Trash: 156 MB (can be purged)                        │
│                                                           │
│ QUOTA SETTINGS                                            │
│ ├─ Current Quota: 10 GB                                  │
│ ├─ Used: 9.8 GB (98% full) ⚠️                            │
│ ├─ Available: 200 MB                                     │
│                                                           │
│ CHANGE QUOTA                                              │
│ ├─ New Quota: [15] GB                                    │
│ ├─ [ ] Notify user of change                             │
│ ├─ [Increase] [Keep] [Decrease]                          │
│                                                           │
│ USER FILES                                                │
│ ├─ [View All Files]  [Delete Old Files]                  │
│ ├─ [Clear Trash]     [Purge Old Versions]                │
│                                                           │
│ ACTIONS                                                   │
│ ├─ [ ] Freeze account (prevent uploads)                  │
│ ├─ [ ] Archive old files (move to long-term storage)    │
│ └─ [Save Changes]                                        │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

#### Feature Details:

**1. Quota Management**
- View current quota and usage
- Increase quota (e.g., 10GB → 15GB → 20GB → 50GB)
- Decrease quota (with warning if user would exceed new limit)
- Bulk quota changes for multiple users
- Preset tiers: Small (5GB), Standard (10GB), Professional (20GB), Enterprise (50GB)
- Optional email notification to user when changed

**2. User File Browsing**
- View all files and folders for a user
- See file sizes, types, creation dates
- Sort by: size, date, type
- Search within user's files
- View file versions (how many old versions stored)

**3. Storage Cleanup Actions**
```
Actions Available:
├─ Clear Trash (permanently delete)
├─ Purge Old Versions (keep only latest)
├─ Delete Duplicate Files (if system detects them)
├─ Move to Archive (sdb2 - SERVER_DATA partition)
└─ Disable Account (prevent new uploads)
```

**4. Alerts & Notifications**
- Notify user when quota is 80% full
- Notify user when quota is 95% full
- Notify admin when system disk is 85%+ full
- Configurable alert thresholds

---

### **Page 3: Storage Analytics & Reports**

#### Section: Usage Trends
```
┌─────────────────────────────────────────────────────────┐
│ Storage Usage Over Time                                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 500 GB  │                                               │
│ 400 GB  │     ╭────────╮                                │
│ 300 GB  │    ╱          ╲                               │
│ 200 GB  │  ╱              ╲                             │
│ 100 GB  │╱                  ╲________                   │
│   0 GB  └────────────────────────────                  │
│         Jan Feb Mar Apr May Jun Jul Aug                 │
│                                                          │
│ [Export Data] [Print Report]                            │
└─────────────────────────────────────────────────────────┘
```

**Data Shown:**
- Total system usage over time
- Per-user usage trends
- File type breakdown (images, documents, videos, other)
- Growth rate projections

---

#### Section: File Type Analysis
```
┌─────────────────────────────────────────────────────────┐
│ Storage by File Type                                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Documents (PDF, Word, Excel)  │███████░│ 42%  186 GB    │
│ Images (JPG, PNG, etc.)       │████░░░░│ 28%  124 GB    │
│ Videos (MP4, MOV, etc.)       │███░░░░░│ 18%   79 GB    │
│ Other Files                   │██░░░░░░│ 12%   53 GB    │
│                                                          │
│ Most Common Extensions:                                 │
│ 1. .pdf  (892 files) 124 GB                             │
│ 2. .jpg  (1.2K files) 89 GB                             │
│ 3. .docx (456 files) 12 GB                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

### **Page 4: Backup & Archive Management**

#### Partition Management
```
┌─────────────────────────────────────────────────────────┐
│ PARTITION 1 (sdb1) - AV_BACKUPS                         │
├─────────────────────────────────────────────────────────┤
│ Mount Point:        /mnt/backup_drive                   │
│ Total Capacity:     465.8 GB                            │
│ Used for Cloud:     393.1 GB  (84%)                     │
│ Status:             ✅ Mounted & Healthy                │
│ File System:        ext4                                │
│                                                          │
│ [View Contents] [Cleanup] [Manage]                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ PARTITION 2 (sdb2) - SERVER_DATA                        │
├─────────────────────────────────────────────────────────┤
│ Mount Point:        /mnt/server_data                    │
│ Total Capacity:     465.8 GB                            │
│ Used for Backups:   58.2 GB  (12.5%)                    │
│ Status:             ✅ Mounted & Healthy                │
│ File System:        ext4                                │
│                                                          │
│ Database Backups:   45.1 GB (78 daily backups × 580MB)  │
│ Monthly Archives:   13.1 GB (12 monthly archives)       │
│                                                          │
│ [View Backups] [Cleanup] [Archive]                      │
└─────────────────────────────────────────────────────────┘
```

#### Backup Management
```
┌─────────────────────────────────────────────────────────┐
│ Recent Database Backups                                 │
├─────────────────────────────────────────────────────────┤
│ • backup_2026_01_02.sql    580 MB   Jan 2, 2026 ✅     │
│ • backup_2026_01_01.sql    578 MB   Jan 1, 2026 ✅     │
│ • backup_2025_12_31.sql    575 MB   Dec 31, 2025 ✅    │
│ • backup_2025_12_30.sql    573 MB   Dec 30, 2025 ✅    │
│                                                          │
│ [Test Restore] [Download] [Delete Old]                 │
└─────────────────────────────────────────────────────────┘
```

---

### **Page 5: Maintenance & Settings**

#### Admin Settings for Cloud Storage
```
┌──────────────────────────────────────────────────────────┐
│ Cloud Storage Settings                                   │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ DEFAULT USER QUOTA                                        │
│ ├─ [10] GB per user                                      │
│ └─ [Save Changes]                                        │
│                                                           │
│ DISK HEALTH CHECK                                         │
│ ├─ Check interval: [5] minutes                           │
│ ├─ Critical threshold: [90]%                             │
│ ├─ Warning threshold: [75]%                              │
│ └─ [Save Changes]                                        │
│                                                           │
│ AUTO-CLEANUP SETTINGS                                     │
│ ├─ Delete trash older than: [90] days                    │
│ ├─ Archive files older than: [365] days                  │
│ ├─ Delete old versions older than: [180] days            │
│ └─ [ ] Enable automatic cleanup (runs daily at 2 AM)    │
│                                                           │
│ NOTIFICATIONS                                             │
│ ├─ [ ] Email admin when disk > 80%                       │
│ ├─ [ ] Email user when quota > 80%                       │
│ ├─ [ ] Email user when quota > 95%                       │
│ └─ Alert email: [admin@acrobaticzrental.com]             │
│                                                           │
│ STORAGE MONITORING                                        │
│ ├─ [ ] Generate daily usage reports                      │
│ ├─ [ ] Send weekly summary to admin                      │
│ └─ Report format: [ PDF | CSV | Both ]                   │
│                                                           │
│ [Save All Settings]  [Reset to Defaults]                │
└──────────────────────────────────────────────────────────┘
```

---

## Implementation Roadmap

### Phase 1: Core User Management (Week 1)
- ✅ List all users with storage usage
- ✅ Show per-user quota and usage percentage
- ✅ Individual user quota adjustment modal
- ✅ Bulk quota management
- 📊 New API: `GET /api/admin/cloud/users` - List users with storage
- 📊 New API: `PUT /api/admin/cloud/users/{userId}/quota` - Update quota

### Phase 2: User File Management (Week 2)
- ✅ View all files for a user
- ✅ Clear user's trash
- ✅ Purge old file versions
- ✅ Delete specific files (admin)
- 📊 New API: `GET /api/admin/cloud/users/{userId}/files` - List user files
- 📊 New API: `DELETE /api/admin/cloud/users/{userId}/files/{fileId}` - Delete file

### Phase 3: Analytics & Reporting (Week 3)
- ✅ Storage usage trends chart
- ✅ File type breakdown
- ✅ Top users list
- ✅ Export reports (CSV, PDF)
- 📊 New API: `GET /api/admin/cloud/analytics` - Get usage stats
- 📊 New API: `GET /api/admin/cloud/analytics/trends` - Get trends

### Phase 4: Alerts & Maintenance (Week 4)
- ✅ Alert management dashboard
- ✅ Automatic cleanup tasks
- ✅ Backup management interface
- ✅ Settings & configuration panel
- 📊 New API: `GET /api/admin/cloud/alerts` - Get active alerts
- 📊 New API: `POST /api/admin/cloud/maintenance/cleanup` - Run cleanup

---

## Database Changes Needed

### New Tables (Optional - for advanced features)
```sql
-- For tracking alerts
CREATE TABLE storage_alerts (
  id UUID PRIMARY KEY,
  userId UUID,
  alertType VARCHAR (50), -- 'quota_warning', 'disk_critical', etc.
  threshold INT, -- 80, 90, 95
  active BOOLEAN DEFAULT true,
  lastTriggered TIMESTAMP,
  createdAt TIMESTAMP DEFAULT now()
);

-- For tracking cleanup tasks
CREATE TABLE storage_cleanup_jobs (
  id UUID PRIMARY KEY,
  jobType VARCHAR(50), -- 'delete_trash', 'purge_versions', 'archive'
  status VARCHAR(50), -- 'pending', 'running', 'completed', 'failed'
  startedAt TIMESTAMP,
  completedAt TIMESTAMP,
  filesAffected INT,
  bytesFreed BIGINT,
  createdAt TIMESTAMP DEFAULT now()
);
```

---

## UI Components to Create

```
src/components/admin/cloud/
├── CloudStorageOverview.tsx       (main dashboard)
├── UserStorageList.tsx            (user table)
├── UserQuotaModal.tsx             (quota management)
├── UserFilesModal.tsx             (file browser)
├── StorageChart.tsx               (usage trends)
├── FileTypeBreakdown.tsx           (pie chart)
├── AlertsPanel.tsx                (active alerts)
├── BackupManager.tsx              (backup controls)
└── StorageSettings.tsx            (admin settings)
```

---

## Easy Explanation

**What we're building:**

Think of the admin panel as a **control center** for cloud storage:

1. **Dashboard** = Overview of everything
   - How much space is used? (like a gas gauge)
   - Is everything working? (health check)
   - Who's using the most space?

2. **User Management** = Control each person's storage
   - See how much space each person uses
   - Change their storage limit (like giving them more or less shelf space)
   - Clean up their old files

3. **Analytics** = Understand the trends
   - What types of files take up space?
   - Is usage growing or shrinking?
   - Make reports for management

4. **Backup** = Keep data safe
   - See all database backups
   - Test if we can restore them
   - Manage where backups are stored

5. **Settings** = Configure how it works
   - Set default storage per user
   - Auto-delete old files
   - Send alerts when space is low

---

## Questions Before Implementation

1. **User Quota Tiers:** Should quotas be:
   - Fixed per user (everyone gets 10GB)?
   - Role-based (Admin=50GB, Manager=20GB, etc.)?
   - Custom per user?
   - ✅ **Recommendation:** Role-based + individual override

2. **Automatic Cleanup:** Should old files be:
   - Manually deleted by admin?
   - Auto-deleted after X days?
   - Auto-archived to secondary storage?
   - ✅ **Recommendation:** Configurable + archived to sdb2 first

3. **Alerts:** Should you be notified by:
   - Email?
   - In-app notifications?
   - Dashboard alerts only?
   - ✅ **Recommendation:** All three

4. **File Deletion:** Should deleted files:
   - Go to trash (recoverable)?
   - Permanently deleted immediately?
   - Archive for 30 days then delete?
   - ✅ **Recommendation:** Trash for 30 days, then purge

---

**Should I proceed with implementation? Any changes to this design?**
