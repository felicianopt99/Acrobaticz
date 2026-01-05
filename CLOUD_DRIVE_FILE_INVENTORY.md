# Cloud Drive Complete File Inventory

## Page Files (9 total)

### Main Entry Points
```
src/app/cloud/page.tsx
├── Title: "Cloud Storage - AV Rentals"
├── Description: "Manage your files and documents in cloud storage"
└── Component: EnhancedCloudPage.tsx

src/app/(cloud)/layout.tsx
├── Title: "Cloud Storage"
├── Description: "Manage your files and documents in cloud storage"
├── Component: CloudLayoutClient.tsx
└── Wraps all /drive routes

src/app/(cloud)/drive/page.tsx
├── Title: "My Drive - Cloud Storage"
├── Description: "View and manage your files"
├── Component: DriveContent.tsx
└── PRIMARY CLOUD DRIVE INTERFACE
```

### Feature Pages (6 pages)
```
src/app/(cloud)/drive/recent/page.tsx
├── Component: RecentContent.tsx
├── Label: "Recent"
└── Shows recently accessed files

src/app/(cloud)/drive/shared/page.tsx
├── Component: SharedContent.tsx
├── Label: "Shared with me"
└── Shows files shared by others

src/app/(cloud)/drive/starred/page.tsx
├── Component: StarredContent.tsx / StarredPageContent.tsx
├── Label: "Starred"
└── Shows user-starred files

src/app/(cloud)/drive/trash/page.tsx
├── Component: TrashContent.tsx / TrashPageContent.tsx
├── Label: "Trash"
└── Shows deleted files (can restore)

src/app/(cloud)/drive/folder/[id]/page.tsx
├── Component: DriveContent.tsx (with folderId param)
├── Dynamic route for folders
└── Shows folder contents

src/app/cloud/storage-dashboard/page.tsx
├── Component: StorageDashboardContent.tsx
├── Label: "Storage Dashboard"
├── Admin page for quota management
└── Requires Admin role
```

---

## Component Files (25 total)

### Location: `src/components/cloud/`

#### Core Layout Components
```
1. CloudLayoutClient.tsx
   ├── Lines: ~200
   ├── Purpose: Client-side wrapper for cloud layout
   ├── Uses: CloudSidebar, CloudHeader, CloudMobileNav
   └── Key State: User info, mobile nav visibility

2. CloudSidebar.tsx
   ├── Lines: 333
   ├── Purpose: Left navigation sidebar
   ├── Key Elements:
   │  ├── Logo/branding
   │  ├── Navigation items (5)
   │  ├── New/Upload buttons
   │  ├── Storage quota display
   │  └── Collapse toggle
   └── Strings: "My Drive", "Starred", "Shared with me", "Recent", "Trash"

3. CloudHeader.tsx
   ├── Lines: 432
   ├── Purpose: Top header bar with search and user menu
   ├── Key Elements:
   │  ├── Search bar
   │  ├── View mode toggle (Grid/List)
   │  ├── Refresh button
   │  ├── Dashboard link
   │  ├── User menu
   │  ├── Help/Shortcuts
   │  └── Logout
   └── Strings: Search placeholder, menu labels, tooltips
```

