# 📊 ANÁLISE ARQUITETURAL - GERADORES PDF EXISTENTES
## Recomendações para Label Generator PDF

**Data:** 16 de Janeiro de 2026  
**Auditoria Técnica:** Fullstack Architect  
**Objetivo:** Mapear stack PDF e padrões reutilizáveis para nova geração de etiquetas

---

## 🎯 RESUMO EXECUTIVO

O projeto utiliza **jsPDF como framework principal** para PDF, com dois geradores em produção:

| Componente | Localização | Tipo | Status |
|-----------|------------|------|--------|
| **QuotePDFGenerator** | `src/lib/pdf-generator.ts` | Cotações | ✅ Produção |
| **ProfessionalCataloguePDFGenerator** | `src/lib/professional-catalog-generator.ts` | Catálogos | ✅ Produção |
| **BrandingContext** | `src/contexts/BrandingContext.tsx` | Branding centralizado | ✅ Produção |

**Recomendação:** Usar **QuotePDFGenerator como template base** para Label Generator (é mais maduro e bem testado).

---

## 1️⃣ BIBLIOTECAS DE PDF

### Stack Confirmado

```json
{
  "jspdf": "^3.0.3",
  "date-fns": "^2.30.0",
  "react-qr-code": "^1.6.4"
}
```

### ❌ NÃO Usado no Projeto

- ❌ `html2canvas` - Não aparece em dependências
- ❌ `react-pdf` - Não implementado
- ❌ `pdfkit` - Node.js only, não aplicável
- ❌ `html2pdf.js` - Não usado

### ✅ jsPDF - Versão Verificada

```typescript
import jsPDF from 'jspdf';

// Uso no projeto:
const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',           // ⭐ Importante: usa milímetros para impressão
  format: 'a4'          // Suporta: a4, a5, a6, letter, etc.
});
```

**Características relevantes:**
- ✅ Renderização vetorial (não bitmap) → qualidade em qualquer escala
- ✅ Suporte a imagens (Base64, JPEG, PNG)
- ✅ Integração com Blob (browser) e Buffer (Node.js)
- ✅ Múltiplas páginas nativas
- ✅ Fontes built-in (helvetica, times, courier)

---

## 2️⃣ MOTOR DE RENDERIZAÇÃO

### Arquitetura Atual: Vetorial Puro (Não HTML→Image)

#### QuotePDFGenerator (`src/lib/pdf-generator.ts`)

```typescript
// ❌ NÃO usa:
// - html2canvas
// - Canvas API
// - SVG→PDF conversion

// ✅ USA: Vetorial direto com jsPDF
export class QuotePDFGenerator {
  private doc: jsPDF;  // Trabalha diretamente com o documento
  
  private addText(text: string, x: number, y: number, options: { 
    fontSize?: number; 
    fontWeight?: 'normal' | 'bold'; 
    align?: 'left' | 'center' | 'right';
    maxWidth?: number;
  }) {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', fontWeight);
    this.doc.text(text, x, y, options);  // ← Vetorial
  }

  private addLine(x1, y1, x2, y2, lineWidth) {
    this.doc.setLineWidth(lineWidth);
    this.doc.line(x1, y1, x2, y2);  // ← Vetorial
  }

  private async loadImageAsBase64(url: string) {
    // Fetch imagem e converte para Data URL Base64
    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    const base64Data = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    
    // ← Adiciona diretamente ao PDF como imagem embeddada
    this.doc.addImage(logoData.data, format, logoX, logoY, logoWidth, logoHeight);
  }
}
```

### Vantagens desta Arquitetura

| Aspecto | Vetorial (Atual) | HTML→Canvas→PDF |
|--------|-----------------|-----------------|
| **Qualidade em escala** | ✅ Infinita (vetorial) | ❌ Fixa (raster) |
| **Tamanho ficheiro** | ✅ Pequeno (linhas + texto) | ❌ Grande (pixel-perfect) |
| **Performance** | ✅ Rápido (sem renderização HTML) | ❌ Lento (DOM parsing) |
| **DPI variable** | ✅ Automático | ❌ Fixo (96 DPI) |
| **Impressoras térmicas** | ✅ Suporta bem | ⚠️ Arriscado |
| **Código complexo** | ⚠️ Manual positioning | ✅ Simples (HTML) |

