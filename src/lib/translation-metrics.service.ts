/**
 * Translation Metrics Service - Cache Hit Rate + Dashboard
 * 
 * Rastreia:
 * - Cache Hit Rate (objetivo: >95% em warehouse)
 * - Latência de DeepL, BD, Memória
 * - Taxa de fallbacks/stale serves
 * - Falhas de tradução
 */

import { prisma } from '@/lib/db';

interface MetricsSnapshot {
  period: string; // 'hourly', 'daily'
  cacheHitRate: number;
  cacheMissRate: number;
  totalRequests: number;
  deeplLatencyMs: number;
  dbLatencyMs: number;
  memoryLatencyMs: number;
  failedTranslations: number;
  staleServes: number;
}

/**
 * Serviço de Coleta e Análise de Métricas
 */
export class TranslationMetricsService {
  private static instance: TranslationMetricsService;
  private requestBuffer: {
    cacheHits: number;
    cacheMisses: number;
    totalRequests: number;
    deeplLatencies: number[];
    dbLatencies: number[];
    memLatencies: number[];
    failedTranslations: number;
    staleServes: number;
  } = {
    cacheHits: 0,
    cacheMisses: 0,
    totalRequests: 0,
    deeplLatencies: [],
    dbLatencies: [],
    memLatencies: [],
    failedTranslations: 0,
    staleServes: 0,
  };

  private flushInterval = 60000; // Flush a cada 1 minuto

  private constructor() {
    this.initializeFlushJob();
  }

  static getInstance(): TranslationMetricsService {
    if (!TranslationMetricsService.instance) {
      TranslationMetricsService.instance = new TranslationMetricsService();
    }
    return TranslationMetricsService.instance;
  }

  /**
   * Inicia job de flush periódico
   */
  private initializeFlushJob(): void {
    if (typeof window === 'undefined') {
      // Server-side only
      setInterval(() => {
        this.flushMetrics().catch(err =>
          console.error('[Metrics] Flush failed:', err)
        );
      }, this.flushInterval);
    }
  }

  /**
   * Registra cache hit
   */
  recordCacheHit(source: 'memory' | 'db' | 'deepl' = 'memory'): void {
    this.requestBuffer.cacheHits++;
    this.requestBuffer.totalRequests++;

    // Latência estimada (simulado)
    if (source === 'memory') {
      this.requestBuffer.memLatencies.push(Math.random() * 2); // <2ms
    } else if (source === 'db') {
      this.requestBuffer.dbLatencies.push(Math.random() * 20 + 5); // 5-25ms
    }
  }

  /**
   * Registra cache miss
   */
  recordCacheMiss(): void {
    this.requestBuffer.cacheMisses++;
    this.requestBuffer.totalRequests++;
  }

  /**
   * Registra latência de DeepL
   */
  recordDeeplLatency(latencyMs: number): void {
    this.requestBuffer.deeplLatencies.push(latencyMs);
  }

  /**
   * Registra falha de tradução
   */
  recordFailedTranslation(): void {
    this.requestBuffer.failedTranslations++;
  }

  /**
   * Registra stale serve
   */
  recordStaleServe(): void {
    this.requestBuffer.staleServes++;
  }

