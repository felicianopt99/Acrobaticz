// src/lib/client-pdf-translation.ts
// Client-side PDF Translation Service that uses API calls instead of direct database access
// This avoids Prisma client-side issues while providing the same translation functionality

import { translateText, translateBatch, Language } from '@/lib/client-translation';

export interface PDFTranslationOptions {
  preserveClientInfo?: boolean; // Default: true - don't translate client names/info
  preserveNumbers?: boolean; // Default: true - don't translate prices, quantities
  preserveTechnicalTerms?: boolean; // Default: true - don't translate technical terms
}

interface PDFTexts {
  // Static labels that should be translated
  staticLabels: {
    quote: string;
    client: string;
    clientInformation: string;
    eventDetails: string;
    location: string;
    startDate: string;
    endDate: string;
    duration: string;
    equipmentAndServices: string;
    item: string;
    quantity: string;
    rate: string;
    days: string;
    total: string;
    subtotal: string;
    discount: string;
    netAmount: string;
    tax: string;
    totalAmount: string;
    additionalNotes: string;
    termsAndConditions: string;
    thankYouMessage: string;
    contactMessage: string;
    validUntil: string;
    date: string;
  };
  
  // Terms and conditions text
  terms: string[];
  
  // Dynamic content that may need translation (services and fees only, NOT equipment names)
  dynamicContent: {
    equipmentNames: string[]; // These will NOT be translated - preserved as-is
    serviceNames: string[];   // These WILL be translated
    feeNames: string[];      // These WILL be translated
    notes?: string;          // Optional: notes/terms to translate
  };
}

// Default PDF labels in English
const DEFAULT_PDF_LABELS = {
  quote: 'QUOTE',
  client: 'Client',
  clientInformation: 'Client Information',
  eventDetails: 'Event Details',
  location: 'Location',
  startDate: 'Start Date',
  endDate: 'End Date',
  duration: 'Duration',
  equipmentAndServices: 'Equipment & Services',
  item: 'Item',
  quantity: 'Quantity',
  rate: 'Rate',
  days: 'Days',
  total: 'Total',
  subtotal: 'Subtotal',
  discount: 'Discount',
  netAmount: 'Net Amount',
  tax: 'Tax',
  totalAmount: 'Total Amount',
  additionalNotes: 'Additional Notes',
  termsAndConditions: 'Terms and Conditions',
  thankYouMessage: 'Thank you for your business!',
  contactMessage: 'For any questions, please contact us.',
  validUntil: 'Valid Until',
  date: 'Date',
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  address: 'Address',
  equipmentItem: 'Equipment Item',
  serviceItem: 'Service Item',
  feeItem: 'Fee Item',
  pageOf: 'Page {page} of {total}',
};

// Portuguese (PT) translations for PDF labels - hardcoded to ensure consistency
const DEFAULT_PDF_LABELS_PT = {
  quote: 'ORÇAMENTO',
  client: 'Cliente',
  clientInformation: 'Informações do Cliente',
  eventDetails: 'Detalhes do Evento',
  location: 'Localização',
  startDate: 'Data de Início',
  endDate: 'Data de Término',
  duration: 'Duração',
  equipmentAndServices: 'Equipamentos e Serviços',
  item: 'Item',
  quantity: 'Quantidade',
  rate: 'Taxa',
  days: 'Dias',
  total: 'Total',
  subtotal: 'Subtotal',
  discount: 'Desconto',
  netAmount: 'Valor Líquido',
  tax: 'Imposto',
  totalAmount: 'Valor Total',
  additionalNotes: 'Notas Adicionais',
  termsAndConditions: 'Termos e Condições',
  thankYouMessage: 'Obrigado por sua preferência!',
  contactMessage: 'Para qualquer dúvida, contacte-nos.',
  validUntil: 'Válido até',
  date: 'Data',
  name: 'Nome',
  email: 'Email',
  phone: 'Telefone',
  address: 'Endereço',
  equipmentItem: 'Item de Equipamento',
  serviceItem: 'Item de Serviço',
  feeItem: 'Item de Taxa',
  pageOf: 'Página {page} de {total}',
};

// Default terms and conditions
const DEFAULT_TERMS = [
  '1. Payment is due within 30 days of invoice date.',
  '2. Equipment must be returned in the same condition as received.',
  '3. Client is responsible for any damage to equipment during rental period.',
  '4. Cancellations must be made at least 48 hours in advance.',
  '5. Delivery and setup fees are non-refundable.',
  '6. Additional charges may apply for overtime or additional services.',
];