---

## 3️⃣ CONFIGURAÇÃO DE FONTES E BRANDING

### 3.1 BrandingContext - Hub Central de Configurações

**Localização:** `src/contexts/BrandingContext.tsx`

```typescript
interface PDFBrandingConfig {
  pdfLogoUrl: string | null;              // URL do logo
  pdfCompanyName: string;                 // Nome empresa (PDF)
  pdfCompanyTagline: string;              // Tagline empresa
  pdfContactEmail: string;                // Email
  pdfContactPhone: string;                // Telefone
  pdfUseTextLogo: boolean;                // Logo texto vs. imagem
  pdfFooterMessage: string;               // Mensagem footer customizada
  pdfFooterContactText: string;           // Texto contacto footer
  isLoading: boolean;
  isUpdating: boolean;
  lastUpdated: number;
  error: string | null;
}

// Hook para usar em qualquer componente
const { branding, updateBrandingLogo, refreshBranding } = useBranding();
```

### 3.2 Como Funciona o Fetch

#### 1. Inicialização no Provider

```typescript
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<PDFBrandingConfig>(DEFAULT_BRANDING);

  // Carrega ao montar
  const refreshBranding = useCallback(async () => {
    const response = await fetch('/api/customization');  // ← API Central
    const config = await response.json();
    
    setBranding(prev => ({
      ...prev,
      pdfLogoUrl: config.pdfLogoUrl || null,
      pdfCompanyName: config.pdfCompanyName || 'AV Rentals',
      // ... outros campos
      isLoading: false,
      lastUpdated: Date.now(),
    }));
  }, []);

  useEffect(() => {
    refreshBranding();
  }, []);

  // Polling a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => refreshBranding(), 30000);
    return () => clearInterval(interval);
  }, [refreshBranding]);
}
```

#### 2. Uso nos Geradores PDF

```typescript
// Em QuotePDFGenerator.ts (linhas 75-80):
private async fetchCustomizationSettings(): Promise<CustomizationSettings> {
  if (this.customizationSettings) {
    return this.customizationSettings;
  }

  try {
    const response = await fetch('/api/customization');  // ← Fallback fetch
    const settings = await response.json();
    this.customizationSettings = settings;
    return settings;
  } catch (error) {
    // Fallback com valores por defeito
    return {
      companyName: 'AV RENTALS',
      contactEmail: 'info@av-rentals.com',
      contactPhone: '+1 (555) 123-4567',
      useTextLogo: true
    };
  }
}
```

### 3.3 Integração de Logo no PDF

```typescript
private async addHeader(quote: Quote) {
  const settings = await this.fetchCustomizationSettings();
  
  const companyName = settings.pdfCompanyName ?? settings.companyName;
  const effectiveUseTextLogo = settings.pdfUseTextLogo ?? true;
  const effectiveLogoUrl = settings.pdfLogoUrl ?? settings.logoUrl;

  if (!effectiveUseTextLogo && !!effectiveLogoUrl) {
    // Logo como imagem
    const logoData = await this.loadImageAsBase64(effectiveLogoUrl);
    if (logoData) {
      const logoX = this.pageWidth - this.margin - logoWidth;
      this.doc.addImage(logoData.data, 'JPEG', logoX, this.currentY, logoWidth, logoHeight);
      this.currentY += logoHeight + 5;
    }
  } else {
    // Fallback: texto
    this.addText(companyName, this.pageWidth - this.margin, this.currentY, {
      fontSize: 22,
      fontWeight: 'bold',
      align: 'right'
    });
  }
}
```

### 3.4 Helper Reutilizável: `loadImageAsBase64`

**Localização:** `src/lib/pdf-generator.ts` (linhas 145-200)

```typescript
private async loadImageAsBase64(url: string): Promise<{ 
  data: string; 
  width: number; 
  height: number; 
} | null> {
  try {
    // Se já é Data URL
    if (url.startsWith('data:')) {
      // Extrai dimensões da imagem
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      return { data: url, width: img.width, height: img.height };
    } else {
      // Fetch com CORS
      const response = await fetch(url, { mode: 'cors' });
      const blob = await response.blob();
      
      // Converte para Base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Obtém dimensões
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = base64Data;
      });

      return { 
        data: base64Data, 
        width: img.width, 
        height: img.height 
      };
    }
  } catch (error) {
    console.error('Error loading image for PDF:', error);
    return null;
  }
}
```