#### Content Display Components
```
4. DriveContent.tsx
   ├── Lines: 1323 (LARGEST COMPONENT)
   ├── Purpose: Main file/folder display (grid or list)
   ├── Key Features:
   │  ├── File/folder listing
   │  ├── Drag & drop selection
   │  ├── Context menu
   │  ├── Rename dialog
   │  ├── Create folder dialog
   │  ├── Multi-select toolbar
   │  ├── File preview modal
   │  └── Share dialog
   └── Strings: 110+ dialog and action strings

5. FileList.tsx
   ├── Lines: 318
   ├── Purpose: Table-based file list view
   ├── Key Features:
   │  ├── Sortable columns (Name, Size, Date)
   │  ├── Filter buttons (All, Files, Folders)
   │  ├── Action menu per row
   │  └── Star toggle
   └── Strings: "Name", "Size", "Modified", filter options

6. RecentContent.tsx
   ├── Lines: 345
   ├── Purpose: Display recently accessed files
   ├── Key Features:
   │  ├── Recent files list
   │  ├── Relative timestamp display
   │  ├── Star toggle
   │  ├── Download option
   │  └── Delete option
   └── Strings: "No recent files", action labels

7. StarredContent.tsx
   ├── Lines: 394
   ├── Purpose: Display starred files and folders
   ├── Key Features:
   │  ├── Star management
   │  ├── Download files
   │  ├── Delete files
   │  └── Sort by type
   └── Strings: "No starred items", action labels

8. SharedContent.tsx
   ├── Lines: ~50 (MINIMAL)
   ├── Purpose: Display files shared with user
   ├── Status: Currently shows "No shared items" placeholder
   └── Strings: "Shared with me", empty state message

9. TrashContent.tsx
   ├── Lines: 469
   ├── Purpose: Manage deleted items
   ├── Key Features:
   │  ├── File/folder list
   │  ├── Restore action
   │  ├── Permanent delete
   │  ├── Empty trash
   │  └── Confirmation dialogs
   └── Strings: Trash management labels

10. EnhancedCloudPage.tsx
    ├── Lines: 200
    ├── Purpose: Alternative cloud page design
    ├── Key Features:
    │  ├── Quick actions sidebar
    │  ├── Activity log
    │  ├── Storage quota display
    │  └── Create folder input
    └── Strings: Quick actions labels

11. CloudPageContent.tsx
    ├── Lines: ~600
    ├── Purpose: Main content area (legacy/alternative)
    ├── Key Features:
    │  ├── File/folder display
    │  ├── Search functionality
    │  ├── Create folder
    │  ├── File operations
    │  └── Drag/drop upload
    └── Strings: Multiple dialog and action strings
```

#### Dialog & Modal Components
```
12. ShareDialog.tsx
    ├── Lines: 244
    ├── Purpose: File sharing dialog
    ├── Key Features:
    │  ├── Permission level selector
    │  ├── Public/Private toggle
    │  ├── Share link copy
    │  ├── Active shares list
    │  └── Delete share option
    └── Strings: 20+ share-related labels

13. FilePreviewModal.tsx
    ├── Lines: ~100
    ├── Purpose: File preview dialog
    ├── Key Features:
    │  ├── File display
    │  ├── Close button
    │  └── Basic preview
    └── Strings: Dialog title (filename), description

14. BatchActionsToolbar.tsx
    ├── Lines: 303
    ├── Purpose: Multi-select action toolbar
    ├── Key Features:
    │  ├── Move dialog
    │  ├── Share dialog
    │  ├── Delete dialog
    │  └── Action buttons
    └── Strings: "Move Items", "Share Items", "Delete Items"

15. TagManager.tsx
    ├── Lines: ~350
    ├── Purpose: File tagging system
    ├── Key Features:
    │  ├── Create tags
    │  ├── Add/remove tags from files
    │  ├── Tag list display
    │  └── Tag management dialog
    └── Strings: "Manage Tags", "Create Tag", "Add Tag"
```

#### Info & Display Components
```
16. StorageQuotaDisplay.tsx
    ├── Lines: 150
    ├── Purpose: Storage usage progress display
    ├── Key Features:
    │  ├── Usage bar
    │  ├── Used/Total text
    │  ├── Percentage display
    │  ├── Warning indicators
    │  └── Alert messages
    └── Strings: Storage labels, warnings, percentages

17. StorageDashboardContent.tsx
    ├── Lines: 625
    ├── Purpose: Admin storage management panel
    ├── Key Features:
    │  ├── Disk health display
    │  ├── User quotas table
    │  ├── Edit quota dialog
    │  ├── Toggle cloud access
    │  ├── Quota history
    │  └── Refresh functionality
    └── Strings: Admin interface labels

18. ActivityLog.tsx
    ├── Lines: ~120
    ├── Purpose: Activity tracking display
    ├── Key Features:
    │  ├── Activity list
    │  ├── Action type icons
    │  ├── Timestamps
    │  └── File names
    └── Strings: 6 action types + "No recent activity"
```

#### Navigation & Navigation Support
```
19. CloudMobileNav.tsx
    ├── Lines: ~150
    ├── Purpose: Mobile sidebar navigation
    ├── Key Features:
    │  ├── Navigation items
    │  ├── Upload options
    │  ├── Mobile-optimized buttons
    │  └── Close button
    └── Strings: Navigation labels, mobile actions

20. FolderBreadcrumb.tsx
    ├── Lines: ~100
    ├── Purpose: Folder navigation breadcrumbs
    ├── Key Features:
    │  ├── Path display
    │  ├── Clickable navigation
    │  └── Chevron separators
    └── Strings: Folder names (dynamic)

21. BreadcrumbNav.tsx
    ├── Lines: ~100
    ├── Purpose: Alternative breadcrumb component
    └── Same as FolderBreadcrumb.tsx (likely duplicate)
```

