import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTranslationMetrics, getCacheStats } from '@/lib/deepl.service';

/**
 * GET /api/translate/health
 * 
 * Health check endpoint para o sistema de tradução.
 * Retorna o estado do circuit breaker, métricas de tradução e estatísticas de cache.
 * 
 * Útil para:
 * - Monitorização e dashboards
 * - Debugging de problemas de tradução
 * - Verificar se DeepL está funcional
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Obter métricas do serviço de tradução
    const translationMetrics = getTranslationMetrics();
    
    // Obter estatísticas de cache
    const cacheStatsResult = await getCacheStats();
    
    // Verificar configuração DeepL na base de dados
    let deeplConfigStatus: 'configured' | 'inactive' | 'missing' = 'missing';
    let deeplConfigDetails: Record<string, unknown> = {};
    
    try {
      const deeplConfig = await prisma.aPIConfiguration.findUnique({
        where: { provider: 'deepl' },
        select: { 
          isActive: true, 
          testStatus: true, 
          lastTestedAt: true,
          testError: true,
        },
      });
      
      if (deeplConfig) {
        deeplConfigStatus = deeplConfig.isActive ? 'configured' : 'inactive';
        deeplConfigDetails = {
          isActive: deeplConfig.isActive,
          testStatus: deeplConfig.testStatus,
          lastTestedAt: deeplConfig.lastTestedAt?.toISOString() ?? null,
          testError: deeplConfig.testError,
        };
      }
    } catch (e) {
      console.warn('[Health] Erro ao verificar config DeepL:', e);
    }
    
    // Verificar fallback em variáveis de ambiente
    const hasEnvFallback = !!process.env.DEEPL_API_KEY;
    
    // Calcular taxa de sucesso
    const totalAttempts = translationMetrics.deeplCalls;
    const successRate = totalAttempts > 0 
      ? ((totalAttempts - translationMetrics.failures) / totalAttempts * 100).toFixed(2)
      : '100.00';
    
    // Calcular taxa de cache hits
    const cacheHitRate = translationMetrics.totalRequests > 0
      ? (translationMetrics.cacheHits / translationMetrics.totalRequests * 100).toFixed(2)
      : '0.00';
    
    // Determinar estado geral de saúde
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const issues: string[] = [];
    
    if (translationMetrics.circuitBreakerOpen) {
      overallStatus = 'unhealthy';
      issues.push('Circuit breaker está ABERTO - DeepL API com falhas repetidas');
    }
    
    if (deeplConfigStatus === 'missing') {
      overallStatus = overallStatus === 'healthy' ? 'degraded' : overallStatus;
      issues.push('Configuração DeepL não encontrada na base de dados');
    } else if (deeplConfigStatus === 'inactive') {
      overallStatus = overallStatus === 'healthy' ? 'degraded' : overallStatus;
      issues.push('Configuração DeepL está INATIVA (isActive=false)');
    }
    
    if (!hasEnvFallback && deeplConfigStatus !== 'configured') {
      overallStatus = 'unhealthy';
      issues.push('Sem DEEPL_API_KEY em .env como fallback');
    }
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTimeMs: responseTime,
      issues: issues.length > 0 ? issues : undefined,
      
      circuitBreaker: {
        isOpen: translationMetrics.circuitBreakerOpen,
        description: translationMetrics.circuitBreakerOpen 
          ? 'ABERTO - Requisições bloqueadas temporariamente'
          : 'FECHADO - Sistema operacional',
      },
      
      deeplConfiguration: {
        status: deeplConfigStatus,
        hasEnvFallback,
        ...deeplConfigDetails,
      },
      
      metrics: {
        totalRequests: translationMetrics.totalRequests,
        cacheHits: translationMetrics.cacheHits,
        cacheHitRate: `${cacheHitRate}%`,
        deeplApiCalls: translationMetrics.deeplCalls,
        failures: translationMetrics.failures,
        successRate: `${successRate}%`,
        lastSuccessAt: translationMetrics.lastSuccessAt 
          ? new Date(translationMetrics.lastSuccessAt).toISOString() 
          : null,
        lastFailureAt: translationMetrics.lastFailureAt 
          ? new Date(translationMetrics.lastFailureAt).toISOString() 
          : null,
      },
      
      cache: cacheStatsResult.status === 'success' ? cacheStatsResult.data : null,
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Health Check Error:', errorMessage);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: errorMessage,
    }, { status: 500 });
  }
}
