/**
 * Fallback Strategy Service - Stale-While-Revalidate (PT-PT Only)
 * 
 * Se DeepL falhar:
 * 1. Serve cache stale (mesmo que velho) - em PT-PT
 * 2. Marca termo para retry automático
 * 3. Circuit breaker para evitar cascata de falhas
 * 4. Exponential backoff para retries
 * Sem seed inicial - DeepL trata de traduzir
 */

import { prisma } from '@/lib/db';
import { deeplTranslateText } from '@/lib/deepl.service';
import type { Language } from '@/types/translation.types';

interface CircuitBreakerState {
  failureCount: number;
  lastFailureTime: number;
  isOpen: boolean;
  successCount: number;
}

/**
 * Estratégia de Fallback com Circuit Breaker
 */
export class FallbackStrategyService {
  private static instance: FallbackStrategyService;
  private circuitBreaker: CircuitBreakerState = {
    failureCount: 0,
    lastFailureTime: 0,
    isOpen: false,
    successCount: 0,
  };

  private readonly FAILURE_THRESHOLD = 5; // Abre circuit após 5 falhas
  private readonly RESET_TIMEOUT = 60000; // 1 minuto
  private readonly HALF_OPEN_ATTEMPT_INTERVAL = 30000; // Tenta recuperar a cada 30s

  private constructor() {}

  static getInstance(): FallbackStrategyService {
    if (!FallbackStrategyService.instance) {
      FallbackStrategyService.instance = new FallbackStrategyService();
    }
    return FallbackStrategyService.instance;
  }

  /**
   * Tenta traduzir com fallback inteligente
   * 
   * 1. Se DeepL OK: retorna tradução nova
   * 2. Se DeepL falha + cache existe: retorna cache (stale)
   * 3. Se DeepL falha + cache não existe: tenta retry em background
   */
  async translateWithFallback(
    text: string,
    targetLanguage: Language,
    cachedTranslation?: string
  ): Promise<{
    translation: string;
    isStale: boolean;
    reason?: string;
  }> {
    try {
      // Verifica se circuit breaker está aberto
      if (this.isCircuitOpen()) {
        return {
          translation: cachedTranslation || text,
          isStale: true,
          reason: 'circuit_breaker_open',
        };
      }

      // Tenta tradução com DeepL
      const result = await deeplTranslateText(text, targetLanguage);

      if (result.status === 'success' && result.data) {
        // Sucesso: reseta circuit breaker
        this.onSuccess();
        return {
          translation: result.data,
          isStale: false,
        };
      }

      // DeepL falhou - entra fallback
      return this.handleDeeplFailure(text, targetLanguage, cachedTranslation);
    } catch (error) {
      // Erro na chamada: aplica fallback
      return this.handleDeeplFailure(text, targetLanguage, cachedTranslation);
    }
  }

  /**
   * Trata falha de DeepL
   */
  private async handleDeeplFailure(
    text: string,
    targetLanguage: Language,
    cachedTranslation?: string
  ): Promise<{
    translation: string;
    isStale: boolean;
    reason: string;
  }> {
    this.onFailure();

    // Se tem cache: serve stale
    if (cachedTranslation) {
      // Marca para re-tradução automática
      await this.markForRetranslation(text, targetLanguage, cachedTranslation);

      return {
        translation: cachedTranslation,
        isStale: true,
        reason: 'served_from_stale_cache',
      };
    }

    // Sem cache: tenta retry com backoff
    await this.scheduleRetry(text, targetLanguage);

    return {
      translation: text, // Fallback: retorna original
      isStale: true,
      reason: 'no_cache_retry_scheduled',
    };
  }