#### Utility & Alternative Components
```
22. FilterPanel.tsx
    ├── Purpose: File filtering options
    └── Status: Possible duplicate/unused

23. StarredPageContent.tsx
    ├── Purpose: Alternative starred view
    └── Similar to StarredContent.tsx

24. SharedPageContent.tsx
    ├── Lines: ~50
    ├── Purpose: Alternative shared content view
    ├── Component: Wraps SharedContent with AppHeader
    └── Status: Minimal alternative

25. TrashPageContent.tsx
    ├── Purpose: Alternative trash view
    └── Similar to TrashContent.tsx
```

---

## API Route Files

These are referenced but not directly translatable:

```
src/app/api/cloud/
├── files/
│  ├── route.ts
│  ├── upload/route.ts
│  ├── [id]/route.ts
│  └── [id]/download/route.ts
├── folders/
│  ├── route.ts
│  ├── [id]/route.ts
│  └── batch/move/route.ts
├── share/
│  ├── route.ts
│  ├── [token]/route.ts
│  └── [id]/route.ts
├── trash/route.ts
├── storage/route.ts
├── health/route.ts
└── activity/route.ts
```

---

## Supporting Files

```
src/lib/storage.ts
├── Purpose: Storage utility functions
├── Functions: deleteFile, deleteDirectory, checkDiskHealth
└── Note: No UI strings

prisma/schema.prisma
├── Purpose: Database schema
├── Models: CloudFile, CloudFolder, ShareToken, StorageQuota
└── Note: No UI strings

public/sw.js
├── Purpose: Service worker
└── Note: No UI strings
```

---

## Database Schema (Reference)

Key models with translatable fields:

```
CloudFile
├── name (file name)
├── mimeType
├── size
├── isStarred (boolean)
├── isPublic (boolean)
└── isTrashed (boolean)

CloudFolder
├── name (folder name)
├── color (folder color - optional)
├── isStarred (boolean)
└── isTrashed (boolean)

CloudTag
├── name (tag name)
└── color (tag color)

StorageQuota
├── usedBytes
└── quotaBytes
```

---

## Component Dependency Map

```
Layout:
  CloudLayoutClient
  ├── CloudSidebar
  ├── CloudHeader
  ├── CloudMobileNav
  └── Children (pages/content)

Content Displays:
  DriveContent / RecentContent / StarredContent / SharedContent / TrashContent
  ├── FileList (optional)
  ├── FilePreviewModal
  ├── ShareDialog
  ├── BatchActionsToolbar
  └── FolderBreadcrumb

Dialogs:
  FilePreviewModal
  ShareDialog
  BatchActionsToolbar
  TagManager

Info Display:
  StorageQuotaDisplay
  ActivityLog
  StorageDashboardContent
```

---

## Translation String Distribution

### By Component (Top 10 Most Strings)
```
1. DriveContent.tsx         - ~110 strings
2. CloudHeader.tsx          - ~40 strings
3. TrashContent.tsx         - ~30 strings
4. StarredContent.tsx       - ~25 strings
5. ShareDialog.tsx          - ~25 strings
6. BatchActionsToolbar.tsx  - ~25 strings
7. StorageDashboardContent  - ~20 strings
8. FileList.tsx             - ~15 strings
9. CloudSidebar.tsx         - ~15 strings
10. StorageQuotaDisplay.tsx - ~12 strings
```

### By Category (Top 5)
```
1. Success Messages    - ~25 strings
2. Error Messages      - ~30+ strings
3. Dialog Labels       - ~20 strings
4. Navigation          - ~12 strings
5. File Operations     - ~15 strings
```

---

## Quick Stats

- **Total Components**: 25
- **Total Pages**: 9
- **Largest Component**: DriveContent.tsx (1323 lines)
- **Smallest Component**: SharedContent.tsx (~50 lines)
- **Total Translatable Strings**: 300+
- **Priority Components**: 4 (critical)
- **High Priority Components**: 4
- **Medium Priority**: 6
- **Low Priority (admin/utility)**: 11

---

## Implementation Checklist

- [ ] Review all file locations
- [ ] Understand component hierarchy
- [ ] Plan i18n integration
- [ ] Start with priority components
- [ ] Create translation JSON
- [ ] Update components with i18n calls
- [ ] Test each component in Portuguese
- [ ] Full QA and native speaker review
