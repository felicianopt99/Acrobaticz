/**
 * Translation Service Types
 * Central types for the translation system with DeepL API integration
 */

export type Language = 'en' | 'pt';

export const SUPPORTED_LANGUAGES: Language[] = ['en', 'pt'];

/**
 * Standard API Response Pattern
 */
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

/**
 * Translation request/response structure
 */
export interface TranslationRequest {
  sourceText: string;
  sourceLanguage?: Language;
  targetLanguages: Language[];
  context?: {
    contentType: 'product' | 'category' | 'description' | 'general';
    contentId?: string;
  };
}

export interface TranslationResult {
  sourceText: string;
  targetLanguage: Language;
  translatedText: string;
  usedCache: boolean;
  timestamp: string;
}

export interface BatchTranslationResult {
  results: TranslationResult[];
  totalRequests: number;
  cachedRequests: number;
  newTranslations: number;
  errors?: Array<{
    text: string;
    language: Language;
    error: string;
  }>;
}

/**
 * Translation Status for UI
 */
export interface TranslationStatus {
  contentId: string;
  contentType: 'product' | 'category';
  contentName: string;
  
  // Status per language
  translations: {
    [key in Language]?: {
      status: 'pending' | 'completed' | 'failed' | 'not-started';
      text?: string;
      translatedAt?: string;
      error?: string;
    };
  };

  lastUpdated: string;
  isAutomatic: boolean;
}

/**
 * Batch Translation Response
 */
export interface BatchTranslationResponse {
  successful: number;
  failed: number;
  cached: number;
  total: number;
  startTime: string;
  endTime: string;
  duration: number;
}

/**
 * Translation Cache Entry
 */
export interface CacheEntry {
  id: string;
  sourceText: string;
  sourceLanguage: Language;
  targetLanguage: Language;
  translatedText: string;
  hash: string;
  contentType: 'product' | 'category' | 'description' | 'general';
  contentId?: string;
  createdAt: string;
  expiresAt?: string;
}

/**
 * Product Translation Record
 */
export interface ProductTranslation {
  id: string;
  productId: string;
  language: Language;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  isAutomatic: boolean;
}

/**
 * Category Translation Record
 */
export interface CategoryTranslation {
  id: string;
  categoryId: string;
  language: Language;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isAutomatic: boolean;
}

/**
 * Server Action Response
 */
export interface ServerActionResult<T = any> extends ApiResponse<T> {
  timestamp: string;
}

/**
 * Translation Presets for UI
 */
export interface TranslationPreset {
  languages: Language[];
  autoTranslate: boolean;
  cacheEnabled: boolean;
  retryAttempts: number;
  timeoutMs: number;
}