  /**
   * Marca termo para re-tradução automática
   */
  private async markForRetranslation(
    sourceText: string,
    targetLanguage: Language,
    currentCached: string
  ): Promise<void> {
    try {
      const existing = await prisma.pendingRetranslation.findUnique({
        where: {
          sourceText_targetLanguage: {
            sourceText,
            targetLanguage,
          },
        },
      });

      if (existing) {
        // Já existe: incrementa retry count
        await prisma.pendingRetranslation.update({
          where: { id: existing.id },
          data: {
            retryCount: existing.retryCount + 1,
            nextRetryAt: this.calculateNextRetryTime(existing.retryCount + 1),
            updatedAt: new Date(),
          },
        });
      } else {
        // Novo: cria registro
        await prisma.pendingRetranslation.create({
          data: {
            id: `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sourceText,
            targetLanguage,
            currentCachedTranslation: currentCached,
            reason: 'api_failure',
            retryCount: 1,
            nextRetryAt: this.calculateNextRetryTime(1),
            status: 'pending',
          },
        });
      }

      console.log(`[Fallback] Marked for retranslation: "${sourceText}" -> ${targetLanguage}`);
    } catch (err) {
      console.error('[Fallback] Failed to mark for retranslation:', err);
    }
  }

  /**
   * Agenda retry com exponential backoff
   */
  private async scheduleRetry(
    sourceText: string,
    targetLanguage: Language
  ): Promise<void> {
    try {
      const existing = await prisma.pendingRetranslation.findUnique({
        where: {
          sourceText_targetLanguage: {
            sourceText,
            targetLanguage,
          },
        },
      });

      if (!existing) {
        await prisma.pendingRetranslation.create({
          data: {
            id: `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sourceText,
            targetLanguage,
            reason: 'api_failure',
            retryCount: 1,
            nextRetryAt: this.calculateNextRetryTime(1),
            status: 'pending',
          },
        });
      }

      console.log(`[Fallback] Scheduled retry for: "${sourceText}" -> ${targetLanguage}`);
    } catch (err) {
      console.error('[Fallback] Failed to schedule retry:', err);
    }
  }

  /**
   * Calcula próximo tempo de retry com exponential backoff
   * 1st retry: 10s
   * 2nd retry: 20s
   * 3rd retry: 40s
   * Max: 5 minutos
   */
  private calculateNextRetryTime(retryCount: number): Date {
    const baseDelay = 10000; // 10 segundos
    const delay = Math.min(baseDelay * Math.pow(2, retryCount - 1), 300000); // Max 5 minutos
    return new Date(Date.now() + delay);
  }

