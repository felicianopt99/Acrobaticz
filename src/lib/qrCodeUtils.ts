/**
 * QR Code Utilities - Normalização e validação de dados
 * Suporta: URL completa, UUID v4 e prefixo eq_
 */

/**
 * Regex para validar UUID v4 format
 * Exemplo: 550e8400-e29b-41d4-a716-446655440000
 */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Regex para validar prefixo personalizado eq_
 * Exemplo: eq-abc-123-def ou eq_12345678901234
 */
const CUSTOM_ID_REGEX = /^eq[_-][a-zA-Z0-9]{12,}$/;

/**
 * Regex para extrair ID de URL de equipamento
 * Exemplo: http://localhost:3000/equipment/eq-abc-123/edit
 */
const EQUIPMENT_URL_REGEX = /\/equipment\/([a-zA-Z0-9\-_]+)\/edit$/;

export interface ParsedEquipmentData {
  id: string;
  isValid: boolean;
  source: 'url' | 'uuid' | 'custom-id';
  error?: string;
}

/**
 * Valida se um ID segue o padrão UUID v4
 */
export function isValidUUID(id: string): boolean {
  return UUID_V4_REGEX.test(id);
}

/**
 * Valida se um ID segue o padrão personalizado eq_
 */
export function isValidCustomId(id: string): boolean {
  return CUSTOM_ID_REGEX.test(id);
}

/**
 * Extrai o ID de uma URL de equipamento
 * Exemplo: http://localhost:3000/equipment/eq-abc-123/edit → eq-abc-123
 */
export function extractIdFromUrl(url: string): string | null {
  try {
    const match = url.match(EQUIPMENT_URL_REGEX);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Função principal: Normaliza dados do QR Code
 * Aceita: URL completa, UUID v4, ID personalizado (eq_)
 *
 * @param qrData - Dados brutos do QR Code
 * @returns Objeto com ID normalizado e informação de validação
 */
export function parseEquipmentQRCode(qrData: string): ParsedEquipmentData {
  if (!qrData || typeof qrData !== 'string') {
    return {
      id: '',
      isValid: false,
      source: 'url',
      error: 'Empty or invalid QR data'
    };
  }

  const trimmed = qrData.trim();

  // 1. Tentar extrair ID de URL completa
  if (trimmed.startsWith('http')) {
    try {
      const url = new URL(trimmed);
      
      // Validar origem (mesmo domínio)
      if (typeof window !== 'undefined' && url.origin !== window.location.origin) {
        return {
          id: '',
          isValid: false,
          source: 'url',
          error: 'QR Code from different origin'
        };
      }

      const extractedId = extractIdFromUrl(trimmed);
      if (extractedId && isValidCustomId(extractedId)) {
        return {
          id: extractedId,
          isValid: true,
          source: 'url'
        };
      }

      return {
        id: '',
        isValid: false,
        source: 'url',
        error: 'Invalid equipment ID format in URL'
      };
    } catch (e) {
      return {
        id: '',
        isValid: false,
        source: 'url',
        error: 'Invalid URL format'
      };
    }
  }

  // 2. Tentar validar como UUID v4
  if (isValidUUID(trimmed)) {
    return {
      id: trimmed,
      isValid: true,
      source: 'uuid'
    };
  }

  // 3. Tentar validar como ID personalizado
  if (isValidCustomId(trimmed)) {
    return {
      id: trimmed,
      isValid: true,
      source: 'custom-id'
    };
  }

  return {
    id: '',
    isValid: false,
    source: 'custom-id',
    error: `Invalid ID format. Expected UUID or eq_*`
  };
}

/**
 * Valida se o ID é compatível com um equipamento esperado
 * Usável para verificar se o scan pertence ao evento correto
 */
export function isEquipmentIdValid(id: string): boolean {
  return isValidUUID(id) || isValidCustomId(id);
}

/**
 * Normaliza um ID para formato padrão (remove caracteres extra)
 */
export function normalizeEquipmentId(id: string): string {
  return id.trim().toLowerCase();
}

/**
 * Cria um ID de sessão único para rastreamento de duplicatas
 * Formato: timestamp-5digitos
 */
export function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000);
  return `${timestamp}-${random}`;
}

/**
 * Debug: Testa parsing com dados de exemplo
 */
export function debugParseExamples(): void {
  console.group('[QR DEBUG] Equipment ID Parsing Examples');

  const examples = [
    'http://localhost:3000/equipment/eq-abc-123-def/edit',
    'eq-abc-123-def',
    '550e8400-e29b-41d4-a716-446655440000',
    'invalid-id',
    'http://other-domain.com/equipment/123/edit'
  ];

  examples.forEach((example) => {
    const result = parseEquipmentQRCode(example);
    console.log(`Input: "${example}"`, result);
  });

  console.groupEnd();
}
