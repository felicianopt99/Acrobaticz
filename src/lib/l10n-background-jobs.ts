/**
 * L10N Ecosystem Background Jobs
 * 
 * Jobs periódicos para:
 * 1. Processar fila de retranslações com fallback
 * 2. Flush de métricas para BD
 * 3. Detecção de anomalias
 */

import { runPendingRetranslationJob } from '@/lib/fallback-strategy.service';

/**
 * Setup de todos os background jobs
 * Deve ser chamado na inicialização do servidor
 */
export function setupL10nBackgroundJobs(): void {
  console.log('[L10N] Initializing background jobs...');

  // Job 1: Processar retranslações pendentes (a cada 1 minuto)
  setInterval(async () => {
    try {
      const result = await runPendingRetranslationJob();
      if (result.processed > 0) {
        console.log(
          `[L10N] Retranslation job: processed=${result.processed}, succeeded=${result.succeeded}, failed=${result.failed}`
        );
      }
    } catch (err) {
      console.error('[L10N] Retranslation job failed:', err);
    }
  }, 60000); // 1 minuto

  console.log('[L10N] Background jobs initialized successfully');
}

/**
 * Export para usar em server startup
 */
export default setupL10nBackgroundJobs;
