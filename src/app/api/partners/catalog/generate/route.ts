import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ProfessionalCataloguePDFGenerator } from '@/lib/professional-catalog-generator';
import { translateText } from '@/lib/translation';

interface CatalogRequest {
  partnerId: string;
  partnerName: string;
  companyName?: string;
  logoUrl?: string;
  equipmentIds: string[];
  language?: 'en' | 'pt';
  download?: boolean;
  termsAccepted?: boolean;
  customTermsText?: string;
}

interface BrandingSettings {
  companyName?: string;
  companyTagline?: string;
  contactEmail?: string;
  contactPhone?: string;
  pdfCompanyName?: string;
  pdfCompanyTagline?: string;
  pdfContactEmail?: string;
  pdfContactPhone?: string;
  pdfFooterMessage?: string;
  catalogTermsAndConditions?: string;
  logoUrl?: string;
  useTextLogo?: boolean;
  pdfLogoUrl?: string;
  pdfUseTextLogo?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: CatalogRequest = await request.json();
    let { 
      partnerId, 
      partnerName, 
      companyName,
      logoUrl,
      equipmentIds, 
      language = 'en',
      download = true,
      termsAccepted = false,
      customTermsText = ''
    } = body;

    console.debug('[PDF GEN] Incoming payload:', {
      partnerId,
      partnerName,
      companyName,
      logoUrl,
      equipmentIdsLength: equipmentIds?.length || 0,
      language,
      download,
      termsAccepted,
      customTermsText: customTermsText ? `"${customTermsText.substring(0, 50)}..."` : 'EMPTY',
    });

    if (!equipmentIds || equipmentIds.length === 0) {
      return NextResponse.json(
        { error: 'No equipment selected' },
        { status: 400 }
      );
    }

    // Fetch selected equipment with category info
    console.debug('[PDF GEN] Fetching equipment with IDs:', equipmentIds);
    
    const equipment = await prisma.equipmentItem.findMany({
      where: {
        id: { in: equipmentIds },
        // Don't filter by status - allow all statuses for catalog generation
      },
      include: {
        category: true,
        subcategory: true,
      },
    });

    console.debug('[PDF GEN] Found equipment:', {
      count: equipment.length,
      ids: equipment.map(e => e.id),
      statuses: equipment.map(e => (e as any).status),
    });

    if (equipment.length === 0) {
      // Log more details for debugging
      const allEquipment = await prisma.equipmentItem.findMany({
        where: { id: { in: equipmentIds } },
        select: { id: true, name: true, status: true },
      });
      
      console.error('[PDF GEN] Equipment fetch failed:', {
        requestedIds: equipmentIds,
        foundItems: allEquipment,
        message: 'No equipment matching the requested IDs',
      });

      return NextResponse.json(
        { 
          error: 'No equipment found',
          details: `Could not find equipment with IDs: ${equipmentIds.join(', ')}. Found: ${allEquipment.map(e => `${e.id}(${e.status})`).join(', ')}`
        },
        { status: 404 }
      );
    }

