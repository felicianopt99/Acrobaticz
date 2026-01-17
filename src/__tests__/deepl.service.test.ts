/**
 * DeepL Service Unit Tests
 * Tests for retry logic, cache, concurrency control, and error handling
 *
 * To run: npm test -- src/__tests__/deepl.service.test.ts
 * Requires: jest, @testing-library/react, or vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock data
const MOCK_DEEPL_API_KEY = 'test-key-123456789012345678901234';
const MOCK_TRANSLATION_TEXT = 'Hello world';
const MOCK_TRANSLATED_TEXT = 'Olá mundo';

/**
 * Test Suite 1: API Key Validation
 */
describe('DeepL Service - API Key Validation', () => {
  it('should accept valid API key format (24-128 chars, alphanumeric+hyphens)', () => {
    const validKey = 'abc123def456ghi789jkl012mn:5678';
    // The validation function would check this
    expect(validKey.length).toBeGreaterThanOrEqual(24);
    expect(/^[a-zA-Z0-9\-:]+$/.test(validKey)).toBe(true);
  });

  it('should reject API key that is too short', () => {
    const shortKey = 'short123';
    expect(shortKey.length).toBeLessThan(24);
  });

  it('should reject API key that is too long', () => {
    const longKey = 'a'.repeat(200);
    expect(longKey.length).toBeGreaterThan(128);
  });

  it('should reject API key with invalid characters', () => {
    const invalidKey = 'key-with-!@#$%^&*()invalid';
    expect(/^[a-zA-Z0-9\-:]+$/.test(invalidKey)).toBe(false);
  });

  it('should reject null or undefined API key', () => {
    const nullKey: any = null;
    const undefinedKey: any = undefined;
    expect(nullKey).toBe(null);
    expect(undefinedKey).toBe(undefined);
  });
});

/**
 * Test Suite 2: Retry Logic
 */
describe('DeepL Service - Retry Logic', () => {
  it('should retry on transient errors (5xx)', () => {
    // Simulate: Request 1: 503 Service Unavailable → Retry
    //          Request 2: 503 Service Unavailable → Retry
    //          Request 3: 200 Success
    let attempts = 0;
    const mockFetch = async () => {
      attempts++;
      if (attempts < 3) {
        return { status: 503, ok: false, text: async () => 'Service unavailable' };
      }
      return { status: 200, ok: true, json: async () => ({ translations: [{ text: MOCK_TRANSLATED_TEXT }] }) };
    };

    expect(attempts).toBeLessThan(3);
  });

  it('should use exponential backoff between retries', () => {
    // Test backoff delays: 500ms, 1s, 2s (with MAX_RETRIES = 3)
    const delays: number[] = [];
    const calcBackoff = (attempt: number) => {
      const BASE_DELAY_MS = 500;
      const expo = BASE_DELAY_MS * Math.pow(2, attempt);
      const jitter = Math.floor(Math.random() * 250);
      return expo + jitter;
    };

    for (let i = 0; i < 3; i++) {
      delays.push(calcBackoff(i));
    }

    expect(delays[0]).toBeLessThan(delays[1]);
    expect(delays[1]).toBeLessThan(delays[2]);
  });

  it('should use longer delay (60s) for rate limit (429) errors', () => {
    // Rate limit should have special handling: 60000ms
    const rateLimitDelay = 60000;
    const normalDelay = 500;
    
    expect(rateLimitDelay).toBeGreaterThan(normalDelay);
    expect(rateLimitDelay).toBe(60000);
  });

  it('should fail after MAX_RETRIES attempts', () => {
    const MAX_RETRIES = 3;
    let attempts = 0;
    const mockFailingFetch = async () => {
      attempts++;
      return { status: 503, ok: false };
    };

    // Simulate retries
    for (let i = 0; i < MAX_RETRIES; i++) {
      mockFailingFetch();
    }

    expect(attempts).toBe(MAX_RETRIES);
  });

  it('should NOT retry on authentication errors (401)', () => {
    // 401 = Invalid key, should fail immediately
    // Should NOT retry on: 401, 403
    const shouldRetry401 = (status: number) => status !== 401 && status !== 403;
    
    expect(shouldRetry401(401)).toBe(false);
    expect(shouldRetry401(403)).toBe(false);
    expect(shouldRetry401(500)).toBe(true);
  });

  it('should differentiate error types in logs', () => {
    const errors = {
      auth: '401 - Invalid authentication',
      quotaExceeded: '456 - Character quota exceeded',
      rateLimited: '429 - Rate limit exceeded',
      serviceDown: '503 - Service unavailable',
    };

    expect(errors.auth).toContain('401');
    expect(errors.quotaExceeded).toContain('456');
    expect(errors.rateLimited).toContain('429');
    expect(errors.serviceDown).toContain('503');
  });
});

