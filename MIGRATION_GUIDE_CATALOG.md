# Partners Catalog Enhancement - Migration Guide

## Prerequisites
- Existing AV-RENTALS database
- Prisma CLI installed (`npm install -g @prisma/cli`)

## Step-by-Step Migration

### 1. Update Database Schema
The `logoUrl` field has been added to the Partner model. You need to run a migration to add this column:

```bash
# Navigate to project root
cd /home/feli/Acrobaticz\ rental/AV-RENTALS

# Create migration
npx prisma migrate dev --name add_logo_url_to_partner

# When prompted for a name, confirm or enter: "add_logo_url_to_partner"
```

Alternatively, if you just want to sync without creating a migration file:
```bash
npx prisma db push
```

### 2. Verify Changes
After migration, verify the change was applied:

```bash
# Check the database has the new column
npx prisma db execute --stdin << 'EOF'
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'Partner' AND column_name = 'logoUrl';
EOF
```

### 3. Application Changes
All application code changes are automatic when you pull the updated files:
- Type definitions updated
- React components enhanced
- API routes modified
- New components added

No additional configuration needed!

### 4. Verify File Upload API
Make sure your upload endpoint exists at `/api/upload`. If not, here's a simple implementation:

```typescript
// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // For development: store in public folder
    // For production: use cloud storage (AWS S3, Cloudinary, etc.)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}-${file.name}`;
    const filepath = join(process.cwd(), 'public', 'uploads', filename);

    await writeFile(filepath, buffer);

    return NextResponse.json({
      url: `/uploads/${filename}`
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
```

### 5. Testing the Feature

After deploying, test the following:

#### Test Logo Upload
1. Go to Partners > Add New Partner
2. Fill in partner details
3. Click "Upload Logo" in the logo section
4. Select a PNG/JPG image (< 2MB)
5. Verify preview appears
6. Save partner
7. Verify logo persists in database

#### Test Catalog Generation
1. Go to partner details page
2. Click "Generate Catalog"
3. Select some equipment
4. Click "Preview PDF"
5. Verify:
   - Logo appears in top-left of PDF
   - Company name displays
   - Language selector works
   - PDF content displays correctly
6. Click "Preview PDF" with Portuguese selected
7. Verify all text is in Portuguese
8. Click "Download PDF"
9. Verify file downloads with correct name

#### Test Partner Info Display
1. In catalog generator, verify:
   - Partner logo displays in info card
   - Partner name and company display
   - Address displays if present

## Rollback Procedure

If you need to rollback the changes:

```bash
# Rollback the migration
npx prisma migrate resolve --rolled-back add_logo_url_to_partner

# Or reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Troubleshooting

### Issue: "Column 'logoUrl' does not exist"
**Solution**: Run the migration again
```bash
npx prisma migrate deploy
```

### Issue: Logo not uploading
**Checklist**:
- Ensure `/api/upload` endpoint exists
- Check file size (should be < 2MB)
- Check file format (PNG/JPG/WebP only)
- Check browser console for errors

### Issue: PDF preview not working
**Checklist**:
- Ensure `/api/partners/catalog/generate` endpoint is accessible
- Check that equipment is selected
- Check browser console for errors
- Verify JSON response from API

### Issue: Language not changing in PDF
**Checklist**:
- Ensure language parameter is passed to API
- Check PDF generation function receives language
- Verify label translations are defined

## Performance Notes
- Logo upload is limited to 2MB (configurable in PartnerForm.tsx)
- PDF generation happens server-side
- Large catalogs (100+ items) may take 2-3 seconds to generate
- Consider caching for frequently generated catalogs in future

## Database Impact
- Single column addition: ~1-2 minutes migration time
- No data loss from existing partners
- Backward compatible - existing partners work without logo

## Support
For issues or questions about the migration:
1. Check the logs: `docker logs av-rentals-db`
2. Review PARTNERS_CATALOG_ENHANCEMENTS.md for feature details
3. Check database state with Prisma Studio: `npx prisma studio`
