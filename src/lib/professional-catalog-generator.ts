// src/lib/professional-catalog-generator.ts
// Professional Catalog PDF Generator - Option 2 Layout
// Features: Quote PDF-style header, detailed list layout with images on left,
// aspect ratio preservation (no distortion), partner information section

import jsPDF from 'jspdf';

export interface CatalogueItem {
  id?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  dailyRate?: number;
  category?: string;
  subcategory?: string;
  quantity?: number;
  specifications?: string[]; // New: detailed specs for right column
}

export interface PartnerInfo {
  name: string;
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
}

export interface CustomizationSettings {
  companyName?: string;
  companyTagline?: string;
  contactEmail?: string;
  contactPhone?: string;
  pdfCompanyName?: string;
  pdfCompanyTagline?: string;
  pdfContactEmail?: string;
  pdfContactPhone?: string;
  logoUrl?: string;
  useTextLogo?: boolean;
  pdfLogoUrl?: string;
  pdfUseTextLogo?: boolean;
  pdfFooterMessage?: string;
  pdfFooterContactText?: string;
}

export interface CataloguePDFOptions {
  filename?: string;
  download?: boolean;
  branding?: CustomizationSettings;
  partnerInfo?: PartnerInfo;
  introText?: string;
  language?: 'en' | 'pt';
  includeTermsAndConditions?: boolean;
  customTermsText?: string;
}

