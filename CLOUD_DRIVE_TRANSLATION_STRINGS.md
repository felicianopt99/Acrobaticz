# Cloud Drive Translation Strings - Extraction Report

## Overview
This document contains all discoverable English text strings from the Cloud Drive feature that require Portuguese translation.

---

## Cloud Drive File Structure

### Pages (in `/src/app/`)
- `src/app/cloud/page.tsx` - Main cloud storage page (legacy/alternative)
- `src/app/(cloud)/drive/page.tsx` - My Drive main page
- `src/app/(cloud)/drive/recent/page.tsx` - Recent files page
- `src/app/(cloud)/drive/shared/page.tsx` - Shared with me page
- `src/app/(cloud)/drive/starred/page.tsx` - Starred items page
- `src/app/(cloud)/drive/trash/page.tsx` - Trash page
- `src/app/(cloud)/drive/folder/[id]/page.tsx` - Folder view page
- `src/app/(cloud)/layout.tsx` - Cloud drive layout wrapper
- `src/app/cloud/storage-dashboard/page.tsx` - Storage management dashboard

### Components (in `/src/components/cloud/`)
1. **ActivityLog.tsx** - Activity log display
2. **BatchActionsToolbar.tsx** - Multi-select actions toolbar
3. **BreadcrumbNav.tsx** - Folder navigation breadcrumbs
4. **CloudHeader.tsx** - Main header with search and user menu
5. **CloudLayoutClient.tsx** - Client-side layout wrapper
6. **CloudMobileNav.tsx** - Mobile navigation menu
7. **CloudPageContent.tsx** - Main content area (legacy/alternative)
8. **CloudSidebar.tsx** - Left sidebar with navigation
9. **DriveContent.tsx** - Main drive content (grid/list view)
10. **EnhancedCloudPage.tsx** - Enhanced cloud page variant
11. **FileList.tsx** - File table display
12. **FilePreviewModal.tsx** - File preview dialog
13. **FilterPanel.tsx** - File filtering options
14. **FolderBreadcrumb.tsx** - Alternative breadcrumb component
15. **RecentContent.tsx** - Recent files display
16. **ShareDialog.tsx** - File sharing dialog
17. **SharedContent.tsx** - Shared files view
18. **SharedPageContent.tsx** - Alternative shared content view
19. **StarredContent.tsx** - Starred files view
20. **StarredPageContent.tsx** - Alternative starred view
21. **StorageDashboardContent.tsx** - Storage dashboard component
22. **StorageQuotaDisplay.tsx** - Storage quota progress display
23. **TagManager.tsx** - File tagging system
24. **TrashContent.tsx** - Trash files view
25. **TrashPageContent.tsx** - Alternative trash view

---

## Comprehensive Translation String List

### Navigation & Labels

#### Sidebar Navigation Items
```
My Drive
Starred
Shared with me
Recent
Trash
```

#### Header & Menu Labels
```
Cloud Storage
Cloud
Dashboard
Settings
Help
Keyboard Shortcuts
Sign out
Logged out
```

### File Operations

#### Upload/Create
```
New
New folder
File upload
Folder upload
Upload Files
Upload
Upload failed
Upload successful
Folder created
Folder created successfully
Failed to create folder
Folder name...
{files.length} file(s) uploaded
{files.length} file(s) uploaded successfully
Please try again
```

#### Download/View
```
Download
Download failed
View
Preview
```

#### Rename
```
Rename
File renamed successfully
Folder renamed successfully
Failed to rename file
Failed to rename folder
Save
Cancel
```

#### Delete/Move
```
Delete
Move
Trash
Trash 2
Moved to trash
File moved to trash
Folder moved to trash
Move Items
Delete Items
{selectedCount} selected
Deleted {selectedCount} items{permanent ? ' permanently' : ' to trash'}
Failed to delete items
Failed to move items
Deleted {selectedCount} items permanently
Failed to delete file
Failed to delete folder
```

#### Share
```
Share
Share Items
Shared {selectedCount} items
Failed to share items
Share "{fileName}"
Manage who can access this file
Add New Share
Active Shares
No active shares
Permission
View
Edit
Admin
Public
Private
Copy
Copied to clipboard
Expires
File shared successfully
Failed to share file
```

### File/Folder Details

#### File Properties
```
Name
Size
Modified
Date
Created
Type
file
folder
Star
Starred
Remove from starred
Added to starred
Removed from starred
```

#### Storage Display
```
Storage
Storage full. Delete some files to continue.
Storage nearly full. Consider deleting old files.
{formatBytes(quota.usedBytes)} of {formatBytes(quota.quotaBytes)} used
{Math.round(percentUsed)}%
Hard Drive
```