**⭐ Este helper é reutilizável para Label Generator!**

---

## 4️⃣ PERFORMANCE: CLIENT vs. SERVER

### Análise de Localização

| Gerador | Localização | Contexto | Execução |
|---------|------------|---------|----------|
| **QuotePDFGenerator** | `src/lib/pdf-generator.ts` | Classe pura (isomorfa) | ✅ **Client-side** |
| **ProfessionalCataloguePDFGenerator** | `src/lib/professional-catalog-generator.ts` | Classe com suporte Node.js | 🟠 **Hybrid** |

### 4.1 QuotePDFGenerator - Client-side Puro

```typescript
// Uso em QuotePDFPreview.tsx (componente Cliente)
const generatePDFBlob = async () => {
  const blob = await QuotePDFGenerator.generateQuotePDF(quote, { 
    download: false,
    language: selectedLanguage
  });
  setPdfBlob(blob);
  
  // Cria URL para preview local
  const url = URL.createObjectURL(blob);
  setPdfUrl(url);
};

const downloadPDF = async () => {
  await QuotePDFGenerator.generateQuotePDF(quote, {
    filename: `quote-${quote.quoteNumber}.pdf`,
    download: true,  // ← Trigger download no browser
    language: selectedLanguage
  });
};
```

**Vantagens Client-side:**
- ✅ Sem round-trip ao servidor
- ✅ Menor latência (instantâneo)
- ✅ Sem carga no servidor
- ✅ Preview em tempo real
- ✅ Download direto (sem HTTP streaming)

**Desvantagens:**
- ⚠️ Computação no browser (CPU user)
- ⚠️ Limite de memória (Browser ~100-500MB)
- ⚠️ Operações síncronas bloqueiam UI

### 4.2 ProfessionalCataloguePDFGenerator - Hybrid (Server-capable)

```typescript
// API endpoint: src/app/api/partners/catalog/generate/route.ts
export async function POST(request: NextRequest) {
  const body: CatalogRequest = await request.json();
  
  const generator = new ProfessionalCataloguePDFGenerator(language);
  const pdfBuffer = await generator.generatePDF(items, options);
  
  // Retorna como arquivo binário
  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="catalog.pdf"`
    }
  });
}
```

**Motivo da Abordagem Hybrid:**
- Catálogos podem ser **muito grandes** (100+ itens com imagens)
- Processamento pesado (multiple pages, image processing)
- Necessário no servidor para escalabilidade

**Desvantagem:**
- ⚠️ Delay de rede
- ⚠️ Carga no servidor
- ⚠️ Sem preview em tempo real

### 4.3 Recomendação para Label Generator

```
┌────────────────────────────────────────┐
│ Tipo de Operação   │ Abordagem         │
├────────────────────────────────────────┤
│ 1-5 labels         │ ✅ Client-side    │
│ 5-20 labels        │ ✅ Client-side    │
│ 20-100 labels      │ 🟠 Hybrid         │
│ 100+ labels        │ ❌ Server-side    │
│ Com imagens        │ 🟠 Hybrid         │
└────────────────────────────────────────┘

RECOMENDAÇÃO: Client-side default com fallback Server para 50+ labels
```

---

## 5️⃣ PADRÃO DE GERAÇÃO - STATIC METHOD

Ambos os geradores usam **static factory method** para facilitar uso:

```typescript
// Em pdf-generator.ts
export class QuotePDFGenerator {
  // Método estático para uso simplificado
  public static async generateQuotePDF(
    quote: Quote, 
    options: PDFGeneratorOptions = {}
  ): Promise<Blob> {
    const generator = new QuotePDFGenerator();
    return generator.generatePDF(quote, options);
  }

  // Implementação de instância
  public async generatePDF(
    quote: Quote, 
    options: PDFGeneratorOptions = {}
  ): Promise<Blob> {
    // ... lógica complexa ...
    
    const pdfBlob = this.doc.output('blob') as Blob;
    
    if (options.download) {
      const link = document.createElement('a');
      const url = URL.createObjectURL(pdfBlob);
      link.href = url;
      link.download = options.filename || 'quote.pdf';
      link.click();
      URL.revokeObjectURL(url);
    }
    
    return pdfBlob;
  }
}