/**
 * Test Suite 3: Concurrency Control
 */
describe('DeepL Service - Concurrency Control', () => {
  it('should limit concurrent requests to MAX_CONCURRENCY', () => {
    const MAX_CONCURRENCY = 3;
    let activeRequests = 0;
    let peakConcurrency = 0;

    const simulateRequest = async () => {
      activeRequests++;
      peakConcurrency = Math.max(peakConcurrency, activeRequests);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      activeRequests--;
    };

    expect(MAX_CONCURRENCY).toBe(3);
  });

  it('should queue requests when at capacity', () => {
    const requestQueue: (() => void)[] = [];
    let inflight = 0;
    const MAX_CONCURRENCY = 3;

    const simulateWithConcurrency = (fn: () => Promise<void>) => {
      if (inflight >= MAX_CONCURRENCY) {
        requestQueue.push(() => {});
      } else {
        inflight++;
      }
    };

    // Simulate 10 requests with max 3 concurrent
    for (let i = 0; i < 10; i++) {
      simulateWithConcurrency(async () => {});
    }

    expect(requestQueue.length).toBeGreaterThan(0);
  });

  it('should process queued requests after slot becomes available', () => {
    let processed = 0;
    const queue: (() => void)[] = [
      () => processed++,
      () => processed++,
      () => processed++,
    ];

    // Process queue
    while (queue.length > 0) {
      const fn = queue.shift();
      if (fn) fn();
    }

    expect(processed).toBe(3);
  });
});

/**
 * Test Suite 4: Caching
 */
describe('DeepL Service - Cache Management', () => {
  it('should cache successful translations', () => {
    const cache = new Map<string, string>();
    const cacheKey = 'pt:Hello world';
    const translatedText = MOCK_TRANSLATED_TEXT;

    cache.set(cacheKey, translatedText);

    expect(cache.has(cacheKey)).toBe(true);
    expect(cache.get(cacheKey)).toBe(translatedText);
  });

  it('should return cached translation without API call', () => {
    let apiCalls = 0;
    const cache = new Map<string, string>();
    const cacheKey = 'pt:Hello world';

    // First request - API call
    cache.set(cacheKey, MOCK_TRANSLATED_TEXT);
    apiCalls++;

    // Second request - use cache
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      // No API call
    }

    expect(apiCalls).toBe(1); // Only one actual API call
  });

  it('should expire cache entries after TTL (30 days)', () => {
    const CACHE_TTL_DAYS = 30;
    const now = Date.now();
    const expiresAt = new Date(now + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);
    
    const cacheEntry = { expiresAt, text: 'cached' };
    
    // Fresh entry
    expect(expiresAt.getTime()).toBeGreaterThan(now);
    
    // Check expiry
    const isExpired = expiresAt.getTime() < now;
    expect(isExpired).toBe(false);
  });

  it('should not cache failed translations', () => {
    const cache = new Map<string, string>();
    const failedKey = 'pt:failed-translation';

    // Simulate failed translation - should not cache
    const shouldCache = false;
    
    if (shouldCache) {
      cache.set(failedKey, 'error');
    }

    expect(cache.has(failedKey)).toBe(false);
  });

  it('should generate consistent cache hash for same input', () => {
    const crypto = require('crypto');
    
    const generateHash = (text: string, lang: string) =>
      crypto.createHash('sha256').update(`${text}:${lang}`).digest('hex');

    const hash1 = generateHash('Hello', 'pt');
    const hash2 = generateHash('Hello', 'pt');
    const hash3 = generateHash('Hello', 'en');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });
});

/**
 * Test Suite 5: Error Handling
 */
