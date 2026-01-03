# External Disk Analysis Report
**Date:** January 2, 2026

---

## Executive Summary

You have an **external USB disk (931.5 GB total)** connected to the system with **2 equal partitions**, but they are currently **NOT MOUNTED**. This is a critical issue because your cloud storage system is configured to use `/mnt/backup_drive/av-rentals/cloud-storage` but has no actual disk mount point.

---

## 1. Disk Hardware Information

### Physical Disk Details
```
Disk Model:        YongzhenWeiye (External USB)
Total Capacity:    931.51 GiB (1 TB)
Interface:         USB
Sector Size:       4096 bytes (physical)
Partition Table:   GPT (GUID Partition Table)
Disk ID:           E4CFD658-7889-47EB-BA67-35CCDA4666C4
System Device:     /dev/sdb
Status:            ⚠️ NOT MOUNTED - CRITICAL ISSUE
```

---

## 2. Partition Configuration

### Partition 1: sdb1 (AV_BACKUPS)
```
Partition Label:   AV_BACKUPS
Mount Point:       ❌ NOT MOUNTED
Filesystem Type:   ext4 (Linux filesystem)
Capacity:          465.8 GiB
Block Size:        4096 bytes
UUID:              b7d68f1c-adf6-40dd-8518-8799d5dea3e1
PARTUUID:          975fb7c8-6cd7-4a58-8e1e-9dfaf4646ecb
Start Sector:      2,048
End Sector:        976,762,879
Status:            ⚠️ UNMOUNTED - Storage accessible but not integrated
```

### Partition 2: sdb2 (SERVER_DATA)
```
Partition Label:   SERVER_DATA
Mount Point:       ❌ NOT MOUNTED
Filesystem Type:   ext4 (Linux filesystem)
Capacity:          465.8 GiB
Block Size:        4096 bytes
UUID:              c3206bef-1b4b-4a79-b2e6-d80f7baafdee
PARTUUID:          dc0e9c59-06d3-4177-97a1-60f0b50f8750
Start Sector:      976,762,880
End Sector:        1,953,523,711
Status:            ⚠️ UNMOUNTED - Storage accessible but not integrated
```

### Partition Layout
```
┌─────────────────────────────────────────────────┐
│           /dev/sdb - 931.5 GiB Total            │
├──────────────────────┬──────────────────────────┤
│   sdb1 (465.8 GiB)   │   sdb2 (465.8 GiB)      │
│   AV_BACKUPS         │   SERVER_DATA            │
│   ext4 (UNMOUNTED)   │   ext4 (UNMOUNTED)       │
└──────────────────────┴──────────────────────────┘
```

---

## 3. Current System Storage Status

### Host System (sda)
```
Disk:              /dev/sda (119.2 GiB internal SSD)
├─ sda1 (1 MiB):   Boot partition
├─ sda2 (2 GB):    /boot (102 MiB used, 1.7 GiB free)
└─ sda3 (117.2 GB): LVM2 Physical Volume
    └─ ubuntu--vg-ubuntu--lv (58.6 GiB):
       Mount:     /
       Usage:     35 GiB used (60%) / 20 GiB free
```

### Mount Points
```
Currently Mounted:
├─ / (root)              → 35 GB used of 58.6 GB (64% capacity) ⚠️ APPROACHING FULL
├─ /boot                 → 102 MB used of 2.0 GB (6%)
└─ /mnt/backup           → Empty directory (no filesystem mounted)
```

---

## 4. CRITICAL ISSUES IDENTIFIED

### Issue 1: External Disk NOT Mounted
**Severity:** 🔴 CRITICAL

- Both partitions on /dev/sdb exist and are detected
- **Neither partition is mounted** to the filesystem
- The system cannot access or write to these disks
- Your cloud storage application is configured to use `/mnt/backup_drive/av-rentals/cloud-storage`
- This path has **no actual disk mounted** - files would be written to the **root filesystem** (`/`)

**Evidence:**
```
$ mount | grep sdb
(no output - disk is not mounted)

$ df | grep sdb
(no output - disk is not mounted)

$ ls -la /mnt/backup
total 8
drwxr-xr-x 2 root root 4096 Dec 29 12:31 ..
(directory exists but is empty - not a mount point)
```