// Uso no componente:
const blob = await QuotePDFGenerator.generateQuotePDF(quote, { 
  download: false 
});
```

**Padrão idêntico em ProfessionalCataloguePDFGenerator:**

```typescript
public static async generateCataloguePDF(
  items: CatalogueItem[], 
  options: CataloguePDFOptions = {}
): Promise<Buffer> {
  const generator = new ProfessionalCataloguePDFGenerator(options.language);
  return generator.generatePDF(items, options);
}
```

---

## 6️⃣ HELPERS REUTILIZÁVEIS PARA LABELS

### 6.1 Image Handling

```typescript
// ✅ REUTILIZAR: loadImageAsBase64() 
// De: src/lib/pdf-generator.ts (linhas 145-200)
// Para: Label Generator

// ✅ REUTILIZAR: calculateImageDimensions()
// De: src/lib/professional-catalog-generator.ts (linhas 207-230)
// Para: Preservar aspect ratio de logos nas etiquetas
```

### 6.2 Branding Integration

```typescript
// ✅ REUTILIZAR: BrandingContext
// Hook: useBranding()

// ✅ COPIAR padrão: fetchCustomizationSettings()
// De: QuotePDFGenerator.fetchCustomizationSettings() (linhas 75-90)

// ✅ USAR fallbacks idênticos
const companyName = settings.pdfCompanyName ?? 'AV Rentals';
const logoUrl = settings.pdfLogoUrl ?? settings.logoUrl;
const useTextLogo = settings.pdfUseTextLogo ?? true;
```

### 6.3 Text Formatting & Wrapping

```typescript
// ✅ REUTILIZAR: addText() com suporte maxWidth
// De: QuotePDFGenerator (linhas 103-140)

private addText(text: string, x: number, y: number, options: { 
  fontSize?: number; 
  fontWeight?: 'normal' | 'bold'; 
  align?: 'left' | 'center' | 'right';
  maxWidth?: number;
} = {}) {
  this.doc.setFontSize(fontSize);
  this.doc.setFont('helvetica', fontWeight);
  
  if (maxWidth) {
    const lines = this.doc.splitTextToSize(text, maxWidth);
    this.doc.text(lines, x, y, { align });
  } else {
    this.doc.text(text, x, y, { align });
  }
}
```

### 6.4 Page Management

```typescript
// ✅ REUTILIZAR: checkPageSpace() + addPageBreak()
// De: QuotePDFGenerator (linhas 59-69)

private checkPageSpace(requiredSpace: number): boolean {
  return (this.currentY + requiredSpace) <= (this.pageHeight - this.margin);
}

private addPageBreak() {
  this.doc.addPage();
  this.currentY = this.margin;
}
```

---

## 7️⃣ TRADUÇÃO EM PDFS

### Integração com Translation Service

```typescript
// Import do serviço de tradução (client-side)
import { clientPDFTranslationService, PDFTranslationOptions } 
  from '@/lib/client-pdf-translation';

// Uso em QuotePDFGenerator:
if (this.language !== 'en') {
  this.translatedTexts = await clientPDFTranslationService.getTranslatedPDFTexts(
    this.language,
    dynamicContent,
    fitsOnOnePage  // ← Informação sobre espaço para layout adaptativo
  );
}

// Depois usar:
const label = this.getTranslatedText('quote', 'QUOTE');  // ← Fallback se não traduzido
```

**⭐ Label Generator pode reutilizar este sistema para suportar PT/EN**

---

## 8️⃣ ESTRUTURA RECOMENDADA PARA LABEL GENERATOR PDF

### 8.1 Classe Principal

```typescript
// src/lib/equipment-label-pdf-generator.ts

import jsPDF from 'jspdf';
import { type EquipmentItem } from '@/types';

export interface EquipmentLabelPDFOptions {
  filename?: string;
  download?: boolean;
  language?: 'en' | 'pt';
  templateSize?: 'cable' | 'small' | 'medium' | 'large' | 'shipping';
  quantities?: Map<string, number>;  // itemId → quantity
}

