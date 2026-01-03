# Storage Quota Update - 50GB per User

**Date**: January 3, 2026  
**Change**: Updated default storage quota from 10GB to 50GB per user

## Summary
All new users created in the system will now automatically receive a **50GB cloud storage quota** instead of the previous 10GB limit.

## Files Modified
1. **src/app/(cloud)/layout.tsx** - Updated quota initialization
2. **src/app/cloud/page.tsx** - Updated quota initialization
3. **src/app/api/cloud/storage/route.ts** - Updated default quota fallback
4. **src/app/api/cloud/files/upload/route.ts** - Updated quota validation
5. **src/app/api/admin/cloud/quotas/route.ts** - Updated quota display calculation
6. **env** - Updated DEFAULT_STORAGE_QUOTA environment variable
7. **env.production** - Updated DEFAULT_STORAGE_QUOTA environment variable

## Technical Details
- **Old Default**: 10,737,418,240 bytes (10 GB)
- **New Default**: 53,687,091,200 bytes (50 GB)
- **Calculation**: 50 × 1024 × 1024 × 1024 = 53,687,091,200 bytes

## Configuration
The quota can still be overridden via the `DEFAULT_STORAGE_QUOTA` environment variable if needed.

### Current Setting
```
DEFAULT_STORAGE_QUOTA="53687091200"
```

## Impact
- **New Users**: Will get 50GB quota automatically
- **Existing Users**: Will keep their current quota settings (no automatic migration)
- **Admins**: Can still manually adjust individual user quotas via admin panel
