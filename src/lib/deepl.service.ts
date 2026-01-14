/**
 * DeepL Translation Service
 * Centralized service for managing translations with caching, retries, and concurrency control
 * Follows the project's standard API response pattern
 */

import { prisma } from '@/lib/db';
import { configService } from '@/lib/config-service';
import { getAPIKey } from '@/app/api/actions/api-configuration.actions';
import crypto from 'crypto';
import type {
  Language,
  TranslationRequest,
  TranslationResult,
  BatchTranslationResult,
  ApiResponse,
  ServerActionResult,
} from '@/types/translation.types';

// Constants
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;
const MAX_CONCURRENCY = 4;
const CACHE_TTL_DAYS = 30;

// State management
let cachedDeeplApiKey: string | null = null;
let cacheExpiry: number = 0;
let inflight = 0;
const waitQueue: Array<() => void> = [];

/**
 * Get DeepL API key from database or config service with caching
 */
async function getDeeplApiKey(): Promise<string | null> {
  const now = Date.now();
  
  // Use cache if still valid (5 minute TTL)
  if (cachedDeeplApiKey && cacheExpiry > now) {
    return cachedDeeplApiKey;
  }

  try {
    // Try to get from database first
    cachedDeeplApiKey = await getAPIKey('deepl');
    
    // Fall back to config service if not in database
    if (!cachedDeeplApiKey) {
      cachedDeeplApiKey = await configService.get('DeepL', 'DEEPL_API_KEY');
    }
    
    // Set cache expiry to 5 minutes from now
    cacheExpiry = now + (5 * 60 * 1000);
    
    if (!cachedDeeplApiKey) {
      console.warn('No DeepL API key found in database or config');
    }
  } catch (error) {
    console.error('Failed to retrieve DeepL API key:', error);
    return null;
  }
  
  return cachedDeeplApiKey;
}

/**
 * Generate hash for cache lookup
 */
function generateCacheHash(sourceText: string, targetLanguage: Language): string {
  return crypto
    .createHash('sha256')
    .update(`${sourceText}:${targetLanguage}`)
    .digest('hex');
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff with jitter
 */
function calcBackoffDelay(attempt: number): number {
  const expo = BASE_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * 250);
  return expo + jitter;
}

/**
 * Concurrency limiter (semaphore)
 */
async function withConcurrency<T>(fn: () => Promise<T>): Promise<T> {
  if (inflight >= MAX_CONCURRENCY) {
    await new Promise<void>(resolve => waitQueue.push(resolve));
  }
  inflight++;
  try {
    return await fn();
  } finally {
    inflight--;
    const next = waitQueue.shift();
    if (next) next();
  }
}

/**
 * Translate text using DeepL API
 * @param sourceText Text to translate
 * @param targetLanguage Target language code
 * @returns Promise with translation result or cached entry
 */
export async function deeplTranslateText(
  sourceText: string,
  targetLanguage: Language
): Promise<ApiResponse<TranslationResult>> {
  return withConcurrency(async () => {
    const hash = generateCacheHash(sourceText, targetLanguage);

    // Check cache first
    const cached = await checkCache(hash, sourceText, targetLanguage);
    if (cached) {
      return {
        status: 'success',
        data: cached,
        timestamp: new Date().toISOString(),
      };
    }

    const apiKey = await getDeeplApiKey();
    if (!apiKey) {
      return {
        status: 'error',
        message: 'DeepL API key not configured',
        timestamp: new Date().toISOString(),
      };
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(DEEPL_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `DeepL-Auth-Key ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: [sourceText],
            target_lang: targetLanguage.toUpperCase(),
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`DeepL API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        const translatedText = data.translations?.[0]?.text;

        if (!translatedText) {
          throw new Error('No translation in DeepL response');
        }

        const result: TranslationResult = {
          sourceText,
          translatedText,
          targetLanguage,
          model: 'deepl',
          usedCache: false,
          timestamp: new Date().toISOString(),
        };

        // Save to cache
        await saveToCache(hash, sourceText, targetLanguage, translatedText);

        return {
          status: 'success',
          data: result,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < MAX_RETRIES - 1) {
          const delay = calcBackoffDelay(attempt);
          await sleep(delay);
        }
      }
    }

    return {
      status: 'error',
      message: lastError?.message || 'Failed to translate with DeepL',
      timestamp: new Date().toISOString(),
    };
  });
}

/**
 * Batch translate multiple texts
 */
export async function batchTranslate(
  requests: TranslationRequest[]
): Promise<ApiResponse<BatchTranslationResult>> {
  const results: TranslationResult[] = [];
  const errors: string[] = [];

  for (const request of requests) {
    const result = await deeplTranslateText(request.text, request.targetLang);
    if (result.status === 'success' && result.data) {
      results.push(result.data);
    } else {
      errors.push(`Failed to translate: ${request.text}`);
    }
  }

  return {
    status: errors.length === 0 ? 'success' : 'partial',
    data: {
      results,
      errors: errors.length > 0 ? errors : undefined,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check cache for existing translation
 */
async function checkCache(
  hash: string,
  sourceText: string,
  targetLanguage: Language
): Promise<TranslationResult | null> {
  try {
    const cached = await prisma.translationCache.findUnique({
      where: { hash },
    });

    if (!cached) {
      return null;
    }

    // Check if cache has expired
    if (cached.expiresAt < new Date()) {
      // Delete expired cache
      await prisma.translationCache.delete({
        where: { hash },
      });
      return null;
    }

    return {
      sourceText: cached.sourceText,
      translatedText: cached.translatedText,
      targetLanguage: cached.targetLanguage as Language,
      model: cached.model,
      usedCache: true,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error checking cache:', error);
    return null;
  }
}

/**
 * Save translation to cache
 */
async function saveToCache(
  hash: string,
  sourceText: string,
  targetLanguage: Language,
  translatedText: string
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);

    await prisma.translationCache.upsert({
      where: { hash },
      update: {
        translatedText,
        expiresAt,
      },
      create: {
        hash,
        sourceText,
        translatedText,
        targetLanguage,
        model: 'deepl',
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<ServerActionResult> {
  try {
    const result = await prisma.translationCache.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return {
      status: 'success',
      message: `Cleared ${result.count} expired cache entries`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to clear cache',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<ServerActionResult> {
  const timestamp = new Date().toISOString();

  try {
    const valid = await prisma.translationCache.count({
      where: {
        expiresAt: { gte: new Date() },
      },
    });

    const expired = await prisma.translationCache.count({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    // Count by language
    const byLanguage = await prisma.translationCache.groupBy({
      by: ['targetLanguage'],
      _count: true,
    });

    const stats = {
      totalCached: valid,
      totalExpired: expired,
      byLanguage: Object.fromEntries(
        byLanguage.map(item => [item.targetLanguage, item._count])
      ) as Record<Language, number>,
    };

    return {
      status: 'success',
      data: stats,
      timestamp,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to retrieve stats',
      timestamp,
    };
  }
}

/**
 * Reset API key cache (useful after configuration updates)
 */
export function resetApiKeyCache(): void {
  cachedDeeplApiKey = null;
  cacheExpiry = 0;
}
