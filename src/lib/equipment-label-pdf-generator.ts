// src/lib/equipment-label-pdf-generator.ts
// Equipment Label PDF Generator - Padrão Industrial Swiss Style
// Design profissional com Helvetica Bold, preto puro, linhas de corte finas
// Otimizado para impressão em A4 com tesoura/guilhotina
// Integração Acrobaticz: Logo de luxo (20% altura) com separador fino (0.2mm)

import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import type { EquipmentItem } from '@/types';

/**
 * Template de tamanho com dimensões em milímetros
 * Swiss Style: Cada template é uma composição harmónica de espaço e tipografia
 */
export type LabelTemplate = 'cable' | 'small' | 'flightcase' | 'shipping';

export interface EquipmentLabelPDFOptions {
  filename?: string;
  download?: boolean;
  templateSize?: LabelTemplate;
  language?: 'en' | 'pt';
  companyName?: string;
}

/**
 * Configuração de template: dimensões, grid layout, tipografia, spacing
 * Todas as dimensões em milímetros
 */
export interface LabelTemplateConfig {
  width: number;              // mm - largura da etiqueta
  height: number;             // mm - altura da etiqueta
  name: string;
  description: string;
  gridColumns: number;        // Etiquetas por linha em A4
  gridRows: number;           // Linhas em A4
  hasLogo: boolean;           // Mostrar logo Acrobaticz?
  qrSize: number;             // Tamanho do QR Code em mm
  logoAreaHeight?: number;    // 20% da altura para logo (apenas com logo)
  minFontSize?: number;       // Font size mínimo para nomes longos
  nameMaxFontSize?: number;   // Font size máximo para nome do equipamento
}

export interface GridPosition {
  x: number;            // Posição X em mm
  y: number;            // Posição Y em mm
  pageIndex: number;    // Índice da página
  cellIndex: number;    // Índice na página (0 a n)
}

export interface CustomizationSettings {
  companyName?: string;
  pdfCompanyName?: string;
  pdfLogoUrl?: string;
  pdfUseTextLogo?: boolean;
}

interface LogoData {
  base64: string;
  width: number;
  height: number;
}

/**
 * Extended EquipmentItem com relacionamentos carregados
 */
export interface EquipmentItemWithRelations extends Omit<EquipmentItem, 'Category' | 'Subcategory'> {
  Category?: {
    id: string;
    name: string;
    icon?: string;
  };
  Subcategory?: {
    id: string;
    name: string;
  };
}

/**
 * Configuração de templates de etiqueta - Swiss Style Industrial
 * Cada template é otimizado para impressão A4 com tesoura/guilhotina
 * 
 * Filosofia:
 * - Helvetica Bold para o nome (elemento mais forte)
 * - Preto puro (#000000) sobre branco (#FFFFFF) - máximo contraste para scanners
 * - Linhas de guia em cinza muito claro (0.1mm) para marcas de corte
 * - Quiet zone obrigatória 3mm ao redor do QR Code
 */
export const LABEL_TEMPLATES: Record<LabelTemplate, LabelTemplateConfig> = {
  cable: {
    // Cable Tag 25×75mm: "Bandeira" - para cabos e conectores
    // Design: QR na ponta direita, ID em Bold Extra Grande centralizado
    width: 25,
    height: 75,
    name: 'Cable Tag',
    description: 'Cabos e conectores - Design de bandeira',
    gridColumns: 2,
    gridRows: 10,
    hasLogo: false,             // Sem logo para maximizar ID + QR
    qrSize: 18,                 // QR na ponta
    minFontSize: 10,            // ID nunca menor que 10pt
    nameMaxFontSize: 20         // ID em Bold extra grande
  },
  small: {
    // Small Case 50×30mm: Compacto - para cases pequenos
    width: 50,
    height: 30,
    name: 'Small Case',
    description: 'Cases compactos - layout horizontal',
    gridColumns: 4,
    gridRows: 8,
    hasLogo: false,
    qrSize: 12,
    minFontSize: 6,
    nameMaxFontSize: 9
  },
  flightcase: {
    // Flightcase 100×75mm: Standard Profissional ⭐
    // Design: Logo (topo 20%) | Separador | Nome (centro) | ID (fundo)
    //         Esquerda: Logo+Nome+ID | Direita: QR grande 35mm com quiet zone 3mm
    width: 100,
    height: 75,
    name: 'Flightcase',
    description: 'Standard profissional - Layout com logo Acrobaticz',
    gridColumns: 2,
    gridRows: 3,
    hasLogo: true,              // Logo de luxo (topo)
    qrSize: 35,                 // QR grande para leitura à distância
    logoAreaHeight: 15,         // 20% da altura (75mm × 20% = 15mm)
    minFontSize: 9,
    nameMaxFontSize: 14
  },
  shipping: {
    // Shipping Label A6 (210×148mm): Envios e paletes
    // Design similar ao Flightcase mas escalonado
    width: 210,
    height: 148,
    name: 'Shipping Label',
    description: 'Envios e paletes A6 - Layout horizontal de luxo',
    gridColumns: 1,
    gridRows: 2,
    hasLogo: true,
    qrSize: 40,                 // QR extra grande para leitura rápida
    logoAreaHeight: 25,         // 25mm para logo (17% da altura)
    minFontSize: 11,
    nameMaxFontSize: 18
  }
};

