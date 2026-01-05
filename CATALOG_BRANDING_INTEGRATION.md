# Equipment Catalog PDF - Company Branding Integration

## Overview

Enhanced the Equipment Catalog PDF generation to include professional company branding information, matching the styling and presentation used in the Quote PDF system. This creates a cohesive, branded experience for all PDF exports.

## Features Added

### 1. **Professional Logo Display**
- Logo displays in the top-right corner of the catalog PDF
- Respects maximum dimensions (50mm width × 20mm height)
- Maintains aspect ratio automatically
- Supports PNG and JPEG formats
- Graceful fallback if logo loading fails

### 2. **Company Branding Information**
- **Company Name**: Displays prominently in top-right section
- **Company Tagline**: Subtitle for additional branding
- **Contact Email**: Professional contact information
- **Contact Phone**: Phone number for inquiries

### 3. **Multi-level Branding Priority**
The system uses a smart priority system for branding:
```
PDF-specific setting > General setting > Partner setting
```

Examples:
- `pdfLogoUrl` → `logoUrl` → `partnerLogoUrl`
- `pdfCompanyName` → `companyName` → `partnerCompanyName`
- `pdfCompanyTagline` → `companyTagline` → (not shown)

### 4. **Language Support**
- All branding information displays correctly with both English and Portuguese catalogs
- Translation labels updated for bilingual support
- Company contact info remains consistent across languages