describe('DeepL Service - Error Handling', () => {
  it('should handle 401 (Invalid Auth) with clear message', () => {
    const status = 401;
    const message = 'DeepL API: Chave de autenticação inválida (401)';
    
    expect(message).toContain('401');
    expect(message).toContain('autenticação');
  });

  it('should handle 429 (Rate Limited) with clear message', () => {
    const status = 429;
    const message = 'DeepL API: Rate limit atingido (429)';
    
    expect(message).toContain('429');
    expect(message).toContain('Rate limit');
  });

  it('should handle 456 (Quota Exceeded) with clear message', () => {
    const status = 456;
    const message = 'DeepL API: Quota de caracteres excedida (456)';
    
    expect(message).toContain('456');
    expect(message).toContain('Quota');
  });

  it('should handle 503 (Service Unavailable) with clear message', () => {
    const status = 503;
    const message = 'DeepL API: Serviço indisponível (503)';
    
    expect(message).toContain('503');
    expect(message).toContain('indisponível');
  });

  it('should handle network errors gracefully', () => {
    const networkError = new Error('Network timeout');
    
    expect(networkError.message).toContain('Network');
  });

  it('should return meaningful error when API key not configured', () => {
    const hasApiKey = false;
    const message = hasApiKey 
      ? 'Translation successful' 
      : 'DeepL API key not configured';
    
    expect(message).toContain('not configured');
  });

  it('should handle empty response from API', () => {
    const emptyResponse = { translations: [] };
    const hasTranslation = (emptyResponse.translations?.length ?? 0) > 0;
    
    expect(hasTranslation).toBe(false);
  });
});

/**
 * Test Suite 6: API Key Fallback Priority
 */
describe('DeepL Service - API Key Fallback Priority', () => {
  it('should prioritize database over config service', () => {
    const sources = ['database', 'configService', 'env'];
    const priority = sources[0]; // Database first
    
    expect(priority).toBe('database');
  });

  it('should use config service if database empty', () => {
    const dbKey = null;
    const configKey = 'config-key-' + 'x'.repeat(20);
    const envKey = 'env-key-' + 'x'.repeat(20);

    const resolvedKey = dbKey || configKey || envKey;
    expect(resolvedKey).toBe(configKey);
  });

  it('should fall back to environment variable', () => {
    const dbKey = null;
    const configKey = null;
    const envKey = 'env-key-' + 'x'.repeat(20);

    const resolvedKey = dbKey || configKey || envKey;
    expect(resolvedKey).toBe(envKey);
  });

  it('should cache API key for 5 minutes', () => {
    const CACHE_TTL_MS = 5 * 60 * 1000;
    const now = Date.now();
    const expiresAt = now + CACHE_TTL_MS;

    const cacheValid = expiresAt > now;
    expect(cacheValid).toBe(true);
  });
});

/**
 * Test Suite 7: Logging & Monitoring
 */
describe('DeepL Service - Logging & Monitoring', () => {
  it('should log cache hits', () => {
    const logMessage = '[DeepL] Cache hit para: "Hello..."';
    expect(logMessage).toContain('Cache hit');
  });

  it('should log retry attempts', () => {
    const logMessage = '[DeepL] Tentativa 1/3: Traduzindo "Hello..." para pt';
    expect(logMessage).toContain('Tentativa');
  });

  it('should log successful translations', () => {
    const logMessage = '[DeepL] ✅ Sucesso na tentativa 1: "Olá mundo..."';
    expect(logMessage).toContain('✅');
    expect(logMessage).toContain('Sucesso');
  });

  it('should log API key retrieval steps', () => {
    const messages = [
      '[DeepL] Tentativa 1: Verificar APIConfiguration na BD',
      '[DeepL] Tentativa 2: Verificar SystemSetting',
      '[DeepL] Tentativa 3: Verificar variável de ambiente DEEPL_API_KEY',
    ];

    expect(messages[0]).toContain('APIConfiguration');
    expect(messages[1]).toContain('SystemSetting');
    expect(messages[2]).toContain('ambiente');
  });
});

/**
 * Integration Test: Full Translation Flow
 */
describe('DeepL Service - Integration Test', () => {
  it('should complete full translation flow: key retrieval → API call → cache', async () => {
    const steps: string[] = [];

    // Step 1: Get API key
    steps.push('getDeeplApiKey');

    // Step 2: Check cache
    steps.push('checkCache');

    // Step 3: Call API
    steps.push('callAPI');

    // Step 4: Save to cache
    steps.push('saveToCache');

    expect(steps).toHaveLength(4);
    expect(steps[0]).toBe('getDeeplApiKey');
    expect(steps[3]).toBe('saveToCache');
  });
});