/**
 * Equipment Label PDF Generator - Swiss Style Industrial
 * Renderização profissional de etiquetas com foco em qualidade de impressão
 */
export class EquipmentLabelPDFGenerator {
  private doc: jsPDF;
  private pageWidth: number = 210;          // A4 width (mm)
  private pageHeight: number = 297;         // A4 height (mm)
  private pageMargin: number = 10;          // Margem global da página (mm)
  private templateConfig: LabelTemplateConfig;
  private qrCodeCache: Map<string, string> = new Map();
  private logoData: LogoData | null = null;
  private customizationSettings: CustomizationSettings | null = null;

  // Constantes de design Swiss Style (Industrial Standards)
  private readonly HELVETICA_FONT = 'helvetica';
  private readonly COURIER_FONT = 'courier';
  private readonly COLOR_BLACK = { r: 0, g: 0, b: 0 };           // Preto puro (#000000)
  private readonly COLOR_WHITE = { r: 255, g: 255, b: 255 };     // Branco puro (#FFFFFF)
  private readonly COLOR_GRAY_CUT = { r: 226, g: 232, b: 240 };  // Cinza corte (#E2E8F0) - linhas de corte
  private readonly GUIDE_LINE_WIDTH = 0.1;   // Linha de guia (0.1mm)
  private readonly SEPARATOR_LINE_WIDTH = 0.2; // Separador fino (0.2mm)
  private readonly QUIET_ZONE = 3;           // Quiet zone obrigatória (3mm)
  private readonly INTERNAL_MARGIN = 3;      // Margem interna de sangria (3mm)

  private constructor(templateSize: LabelTemplate = 'flightcase') {
    this.doc = new jsPDF({
      format: 'a4',
      orientation: 'portrait',
      unit: 'mm'
    });
    
    this.templateConfig = LABEL_TEMPLATES[templateSize];
  }

  /**
   * Factory method estático
   */
  public static async generateLabelsPDF(
    items: EquipmentItemWithRelations[],
    quantities: Map<string, number>,
    options: EquipmentLabelPDFOptions = {}
  ): Promise<Blob> {
    const generator = new EquipmentLabelPDFGenerator(options.templateSize || 'flightcase');
    
    // Fetch customization settings (branding)
    await generator.fetchCustomizationSettings();
    
    // Gerar QR codes em paralelo
    await generator.preRenderQRCodesInParallel(items);
    
    // Gerar PDF com grid layout
    await generator.generatePDF(items, quantities);
    
    // Output como blob
    const blob = generator.doc.output('blob');
    
    // Download automático se solicitado
    if (options.download) {
      const filename = options.filename || `equipment-labels-${Date.now()}.pdf`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    }
    
    return blob;
  }