// Portuguese terms and conditions
const DEFAULT_TERMS_PT = [
  '1. O pagamento é devido no prazo de 30 dias a partir da data da fatura.',
  '2. O equipamento deve ser devolvido no mesmo estado em que foi recebido.',
  '3. O cliente é responsável por qualquer dano ao equipamento durante o período de aluguel.',
  '4. Os cancelamentos devem ser feitos com pelo menos 48 horas de antecedência.',
  '5. As taxas de entrega e configuração não são reembolsáveis.',
  '6. Podem aplicar-se encargos adicionais por horas extras ou serviços adicionais.',
];

// Compact terms for smaller PDFs
const COMPACT_TERMS = [
  '1. Payment due within 30 days.',
  '2. Equipment returned in same condition.',
  '3. Client responsible for damage during rental.',
  '4. 48-hour cancellation notice required.',
];

// Compact Portuguese terms
const COMPACT_TERMS_PT = [
  '1. Pagamento devido em 30 dias.',
  '2. Equipamento devolvido em bom estado.',
  '3. Cliente responsável por danos durante aluguel.',
  '4. Notificação de cancelamento com 48 horas de antecedência obrigatória.',
];

class ClientPDFTranslationService {
  private translationCache = new Map<string, Map<string, string>>();

  /**
   * Detect if text is likely in Portuguese or English
   * Uses simple heuristics: Portuguese-specific words, accents, patterns
   */
  private detectLanguage(text: string): 'pt' | 'en' {
    if (!text) return 'en';
    
    const lowerText = text.toLowerCase();
    
    // Portuguese indicators
    const ptIndicators = [
      'ão', 'ões', 'ã', 'õ', 'ç', // Portuguese accents/characters
      'é', 'ê', 'á', 'à', 'í', 'ó', 'ô', 'ú', 'ü', // Portuguese vowels
      'pagamento', 'equipamento', 'devolução', 'aluguel', 'danos', 'horas', 'encargos', // Portuguese words
      'deve', 'devem', 'será', 'serão', 'durante', 'prazo', // Portuguese verb forms
      'de ', 'do ', 'da ', 'dos ', 'das ', // Portuguese articles
    ];
    
    // English indicators
    const enIndicators = [
      'payment', 'equipment', 'returned', 'rental', 'damage', 'hours', 'charges', // English words
      'must', 'will', 'should', 'shall', 'during', 'within', // English modals
      'is ', 'are ', 'be ', 'been ', // English verb forms
    ];
    
    let ptScore = 0;
    let enScore = 0;
    
    ptIndicators.forEach(indicator => {
      if (lowerText.includes(indicator)) ptScore++;
    });
    
    enIndicators.forEach(indicator => {
      if (lowerText.includes(indicator)) enScore++;
    });
    
    // If Portuguese score is higher, it's likely Portuguese
    if (ptScore > enScore) return 'pt';
    
    // Default to English
    return 'en';
  }

  /**
   * Get all PDF texts translated for the specified language
   */
  async getTranslatedPDFTexts(
    targetLang: Language,
    dynamicContent: PDFTexts['dynamicContent'],
    compact: boolean = false,
    options: PDFTranslationOptions = {}
  ): Promise<PDFTexts> {
    if (targetLang === 'en') {
      return this.buildEnglishPDFTexts(dynamicContent, compact);
    }

    const cacheKey = `${targetLang}_${compact ? 'compact' : 'full'}`;
    if (this.translationCache.has(cacheKey)) {
      const cached = this.translationCache.get(cacheKey)!;
      return this.buildPDFTexts(cached, targetLang, dynamicContent, compact);
    }

    // Translate static labels
    const staticTexts = Object.values(DEFAULT_PDF_LABELS);
    const termsToTranslate = compact ? COMPACT_TERMS : DEFAULT_TERMS;
    const allStaticTexts = [...staticTexts, ...termsToTranslate];

    try {
      // Use batch translation for efficiency
      const translations = await translateBatch(allStaticTexts, targetLang);
      
      // Cache the results
      const translationMap = new Map<string, string>();
      allStaticTexts.forEach((text, index) => {
        if (translations[index]) {
          translationMap.set(text, translations[index]);
        }
      });
      
      this.translationCache.set(cacheKey, translationMap);
      
      return this.buildPDFTexts(translationMap, targetLang, dynamicContent, compact);
    } catch (error) {
      console.error('PDF translation error:', error);
      // Fallback to English
      return this.buildEnglishPDFTexts(dynamicContent, compact);
    }
  }