export class EquipmentLabelPDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 5;  // Etiquetas com margem mínima
  
  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  // Static factory
  public static async generateLabelsPDF(
    items: EquipmentItem[],
    quantities: Map<string, number>,
    options: EquipmentLabelPDFOptions = {}
  ): Promise<Blob> {
    const generator = new EquipmentLabelPDFGenerator();
    return generator.generatePDF(items, quantities, options);
  }

  public async generatePDF(
    items: EquipmentItem[],
    quantities: Map<string, number>,
    options: EquipmentLabelPDFOptions = {}
  ): Promise<Blob> {
    // 1. Fetch branding
    const settings = await this.fetchCustomizationSettings();
    
    // 2. Para cada item
    for (const item of items) {
      const qty = quantities.get(item.id) || 1;
      
      // 3. Gerar `qty` labels deste item
      for (let i = 0; i < qty; i++) {
        await this.addLabel(item, settings);
        
        // Check espaço e page break se necessário
        if (!this.checkPageSpace(60)) {  // 60mm é altura máxima de label
          this.addPageBreak();
        }
      }
    }

    // 4. Retornar Blob
    const pdfBlob = this.doc.output('blob') as Blob;
    
    if (options.download) {
      const link = document.createElement('a');
      const url = URL.createObjectURL(pdfBlob);
      link.href = url;
      link.download = options.filename || 'equipment-labels.pdf';
      link.click();
      URL.revokeObjectURL(url);
    }

    return pdfBlob;
  }

  private async addLabel(item: EquipmentItem, settings: CustomizationSettings) {
    // Renderizar etiqueta vetorial
    // Usar código de EquipmentLabel.tsx como referência
  }

  // ... Helpers (reutilizar de QuotePDFGenerator) ...
  private async fetchCustomizationSettings() { ... }
  private loadImageAsBase64(url: string) { ... }
  private addText(text, x, y, options) { ... }
  private checkPageSpace(requiredSpace) { ... }
  private addPageBreak() { ... }
}
```

### 8.2 Integração no Componente (Client-side)

```typescript
// src/components/inventory/EquipmentLabelPDFDownload.tsx

import { EquipmentLabelPDFGenerator } from '@/lib/equipment-label-pdf-generator';
import { useCallback, useState } from 'react';