export class ProfessionalCataloguePDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 20;
  private language: 'en' | 'pt' = 'en';

  // Color palette - modern professional (2026)
  private readonly COLOR_PRIMARY = { r: 35, g: 80, b: 160 };
  private readonly COLOR_DARK = { r: 20, g: 30, b: 40 };
  private readonly COLOR_TEXT = { r: 50, g: 50, b: 50 };
  private readonly COLOR_MUTED = { r: 120, g: 120, b: 120 };
  private readonly COLOR_LIGHT_GRAY = { r: 245, g: 245, b: 245 };
  private readonly COLOR_BORDER = { r: 220, g: 220, b: 220 };
  private readonly COLOR_ACCENT = { r: 52, g: 211, b: 153 }; // Green for pricing
  private readonly COLOR_ALT_ROW = { r: 250, g: 250, b: 250 };

  constructor(language: 'en' | 'pt' = 'en') {
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.language = language;
  }

  /**
   * Get localized text labels
   */
  private getLocalizedText(key: string): string {
    const translations: Record<string, Record<string, string>> = {
      en: {
        'per_day': '/day',
        'in_stock': 'in stock',
        'available_equipment': 'Available Equipment',
      },
      pt: {
        'per_day': '/dia',
        'in_stock': 'em estoque',
        'available_equipment': 'Equipamento Disponível',
      }
    };
    return translations[this.language]?.[key] || translations['en'][key];
  }

  /**
   * Get image dimensions from buffer
   */
  private getImageDimensions(buffer: Buffer): { width: number; height: number } | null {
    try {
      // Check JPEG
      if (buffer[0] === 0xff && buffer[1] === 0xd8) {
        // Look for SOF marker
        let offset = 2;
        while (offset < buffer.length - 8) {
          if (buffer[offset] === 0xff) {
            const marker = buffer[offset + 1];
            // SOF markers: 0xc0, 0xc1, 0xc2, 0xc9, 0xca, 0xcb
            if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2 || 
                marker === 0xc9 || marker === 0xca || marker === 0xcb) {
              const height = (buffer[offset + 5] << 8) | buffer[offset + 6];
              const width = (buffer[offset + 7] << 8) | buffer[offset + 8];
              return { width, height };
            }
            offset += 2;
          } else {
            offset++;
          }
        }
      }
      
      // Check PNG
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        return { width, height };
      }

      // Check GIF
      if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        const width = buffer.readUInt16LE(6);
        const height = buffer.readUInt16LE(8);
        return { width, height };
      }

      // Default: assume 800x600 if we can't determine
      console.warn('[IMAGE] Could not determine dimensions, using default');
      return { width: 800, height: 600 };
    } catch (err) {
      console.error('[IMAGE] Error parsing dimensions:', err);
      return { width: 800, height: 600 };
    }
  }

  /**
   * Load image as Base64 data URL with dimensions
   */
  private async loadImageAsDataUrl(url?: string): Promise<{
    dataUrl: string;
    width: number;
    height: number;
  } | null> {
    if (!url) {
      console.debug('[IMAGE] No URL provided');
      return null;
    }

    try {
      let resolved = url;
      // Resolve relative URLs
      if (resolved.startsWith('/')) {
        const origin = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        resolved = origin.replace(/\/$/, '') + resolved;
      }

      console.debug('[IMAGE] Loading image from:', resolved);

      // Fetch the image
      const res = await fetch(resolved);
      if (!res.ok) {
        console.warn(`[IMAGE] Failed to fetch image: ${res.status} ${res.statusText} from ${resolved}`);
        return null;
      }

      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${contentType};base64,${base64}`;

      // Get image dimensions from buffer
      const dimensions = this.getImageDimensions(buffer);
      
      if (!dimensions) {
        console.warn('[IMAGE] Could not determine image dimensions from:', resolved);
        return null;
      }

      console.debug('[IMAGE] Successfully loaded:', { url: resolved, width: dimensions.width, height: dimensions.height });

      return {
        dataUrl,
        width: dimensions.width,
        height: dimensions.height
      };
    } catch (err) {
      console.error('[IMAGE] Error loading image:', { url, error: err instanceof Error ? err.message : String(err) });
      return null;
    }
  }

  /**
   * Calculate scaled dimensions preserving aspect ratio
   * Centers image in container with no distortion
   */
  private calculateImageDimensions(
    sourceWidth: number,
    sourceHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number; offsetX: number; offsetY: number } {
    const sourceRatio = sourceWidth / sourceHeight;
    const containerRatio = maxWidth / maxHeight;

    let finalWidth: number;
    let finalHeight: number;

    if (sourceRatio > containerRatio) {
      // Image is wider - constrain by width
      finalWidth = maxWidth;
      finalHeight = maxWidth / sourceRatio;
    } else {
      // Image is taller - constrain by height
      finalHeight = maxHeight;
      finalWidth = maxHeight * sourceRatio;
    }

    // Center in container
    const offsetX = (maxWidth - finalWidth) / 2;
    const offsetY = (maxHeight - finalHeight) / 2;

    return { width: finalWidth, height: finalHeight, offsetX, offsetY };
  }

  /**
   * Set text color helpers
   */
  private setColorPrimary() {
    this.doc.setTextColor(this.COLOR_PRIMARY.r, this.COLOR_PRIMARY.g, this.COLOR_PRIMARY.b);
  }

  private setColorDark() {
    this.doc.setTextColor(this.COLOR_DARK.r, this.COLOR_DARK.g, this.COLOR_DARK.b);
  }

  private setColorText() {
    this.doc.setTextColor(this.COLOR_TEXT.r, this.COLOR_TEXT.g, this.COLOR_TEXT.b);
  }

  private setColorMuted() {
    this.doc.setTextColor(this.COLOR_MUTED.r, this.COLOR_MUTED.g, this.COLOR_MUTED.b);
  }

  private setColorDefault() {
    this.doc.setTextColor(0, 0, 0);
  }

  /**
   * Set fill color helpers
   */
  private setFillLightGray() {
    this.doc.setFillColor(this.COLOR_LIGHT_GRAY.r, this.COLOR_LIGHT_GRAY.g, this.COLOR_LIGHT_GRAY.b);
  }

  private setFillAltRow() {
    this.doc.setFillColor(this.COLOR_ALT_ROW.r, this.COLOR_ALT_ROW.g, this.COLOR_ALT_ROW.b);
  }

  /**
   * Add company header - professional 2-column layout
   */
  private async addHeader(branding?: CustomizationSettings) {
    const companyName = branding?.pdfCompanyName ?? branding?.companyName ?? 'AV RENTALS';
    const companyTagline = branding?.pdfCompanyTagline ?? branding?.companyTagline ?? '';
    const email = branding?.pdfContactEmail ?? branding?.contactEmail;
    const phone = branding?.pdfContactPhone ?? branding?.contactPhone;

    const effectiveUseTextLogo = branding?.pdfUseTextLogo ?? branding?.useTextLogo ?? true;
    const effectiveLogoUrl = branding?.pdfLogoUrl ?? branding?.logoUrl;

    console.debug('[PDF HEADER] Logo settings:', {
      effectiveUseTextLogo,
      effectiveLogoUrl: effectiveLogoUrl ? `"${effectiveLogoUrl.substring(0, 50)}..."` : 'EMPTY',
      pdfLogoUrl: branding?.pdfLogoUrl ? `"${branding.pdfLogoUrl.substring(0, 50)}..."` : 'EMPTY',
      logoUrl: branding?.logoUrl ? `"${branding.logoUrl.substring(0, 50)}..."` : 'EMPTY',
    });

    // COLUMN 1: Company Branding (left side)
    // COLUMN 2: Partner Info (right side)
    
    const colWidth = (this.pageWidth - this.margin * 2) / 2 - 5;
    const col1X = this.margin;
    const col2X = this.margin + colWidth + 10;

    let headerHeight = 0;
    let logoWasDisplayed = false;

    // LEFT COLUMN: Company Logo & Branding
    let col1Y = this.currentY;

    // Logo (smaller, more professional - 35mm max width)
    if (!effectiveUseTextLogo && effectiveLogoUrl) {
      console.debug('[PDF HEADER] Attempting to load logo from:', effectiveLogoUrl);
      const logoImg = await this.loadImageAsDataUrl(effectiveLogoUrl);
      if (logoImg) {
        const maxW = 35;
        const maxH = 20;
        const dims = this.calculateImageDimensions(logoImg.width, logoImg.height, maxW, maxH);
        try {
          const format = effectiveLogoUrl.includes('png') ? 'PNG' : 'JPEG';
          this.doc.addImage(
            logoImg.dataUrl,
            format,
            col1X,
            col1Y,
            dims.width,
            dims.height
          );
          col1Y += dims.height + 4;
          logoWasDisplayed = true;
          console.debug('[PDF HEADER] Logo successfully added to PDF');
        } catch (e) {
          console.error('[PDF HEADER] Error adding image to PDF:', e instanceof Error ? e.message : String(e));
        }
      } else {
        console.warn('[PDF HEADER] Failed to load logo image data');
      }
    } else {
      if (effectiveUseTextLogo) {
        console.debug('[PDF HEADER] Using text logo (useTextLogo=true)');
      } else {
        console.debug('[PDF HEADER] No logo URL provided, using text logo');
      }
    }

    // Company name and contact info (left column) - only show name if no logo
    if (!logoWasDisplayed) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(11);
      this.setColorPrimary();
      this.doc.text(companyName, col1X, col1Y);
      col1Y += 5;

      // Contact info (only if no logo)
      if (email || phone) {
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(8);
        this.setColorMuted();
        const contactLines = [];
        if (email) contactLines.push(email);
        if (phone) contactLines.push(phone);
        this.doc.text(contactLines.join(' • '), col1X, col1Y);
        col1Y += 4;
      }
    }

    headerHeight = col1Y - this.currentY;

    // RIGHT COLUMN: Placeholder for partner info (will be added in addPartnerInfoInHeader)
    // Draw subtle border between columns
    this.doc.setDrawColor(220, 220, 220);
    this.doc.setLineWidth(0.2);
    this.doc.line(col1X + colWidth + 5, this.currentY, col1X + colWidth + 5, this.currentY + headerHeight);

    this.currentY += headerHeight + 8;

    // Bottom separator line
    this.doc.setDrawColor(this.COLOR_PRIMARY.r, this.COLOR_PRIMARY.g, this.COLOR_PRIMARY.b);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 8;
  }

  /**
   * Add partner info in header (right column)
   */
  private async addPartnerInfoInHeader(partnerInfo: PartnerInfo) {
    const colWidth = (this.pageWidth - this.margin * 2) / 2 - 5;
    const col2X = this.margin + colWidth + 10;
    let col2Y = this.currentY - 28; // Start higher, in header area

    // Prepare for section
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    this.setColorMuted();
    this.doc.text('FOR:', col2X, col2Y);
    col2Y += 5;

    // Partner name
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.setColorDark();
    this.doc.text(partnerInfo.name, col2X, col2Y);
    col2Y += 5;

    // Contact details
    const contactParts = [];
    if (partnerInfo.companyName) contactParts.push(partnerInfo.companyName);
    if (partnerInfo.email) contactParts.push(partnerInfo.email);
    if (partnerInfo.phone) contactParts.push(partnerInfo.phone);

    if (contactParts.length > 0) {
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7.5);
      this.setColorText();
      const maxWidth = colWidth - 4;
      const lines = this.doc.splitTextToSize(contactParts.join(' • '), maxWidth);
      this.doc.text(lines, col2X, col2Y);
    }
  }

  /**
   * Add partner info in header (already integrated in addHeader)
   */
  private async addPartnerSection(partnerInfo: PartnerInfo) {
    // Partner info is now integrated into the header
    // This method is kept for compatibility but the work is done in addPartnerInfoInHeader
    await this.addPartnerInfoInHeader(partnerInfo);
  }

  /**
   * Add equipment list - organized by category and subcategory
   */
  private async addEquipmentList(items: CatalogueItem[]) {
    try {
      // Group items by category and subcategory
      const groupedItems = this.groupItemsByCategory(items);
      console.debug('[PDF GENERATOR] Grouped items:', { categories: Object.keys(groupedItems).length });

      // Title
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(14);
      this.setColorPrimary();
      this.doc.text(this.getLocalizedText('available_equipment'), this.margin, this.currentY);
      this.currentY += 10;

      // Layout constants
      const imageContainerW = 75;
      const imageContainerH = 60;
      const imageMarginLeft = this.margin;
      const detailsMarginLeft = imageMarginLeft + imageContainerW + 8;
      const detailsMaxW = this.pageWidth - detailsMarginLeft - this.margin;

      // Process each category
      let itemIndex = 0;
      for (const [categoryName, subcategories] of Object.entries(groupedItems)) {
        console.debug('[PDF GENERATOR] Processing category:', categoryName);
        // Category header
        if (this.currentY + 8 > this.pageHeight - 30) {
          this.addPageBreak();
        }

        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(12);
        this.setColorPrimary();
        this.doc.text(categoryName, this.margin, this.currentY);
        this.currentY += 7;

        // Process each subcategory
        for (const [subcategoryName, categoryItems] of Object.entries(subcategories)) {
          // Subcategory header (if there are multiple subcategories)
          const totalSubcategories = Object.keys(subcategories).length;
          if (totalSubcategories > 1) {
            const minItemHeight = imageContainerH + 10;
            const subcategoryHeaderHeight = 6;
            const spaceNeededForSubcategoryWithItem = subcategoryHeaderHeight + minItemHeight;

            // Check if subcategory header + at least one item fits on current page
            if (this.currentY + spaceNeededForSubcategoryWithItem > this.pageHeight - 30) {
              this.addPageBreak();
            }

            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(10);
            this.setColorMuted();
            this.doc.text(`  ${subcategoryName}`, this.margin, this.currentY);
            this.currentY += 6;
          }

          // Equipment items
          for (const item of categoryItems) {
            try {
              console.debug('[PDF GENERATOR] Processing item:', item.name);
              const minItemHeight = imageContainerH + 10;

              if (this.currentY + minItemHeight > this.pageHeight - 30) {
                this.addPageBreak();
              }

              const itemStartY = this.currentY;

              // Light subtle background for alternating rows
              if (itemIndex % 2 === 1) {
                this.doc.setFillColor(248, 248, 248);
                this.doc.rect(this.margin - 2, itemStartY - 1, this.pageWidth - this.margin * 2 + 4, minItemHeight + 2, 'F');
              }

              // IMAGE CONTAINER (left side)
              this.doc.setDrawColor(220, 220, 220);
              this.doc.setLineWidth(0.2);
              this.doc.rect(imageMarginLeft, itemStartY, imageContainerW, imageContainerH, 'S');

              if (item.imageUrl) {
                const imgData = await this.loadImageAsDataUrl(item.imageUrl);
                if (imgData) {
                  const dims = this.calculateImageDimensions(
                    imgData.width,
                    imgData.height,
                    imageContainerW - 2,
                    imageContainerH - 2
                  );

                  try {
                    const format = item.imageUrl.includes('png') ? 'PNG' : 'JPEG';
                    this.doc.addImage(
                      imgData.dataUrl,
                      format,
                      imageMarginLeft + 1 + dims.offsetX,
                      itemStartY + 1 + dims.offsetY,
                      dims.width,
                      dims.height
                    );
                  } catch (e) {
                    console.warn('[PDF GENERATOR] Failed to add image for item:', item.name, e);
                    this.drawImagePlaceholder(imageMarginLeft, itemStartY, imageContainerW, imageContainerH);
                  }
                } else {
                  this.drawImagePlaceholder(imageMarginLeft, itemStartY, imageContainerW, imageContainerH);
                }
              } else {
                this.drawImagePlaceholder(imageMarginLeft, itemStartY, imageContainerW, imageContainerH);
              }

              // DETAILS SECTION (right side)
              let detailY = itemStartY + 3;

              // Product name
              this.doc.setFont('helvetica', 'bold');
              this.doc.setFontSize(11);
              this.setColorDark();
              const nameLines = this.doc.splitTextToSize(item.name, detailsMaxW);
              this.doc.text(nameLines, detailsMarginLeft, detailY);
              detailY += nameLines.length * 4.5 + 3;

              // Description
              if (item.description) {
                this.doc.setFont('helvetica', 'normal');
                this.doc.setFontSize(8);
                this.setColorText();
                const descLines = this.doc.splitTextToSize(item.description, detailsMaxW);
                const maxDescLines = 3;
                const visibleDescLines = descLines.slice(0, maxDescLines);
                this.doc.text(visibleDescLines, detailsMarginLeft, detailY);
              }

              // Pricing and quantity
              const priceY = itemStartY + imageContainerH - 6;

              if (item.dailyRate !== undefined && item.dailyRate > 0) {
                this.doc.setFont('helvetica', 'bold');
                this.doc.setFontSize(10);
                this.doc.setTextColor(this.COLOR_ACCENT.r, this.COLOR_ACCENT.g, this.COLOR_ACCENT.b);
                this.doc.text(`€${item.dailyRate.toFixed(2)}${this.getLocalizedText('per_day')}`, detailsMarginLeft, priceY);

                if (item.quantity !== undefined) {
                  this.doc.setFont('helvetica', 'normal');
                  this.doc.setFontSize(8);
                  this.setColorMuted();
                  this.doc.text(`• ${item.quantity} ${this.getLocalizedText('in_stock')}`, detailsMarginLeft + 32, priceY);
                }
              }

              this.setColorDefault();
              this.currentY = itemStartY + minItemHeight + 4;
              itemIndex++;
            } catch (itemError) {
              console.error('[PDF GENERATOR] Error processing item:', {
                itemName: item.name,
                error: itemError instanceof Error ? itemError.message : String(itemError),
                stack: itemError instanceof Error ? itemError.stack : '',
              });
              // Skip this item and continue with next
              itemIndex++;
            }
          }
        }

        // Space between categories
        this.currentY += 4;
      }
    } catch (equipmentError) {
      console.error('[PDF GENERATOR] Error in equipment list:', equipmentError instanceof Error ? equipmentError.message : String(equipmentError));
      throw equipmentError;
    }
  }

  /**
   * Group items by category and subcategory
   */
  private groupItemsByCategory(items: CatalogueItem[]): Record<string, Record<string, CatalogueItem[]>> {
    const grouped: Record<string, Record<string, CatalogueItem[]>> = {};

    for (const item of items) {
      const category = item.category || 'Other';
      const subcategory = (item as any).subcategory || 'General';

      if (!grouped[category]) {
        grouped[category] = {};
      }

      if (!grouped[category][subcategory]) {
        grouped[category][subcategory] = [];
      }

      grouped[category][subcategory].push(item);
    }

    return grouped;
  }

  /**
   * Draw image placeholder
   */
  private drawImagePlaceholder(x: number, y: number, w: number, h: number) {
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.setColorMuted();
    this.doc.text('No Image', x + w / 2, y + h / 2, { align: 'center' });
  }

  /**
   * Add page footer to all pages
   */
  /**
   * Add terms and conditions section on dedicated page
   */
  private async addTermsAndConditions(customTermsText?: string) {
    // Only add terms section if custom terms are provided
    if (!customTermsText || !customTermsText.trim()) {
      return;
    }

    // Always start on a new page for terms and conditions
    this.addPageBreak();

    // Section title - large and prominent
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(16);
    this.setColorDark();
    const termsTitle = this.language === 'pt' ? 'Termos e Condições' : 'Terms and Conditions';
    this.doc.text(termsTitle, this.margin, this.currentY);
    this.currentY += 10;

    // Divider - thicker and more prominent
    this.doc.setDrawColor(this.COLOR_PRIMARY.r, this.COLOR_PRIMARY.g, this.COLOR_PRIMARY.b);
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 8;

    // Intro text
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.setColorMuted();
    const introText = this.language === 'pt' 
      ? 'Leia atentamente os seguintes termos e condições antes de usar o equipamento alugado:'
      : 'Please read the following terms and conditions carefully before using the rented equipment:';
    const introLines = this.doc.splitTextToSize(introText, this.pageWidth - (this.margin * 2));
    this.doc.text(introLines, this.margin, this.currentY);
    this.currentY += introLines.length * 4 + 8;

    // Terms content
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.setColorText();

    // Split custom terms by newline
    const terms = customTermsText.split('\n').filter(t => t.trim().length > 0);

    const maxWidth = this.pageWidth - (this.margin * 2);
    let termsY = this.currentY;

    for (const term of terms) {
      const lines = this.doc.splitTextToSize(term, maxWidth - 4);
      const lineHeight = 4.5;
      const textHeight = lines.length * lineHeight;

      // Check if we need a new page
      if (termsY + textHeight + 5 > this.pageHeight - 25) {
        this.addPageBreak();
        termsY = this.currentY;
      }

      // Alternate background colors for readability
      if (terms.indexOf(term) % 2 === 1) {
        this.doc.setFillColor(248, 248, 248);
        this.doc.rect(this.margin - 2, termsY - 1, maxWidth + 4, textHeight + 2, 'F');
      }

      this.setColorText();
      this.doc.text(lines, this.margin + 2, termsY, { maxWidth: maxWidth - 4 });
      termsY += textHeight + 3;
    }

    this.currentY = termsY + 10;
  }

  private addPageFooter(branding?: CustomizationSettings) {
    const pageCount = (this.doc as any).getNumberOfPages ? (this.doc as any).getNumberOfPages() : 1;

    for (let i = 1; i <= pageCount; i++) {
      (this.doc as any).setPage(i);

      // Footer line
      this.doc.setDrawColor(this.COLOR_BORDER.r, this.COLOR_BORDER.g, this.COLOR_BORDER.b);
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margin, this.pageHeight - 18, this.pageWidth - this.margin, this.pageHeight - 18);

      // Footer message
      const footerMsg = branding?.pdfFooterMessage ?? 'For rental inquiries and availability, please contact us.';
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(8);
      this.setColorMuted();
      this.doc.text(footerMsg, this.margin, this.pageHeight - 12);

      // Page number
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
      this.doc.text(`Page ${i} of ${pageCount}`, this.pageWidth - this.margin, this.pageHeight - 12, {
        align: 'right'
      });
    }
  }

  /**
   * Add page break
   */
  private addPageBreak() {
    this.doc.addPage();
    this.currentY = this.margin;
  }

  /**
   * Main PDF generation method
   */
  public async generatePDF(items: CatalogueItem[], options: CataloguePDFOptions = {}): Promise<Buffer> {
    try {
      console.debug('[PDF GENERATOR] Starting generatePDF', { 
        itemsCount: items.length,
        hasCustomTerms: !!options.customTermsText,
        customTermsLength: options.customTermsText?.length || 0,
        customTermsPreview: options.customTermsText ? `"${options.customTermsText.substring(0, 50)}..."` : 'NONE'
      });
      
      // Add header
      console.debug('[PDF GENERATOR] Adding header');
      await this.addHeader(options.branding);

      // Add partner section if provided
      if (options.partnerInfo) {
        console.debug('[PDF GENERATOR] Adding partner section');
        await this.addPartnerSection(options.partnerInfo);
      }

      // Add equipment list
      console.debug('[PDF GENERATOR] Adding equipment list');
      await this.addEquipmentList(items);

      // Add terms and conditions if provided
      if (options.customTermsText) {
        console.debug('[PDF GENERATOR] Adding terms and conditions');
        await this.addTermsAndConditions(options.customTermsText);
      } else {
        console.debug('[PDF GENERATOR] Skipping terms - no custom terms provided');
      }

      // Add footer
      console.debug('[PDF GENERATOR] Adding footer');
      this.addPageFooter(options.branding);

      // Generate PDF
      console.debug('[PDF GENERATOR] Calling doc.output()');
      const arrayBuffer = this.doc.output('arraybuffer');
      console.debug('[PDF GENERATOR] Converting to Buffer');
      return Buffer.from(arrayBuffer);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : '';
      console.error('[PDF GENERATOR] Failed to generate PDF:', {
        message: errorMsg,
        stack: errorStack,
        itemsCount: items.length,
      });
      throw error;
    }
  }

  /**
   * Static method for direct generation
   */
  public static async generateCataloguePDF(
    items: CatalogueItem[],
    options: CataloguePDFOptions = {}
  ): Promise<Buffer> {
    const generator = new ProfessionalCataloguePDFGenerator(options.language || 'en');
    return generator.generatePDF(items, options);
  }
}
