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

// Circuit Breaker Configuration
const CIRCUIT_BREAKER_FAILURE_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_TIMEOUT_MS = 60000; // 1 minute

// State management
let cachedDeeplApiKey: string | null = null;
let cacheExpiry: number = 0;
let inflight = 0;
const waitQueue: Array<() => void> = [];

// Circuit Breaker State
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const circuitBreaker: CircuitBreakerState = {
  failures: 0,
  lastFailure: 0,
  isOpen: false,
};

// Translation Metrics
interface TranslationMetrics {
  totalRequests: number;
  cacheHits: number;
  deeplCalls: number;
  failures: number;
  lastSuccessAt: number | null;
  lastFailureAt: number | null;
}

const metrics: TranslationMetrics = {
  totalRequests: 0,
  cacheHits: 0,
  deeplCalls: 0,
  failures: 0,
  lastSuccessAt: null,
  lastFailureAt: null,
};

/**
 * Check if circuit breaker allows requests
 */
function checkCircuitBreaker(): boolean {
  if (!circuitBreaker.isOpen) return true;

  // Check if reset timeout has passed
  if (Date.now() - circuitBreaker.lastFailure > CIRCUIT_BREAKER_RESET_TIMEOUT_MS) {
    console.log('[DeepL] 🔄 Circuit breaker reset - permitindo novas tentativas');
    circuitBreaker.isOpen = false;
    circuitBreaker.failures = 0;
    return true;
  }

  console.warn('[DeepL] ⚡ Circuit breaker ABERTO - retornando fallback');
  return false;
}

/**
 * Record a failure for circuit breaker
 */
function recordCircuitBreakerFailure(): void {
  circuitBreaker.failures++;
  circuitBreaker.lastFailure = Date.now();
  metrics.failures++;
  metrics.lastFailureAt = Date.now();

  if (circuitBreaker.failures >= CIRCUIT_BREAKER_FAILURE_THRESHOLD) {
    circuitBreaker.isOpen = true;
    console.error(`[DeepL] ⚡ Circuit breaker ABERTO após ${CIRCUIT_BREAKER_FAILURE_THRESHOLD} falhas consecutivas`);
  }
}

/**
 * Record a success for circuit breaker
 */
function recordCircuitBreakerSuccess(): void {
  circuitBreaker.failures = 0;
  circuitBreaker.isOpen = false;
  metrics.lastSuccessAt = Date.now();
}

/**
 * Get current translation service metrics
 */
export function getTranslationMetrics(): TranslationMetrics & { circuitBreakerOpen: boolean } {
  return {
    ...metrics,
    circuitBreakerOpen: circuitBreaker.isOpen,
  };
}

/**
 * Validate DeepL API key format
 * DeepL keys are typically 24-128 characters, alphanumeric with hyphens/colons
 */
function validateDeeplApiKey(key: string | null | undefined): boolean {
  if (!key || typeof key !== 'string') {
    console.warn('[DeepL] Chave API é null, undefined ou tipo inválido');
    return false;
  }
  
  const trimmed = key.trim();
  
  if (trimmed.length < 24 || trimmed.length > 128) {
    console.warn(`[DeepL] Chave tem ${trimmed.length} caracteres (esperado 24-128)`);
    return false;
  }
  
  if (!/^[a-zA-Z0-9\-:]+$/.test(trimmed)) {
    console.warn('[DeepL] Chave contém caracteres inválidos (apenas alfanuméricos, hífens e dois-pontos permitidos)');
    return false;
  }
  
  return true;
}

/**
 * Get DeepL API key from database or config service with caching
 * Priority: 1) Database (checking isActive status), 2) Config Service, 3) Environment variable
 * 
 * IMPORTANTE: Esta função verifica o status isActive da configuração.
 * Se isActive=false, a chave NÃO será retornada e o sistema cai para fallback.
 */
