# Cloud Storage Documentation

## Overview

The AV Rentals application now includes a fully-featured cloud storage system similar to Google Drive. Users can store, organize, and share files with granular permission controls.

## Features Implemented

### 1. **File & Folder Management**
- Upload single or multiple files simultaneously
- Create and organize folders with custom colors
- Rename files and folders
- Star (favorite) items for quick access
- Soft delete to trash, with restore functionality
- Permanent deletion with confirmation

### 2. **Storage Organization**
- Nested folder hierarchy with parent tracking
- File metadata storage (name, size, MIME type, version)
- Automatic file size tracking
- Per-user storage quotas with visual progress indicator
- Support for all file types

### 3. **Sharing & Collaboration**
- Create shareable links with time-based expiration
- Permission levels: View, Edit, Admin
- Public shares with token-based access
- Share revocation
- Permission management per share

### 4. **File Discovery**
- Full-text search across file and folder names
- Star system for favorites
- Recent activity tracking
- Folder browsing with item counts

### 5. **User Interface**
- Responsive grid view for files and folders
- Drag-and-drop ready (infrastructure in place)
- Breadcrumb navigation
- Quick actions sidebar
- Storage quota display with health warnings
- File preview modal (images, videos, audio, text, PDF)
- Activity log showing recent operations

### 6. **Admin Features**
- Storage dashboard with real-time disk health
- Disk usage monitoring
- Critical capacity alerts (>90% full)
- Automatic admin notifications
- Per-user storage tracking

### 7. **File Versioning**
- Automatic version history tracking
- Timestamp for each version
- Version comparison support

### 8. **Activity Logging**
- Track all file operations (upload, download, delete, rename, share)
- User activity audit trail
- Timestamp for each action

## Storage Configuration

### Default Paths
```
External Disk: /mnt/backup_drive/av-rentals/cloud-storage
├── {userId}/
│   ├── files/
│   │   ├── {folderId}/
│   │   │   └── {filename}
│   │   └── ...
│   ├── versions/
│   │   └── {fileId}/
│   │       ├── v1
│   │       ├── v2
│   │       └── ...
│   └── temp/
└── ...
```

### Environment Variables
```env
# Storage Configuration
STORAGE_PATH=/mnt/backup_drive/av-rentals/cloud-storage
TEMP_DIR=/mnt/backup_drive/av-rentals/cloud-storage/temp
DEFAULT_STORAGE_QUOTA=10737418240  # 10GB
DISK_HEALTH_CHECK_INTERVAL=300000  # 5 minutes
ADMIN_DISK_ALERT_THRESHOLD=90      # 90% full
```

## API Endpoints

### Folders
- `GET /api/cloud/folders` - List root folders
- `POST /api/cloud/folders` - Create new folder
- `PATCH /api/cloud/folders/[id]` - Update folder (rename, move, star, color)
- `DELETE /api/cloud/folders/[id]` - Delete folder (soft or permanent)

### Files
- `GET /api/cloud/files` - List files in folder
- `POST /api/cloud/files/upload` - Upload files (multi-file support)
- `GET /api/cloud/files/[id]` - Download file
- `PATCH /api/cloud/files/[id]` - Update file (rename, move, star)
- `DELETE /api/cloud/files/[id]` - Delete file (soft or permanent)

### Trash
- `GET /api/cloud/trash` - List trashed items
- `POST /api/cloud/trash` - Restore from trash
- `DELETE /api/cloud/trash` - Permanently delete

### Sharing
- `POST /api/cloud/share` - Create share
- `GET /api/cloud/share?fileId=...` - List shares for file
- `GET /api/cloud/share/[token]` - Get shared file metadata (public)
- `DELETE /api/cloud/share/[id]` - Remove share

### Search
- `GET /api/cloud/search?q=...&type=...` - Search files/folders

### Storage
- `GET /api/cloud/storage` - Get user's storage quota
- `GET /api/cloud/health` - Get disk health (admin only)

### Activity
- `GET /api/cloud/activity` - Get user's activity log

## Navigation

### Main Cloud Storage Page
- Route: `/cloud`
- Features: File/folder grid view, upload, create folder, search
- Sidebar: Quick actions, storage quota, recent activity

### Trash Page
- Route: `/cloud/trash`
- Features: View deleted items, restore or permanently delete
- Cleanup: Items auto-purged after 30 days

### Shared with Me
- Route: `/cloud/shared`
- Features: View files shared by others
- Permission-based visibility

### Starred Items
- Route: `/cloud/starred`
- Features: Quick access to favorite files

### Public Share Page
- Route: `/share/[token]`
- Features: No authentication required
- Permission validation and expiry checking

### Storage Dashboard (Admin)
- Route: `/cloud/storage-dashboard`
- Features: Disk health, usage metrics, capacity warnings
- Admin only

## Database Schema

### Core Tables
- `CloudFolder` - Folder metadata and hierarchy
- `CloudFile` - File metadata and references
- `FileShare` - Sharing configuration
- `FolderShare` - Folder sharing configuration
- `FileVersion` - Version history
- `FileActivity` - Audit log
- `StorageQuota` - Per-user storage limits

### Key Relationships
- Files and Folders link to User via ownerId
- FileShare and FolderShare reference their respective items
- FileVersion tracks all revisions
- FileActivity logs all operations

## Security Features

### Authentication
- JWT-based authentication
- HTTP-only cookies for tokens
- Server-side validation on all endpoints

### Authorization
- User can only access their own files
- Share permissions enforced per operation
- Admin-only endpoints protected
- Public shares validated by token and expiry

### File Safety
- Soft delete to trash before permanent deletion
- Atomic transactions (DB + filesystem together)
- BigInt support for large file sizes
- Proper error handling with rollback

## Performance Optimizations

- Pagination for activity logs
- Incremental disk health checks (cached)
- Database indexing on userId and timestamps
- Efficient blob storage on external disk
- Atomic multi-file uploads

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `409` - Conflict
- `507` - Insufficient storage
- `500` - Server error

## Future Enhancements

1. **Advanced Features**
   - Drag-and-drop file upload and organization
   - Keyboard shortcuts
   - Batch operations (multi-select, bulk delete)
   - File comments and collaboration
   - Real-time sync across devices

2. **Improvements**
   - Webp image optimization
   - Automatic thumbnail generation
   - Full-text search with filtering
   - Integration with external cloud storage (S3, Azure)
   - Backup and recovery tools

3. **Admin Tools**
   - Per-user quota management
   - Storage usage reports
   - Compliance auditing
   - Recovery from trash bins
   - Disk cleanup automation

## Testing the Cloud Storage

### Quick Start
1. Login with user credentials
2. Click "Cloud Storage" in sidebar or header
3. See `/app-select` choice screen if first time
4. Choose "Cloud" to enter cloud storage
5. Use "Upload" button to add files
6. Use "New Folder" to create folders
7. Right-click or use action menus for operations

### Test Scenarios
- Upload single file
- Upload multiple files
- Create nested folders
- Star items
- Delete and restore
- Share and access via link
- Check storage quota
- View activity log

## Notes

- Default storage quota: 10GB per user
- External disk must be mounted at `/mnt/backup_drive`
- Disk health checked every 5 minutes
- Admin alerts at 90% capacity
- Trash items kept for 30 days before auto-delete
- BigInt used for large file sizes (>2GB)
- TypeScript throughout for type safety