  /**
   * Fetch customization settings do backend
   */
  private async fetchCustomizationSettings(): Promise<void> {
    try {
      const response = await fetch('/api/customization', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        this.customizationSettings = await response.json();
        
        // Converter logo para Base64 com metadata
        if (this.customizationSettings?.pdfLogoUrl && !this.customizationSettings.pdfUseTextLogo) {
          const logoData = await this.convertImageToBase64(this.customizationSettings.pdfLogoUrl);
          if (logoData.base64) {
            this.logoData = logoData;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to fetch customization settings:', error);
    }
  }

  /**
   * Converter imagem para Base64 usando Canvas com aspect ratio
   */
  private async convertImageToBase64(imageUrl: string): Promise<{ base64: string; width: number; height: number }> {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            resolve({
              base64: dataUrl,
              width: img.width,
              height: img.height
            });
          } else {
            resolve({ base64: '', width: 0, height: 0 });
          }
        };
        
        img.onerror = () => {
          console.warn('Failed to load image:', imageUrl);
          resolve({ base64: '', width: 0, height: 0 });
        };
        
        img.src = imageUrl;
      } catch (error) {
        console.warn('Error converting image:', error);
        resolve({ base64: '', width: 0, height: 0 });
      }
    });
  }

  /**
   * Calcular dimensões do logo respeitando aspect ratio
   */
  private calculateLogoDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = maxWidth;
    let height = maxWidth / aspectRatio;
    
    if (height > maxHeight) {
      height = maxHeight;
      width = maxHeight * aspectRatio;
    }
    
    return { width, height };
  }

  /**
   * Gerar QR codes em paralelo
   */
  private async preRenderQRCodesInParallel(items: EquipmentItem[]): Promise<void> {
    const qrPromises = items.map(async (item) => {
      if (!this.qrCodeCache.has(item.id)) {
        const qrPayload = this.normalizeQRPayload(item.id);
        const qrDataUrl = await this.generateQRCodeImage(qrPayload);
        this.qrCodeCache.set(item.id, qrDataUrl);
      }
    });
    
    await Promise.all(qrPromises);
  }

  /**
   * Gerar QR Code com alta fidelidade
   */
  private async generateQRCodeImage(data: string): Promise<string> {
    try {
      const qrDataUrl = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'H',  // 30% de tolerância
        type: 'image/png',
        width: 200,
        margin: 1,                   // Quiet zone
        scale: 10,                   // Clareza vetorial
        color: {
          dark: '#000000',           // Preto puro
          light: '#FFFFFF'           // Branco puro
        }
      });
      return qrDataUrl;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      return '';
    }
  }

  /**
   * Normalizar payload do QR code
   */
  private normalizeQRPayload(itemId: string): string {
    return `av-rental://equipment/${itemId.trim()}`;
  }

  /**
   * Renderizar QR Code como Protagonista com Quiet Zone Profissional
   * 
   * REGRAS ESTRITAS:
   * 1. QR Code é o MAIOR elemento visual (nunca reduzido)
   * 2. Quiet Zone: 3mm branco obrigatório ao redor
   * 3. Preto puro #000000 apenas (máximo contraste)
   * 4. ID NÃO é impresso como texto (já está no QR)
   * 5. Desenho por último (Z-Index top)
   * 
   * @param itemId ID do item (para payload do QR, não para impressão)
   * @param x Posição X do QR
   * @param y Posição Y do QR
   * @param qrSize Tamanho do QR em mm
   */
  private async renderQRCodeWithQuietZone(
    itemId: string,
    x: number,
    y: number,
    qrSize: number
  ): Promise<void> {
    const qrDataUrl = this.qrCodeCache.get(itemId) || '';
    
    if (!qrDataUrl) return;
    
    // ===== QUIET ZONE: 3mm branco obrigatório ao redor =====
    const quietX = x - this.QUIET_ZONE;      // 3mm esquerda
    const quietY = y - this.QUIET_ZONE;      // 3mm topo
    const quietSize = qrSize + (this.QUIET_ZONE * 2); // 3mm cada lado
    
    // Renderizar fundo branco para quiet zone
    this.doc.setFillColor(this.COLOR_WHITE.r, this.COLOR_WHITE.g, this.COLOR_WHITE.b);
    this.doc.rect(quietX, quietY, quietSize, quietSize, 'F'); // 'F' = fill
    
    // ===== QR CODE: Preto puro #000000 (máximo contraste) =====
    // Este é o PROTAGONISTA - elemento mais importante da etiqueta
    this.doc.addImage(qrDataUrl, 'PNG', x, y, qrSize, qrSize);
    
    // ===== SEM TEXTO ID =====
    // O ID já está codificado no QR Code (av-rental://equipment/{id})
    // Remover completamente o fallback de texto para limpeza visual
  }

  /**
   * Renderizar Branding Header - SSOT (Single Source of Truth)
   * 
   * Regra de Ouro: Se logo carrega com sucesso, NUNCA mostrar texto "Acrobaticz" ou "AV Rentals"
   * O logótipo é a única marca visual. Nada de redundância.
   * 
   * @param x Posição X
   * @param y Posição Y
   * @param width Largura disponível
   * @param maxLogoHeight Altura máxima para o logo (fixo em 15mm para cables, variável para outros)
   * @returns Altura ocupada (para cálculo de offset)
   */
  private async renderBrandingHeader(
    x: number,
    y: number,
    width: number,
    maxLogoHeight: number
  ): Promise<number> {
    // SSOT: Carregar logo apenas uma vez no constructor
    if (this.logoData && this.logoData.base64) {
      // ✅ LOGO CARREGOU: Renderizar APENAS o logo
      // Calcular dimensões mantendo aspect ratio
      const logoDimensions = this.calculateLogoDimensions(
        this.logoData.width,
        this.logoData.height,
        width - 4,  // Deixar margens de 2mm cada lado
        maxLogoHeight
      );
      
      // Centralizar logo horizontalmente na zona disponível
      const logoX = x + (width - logoDimensions.width) / 2;
      
      // Renderizar imagem
      this.doc.addImage(
        this.logoData.base64,
        'PNG',
        logoX,
        y,
        logoDimensions.width,
        logoDimensions.height
      );
      
      // Retornar altura usada (sem separador para templates sem logo)
      return logoDimensions.height;
    } else {
      // ❌ LOGO NÃO CARREGOU: Fallback com texto APENAS
      // (Nunca mostrar logo quebrado + texto simultaneamente)
      const companyName = this.customizationSettings?.pdfCompanyName || 'Acrobaticz';
      
      this.doc.setFontSize(10);
      this.doc.setFont(this.HELVETICA_FONT, 'bold');
      this.doc.setTextColor(this.COLOR_BLACK.r, this.COLOR_BLACK.g, this.COLOR_BLACK.b);
      this.doc.text(companyName, x + 2, y + 3);
      
      return 5; // Altura do texto
    }
  }

  /**
   * Calcular posição no grid A4 com margens de 10mm
   * Garante perfeita alineação para tesoura/guilhotina
   */
  private calculateGridPosition(labelIndex: number): GridPosition {
    const cellsPerPage = this.templateConfig.gridColumns * this.templateConfig.gridRows;
    const pageIndex = Math.floor(labelIndex / cellsPerPage);
    const cellIndex = labelIndex % cellsPerPage;
    
    const col = cellIndex % this.templateConfig.gridColumns;
    const row = Math.floor(cellIndex / this.templateConfig.gridColumns);
    
    // Calcular dimensões disponíveis (com margem global de 10mm)
    const availableWidth = this.pageWidth - (this.pageMargin * 2);
    const availableHeight = this.pageHeight - (this.pageMargin * 2);
    
    const cellWidth = availableWidth / this.templateConfig.gridColumns;
    const cellHeight = availableHeight / this.templateConfig.gridRows;
    
    const x = this.pageMargin + (col * cellWidth);
    const y = this.pageMargin + (row * cellHeight);
    
    return { x, y, pageIndex, cellIndex };
  }

  /**
   * Gerar PDF com grid layout A4 profissional
   * Margem global: 10mm
   */
  private async generatePDF(
    items: EquipmentItemWithRelations[],
    quantities: Map<string, number>
  ): Promise<void> {
    let labelIndex = 0;
    
    for (const item of items) {
      const qty = quantities.get(item.id) || 0;
      
      for (let i = 0; i < qty; i++) {
        const position = this.calculateGridPosition(labelIndex);
        
        // Adicionar página se necessário
        if (position.pageIndex > 0 && position.cellIndex === 0) {
          this.doc.addPage('a4', 'p');
        }
        
        // Calcular dimensões da célula
        const availableWidth = this.pageWidth - (this.pageMargin * 2);
        const availableHeight = this.pageHeight - (this.pageMargin * 2);
        const cellWidth = availableWidth / this.templateConfig.gridColumns;
        const cellHeight = availableHeight / this.templateConfig.gridRows;
        
        await this.drawLabelCell(item, position, cellWidth, cellHeight);
        
        labelIndex++;
      }
    }
  }

  /**
   * Desenhar célula de etiqueta com marcas de corte profissionais
   * 
   * Engenharia de Layout A4:
   * 1. Grelha A4 com marcas de corte pontilhadas (#E2E8F0, 0.1mm)
   * 2. QR Code renderizado por último (Z-Index top)
   * 3. Margens internas de 3mm (sangria) respeitadas
   * 4. Preto puro #000000 para máximo contraste
   */
  private async drawLabelCell(
    item: EquipmentItemWithRelations,
    position: GridPosition,
    cellWidth: number,
    cellHeight: number
  ): Promise<void> {
    const { x, y } = position;
    
    // ===== PASSO 1: MARCAS DE CORTE PONTILHADAS (#E2E8F0, 0.1mm) =====
    // Linhas pontilhadas para guiar tesoura/guilhotina profissional
    this.doc.setDrawColor(this.COLOR_GRAY_CUT.r, this.COLOR_GRAY_CUT.g, this.COLOR_GRAY_CUT.b);
    this.doc.setLineWidth(0.1);
    
    // Desenhar rectângulo com padrão pontilhado (usando setLineDash se disponível)
    // Fallback: desenhar linhas contínuas se setLineDash não estiver disponível
    try {
      // Tentar usar setLineDash para pontilhado profissional
      (this.doc as any).setLineDash([1, 1]); // Padrão: 1mm linha, 1mm espaço
    } catch (e) {
      // Se não suportar, continuar com linha contínua
    }
    
    this.doc.rect(x, y, cellWidth, cellHeight, 'S'); // 'S' = stroke only
    
    // Resetar padrão de linha
    try {
      (this.doc as any).setLineDash([]);
    } catch (e) {
      // Ignorar
    }
    
    // ===== PASSO 2: CALCULAR ÁREA INTERNA (respeitando margens de 3mm) =====
    const padding = this.INTERNAL_MARGIN; // 3mm de sangria
    const contentX = x + padding;
    const contentY = y + padding;
    const contentWidth = cellWidth - (padding * 2);
    const contentHeight = cellHeight - (padding * 2);
    
    // ===== PASSO 3: RENDERIZAR CONTEÚDO ESPECÍFICO DO TEMPLATE =====
    const templateName = this.templateConfig.name.toLowerCase();
    if (templateName.includes('cable')) {
      await this.drawCableTagLabel(item, contentX, contentY, contentWidth, contentHeight);
    } else if (templateName.includes('flightcase')) {
      await this.drawFlightcaseLabel(item, contentX, contentY, contentWidth, contentHeight);
    } else if (templateName.includes('small')) {
      await this.drawSmallCaseLabel(item, contentX, contentY, contentWidth, contentHeight);
    } else if (templateName.includes('shipping')) {
      await this.drawShippingLabel(item, contentX, contentY, contentWidth, contentHeight);
    }
    
    // ===== PASSO 4: QR CODE RENDERIZADO POR ÚLTIMO (Z-INDEX TOP) =====
    // O QR é o PROTAGONISTA e deve aparecer por cima de todos os elementos
    // (Já renderizado dentro de cada drawXxxLabel, não é necessário novamente)
  }

  /**
   * Cable Tag 25×75mm - Design Bandeira Industrial (LAYOUT RENOVADO)
   * 
   * ┌─────────────────────────────────────────────────────────┬──────────┐
   * │                                                         │          │
   * │   ID DO EQUIPAMENTO                                    │   QR     │
   * │   (Helvetica Bold 14pt com auto-shrink)               │  CODE    │
   * │                                                         │ 20×20mm  │
   * │   [Zona Proibida: Nada escrito aqui →]               │          │
   * └─────────────────────────────────────────────────────────┴──────────┘
   *
   * ZONA ESQUERDA (45mm): ID do Equipamento - ELEMENTO CENTRAL
   * - Font: Helvetica Bold 14pt inicial
   * - Auto-shrink até 8pt se ID for longo
   * - Alinhamento: Esquerda com margem de 5mm
   * - Máximo de 2 linhas
   *
   * ZONA DIREITA (22mm): QR CODE - ZONA PROIBIDA
   * - Nada pode ser escrito aqui
   * - QR 20×20mm + quiet zone 2mm = 24mm total
   * - Desenhado por último (Z-Index)
   *
   * SEM NOME, SEM CATEGORIA (apenas ID necessário para funcionalidade)
   */
  private async drawCableTagLabel(
    item: EquipmentItemWithRelations,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> {
    const qrSize = 20; // QR Code 20×20mm - PROTAGONISTA
    const qrProhibitedZoneWidth = 22; // Zona exclusiva para QR direita
    const nameMargin = 2; // Margem esquerda para nome
    
    // ===== ZONA ESQUERDA: NOME + CATEGORIA =====
    const contentWidth = width - qrProhibitedZoneWidth - nameMargin;
    
    // NOME DO EQUIPAMENTO (Helvetica Bold, auto-shrink)
    const nameText = item.name || 'Unknown';
    let fontSize = 12;
    let textFits = false;
    let nameLines: string[] = [];
    
    while (fontSize >= 8 && !textFits) {
      this.doc.setFontSize(fontSize);
      this.doc.setFont(this.HELVETICA_FONT, 'bold');
      
      nameLines = this.doc.splitTextToSize(nameText, contentWidth - 1);
      const lineHeight = fontSize * 0.35;
      const totalHeight = nameLines.length * lineHeight;
      
      // Máximo 2 linhas, sem tocar no QR
      if (nameLines.length <= 2 && totalHeight < (height * 0.5)) {
        textFits = true;
      } else {
        fontSize -= 0.5;
      }
    }
    
    // Renderizar nome
    this.doc.setFontSize(fontSize);
    this.doc.setFont(this.HELVETICA_FONT, 'bold');
    this.doc.setTextColor(this.COLOR_BLACK.r, this.COLOR_BLACK.g, this.COLOR_BLACK.b);
    const lineHeight = fontSize * 0.35;
    const nameStartY = y + (lineHeight * 0.5);
    this.doc.text(nameLines, x + nameMargin, nameStartY);
    
    // CATEGORIA > SUBCATEGORIA (Helvetica Itálica 9pt)
    const categoryText = this.buildCategoryText(item);
    this.doc.setFontSize(9);
    this.doc.setFont(this.HELVETICA_FONT, 'italic');
    this.doc.setTextColor(this.COLOR_BLACK.r, this.COLOR_BLACK.g, this.COLOR_BLACK.b);
    
    const categoryStartY = nameStartY + (nameLines.length * lineHeight) + 1;
    const categoryLines = this.doc.splitTextToSize(categoryText, contentWidth - 1);
    this.doc.text(categoryLines, x + nameMargin, categoryStartY);
    
    // ===== ZONA DIREITA: QR CODE (PROTAGONISTA - Renderizado por último) =====
    const qrX = x + width - qrSize - 1;
    const qrY = y + (height - qrSize) / 2;
    
    // Renderizar QR por último para garantir Z-Index
    await this.renderQRCodeWithQuietZone(item.id, qrX, qrY, qrSize);
  }

  /**
   * Helper: Construir texto de categoria/subcategoria
   */
  private buildCategoryText(item: EquipmentItemWithRelations): string {
    const parts: string[] = [];
    
    if (item.Category?.name) {
      parts.push(item.Category.name);
    }
    
    if (item.Subcategory?.name) {
      parts.push(item.Subcategory.name);
    }
    
    return parts.length > 0 ? parts.join(' / ') : '—';
  }

  /**
   * Flightcase 100×75mm - Padrão Profissional Swiss Style (REFATORADO)
   * 
   * GRID A4: 2 COLUNAS × 3 LINHAS = 6 ETIQUETAS POR PÁGINA
   *
   * Layout com Divisão Funcional Clara:
   *
   * ┌─────────────────────────────────────┬──────────────┐
   * │  [LOGO CENTRADO] (15mm max height)  │              │
   * │─────────────────────────────────────│              │
   * │  NOME DO EQUIPAMENTO (Bold 12pt)    │   QR CODE    │
   * │  (splitTextToSize para evitar       │   30×30mm    │
   * │   transbordar)                      │   com Quiet  │
   * │                                     │   Zone       │
   * │  ID: xxxxx (8pt)                    │              │
   * └─────────────────────────────────────┴──────────────┘
   *
   * TOPO (15mm): Logo Acrobaticz - SSOT (sem texto redundante)
   * CENTRO (30mm): Nome em Bold 12pt com splitTextToSize
   * BASE (10mm): ID em 8pt para leitura humana
   * DIREITA (30×30mm): QR Code grande + quiet zone
   */
  private async drawFlightcaseLabel(
    item: EquipmentItemWithRelations,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> {
    const qrSize = 30; // QR Code 30×30mm (fixo para Flightcase)
    const logoAreaHeight = 15; // Logo máximo 15mm
    const padding = 1;
    
    let currentY = y + padding;
    
    // ===== SECÇÃO TOPO: BRANDING HEADER (Logo SSOT) =====
    if (this.templateConfig.hasLogo) {
      const headerHeight = await this.renderBrandingHeader(
        x + padding,
        currentY,
        width - qrSize - padding * 3,
        logoAreaHeight
      );
      
      // Desenhar separador fino abaixo do logo
      this.doc.setDrawColor(this.COLOR_BLACK.r, this.COLOR_BLACK.g, this.COLOR_BLACK.b);
      this.doc.setLineWidth(this.SEPARATOR_LINE_WIDTH);
      this.doc.line(x + padding, currentY + headerHeight + 1, x + width - qrSize - padding, currentY + headerHeight + 1);
      
      currentY += headerHeight + 2; // Incluir espaço do separador
    }
    
    // ===== SECÇÃO CENTRO: NOME DO EQUIPAMENTO (Bold 12pt) =====
    const nameAreaHeight = height - (currentY - y) - padding - 8; // 8mm reservado para ID
    const nameMaxWidth = width - qrSize - padding * 3;
    
    this.doc.setFont(this.HELVETICA_FONT, 'bold');
    this.doc.setTextColor(this.COLOR_BLACK.r, this.COLOR_BLACK.g, this.COLOR_BLACK.b);
    
    // Font scaling para nomes longos
    let fontSize = 12;
    let textFits = false;
    let nameLines: string[] = [];
    
    while (fontSize >= 9 && !textFits) {
      this.doc.setFontSize(fontSize);
      nameLines = this.doc.splitTextToSize(item.name, nameMaxWidth - 1);
      const lineHeight = fontSize * 0.35;
      const totalHeight = nameLines.length * lineHeight;
      
      // Deve caber: máximo 2 linhas, respeitar altura
      if (totalHeight < nameAreaHeight && nameLines.length <= 2) {
        textFits = true;
      } else {
        fontSize -= 0.5;
      }
    }
    
    // Renderizar nome
    this.doc.setFontSize(fontSize);
    nameLines = this.doc.splitTextToSize(item.name, nameMaxWidth - 1);
    const lineHeight = fontSize * 0.35;
    const nameStartY = currentY + (lineHeight * 0.5);
    this.doc.text(nameLines, x + padding, nameStartY);
    
    
    currentY += (nameLines.length * lineHeight) + padding;
    
    // ===== SECÇÃO BASE: CATEGORIA > SUBCATEGORIA (Itálica 9pt, sem ID texto) =====
    // ID não é impresso (já está no QR Code como payload)
    const categoryText = this.buildCategoryText(item);
    
    this.doc.setFontSize(9);
    this.doc.setFont(this.HELVETICA_FONT, 'italic');
    this.doc.setTextColor(this.COLOR_BLACK.r, this.COLOR_BLACK.g, this.COLOR_BLACK.b);
    this.doc.text(categoryText, x + padding, currentY);
    
    // ===== ZONA DIREITA: QR CODE 30×30mm (Desenhado por último para Z-Index) =====
    const qrX = x + width - qrSize - padding;
    const qrY = y + (height - qrSize) / 2;
    
    await this.renderQRCodeWithQuietZone(item.id, qrX, qrY, qrSize);
  }

  /**
   * Small Case 50×30mm - Layout Horizontal Compacto
   * 
   * Design:
   * - Nome (Helvetica Bold, 7pt)
   * - Categoria / Subcategoria (Helvetica normal, 5pt)
   * - QR Code pequeno (12mm) na direita
   * - ID minúsculo em Courier sob QR (fallback)
   */
  private async drawSmallCaseLabel(
    item: EquipmentItemWithRelations,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> {
    const qrSize = this.templateConfig.qrSize; // 12mm
    const padding = 0.5;
    
    // ===== NOME (Helvetica Bold) =====
    const maxNameWidth = width - qrSize - padding * 3;
    const nameText = item.name || 'Unnamed';
    
    this.doc.setFontSize(7);
    this.doc.setFont(this.HELVETICA_FONT, 'bold');
    this.doc.setTextColor(this.COLOR_BLACK.r, this.COLOR_BLACK.g, this.COLOR_BLACK.b);
    
    const nameLines = this.doc.splitTextToSize(nameText, maxNameWidth);
    const lineHeight = 7 * 0.35;
    const totalHeight = nameLines.length * lineHeight;
    const nameStartY = y + (height - totalHeight) / 2 + 1;
    
    this.doc.text(nameLines, x + padding, nameStartY);
    
    // ===== CATEGORIA / SUBCATEGORIA (Itálica 9pt) =====
    const categoryText = this.buildCategoryText(item);
    
    this.doc.setFontSize(9);
    this.doc.setFont(this.HELVETICA_FONT, 'italic');
    this.doc.setTextColor(this.COLOR_BLACK.r, this.COLOR_BLACK.g, this.COLOR_BLACK.b);
    
    const categoryLines = this.doc.splitTextToSize(categoryText, maxNameWidth);
    const categoryLineHeight = 9 * 0.35;
    const categoryStartY = nameStartY + totalHeight + categoryLineHeight;
    
    this.doc.text(categoryLines, x + padding, categoryStartY);
    
    // ===== QR CODE =====
    const qrX = x + width - qrSize - padding;
    const qrY = y + (height - qrSize) / 2;
    
    await this.renderQRCodeWithQuietZone(item.id, qrX, qrY, qrSize);
  }

  /**
   * Shipping Label A6 (210×148mm) - Layout Horizontal de Luxo
   * 
   * Design:
   * - Logo Acrobaticz (topo 25mm, centrado)
   * - Separador fino (0.2mm)
   * - Nome do equipamento (Helvetica Bold grande)
   * - Categoria / Subcategoria (Helvetica normal)
   * - QR Code extra grande (40mm) lado direito com quiet zone 3mm
   * 
   * Uso: Envios, paletes, grandes remessas
   */
  private async drawShippingLabel(
    item: EquipmentItemWithRelations,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> {
    const padding = 1;
    const qrSize = this.templateConfig.qrSize; // 40mm
    const logoAreaHeight = this.templateConfig.logoAreaHeight || 25; // 25mm
    
    let currentY = y + padding;
    
    // ===== SECÇÃO: BRANDING HEADER (Logo + Separador) =====
    if (this.templateConfig.hasLogo) {
      const headerHeightUsed = await this.renderBrandingHeader(
        x + padding,
        currentY,
        width - qrSize - padding * 3,
        logoAreaHeight
      );
      currentY += headerHeightUsed;
    }
    
    // ===== SECÇÃO: NOME DO EQUIPAMENTO (Helvetica Bold extra grande) =====
    const nameAreaHeight = height - (currentY - y) - padding - 6;
    const nameMaxWidth = width - qrSize - padding * 3;
    
    this.doc.setFont(this.HELVETICA_FONT, 'bold');
    this.doc.setTextColor(this.COLOR_BLACK.r, this.COLOR_BLACK.g, this.COLOR_BLACK.b);
    
    // Font scaling para nomes longos
    let fontSize = this.templateConfig.nameMaxFontSize || 18;
    let textFits = false;
    let nameLines: string[] = [];
    
    while (fontSize >= (this.templateConfig.minFontSize || 11) && !textFits) {
      this.doc.setFontSize(fontSize);
      nameLines = this.doc.splitTextToSize(item.name, nameMaxWidth - 1);
      const lineHeight = fontSize * 0.35;
      const totalHeight = nameLines.length * lineHeight;
      
      if (totalHeight < nameAreaHeight && nameLines.length <= 2) {
        textFits = true;
      } else {
        fontSize -= 0.5;
      }
    }
    
    // Renderizar nome
    this.doc.setFontSize(fontSize);
    nameLines = this.doc.splitTextToSize(item.name, nameMaxWidth - 1);
    const lineHeight = fontSize * 0.35;
    const nameStartY = currentY + (lineHeight * 0.5);
    this.doc.text(nameLines, x + padding, nameStartY);
    
    
    currentY += (nameLines.length * lineHeight) + padding;
    
    // ===== SECÇÃO: CATEGORIA > SUBCATEGORIA (Itálica 9pt) =====
    const categoryText = this.buildCategoryText(item);
    
    this.doc.setFontSize(9);
    this.doc.setFont(this.HELVETICA_FONT, 'italic');
    this.doc.setTextColor(this.COLOR_BLACK.r, this.COLOR_BLACK.g, this.COLOR_BLACK.b);
    this.doc.text(categoryText, x + padding, currentY);
    
    // ===== SECÇÃO: QR CODE EXTRA GRANDE (lado direito) =====
    const qrX = x + width - qrSize - padding;
    const qrY = y + (height - qrSize) / 2;
    
    await this.renderQRCodeWithQuietZone(item.id, qrX, qrY, qrSize);
  }

  public getDoc(): jsPDF {
    return this.doc;
  }
}

export default EquipmentLabelPDFGenerator;