### Issue 2: Root Filesystem Nearly Full
**Severity:** 🟠 HIGH

- Root filesystem (`/`) is at **60% capacity** (35 GB of 58.6 GB used)
- Only **20 GB free** remaining
- If cloud storage path `/mnt/backup_drive/...` is written to without proper mount:
  - Files would go to `/` instead of external disk
  - Could cause system crash when root fills up
  - Could cause data loss or corruption

### Issue 3: No fstab Entry
**Severity:** 🟠 HIGH

- Partitions not configured in `/etc/fstab`
- Manual mounts would be **lost on system reboot**
- No automatic mounting on startup

### Issue 4: No Persistent Mount Configuration
**Severity:** 🟠 MEDIUM

- Disk would need to be remounted after each system restart
- Not suitable for production cloud storage service

---

## 5. Partition Health & Filesystem Status

### Filesystem Check Results
```
sdb1 (AV_BACKUPS):
  Type:           ext4
  Status:         ✅ Valid ext4 filesystem
  UUID:           b7d68f1c-adf6-40dd-8518-8799d5dea3e1
  Mounted:        ❌ NO
  Data Access:    ❌ BLOCKED (not mounted)

sdb2 (SERVER_DATA):
  Type:           ext4
  Status:         ✅ Valid ext4 filesystem
  UUID:           c3206bef-1b4b-4a79-b2e6-d80f7baafdee
  Mounted:        ❌ NO
  Data Access:    ❌ BLOCKED (not mounted)
```

---

## 6. Recommendations

### IMMEDIATE ACTIONS (DO FIRST)

#### Step 1: Mount the External Disk
Run these commands as root:

```bash
# Create mount points
sudo mkdir -p /mnt/backup_drive
sudo mkdir -p /mnt/server_data

# Mount both partitions
sudo mount /dev/sdb1 /mnt/backup_drive
sudo mount /dev/sdb2 /mnt/server_data

# Verify mounts
df -h | grep sdb
mount | grep sdb
```

#### Step 2: Set Correct Permissions
```bash
# Allow your application to read/write
sudo chown -R feliciano:feliciano /mnt/backup_drive
sudo chown -R feliciano:feliciano /mnt/server_data
sudo chmod -R 755 /mnt/backup_drive
sudo chmod -R 755 /mnt/server_data
```

#### Step 3: Verify Cloud Storage Path
```bash
# Check if cloud storage directory exists
ls -la /mnt/backup_drive/av-rentals/

# If it exists, check contents
du -sh /mnt/backup_drive/av-rentals/cloud-storage

# If it doesn't exist, create it
mkdir -p /mnt/backup_drive/av-rentals/cloud-storage
```

### PERSISTENT CONFIGURATION (Long-term)

#### Step 4: Add to fstab for Automatic Mounting
Edit `/etc/fstab` and add these lines:

```bash
# External USB Disk Partitions
UUID=b7d68f1c-adf6-40dd-8518-8799d5dea3e1 /mnt/backup_drive ext4 defaults,nofail 0 2
UUID=c3206bef-1b4b-4a79-b2e6-d80f7baafdee /mnt/server_data ext4 defaults,nofail 0 2
```

**How to do it:**
```bash
sudo nano /etc/fstab
# Add the two lines above at the end
# Save with Ctrl+O, Enter, Ctrl+X
```

**Verify syntax:**
```bash
sudo mount -a
```

#### Step 5: Test Mount Persistence
```bash
# Restart the system
sudo reboot

# After reboot, verify mounts are still there
df -h | grep sdb
```

---

## 7. Partition Usage Recommendations

### sdb1 - AV_BACKUPS (465.8 GiB)
**Suggested Use:**
- Automated system/database backups
- Archive of old/inactive projects
- Cold storage for compliance

**Example Structure:**
```
/mnt/backup_drive/
├── av-rentals/
│   ├── cloud-storage/      (current: ~10GB quota per user)
│   ├── database-backups/   (PostgreSQL dumps)
│   └── system-backups/     (full system snapshots)
└── archives/
    └── older-projects/
```