export function EquipmentLabelPDFDownload({ 
  selectedItems,
  quantities 
}: {
  selectedItems: EquipmentItem[];
  quantities: Map<string, number>;
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = useCallback(async () => {
    try {
      setIsGenerating(true);
      
      const blob = await EquipmentLabelPDFGenerator.generateLabelsPDF(
        selectedItems,
        quantities,
        {
          download: true,
          filename: `equipment-labels-${Date.now()}.pdf`,
          language: 'pt'
        }
      );
      
      toast({ title: 'PDF gerado com sucesso!' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ title: 'Erro ao gerar PDF', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedItems, quantities]);

  return (
    <Button onClick={handleDownloadPDF} disabled={isGenerating}>
      {isGenerating ? 'Gerando...' : 'Download PDF'}
    </Button>
  );
}
```

---

## 9️⃣ CHECKLIST DE REUTILIZAÇÃO

### Código a COPIAR

- [x] `loadImageAsBase64()` de `pdf-generator.ts`
- [x] `addText()` com support a `maxWidth` de `pdf-generator.ts`
- [x] `checkPageSpace()` + `addPageBreak()` de `pdf-generator.ts`
- [x] `fetchCustomizationSettings()` pattern de `pdf-generator.ts`
- [x] Static factory method pattern (ambos geradores)
- [x] Error handling e fallbacks idênticos
- [x] Blob output e download pattern

### Contextos a USAR

- [x] `BrandingContext` para logo/company info
- [x] `clientPDFTranslationService` para multi-idioma
- [x] `useBranding()` hook em componentes

### Padrões a ADOTAR

- [x] jsPDF com unit='mm' (impressão real)
- [x] Classes com métodos estáticos para simplificar
- [x] Async/await para image loading
- [x] Data URL Base64 para embeddings de imagens
- [x] Margens configuráveis por template
- [x] Page break automático baseado em espaço

### Código a EVITAR

- ❌ html2canvas ou Canvas API (renderização complexa)
- ❌ HTML→PDF (perda de controle)
- ❌ Operações síncronas bloqueantes (sem for loops em larga escala)
- ❌ Fetch de imagens sem CORS headers
- ❌ Renderização local sem fallbacks

---

## 🔟 DEPENDÊNCIAS NECESSÁRIAS

```json
{
  "jspdf": "^3.0.3",           // ✅ Já instalado
  "react-qr-code": "^1.6.4",   // ✅ Já instalado (para QR nas labels)
  "date-fns": "^2.30.0"         // ✅ Já instalado (data formatting)
}
```

**Nada novo a instalar!** Todas as dependências já existem.

---

## 1️⃣1️⃣ EXEMPLO DE IMPLEMENTAÇÃO MÍNIMA

```typescript
// src/lib/equipment-label-pdf-generator.ts
import jsPDF from 'jspdf';
import type { EquipmentItem } from '@/types';

export class EquipmentLabelPDFGenerator {
  private doc: jsPDF;
  
  constructor() {
    // Label tamanho: 100×80mm (default)
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 80]  // ← Tamanho de uma etiqueta
    });
  }

  public static async generateLabelsPDF(
    items: EquipmentItem[],
    quantities: Map<string, number>
  ): Promise<Blob> {
    const generator = new EquipmentLabelPDFGenerator();
    
    // Criar novo PDF com múltiplas páginas (cada página = 1 label)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 80]
    });

    for (const item of items) {
      const qty = quantities.get(item.id) || 1;
      
      for (let i = 0; i < qty; i++) {
        // Adicionar conteúdo da label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(item.name, 50, 20, { align: 'center' });
        
        // QR code aqui (usando react-qr-code + canvas)
        doc.text(item.id, 50, 70, { align: 'center', fontSize: 8 });
        
        // Add nova página se houver mais labels
        if (i < qty - 1) {
          doc.addPage();
        }
      }
    }

    return doc.output('blob') as Blob;
  }
}
```

---

## CONCLUSÕES E PRÓXIMOS PASSOS

### ✅ O que Usar Diretamente

1. **jsPDF** como biblioteca PDF (confirmado em produção)
2. **BrandingContext** para logo e branding (já integrado)
3. **Padrão de Static Factory** para geração simplificada
4. **Helpers de Image Loading** (copiar `loadImageAsBase64`)
5. **Tradução com clientPDFTranslationService** (opcional, para PT)

### ⚠️ Considerações Especiais para Labels

1. **Tamanho de página:** Labels são pequenas (50-210mm) → usar formato customizado
2. **Múltiplas labels por item:** Loop com quantidades (Gap G1 do audit)
3. **Sem imagens grandes:** Labels são simples (texto + QR) → sempre client-side
4. **Modo print-safe:** Garantir contraste preto/branco puro

### 🚀 Implementação Recomendada

**Fase 1 (Esta semana):**
- Criar `EquipmentLabelPDFGenerator` classe base
- Reutilizar helpers de `QuotePDFGenerator`
- Integrar com `BrandingContext`
- Suporte básico a quantidades

**Fase 2 (Próxima semana):**
- Templates de tamanho variável
- Tradução PT/EN via `clientPDFTranslationService`
- Batch download (múltiplos PDFs zipados)

**Fase 3 (Futuro):**
- Parallelização (Web Workers para 100+ labels)
- Formatação ZPL para impressoras Zebra
- Preview com zoom

---

## 📚 FICHEIROS RELEVANTES

| Ficheiro | Linhas | Propósito |
|----------|--------|----------|
| `src/lib/pdf-generator.ts` | 1-830 | ⭐ Template principal (copiar padrões) |
| `src/lib/professional-catalog-generator.ts` | 1-815 | Alternativa (image handling avançado) |
| `src/contexts/BrandingContext.tsx` | 1-170 | ⭐ Branding centralizado |
| `src/components/quotes/QuotePDFPreview.tsx` | 1-229 | Exemplo de integração cliente |
| `src/app/api/partners/catalog/generate/route.ts` | 1-290 | Exemplo de geração server-side (referência) |
| `src/lib/client-pdf-translation.ts` | - | Tradução (procurar se existir) |

---

**Relatório completo. Pronto para implementação de Label Generator PDF usando stack estabelecido.**