### Activity & History

#### Activity Log
```
Uploaded
Downloaded
Deleted
Renamed
Shared
No recent activity
Activity
History
```

#### Timestamps
```
Just now
{minutes} minutes ago
{hours} hours ago
{days} days ago
```

### Dialogs & Modals

#### Common Dialog Text
```
Success
Error
Title
Description
Cancel
Save
Close
Delete Forever
Restore
```

#### Restore Dialog (Trash)
```
Restore Item
Are you sure you want to restore this item?
Restore forever
Delete permanently
Item restored from trash
Item permanently deleted
Restored successfully
Deleted permanently
Restore
```

#### Empty Trash
```
Empty Trash
Empty the trash
This action cannot be undone
Clear all items from trash
Trash emptied
Failed to empty trash
```

#### Create Folder Dialog
```
Create Folder
Enter folder name
New Folder
```

#### Rename Dialog
```
Rename File/Folder
Enter new name
Rename
```

### Search & Filter

#### Search
```
Search files...
Search files and folders...
Search...
Search cloud storage
```

#### View Modes
```
Grid view
List view
Toggle view
View Mode
```

#### Filter Options
```
all
file
folder
Filter
All
Files
Folders
No items found
No files found
No folders found
```

### Storage Dashboard

#### Quota Management
```
Storage Dashboard
Disk Health
User Quotas
Storage full
Storage usage
Available
Total
Percent Used
Used
Quota
Cloud Access
Cloud Enabled
Last Updated
Role Default Quota
Edit Quota
Save Quota
Toggle Cloud Access
View History
Quota History
Edit User Quota
New Quota Bytes
Reason for change
File Count
Folder Count
User
Role
Active
```

#### Disk Health Display
```
Disk accessible
Available
Total
Used Percent
Last Check
Check Disk Health
Refresh
Health Check
```

### Error Messages

#### Generic Errors
```
Error
Error loading content
Failed to load content
Failed to load starred items
Failed to load recent files
Failed to load trash
Failed to load shared items
Failed to load storage data
Failed to load cloud storage
Please try again
Please enter a folder name
Tag name is required
Failed to load tags
Failed to load quota history
```

#### Upload Errors
```
Upload failed
Failed to upload file
Failed to upload folder
```

#### Share Errors
```
Failed to create share
Failed to load shares
Failed to remove share
Failed to share file
Failed to share items
```

#### Quota/Storage Errors
```
Storage full
Storage nearly full
Failed to update quota
Failed to update storage
Failed to toggle cloud access
```

### Tags System

#### Tag Management
```
Manage Tags
Tag name
Create Tag
Add Tag
Remove Tag
Tag created successfully
Tag added to file
Tag removed from file
Failed to create tag
Failed to add tag
Failed to remove tag
```

### Confirmation & Status Messages

#### Batch Operations
```
Moved {selectedCount} items
Shared {selectedCount} items
Deleted {selectedCount} items
Deleted {selectedCount} items permanently
{selectedCount} selected
```

#### Status Messages
```
Loading...
Loading storage data...
Loading content...
Refresh - Reload files and folders from server
Go to Dashboard - Switch to main dashboard
User profile
You have been successfully logged out.
Sign out of your account
Switch to main dashboard view
Configure cloud storage settings
View keyboard shortcuts and tips
```

### Keyboard Shortcuts & Hints

#### Shortcuts
```
Keyboard Shortcuts
Ctrl/Cmd + A
Select all
Delete
Move selected to trash
Escape
Deselect all
Enter
Rename
Shift + Click
Range selection
Ctrl/Cmd + Click
Toggle selection
```

---

## Component Structure Overview

### Page Hierarchy

```
src/app/(cloud)/layout.tsx
├── CloudLayoutClient
├── src/app/(cloud)/drive/page.tsx
│   └── DriveContent.tsx
│       ├── CloudSidebar.tsx
│       ├── CloudHeader.tsx
│       ├── FileList.tsx or Grid View
│       ├── ShareDialog.tsx
│       ├── BatchActionsToolbar.tsx
│       └── FilePreviewModal.tsx
├── src/app/(cloud)/drive/recent/page.tsx
│   └── RecentContent.tsx
├── src/app/(cloud)/drive/shared/page.tsx
│   └── SharedContent.tsx
├── src/app/(cloud)/drive/starred/page.tsx
│   └── StarredContent.tsx
├── src/app/(cloud)/drive/trash/page.tsx
│   └── TrashContent.tsx
└── src/app/cloud/storage-dashboard/page.tsx
    └── StorageDashboardContent.tsx
```