  /**
   * Processa fila de retranslações pendentes
   * Deve ser chamado periodicamente (ex: a cada 1 minuto)
   */
  async processPendingRetranslations(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    const now = new Date();
    const pending = await prisma.pendingRetranslation.findMany({
      where: {
        status: 'pending',
        nextRetryAt: {
          lte: now,
        },
      },
      take: 50, // Processa até 50 por vez
    });

    let succeeded = 0;
    let failed = 0;

    for (const item of pending) {
      try {
        // Tenta tradução de novo
        const result = await deeplTranslateText(
          item.sourceText,
          item.targetLanguage as Language
        );

        if (result.status === 'success' && result.data) {
          // Sucesso: marca como completo
          await prisma.pendingRetranslation.update({
            where: { id: item.id },
            data: { status: 'retrying' }, // Move para retrying temporário
          });

          // Atualiza cache no DB
          await prisma.translation.upsert({
            where: {
              sourceText_targetLang: {
                sourceText: item.sourceText,
                targetLang: item.targetLanguage as Language,
              },
            },
            create: {
              id: `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              sourceText: item.sourceText,
              targetLang: item.targetLanguage as Language,
              translatedText: result.data,
              model: 'deepl',
              usageCount: 1,
            },
            update: {
              translatedText: result.data,
              usageCount: { increment: 1 },
              lastUsed: new Date(),
            },
          });

          succeeded++;
          console.log(`[Fallback] ✅ Retranslated: "${item.sourceText}"`);
        } else {
          // Falha: incrementa retry count
          await prisma.pendingRetranslation.update({
            where: { id: item.id },
            data: {
              retryCount: item.retryCount + 1,
              nextRetryAt: this.calculateNextRetryTime(item.retryCount + 1),
              status: item.retryCount + 1 >= item.maxRetries ? 'failed' : 'pending',
            },
          });

          failed++;
          console.log(
            `[Fallback] ❌ Retry failed for: "${item.sourceText}" (attempt ${item.retryCount + 1}/${item.maxRetries})`
          );
        }
      } catch (err) {
        // Erro na tentativa
        await prisma.pendingRetranslation.update({
          where: { id: item.id },
          data: {
            retryCount: item.retryCount + 1,
            nextRetryAt: this.calculateNextRetryTime(item.retryCount + 1),
            status: item.retryCount + 1 >= item.maxRetries ? 'failed' : 'pending',
          },
        });

        failed++;
        console.error(`[Fallback] Error during retry:`, err);
      }
    }

    return {
      processed: pending.length,
      succeeded,
      failed,
    };
  }

  /**
   * Circuit Breaker: Verifica se está aberto
   */
  private isCircuitOpen(): boolean {
    if (!this.circuitBreaker.isOpen) return false;

    // Tenta recuperar (half-open state)
    const timeSinceLast = Date.now() - this.circuitBreaker.lastFailureTime;
    if (timeSinceLast > this.RESET_TIMEOUT) {
      console.log('[Fallback] Circuit breaker attempting recovery (half-open)');
      this.circuitBreaker.isOpen = false;
      this.circuitBreaker.failureCount = 0;
      return false;
    }

    return true;
  }

  /**
   * Registra sucesso (reseta circuit breaker)
   */
  private onSuccess(): void {
    this.circuitBreaker.successCount++;
    if (this.circuitBreaker.isOpen && this.circuitBreaker.successCount >= 3) {
      console.log('[Fallback] Circuit breaker CLOSED (recovered)');
      this.circuitBreaker.isOpen = false;
      this.circuitBreaker.failureCount = 0;
      this.circuitBreaker.successCount = 0;
    }
  }

  /**
   * Registra falha (pode abrir circuit breaker)
   */
  private onFailure(): void {
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = Date.now();
    this.circuitBreaker.successCount = 0;

    if (
      this.circuitBreaker.failureCount >= this.FAILURE_THRESHOLD &&
      !this.circuitBreaker.isOpen
    ) {
      console.warn(
        `[Fallback] ⚠️ Circuit breaker OPEN after ${this.FAILURE_THRESHOLD} failures`
      );
      this.circuitBreaker.isOpen = true;
    }
  }

  /**
   * Obtém status do circuit breaker
   */
  getCircuitBreakerStatus() {
    return {
      isOpen: this.circuitBreaker.isOpen,
      failureCount: this.circuitBreaker.failureCount,
      successCount: this.circuitBreaker.successCount,
      lastFailureTime: new Date(this.circuitBreaker.lastFailureTime),
    };
  }

  /**
   * Reseta circuit breaker (manual)
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker = {
      failureCount: 0,
      lastFailureTime: 0,
      isOpen: false,
      successCount: 0,
    };
    console.log('[Fallback] Circuit breaker manually reset');
  }

  /**
   * Estatísticas de fallback
   */
  async getStatistics() {
    const pending = await prisma.pendingRetranslation.count({
      where: { status: 'pending' },
    });

    const failed = await prisma.pendingRetranslation.count({
      where: { status: 'failed' },
    });

    const metrics = await prisma.translationMetrics.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    return {
      pendingRetranslations: pending,
      failedRetranslations: failed,
      staleServes: metrics?.staleServingCount || 0,
      circuitBreakerStatus: this.getCircuitBreakerStatus(),
    };
  }
}

export const fallbackService = FallbackStrategyService.getInstance();

// Background job para processar retries
export async function runPendingRetranslationJob(): Promise<void> {
  try {
    const result = await fallbackService.processPendingRetranslations();
    console.log(
      `[Fallback] Job completed: ${result.processed} processed, ${result.succeeded} succeeded, ${result.failed} failed`
    );
  } catch (err) {
    console.error('[Fallback] Job failed:', err);
  }
}