  /**
   * Translate only the dynamic content (service names, fee names, and notes with language detection)
   */
  async translateDynamicContent(
    dynamicContent: PDFTexts['dynamicContent'],
    targetLang: Language,
    options: PDFTranslationOptions = {}
  ): Promise<PDFTexts['dynamicContent']> {
    if (targetLang === 'en') {
      return dynamicContent;
    }

    try {
      // Only translate service names and fee names, NOT equipment names
      const servicesToTranslate = dynamicContent.serviceNames || [];
      const feesToTranslate = dynamicContent.feeNames || [];
      
      const [translatedServices, translatedFees] = await Promise.all([
        translateBatch(servicesToTranslate, targetLang),
        translateBatch(feesToTranslate, targetLang),
      ]);

      // Translate notes with language detection (only translate if source != target language)
      let translatedNotes = dynamicContent.notes;
      if (dynamicContent.notes && dynamicContent.notes.trim()) {
        translatedNotes = await this.translateWithDetection(dynamicContent.notes, targetLang);
      }

      return {
        equipmentNames: dynamicContent.equipmentNames, // Keep original equipment names
        serviceNames: translatedServices,
        feeNames: translatedFees,
        notes: translatedNotes, // Include translated notes
      };
    } catch (error) {
      console.error('Dynamic content translation error:', error);
      return dynamicContent; // Fallback to original
    }
  }

  /**
   * Translate text with language detection - only translate if source language differs from target
   */
  async translateWithDetection(
    text: string,
    targetLang: Language
  ): Promise<string> {
    if (!text || targetLang === 'en') {
      return text;
    }

    try {
      // Detect source language
      const sourceLanguage = this.detectLanguage(text);
      
      // Only translate if source and target languages differ
      if (sourceLanguage === targetLang) {
        return text; // Already in target language, no need to translate
      }
      
      // Translate from detected language to target language
      const [translated] = await translateBatch([text], targetLang);
      return translated || text;
    } catch (error) {
      console.error('Language detection translation error:', error);
      return text;
    }
  }

  /**
   * Build English PDF texts (no translation needed)
   */
  private buildEnglishPDFTexts(
    dynamicContent: PDFTexts['dynamicContent'],
    compact: boolean
  ): PDFTexts {
    return {
      staticLabels: { ...DEFAULT_PDF_LABELS },
      terms: compact ? [...COMPACT_TERMS] : [...DEFAULT_TERMS],
      dynamicContent: { ...dynamicContent },
    };
  }

  /**
   * Build PDF texts using hardcoded translations for labels only (PT), 
   * but dynamic translations for terms and notes via API
   */
  private buildPDFTexts(
    translationMap: Map<string, string>,
    targetLang: Language,
    dynamicContent: PDFTexts['dynamicContent'],
    compact: boolean
  ): PDFTexts {
    // Build translated static labels
    const staticLabels: any = {};
    
    // For Portuguese, use hardcoded translations for labels to ensure consistency
    const isPortuguese = targetLang === 'pt';
    
    // Map all English labels to either hardcoded PT or API translations
    Object.entries(DEFAULT_PDF_LABELS).forEach(([key, englishValue]) => {
      if (isPortuguese) {
        // Use hardcoded Portuguese translation for labels
        const ptValue = (DEFAULT_PDF_LABELS_PT as any)[key];
        if (ptValue) {
          staticLabels[key] = ptValue;
        } else {
          // Fallback to English if no PT translation found
          staticLabels[key] = englishValue;
        }
      } else {
        // For other languages, use API translation from translationMap
        staticLabels[key] = translationMap.get(englishValue) || englishValue;
      }
    });

    // Build translated terms - ALWAYS use translation map (dynamic, from API)
    // This allows custom/dynamic terms to be translated properly
    const termsToUse = compact ? COMPACT_TERMS : DEFAULT_TERMS;
    const terms = termsToUse.map(term => translationMap.get(term) || term);

    return {
      staticLabels,
      terms,
      dynamicContent: { ...dynamicContent },
    };
  }

  /**
   * Clear translation cache
   */
  clearCache() {
    this.translationCache.clear();
  }
}

// Export singleton instance
export const clientPDFTranslationService = new ClientPDFTranslationService();