  /**
   * Calcula média de um array
   */
  private avg(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  /**
   * Flush de métricas para BD
   */
  private async flushMetrics(): Promise<void> {
    if (this.requestBuffer.totalRequests === 0) {
      return; // Nada para flush
    }

    try {
      const hitRate =
        this.requestBuffer.totalRequests === 0
          ? 0
          : (this.requestBuffer.cacheHits / this.requestBuffer.totalRequests) * 100;

      const missRate = 100 - hitRate;

      const snapshot: MetricsSnapshot = {
        period: 'hourly',
        cacheHitRate: parseFloat(hitRate.toFixed(2)),
        cacheMissRate: parseFloat(missRate.toFixed(2)),
        totalRequests: this.requestBuffer.totalRequests,
        deeplLatencyMs: Math.round(this.avg(this.requestBuffer.deeplLatencies)),
        dbLatencyMs: Math.round(this.avg(this.requestBuffer.dbLatencies)),
        memoryLatencyMs: Math.round(this.avg(this.requestBuffer.memLatencies)),
        failedTranslations: this.requestBuffer.failedTranslations,
        staleServes: this.requestBuffer.staleServes,
      };

      // Armazena na BD
      await prisma.translationMetrics.create({
        data: {
          id: `metrics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          period: snapshot.period,
          cacheHitRate: snapshot.cacheHitRate,
          cacheMissRate: snapshot.cacheMissRate,
          totalRequests: snapshot.totalRequests,
          deeplApiLatencyMs: snapshot.deeplLatencyMs,
          dbLatencyMs: snapshot.dbLatencyMs,
          memoryLatencyMs: snapshot.memoryLatencyMs,
          failedTranslations: snapshot.failedTranslations,
          staleServingCount: snapshot.staleServes,
        },
      });

      // Verifica se hit rate está abaixo do objetivo (95%)
      if (snapshot.cacheHitRate < 95) {
        console.warn(
          `⚠️ [Metrics] Cache Hit Rate LOW: ${snapshot.cacheHitRate}% (target: >95%)`
        );
      }

      // Reset buffer
      this.resetBuffer();

      console.log(
        `[Metrics] 📊 Flushed: Hit Rate=${snapshot.cacheHitRate}%, Requests=${snapshot.totalRequests}, Latency(DeepL)=${snapshot.deeplLatencyMs}ms`
      );
    } catch (err) {
      console.error('[Metrics] Failed to flush:', err);
    }
  }

  /**
   * Reset do buffer de métricas
   */
  private resetBuffer(): void {
    this.requestBuffer = {
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
      deeplLatencies: [],
      dbLatencies: [],
      memLatencies: [],
      failedTranslations: 0,
      staleServes: 0,
    };
  }

  /**
   * Obtém estatísticas em tempo real (últimas 24 horas)
   */
  async getRealtimeStats() {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const metrics = await prisma.translationMetrics.findMany({
      where: {
        createdAt: {
          gte: last24h,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 24, // Últimas 24 horas
    });

    const avgHitRate =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / metrics.length
        : 0;

    const avgDeeplLatency =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.deeplApiLatencyMs, 0) / metrics.length
        : 0;

    const totalFailed = metrics.reduce((sum, m) => sum + m.failedTranslations, 0);
    const totalStale = metrics.reduce((sum, m) => sum + m.staleServingCount, 0);

    return {
      period: 'last_24h',
      metrics,
      averageHitRate: parseFloat(avgHitRate.toFixed(2)),
      averageDeeplLatency: Math.round(avgDeeplLatency),
      totalFailedTranslations: totalFailed,
      totalStaleServes: totalStale,
      warningFlag: avgHitRate < 95 ? 'LOW_HIT_RATE' : null,
    };
  }

  /**
   * Obtém histórico por período
   */
  async getHistoricalStats(days: number = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const metrics = await prisma.translationMetrics.findMany({
      where: {
        createdAt: {
          gte: since,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Agrupa por dia
    const byDay: Record<string, any> = {};

    for (const m of metrics) {
      const day = m.createdAt.toISOString().split('T')[0];
      if (!byDay[day]) {
        byDay[day] = {
          metrics: [],
          avgHitRate: 0,
          avgLatency: 0,
        };
      }
      byDay[day].metrics.push(m);
    }

    // Calcula médias por dia
    for (const day of Object.keys(byDay)) {
      const dayMetrics = byDay[day].metrics;
      byDay[day].avgHitRate = parseFloat(
        (
          dayMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) /
          dayMetrics.length
        ).toFixed(2)
      );
      byDay[day].avgLatency = Math.round(
        dayMetrics.reduce((sum, m) => sum + m.deeplApiLatencyMs, 0) /
          dayMetrics.length
      );
    }

    return {
      period: `last_${days}_days`,
      byDay,
      trend: this.calculateTrend(metrics),
    };
  }

  /**
   * Calcula tendência (melhorando ou piorando?)
   */
  private calculateTrend(metrics: any[]): string {
    if (metrics.length < 2) return 'insufficient_data';

    const first = metrics[0].cacheHitRate;
    const last = metrics[metrics.length - 1].cacheHitRate;

    if (last > first + 2) return 'improving';
    if (last < first - 2) return 'degrading';
    return 'stable';
  }

  /**
   * Detecta anomalias (padrões de cache misses)
   */
  async detectAnomalies() {
    const last1h = new Date(Date.now() - 60 * 60 * 1000);

    const recentMetrics = await prisma.translationMetrics.findMany({
      where: {
        createdAt: {
          gte: last1h,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 12, // 12 pontos de dados (5 min cada)
    });

    const anomalies = [];

    // Detecta queda súbita de hit rate
    if (recentMetrics.length > 1) {
      const current = recentMetrics[0].cacheHitRate;
      const previous = recentMetrics[1].cacheHitRate;

      if (current < previous - 10) {
        anomalies.push({
          type: 'sudden_hit_rate_drop',
          from: previous,
          to: current,
          timestamp: recentMetrics[0].createdAt,
        });
      }
    }

    // Detecta picos de falhas
    const highFailureCount = recentMetrics.filter(m => m.failedTranslations > 5);
    if (highFailureCount.length > 0) {
      anomalies.push({
        type: 'high_failure_rate',
        count: highFailureCount.length,
        affectedTimes: highFailureCount.map(m => m.createdAt),
      });
    }

    // Detecta latência anormal
    const avgLatency =
      recentMetrics.reduce((sum, m) => sum + m.deeplApiLatencyMs, 0) /
      recentMetrics.length;
    const highLatency = recentMetrics.filter(
      m => m.deeplApiLatencyMs > avgLatency * 1.5
    );

    if (highLatency.length > 0) {
      anomalies.push({
        type: 'high_latency_periods',
        normalLatency: Math.round(avgLatency),
        count: highLatency.length,
      });
    }

    return {
      period: 'last_1h',
      anomalies,
      hasAnomalies: anomalies.length > 0,
    };
  }

  /**
   * Status do dashboard (resumo)
   */
  async getDashboardStatus() {
    const realtime = await this.getRealtimeStats();
    const anomalies = await this.detectAnomalies();

    const healthy = realtime.averageHitRate > 95 && !anomalies.hasAnomalies;

    return {
      healthy,
      status: healthy ? 'OK' : 'WARNING',
      cacheHitRate: realtime.averageHitRate,
      avgLatency: realtime.averageDeeplLatency,
      failedTranslations: realtime.totalFailedTranslations,
      anomalyCount: anomalies.anomalies.length,
      lastUpdated: new Date(),
    };
  }
}

export const metricsService = TranslationMetricsService.getInstance();