### Component Relationships

#### Main Navigation
- **CloudSidebar.tsx**: Displays navigation menu with labels
  - Links to: My Drive, Starred, Shared with me, Recent, Trash
  - Upload/Create buttons
  - Storage quota display

- **CloudHeader.tsx**: Top header bar
  - Search functionality
  - View mode toggle (Grid/List)
  - User menu
  - Refresh button
  - Dashboard link

- **CloudMobileNav.tsx**: Mobile version of sidebar
  - Responsive navigation
  - Upload options

#### Content Displays
- **DriveContent.tsx**: Main file/folder grid or list
- **FileList.tsx**: Table-based file list view
- **RecentContent.tsx**: Recent files display
- **StarredContent.tsx**: Starred files display
- **SharedContent.tsx**: Shared files display
- **TrashContent.tsx**: Deleted items display

#### Dialogs & Modals
- **ShareDialog.tsx**: File sharing options
- **FilePreviewModal.tsx**: File preview
- **BatchActionsToolbar.tsx**: Multi-select operations
- **TagManager.tsx**: File tagging

#### Admin
- **StorageDashboardContent.tsx**: Storage quota management
- **StorageQuotaDisplay.tsx**: Quota progress bar

#### Utilities
- **ActivityLog.tsx**: Activity history display
- **FolderBreadcrumb.tsx/BreadcrumbNav.tsx**: Navigation path
- **FilterPanel.tsx**: Filter options

---

## Toast Messages (Action Feedback)

### Success Messages
```
Success
Uploaded successfully
Folder created successfully
File renamed successfully
Folder renamed successfully
Item restored from trash
Item permanently deleted
Restored successfully
Deleted permanently
Trash emptied
Shared successfully
Tag created successfully
Tag added to file
Tag removed from file
File shared successfully
Copied
Share link copied to clipboard
Share removed
Quota updated successfully
Cloud access enabled for {user.name}
Cloud access disabled for {user.name}
Removed from starred
Added to starred
Moved {selectedCount} items
Shared {selectedCount} items
Deleted {selectedCount} items
Deleted {selectedCount} items permanently
```

### Error Messages (Toast)
```
Error
{error.message}
Failed to create folder
Failed to rename file
Failed to rename folder
Failed to delete file
Failed to delete folder
Failed to move to trash
Failed to restore item
Failed to delete item
Failed to download file
Failed to update
Failed to load content
Failed to load storage quota
Failed to fetch storage info
Failed to upload file
Failed to upload folder
Failed to share file
Failed to share items
Failed to create share
Failed to load shares
Failed to remove share
Failed to delete share
Failed to toggle cloud access
Failed to update quota
Failed to toggle star
Failed to move items
Failed to delete items
Failed to load starred items
Failed to load recent files
Failed to load trash
Failed to load shared items
Failed to load cloud storage
Failed to create tag
Failed to add tag
Failed to remove tag
Failed to load tags
Failed to log out. Please try again.
Failed to load quota history
Please try again
Tag name is required
Please enter a folder name
```

---

## Summary Statistics

- **Total Pages**: 9
- **Total Components**: 25
- **Navigation Items**: 5 main + multiple submenu items
- **Dialog Types**: 8+
- **User Facing Text Strings**: 300+
- **Toast/Feedback Messages**: 100+
- **Status/Error Messages**: 80+

---

## Translation Notes

1. **Dynamic Text**: Many strings contain template variables like `{selectedCount}`, `{fileName}`, `{formatBytes()}`. These should be preserved as-is in translation.

2. **Button Labels**: Short, action-oriented text (Upload, Share, Delete, etc.)

3. **Aria Labels**: Accessibility text that should also be translated

4. **Placeholders**: Input field placeholder text in search/folder name inputs

5. **Component Variants**: Some components have alternative implementations (legacy versions) that may need translation updates separately

6. **Technical Terms**: 
   - "Storage" (Armazenamento)
   - "Quota" (Cota/Limite)
   - "Trash" (Lixo)
   - "Share/Sharing" (Compartilhar/Compartilhamento)
   - "Starred" (Marcado com estrela)
   - "Tag" (Etiqueta/Tag)

7. **Permissions**: View, Edit, Admin (may need localized equivalents)

---

## Next Steps for Translation

1. Create Portuguese translation strings for all text above
2. Extract strings into i18n JSON structure
3. Update all components to use i18n keys
4. Test with Portuguese locale
5. Validate all dynamic text replacements work correctly with Portuguese
6. Check plural forms (especially for item counts)
