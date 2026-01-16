/**
 * API Error Translation Utilities
 * Translates error messages from API responses through TranslationContext
 * Ensures all error messages are properly localized before showing in UI
 */

import { useTranslation } from '@/contexts/TranslationContext';

/**
 * Common error message mappings
 * Maps API error codes/patterns to human-readable messages
 */
export const ERROR_MESSAGE_MAP: Record<string, string> = {
  // Equipment-related errors
  'EQUIPMENT_NOT_FOUND': 'Equipment not found',
  'EQUIPMENT_DELETED': 'Equipment has been deleted',
  'EQUIPMENT_IN_USE': 'Equipment is currently in use and cannot be modified',
  'CANNOT_DELETE_EQUIPMENT': 'Cannot delete equipment with active rentals',
  'EQUIPMENT_SCHEDULED': 'Equipment is scheduled for future events',
  
  // Permission errors
  'PERMISSION_DENIED': 'You do not have permission to perform this action',
  'INSUFFICIENT_PERMISSIONS': 'Insufficient permissions',
  'FORBIDDEN': 'Access denied',
  
  // Conflict errors
  'CONFLICT_DETECTED': 'Conflict detected',
  'EQUIPMENT_CONFLICT': 'Equipment is booked for overlapping dates',
  'DUPLICATE_BOOKING': 'This equipment is already booked for this period',
  
  // Validation errors
  'INVALID_DATA': 'Invalid data provided',
  'MISSING_REQUIRED_FIELD': 'Required field is missing',
  'INVALID_DATE_RANGE': 'Invalid date range provided',
  
  // Server errors
  'SERVER_ERROR': 'An error occurred on the server',
  'DATABASE_ERROR': 'Database error',
  'STORAGE_ERROR': 'Storage error',
  
  // Network errors
  'NETWORK_ERROR': 'Network error',
  'REQUEST_TIMEOUT': 'Request timeout',
  
  // Generic errors
  'FAILED': 'Operation failed',
  'NOT_FOUND': 'Resource not found',
};

/**
 * Extract error message from API response
 * Handles various error response formats
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
}

/**
 * Hook for translating API error messages
 * Automatically handles translation through TranslationContext
 */
export function useApiErrorTranslation() {
  const { t, tSync, language } = useTranslation();

  /**
   * Translate an error message immediately (if cached) or asynchronously
   * Returns the translated message synchronously from cache, or original if not cached
   */
  const translateErrorSync = (message: string): string => {
    // Try to translate synchronously from cache
    const cached = tSync(message);
    return cached;
  };

  /**
   * Translate an error message asynchronously
   * Always returns translated version when available
   */
  const translateErrorAsync = async (message: string): Promise<string> => {
    if (language === 'en') {
      return message;
    }
    return await t(message);
  };

  /**
   * Translate error message with fallback lookup
   * If exact message not found, tries to find a pattern match in ERROR_MESSAGE_MAP
   */
  const translateError = async (message: string): Promise<string> => {
    // Try direct translation first
    const translated = await translateErrorAsync(message);
    if (translated !== message) {
      return translated;
    }

    // Try to find pattern match in error map
    for (const [key, defaultMsg] of Object.entries(ERROR_MESSAGE_MAP)) {
      if (message.includes(key) || message.toUpperCase().includes(key)) {
        return await translateErrorAsync(defaultMsg);
      }
    }

    // If nothing matches, try exact match with common patterns
    if (message.includes('Cannot delete') || message.includes('cannot delete')) {
      return await translateErrorAsync('Não é possível eliminar este item');
    }
    if (message.includes('not found')) {
      return await translateErrorAsync('Item não encontrado');
    }
    if (message.includes('in use')) {
      return await translateErrorAsync('Item em uso');
    }
    if (message.includes('Permission') || message.includes('permission')) {
      return await translateErrorAsync('Acesso negado');
    }

    // Fallback: try direct translation
    return translated;
  };

  /**
   * Translate error from API response
   * Extracts message and translates it
   */
  const translateApiError = async (error: unknown): Promise<string> => {
    const message = extractErrorMessage(error);
    return await translateError(message);
  };

  return {
    translateError,
    translateErrorSync,
    translateErrorAsync,
    translateApiError,
    extractErrorMessage,
  };
}

/**
 * Batch translate multiple error messages
 * More efficient than translating individually
 */
export async function translateErrorsBatch(
  messages: string[],
  t: (text: string) => Promise<string>
): Promise<string[]> {
  const translations = await Promise.all(
    messages.map(async (message) => {
      try {
        return await t(message);
      } catch {
        return message; // Fallback to original if translation fails
      }
    })
  );
  return translations;
}