async function getDeeplApiKey(): Promise<string | null> {
  const now = Date.now();
  
  // Use cache if still valid (5 minute TTL)
  if (cachedDeeplApiKey && cacheExpiry > now) {
    return cachedDeeplApiKey;
  }

  try {
    // Priority 1: Database (APIConfiguration) - with isActive check
    console.log('[DeepL] 🔍 Verificando APIConfiguration na BD...');
    
    // Primeiro, verificar o estado completo da configuração
    const config = await prisma.aPIConfiguration.findUnique({
      where: { provider: 'deepl' },
      select: { apiKey: true, isActive: true, testStatus: true },
    });
    
    if (config) {
      console.log(`[DeepL] Config encontrada: isActive=${config.isActive}, testStatus=${config.testStatus}`);
      
      if (!config.isActive) {
        console.warn('[DeepL] ⚠️ ATENÇÃO: Configuração DeepL está INATIVA (isActive=false)!');
        console.warn('[DeepL] 💡 Sugestão: Ativar em Admin > Configurações > APIs ou via Prisma Studio');
        // Não retornar a chave se está inativa - cair para fallback
      } else if (config.apiKey && validateDeeplApiKey(config.apiKey)) {
        console.log('[DeepL] ✅ Chave encontrada em APIConfiguration e válida');
        cachedDeeplApiKey = config.apiKey;
        cacheExpiry = now + (5 * 60 * 1000);
        return cachedDeeplApiKey;
      } else if (config.apiKey) {
        console.warn('[DeepL] ⚠️ Chave em APIConfiguration tem formato inválido');
      }
    } else {
      console.log('[DeepL] ℹ️ Nenhuma configuração DeepL encontrada em APIConfiguration');
    }
    
    // Se chegou aqui, APIConfiguration não tem chave válida ou está inativa
    cachedDeeplApiKey = null;
    
    // Priority 2: Config Service (SystemSetting)
    console.log('[DeepL] Tentativa 2: Verificar SystemSetting');
    cachedDeeplApiKey = (await configService.get('Integration', 'DEEPL_API_KEY')) ?? null;
    
    if (cachedDeeplApiKey && validateDeeplApiKey(cachedDeeplApiKey)) {
      console.log('[DeepL] ✅ Chave encontrada em SystemSetting e válida');
      cacheExpiry = now + (5 * 60 * 1000);
      return cachedDeeplApiKey;
    } else if (cachedDeeplApiKey) {
      console.warn('[DeepL] ⚠️ Chave em SystemSetting tem formato inválido');
      cachedDeeplApiKey = null;
    }
    
    // Priority 3: Environment variable
    console.log('[DeepL] Tentativa 3: Verificar variável de ambiente DEEPL_API_KEY');
    cachedDeeplApiKey = process.env.DEEPL_API_KEY ?? null;
    
    if (cachedDeeplApiKey && validateDeeplApiKey(cachedDeeplApiKey)) {
      console.log('[DeepL] ✅ Chave encontrada em .env e válida');
      cacheExpiry = now + (5 * 60 * 1000);
      return cachedDeeplApiKey;
    } else if (cachedDeeplApiKey) {
      console.error('[DeepL] ❌ DEEPL_API_KEY em .env tem formato inválido');
      cachedDeeplApiKey = null;
      return null;
    }
    
    console.warn('[DeepL] ❌ Nenhuma chave DeepL configurada (em BD, config ou .env)');
    return null;
    
  } catch (error) {
    console.error('[DeepL] Erro ao recuperar chave:', error instanceof Error ? error.message : String(error));
    return null;
  }
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
  metrics.totalRequests++;

  // Check circuit breaker first
  if (!checkCircuitBreaker()) {
    return {
      status: 'error',
      message: 'Serviço DeepL temporáriamente indisponível (circuit breaker aberto)',
      timestamp: new Date().toISOString(),
    };
  }

  return withConcurrency(async () => {
    const hash = generateCacheHash(sourceText, targetLanguage);

    // Check cache first
    const cached = await checkCache(hash, sourceText, targetLanguage);
    if (cached) {
      metrics.cacheHits++;
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

    metrics.deeplCalls++;
    let lastError: Error | null = null;
    let isRateLimited = false;

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
            // CORREÇÃO: PT-PT para Português Europeu (não PT que é Brasileiro)
            target_lang: targetLanguage.toLowerCase() === 'pt' ? 'PT-PT' : targetLanguage.toUpperCase(),
          }),
        });

        // Handle specific HTTP status codes with appropriate errors
        if (response.status === 401) {
          console.error('[DeepL] ❌ Erro 401: Chave de autenticação inválida');
          recordCircuitBreakerFailure();
          throw new Error('DeepL API: Chave de autenticação inválida (401). Verificar DEEPL_API_KEY.');
        }
        
        if (response.status === 403) {
          console.error('[DeepL] ❌ Erro 403: Acesso proibido');
          recordCircuitBreakerFailure();
          throw new Error('DeepL API: Acesso proibido (403). Verificar permissões da conta.');
        }
        
        if (response.status === 429) {
          isRateLimited = true;
          const error = await response.text();
          console.warn(`[DeepL] ⚠️ Erro 429 (Rate Limited): ${error}`);
          recordCircuitBreakerFailure();
          throw new Error(`DeepL API: Rate limit atingido (429). Aguardar antes de tentar novamente.`);
        }
        
        if (response.status === 456) {
          console.error('[DeepL] ❌ Erro 456: Quota de caracteres excedida');
          recordCircuitBreakerFailure();
          throw new Error('DeepL API: Quota de caracteres excedida (456).');
        }
        
        if (response.status === 503) {
          console.warn('[DeepL] ⚠️ Erro 503: Serviço indisponível');
          recordCircuitBreakerFailure();
          throw new Error('DeepL API: Serviço indisponível (503). Tentar mais tarde.');
        }

        if (!response.ok) {
          const error = await response.text();
          recordCircuitBreakerFailure();
          throw new Error(`DeepL API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        const translatedText = data.translations?.[0]?.text;

        if (!translatedText) {
          throw new Error('No translation in DeepL response');
        }

        // Success! Record it for circuit breaker
        recordCircuitBreakerSuccess();

        const result: TranslationResult = {
          sourceText,
          translatedText,
          targetLanguage,
          usedCache: false,
          timestamp: new Date().toISOString(),
        };

        // Save to TranslationCache (TTL cache)
        await saveToCache(hash, sourceText, targetLanguage, translatedText);

        // NOVO: Sincronizar com tabela Translation para unificar caches e analytics
        await syncToTranslationTable(sourceText, targetLanguage, translatedText);

        return {
          status: 'success',
          data: result,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < MAX_RETRIES - 1) {
          // Se rate limited (429), usar delay muito maior
          let delay: number;
          if (isRateLimited) {
            delay = 60000; // 60 segundos para rate limit
            console.log(`[DeepL] ⏳ Rate limited: aguardando ${delay}ms antes de tentar novamente...`);
          } else {
            delay = calcBackoffDelay(attempt);
            console.log(`[DeepL] ⏳ Tentativa ${attempt + 1} falhou: aguardando ${delay}ms...`);
          }
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
    // Translate to each target language
    for (const targetLang of request.targetLanguages) {
      const result = await deeplTranslateText(request.sourceText, targetLang);
      if (result.status === 'success' && result.data) {
        results.push(result.data);
      } else {
        errors.push(`Failed to translate: ${request.sourceText} to ${targetLang}`);
      }
    }
  }

  return {
    status: errors.length === 0 ? 'success' : 'error',
    data: {
      results,
      totalRequests: requests.length,
      cachedRequests: 0,
      newTranslations: results.length,
      errors: errors.length > 0 ? errors.map(e => ({
        text: e,
        language: 'en' as Language,
        error: e,
      })) : undefined,
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
    if (cached.expiresAt && cached.expiresAt < new Date()) {
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
        updatedAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        hash,
        sourceText,
        translatedText,
        targetLanguage,
        contentType: 'general',
        updatedAt: new Date(),
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

/**
 * Sync translation to the Translation table for unified analytics
 * This ensures usageCount, lastUsed, and other analytics work correctly
 * even for translations that came from DeepL/TranslationCache
 */
async function syncToTranslationTable(
  sourceText: string,
  targetLanguage: Language,
  translatedText: string
): Promise<void> {
  try {
    await prisma.translation.upsert({
      where: {
        sourceText_targetLang: {
          sourceText,
          targetLang: targetLanguage,
        },
      },
      update: {
        translatedText,
        updatedAt: new Date(),
        lastUsed: new Date(),
        usageCount: { increment: 1 },
      },
      create: {
        id: crypto.randomUUID(),
        sourceText,
        targetLang: targetLanguage,
        translatedText,
        model: 'deepl',
        isAutoTranslated: true,
        updatedAt: new Date(),
        lastUsed: new Date(),
        usageCount: 1,
      },
    });
  } catch (error) {
    // Log but don't fail - this is optional sync for analytics
    // The main TranslationCache is the primary store
    console.warn('[DeepL] Sync to Translation table failed (non-critical):', 
      error instanceof Error ? error.message : String(error));
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