### 5. **Professional Layout**
- Branding section positioned at top-right
- Divider line separates branding from main content
- Catalog title and partner information clearly organized
- Color scheme: Professional blue (#143C78) for company names
- Consistent typography with rest of PDF

## Technical Implementation

### API Endpoint: `/api/partners/catalog/generate`

**Request Structure:**
```typescript
interface CatalogRequest {
  partnerId: string;
  partnerName: string;
  companyName?: string;
  logoUrl?: string;
  equipmentIds: string[];
  language?: 'en' | 'pt';
  download?: boolean;
}
```

**New Features:**
1. Fetches branding settings from `/api/customization` endpoint
2. Integrates branding into PDF generation
3. Handles async image loading (base64 conversion)
4. Manages logo dimensions and format detection

### Helper Function: `loadImageAsBase64()`
```typescript
async function loadImageAsBase64(url: string): Promise<{ 
  data: string; 
  width: number; 
  height: number 
} | null>
```

Converts image URLs to base64 for PDF embedding:
- Fetches image from URL with CORS support
- Converts to FileReader blob format
- Returns data URL ready for jsPDF
- Includes error handling with console logging

### Updated Function Signature
```typescript
async function generateCatalogPDF(
  partnerName: string,
  companyName: string | undefined,
  logoUrl: string | undefined,
  equipment: any[],
  language: 'en' | 'pt' = 'en',
  brandingSettings: BrandingSettings = {}
): Promise<Buffer>
```

## Database Schema

### Partner Model Update
```prisma
model Partner {
  // ... existing fields
  logoUrl String?  // Company logo URL for catalog
}
```

**Migration Required:**
```bash
npx prisma migrate dev --name add_logo_url_to_partner
```

### Customization Settings Integration
The catalog pulls branding information from the Customization model:
- `companyName` / `pdfCompanyName`
- `companyTagline` / `pdfCompanyTagline`
- `contactEmail` / `pdfContactEmail`
- `contactPhone` / `pdfContactPhone`
- `logoUrl` / `pdfLogoUrl`
- `useTextLogo` / `pdfUseTextLogo`

## File Upload & Validation

### Partner Logo Upload (Form Component)
Location: `src/components/partners/PartnerForm.tsx`

**Validation Rules:**
- File type: PNG, JPG, WebP only
- Maximum size: 2MB
- Display preview before save
- Option to remove uploaded logo

## Branding Fallback Strategy

The system gracefully handles missing branding information:

1. **Logo Missing**: Shows company name in text instead
2. **Company Name Missing**: Uses partner name
3. **Email/Phone Missing**: Omitted from display
4. **Image Load Failure**: Falls back to text company name
5. **API Unreachable**: Continues with empty branding (no errors)

## PDF Layout Order

The generated catalog now follows this layout structure:

```
┌─────────────────────────────────────────────────┐
│                                      [LOGO HERE] │
│                                     Company Name │
│                                          Tagline │
│                                    company@email │
│                                    +1-234-567890 │
├─────────────────────────────────────────────────┤
│             Equipment Catalog                    │
│                                                  │
│ Partner: Acrobaticz Rentals                      │
│ Company: ABC Productions                         │
│ Generated: January 15, 2025                      │
├─────────────────────────────────────────────────┤
│                                                  │
│ Category: Audio Equipment                        │
│                                                  │
│ 1. Item Name                                     │
│    Daily Rate: $100 | Available: 5               │
│    Description: Professional audio device...     │
│                                                  │
│ [continues for all equipment...]                 │
└─────────────────────────────────────────────────┘
```

## Testing Checklist

- [ ] Database migration executed successfully
- [ ] Partner logo uploads working in form
- [ ] Catalog generation includes company branding
- [ ] Logo displays correctly in PDF (top-right)
- [ ] Company name, tagline, email, phone visible
- [ ] English catalog generates with correct branding
- [ ] Portuguese catalog generates with correct branding
- [ ] Logo image format detection works (PNG/JPEG)
- [ ] Fallback to text logo when image fails
- [ ] PDF preview modal displays branding correctly
- [ ] Download functionality includes branding

## Comparison with Quote PDF

The catalog PDF now matches the professional branding approach used in quotes:

| Feature | Quote PDF | Catalog PDF |
|---------|-----------|------------|
| Logo Size | 50mm × 20mm | 50mm × 20mm |
| Logo Position | Top-right | Top-right |
| Company Name | Bold, blue | Bold, blue (#143C78) |
| Tagline | Supported | Supported |
| Contact Info | Email + Phone | Email + Phone |
| Format Support | PNG, JPEG | PNG, JPEG |
| Aspect Ratio | Maintained | Auto-scaled |
| Fallback | Text logo | Text logo |

## Configuration via Admin Panel

Admins can customize catalog branding through `/admin/customization`:
- Upload company logo
- Set company name (general or PDF-specific)
- Add company tagline
- Configure contact email
- Configure contact phone
- Choose between logo/text display option

## Troubleshooting

### Logo Not Appearing
1. Check if logo URL is accessible (CORS enabled)
2. Verify file format is PNG or JPEG
3. Check browser console for image load errors
4. Ensure customization settings have logo URL set

### Company Information Missing
1. Verify customization settings are saved
2. Check API endpoint `/api/customization` is responding
3. Ensure branding fields are not empty
4. Check network tab for failed requests

### PDF Generation Errors
1. Verify all equipment items have valid data
2. Check translation service is working
3. Ensure image URLs are accessible
4. Review server logs for detailed error messages

## Future Enhancements

1. **Logo Caching**: Cache base64 images to improve performance
2. **Custom Fonts**: Support custom fonts for company branding
3. **Color Customization**: Allow custom color schemes per catalog
4. **Multi-Logo Support**: Different logos for different catalog types
5. **Digital Signatures**: Add company signature to PDFs
6. **Watermarks**: Add security watermarks with company branding

## Environment Variables

Ensure these are configured for proper functionality:
```
NEXTAUTH_URL=http://localhost:3000
# Or production URL for deployed instances
```

## Related Files

- `src/app/api/partners/catalog/generate/route.ts` - PDF generation API
- `src/components/partners/PartnerForm.tsx` - Partner form with logo upload
- `src/components/partners/PartnerCatalogGenerator.tsx` - Catalog generator UI
- `src/lib/pdf-generator.ts` - Reference implementation for PDF branding
- `prisma/schema.prisma` - Database schema with Partner model

## Compatibility

- **Next.js**: 14.0+
- **jsPDF**: Latest version
- **Prisma**: 5.x+
- **Node.js**: 18+

## Summary

The Equipment Catalog PDF feature is now fully integrated with the company branding system, providing a professional and consistent experience across all PDF exports. Users can customize all branding elements through the admin panel, and the system gracefully handles missing or unavailable branding information.