    // Fetch company branding settings
    let brandingSettings: BrandingSettings = {};
    try {
      const brandingResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/customization`, {
        cache: 'force-cache'
      });
      if (brandingResponse.ok) {
        brandingSettings = await brandingResponse.json();
        console.debug('[PDF GEN] Branding settings fetched:', {
          hasPdfLogoUrl: !!brandingSettings.pdfLogoUrl,
          hasLogoUrl: !!brandingSettings.logoUrl,
          pdfLogoUrl: brandingSettings.pdfLogoUrl ? `"${brandingSettings.pdfLogoUrl.substring(0, 50)}..."` : 'EMPTY',
          logoUrl: brandingSettings.logoUrl ? `"${brandingSettings.logoUrl.substring(0, 50)}..."` : 'EMPTY',
        });
      }
    } catch (error) {
      console.error('Failed to fetch branding settings:', error);
    }

    // Fetch partner record
    let partnerRecord: any = null;
    try {
      if (partnerId) {
        partnerRecord = await prisma.partner.findUnique({ where: { id: partnerId }, include: { client: true } });
        if (partnerRecord) {
          partnerName = partnerName || partnerRecord.name;
          companyName = companyName || partnerRecord.companyName;
          logoUrl = logoUrl || partnerRecord.logoUrl;
        }
      }
    } catch (err) {
      console.error('Failed to fetch partner record:', err);
    }

    // Build partner info
    const clientRecord = partnerRecord?.client ?? null;
    const partnerInfo = {
      name: clientRecord?.name || partnerName || (partnerRecord ? partnerRecord.name : undefined) || 'Partner',
      companyName: clientRecord ? undefined : (companyName || (partnerRecord ? partnerRecord.companyName : undefined)),
      contactPerson: clientRecord?.contactPerson || partnerRecord?.contactPerson,
      email: clientRecord?.email || partnerRecord?.email,
      phone: clientRecord?.phone || partnerRecord?.phone,
      address: clientRecord?.address || partnerRecord?.address,
      logoUrl: logoUrl || (partnerRecord ? partnerRecord.logoUrl : undefined),
    };

    // Map equipment to CatalogueItem format
    let catalogueItems = equipment.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl ?? undefined,
      dailyRate: item.dailyRate,
      category: item.category?.name,
      subcategory: item.subcategory?.name,
      quantity: item.quantity
    }));

    // Translate product descriptions if language is Portuguese
    if (language === 'pt') {
      console.debug('[PDF GEN] Translating product descriptions to Portuguese');
      catalogueItems = await Promise.all(catalogueItems.map(async (item, index) => {
        const originalItem = equipment[index];
        let translatedDescription = item.description;
        
        // Try to use cached descriptionPt first, otherwise translate on-the-fly
        if ((originalItem as any).descriptionPt) {
          translatedDescription = (originalItem as any).descriptionPt;
        } else if (item.description) {
          try {
            translatedDescription = await translateText(item.description, language);
          } catch (error) {
            console.error(`Failed to translate description for item ${item.id}:`, error);
            // Use original description if translation fails
          }
        }
        
        return {
          ...item,
          description: translatedDescription,
        };
      }));
    }

    // Translate branding footer only (NOT partner/client names)
    if (language === 'pt') {
      try {
        const translatedFooter = await translateText(
          brandingSettings.pdfFooterMessage ?? 'For rental inquiries and availability, please contact us.',
          language
        );

        if (translatedFooter) {
          brandingSettings.pdfFooterMessage = translatedFooter;
        }
      } catch (error) {
        console.error('[PDF GEN] Branding translation error:', error);
      }
    }
    // Note: Partner name and company name are NOT translated - they remain in original language

    // Prepare branding
    const branding = {
      companyName: brandingSettings.pdfCompanyName ?? brandingSettings.companyName ?? 'AV Rentals',
      companyTagline: brandingSettings.pdfCompanyTagline ?? brandingSettings.companyTagline ?? '',
      contactEmail: brandingSettings.pdfContactEmail ?? brandingSettings.contactEmail ?? '',
      contactPhone: brandingSettings.pdfContactPhone ?? brandingSettings.contactPhone ?? '',
      logoUrl: brandingSettings.pdfLogoUrl ?? brandingSettings.logoUrl ?? '',
      pdfLogoUrl: brandingSettings.pdfLogoUrl ?? '',
      useTextLogo: brandingSettings.pdfUseTextLogo !== undefined ? brandingSettings.pdfUseTextLogo : (brandingSettings.useTextLogo ?? true),
      pdfUseTextLogo: brandingSettings.pdfUseTextLogo !== undefined ? brandingSettings.pdfUseTextLogo : (brandingSettings.useTextLogo ?? true),
      pdfFooterMessage: brandingSettings.pdfFooterMessage ?? 'For rental inquiries and availability, please contact us.'
    };

    console.debug('[PDF GEN] Final branding object:', {
      logoUrl: branding.logoUrl ? `"${branding.logoUrl.substring(0, 60)}..."` : 'EMPTY',
      pdfLogoUrl: branding.pdfLogoUrl ? `"${branding.pdfLogoUrl.substring(0, 60)}..."` : 'EMPTY',
      useTextLogo: branding.useTextLogo,
      pdfUseTextLogo: branding.pdfUseTextLogo,
    });

    // Generate PDF using new professional catalog generator
    let pdfBuffer: Buffer;
    try {
      console.debug('[PDF GEN] Starting PDF generation with', catalogueItems.length, 'items');
      console.debug('[PDF GEN] Passing customTermsText:', customTermsText ? `"${customTermsText.substring(0, 50)}..."` : 'EMPTY');
      pdfBuffer = await ProfessionalCataloguePDFGenerator.generateCataloguePDF(catalogueItems, {
        branding,
        partnerInfo,
        language,
        includeTermsAndConditions: termsAccepted,
        customTermsText: customTermsText || brandingSettings.catalogTermsAndConditions
      });
      console.debug('[PDF GEN] PDF generated successfully, size:', pdfBuffer.length);
    } catch (pdfError) {
      const errorMsg = pdfError instanceof Error ? pdfError.message : String(pdfError);
      const errorStack = pdfError instanceof Error ? pdfError.stack : '';
      console.error('[PDF GEN] PDF generation failed:', {
        message: errorMsg,
        stack: errorStack,
        catalogueItemsCount: catalogueItems.length,
        partnerInfo,
      });
      throw pdfError;
    }

    // Create filename
    const filename = download
      ? `${(partnerInfo.name || partnerName)}-equipment-catalog-${new Date().toISOString().split('T')[0]}.pdf`.replace(/\s+/g, '-')
      : `equipment-catalog-${Date.now()}.pdf`;

    return new NextResponse(pdfBuffer.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': download 
          ? `attachment; filename="${filename}"`
          : 'inline',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Catalog generation error:', {
      message: errorMessage,
      stack: errorStack,
      error: error
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to generate catalog',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