### sdb2 - SERVER_DATA (465.8 GiB)
**Suggested Use:**
- Alternative storage for high-availability setup
- Mirror/redundancy of important data
- Separate from backup partition for safety

**Example Structure:**
```
/mnt/server_data/
├── av-rentals-mirror/     (duplicate of active cloud storage)
├── media/                 (video, images, large files)
└── logs/                  (application/system logs)
```

---

## 8. Cloud Storage Integration

### Current Configuration (In env file)
```
EXTERNAL_STORAGE_PATH="/mnt/backup_drive/av-rentals/cloud-storage"
EXTERNAL_STORAGE_TEMP="/mnt/backup_drive/av-rentals/cloud-storage/temp"
DEFAULT_STORAGE_QUOTA="10737418240"  # 10GB per user
```

### After Mounting
Once `/mnt/backup_drive` is mounted:

1. Cloud storage files will be saved to the external disk ✅
2. Large uploads won't fill root filesystem ✅
3. Multiple users can store up to 10GB each
4. With 465.8 GiB available:
   - Can support **~46 concurrent users** (at 10GB each)
   - Or **~94 users** if average is 5GB

### Verify Cloud Storage is Working
```bash
# After mounting, check that path is accessible
ls -la /mnt/backup_drive/av-rentals/cloud-storage/

# Rebuild Docker containers
docker-compose build --no-cache
docker-compose up -d

# Check logs for any storage errors
docker-compose logs -f app | grep -i "storage\|error"
```

---

## 9. System Capacity Analysis

### Current Disk Space
```
Internal SSD (sda3):     58.6 GiB total
├─ Used:                35.0 GiB (60%)
├─ Free:                20.0 GiB (34%)
└─ Critical Level:      ~5 GiB ⚠️ APPROACHING

External USB (sdb):     931.5 GiB total
├─ sdb1 (Backup):       465.8 GiB ❌ UNMOUNTED
└─ sdb2 (Server):       465.8 GiB ❌ UNMOUNTED
```

### Capacity Planning for Cloud Storage
```
Once External Disk Mounted:
─────────────────────────────
Available Space:        465.8 GiB (sdb1 for cloud storage)
Default Quota/User:     10 GiB
Max Concurrent Users:   ~46 users
Max Data Storage:       ~465 users (at 5GB average)
Recommended Threshold:  Keep 10% free (46.6 GiB minimum)
Usable Space:           ~419 GiB (after 10% buffer)
```

---

## 10. Action Plan Summary

| Priority | Action | Impact | Timeline |
|----------|--------|--------|----------|
| 🔴 CRITICAL | Mount sdb1 and sdb2 | Cloud storage will work | 5 minutes |
| 🔴 CRITICAL | Set correct permissions | App can read/write files | 2 minutes |
| 🟠 HIGH | Add to fstab | Persistent across reboots | 5 minutes |
| 🟠 HIGH | Rebuild Docker containers | App uses external disk | 10 minutes |
| 🟡 MEDIUM | Create backup plan | Data protection | 30 minutes |
| 🟡 MEDIUM | Monitor disk usage | Prevent full disk | Ongoing |

---

## 11. Next Steps

1. **Run immediate mounting commands** (see Step 1)
2. **Verify mounts are accessible** (ls -la /mnt/backup_drive)
3. **Add to fstab** for persistence (see Step 4)
4. **Rebuild containers** to ensure cloud storage uses new mount
5. **Test file upload** through cloud drive feature
6. **Monitor disk usage** with: `df -h /mnt/backup_drive`

---

## Files to Reference
- Cloud Storage Configuration: [src/lib/storage.ts](src/lib/storage.ts#L5-L6)
- Upload Handler: [src/app/api/cloud/files/upload/route.ts](src/app/api/cloud/files/upload/route.ts)
- Database: [prisma/schema.prisma](prisma/schema.prisma#L517-L630)

---

**Report Generated:** January 2, 2026  
**System:** Linux host with external USB disk (931.5 GiB)  
**Status:** ⚠️ ACTION REQUIRED - Disks not mounted
