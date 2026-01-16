'use client';

/**
 * Hook: useScanWithRetry
 * 
 * Lida com retry automático quando versão do Rental muda (erro 409)
 * Implementa backoff exponencial e atualização de versão
 * 
 * Uso:
 * ```ts
 * const { submitScan, isRetrying, lastError } = useScanWithRetry();
 * const result = await submitScan('eq-123', 'checkout', 1); // currentVersion=1
 * if (result.error === 'VERSION_CONFLICT') {
 *   // Hook já fez retry automaticamente
 * }
 * ```
 */

import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ScanRetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  logVerbose?: boolean;
}

export interface ScanResult {
  success: boolean;
  data?: {
    rentalId: string;
    newVersion: number;
    progress: {
      out: string;
      in: string;
    };
  };
  error?: {
    code: string;
    message: string;
    currentVersion?: number;
  };
}

const DEFAULT_RETRY_CONFIG: ScanRetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 300,
  maxDelayMs: 2000,
  backoffMultiplier: 1.5,
  logVerbose: false
};

export function useScanWithRetry(config?: Partial<ScanRetryConfig>) {
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastError, setLastError] = useState<any>(null);

  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const versionCacheRef = useRef<Map<string, number>>(new Map());

  /**
   * Fetch a versão mais recente do rental da DB
   */
  const fetchLatestVersion = useCallback(
    async (rentalId: string): Promise<number | null> => {
      try {
        const response = await fetch(`/api/rentals/${rentalId}/version`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          const newVersion = data.version;
          
          // Atualizar cache
          versionCacheRef.current.set(rentalId, newVersion);
          
          if (finalConfig.logVerbose) {
            console.log(`[RETRY] Fetched latest version for ${rentalId}: ${newVersion}`);
          }

          return newVersion;
        }
      } catch (error) {
        console.error(`[RETRY] Failed to fetch version for ${rentalId}:`, error);
      }

      return null;
    },
    [finalConfig]
  );

  /**
   * Submete um scan com retry automático em caso de VERSION_CONFLICT
   *
   * @param rentalId - ID do rental
   * @param equipmentId - ID do equipamento
   * @param scanType - 'checkout' ou 'checkin'
   * @param currentVersion - Versão atual conhecida (para OCC)
   * @returns ScanResult com sucesso/erro
   */
  const submitScan = useCallback(
    async (
      rentalId: string,
      equipmentId: string,
      scanType: 'checkout' | 'checkin',
      currentVersion: number,
      eventId?: string
    ): Promise<ScanResult> => {
      let lastErrorState: any = null;
      let attemptVersion = currentVersion;

      for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
        try {
          setIsRetrying(attempt > 1);

          if (finalConfig.logVerbose) {
            console.log(
              `[RETRY] Attempt ${attempt}/${finalConfig.maxAttempts} for ${equipmentId} ` +
              `(scanType=${scanType}, version=${attemptVersion})`
            );
          }

          // Preparar payload
          const payload = {
            scans: [
              {
                equipmentId,
                scanType,
                eventId: eventId || 'unknown',
                timestamp: Date.now()
              }
            ]
          };

          const response = await fetch('/api/rentals/scan-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const responseData = await response.json();

          // ✅ SUCESSO
          if (response.ok && responseData.success) {
            const scanResult = responseData;
            
            if (finalConfig.logVerbose) {
              console.log(`[RETRY] ✅ Scan successful on attempt ${attempt}`);
            }

            setLastError(null);
            setIsRetrying(false);

            return {
              success: true,
              data: {
                rentalId,
                newVersion: attemptVersion + 1,
                progress: {
                  out: '?/?',
                  in: '?/?'
                }
              }
            };
          }

          // ❌ ERRO: Verificar se é VERSION_CONFLICT
          if (responseData.errors && responseData.errors.length > 0) {
            const scanError = responseData.errors[0];

            if (scanError.code === 'VERSION_CONFLICT') {
              lastErrorState = scanError;

              // Se é último attempt, falhar
              if (attempt >= finalConfig.maxAttempts) {
                console.error(`[RETRY] ❌ VERSION_CONFLICT after ${finalConfig.maxAttempts} attempts`);
                
                setLastError(scanError);
                setIsRetrying(false);

                return {
                  success: false,
                  error: {
                    code: 'VERSION_CONFLICT',
                    message: scanError.error || 'Version conflict',
                    currentVersion: attemptVersion
                  }
                };
              }

              // Fazer retry: fetch nova versão
              console.warn(
                `[RETRY] Version conflict (current=${attemptVersion}). ` +
                `Fetching latest version and retrying...`
              );

              const latestVersion = await fetchLatestVersion(rentalId);
              
              if (latestVersion !== null) {
                attemptVersion = latestVersion;
                
                // Aguardar antes de retry
                const delay = Math.min(
                  finalConfig.initialDelayMs * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
                  finalConfig.maxDelayMs
                );

                if (finalConfig.logVerbose) {
                  console.log(`[RETRY] Waiting ${delay}ms before retry...`);
                }

                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
              } else {
                // Não conseguiu fetch versão, usar estratégia simples: tentar com versão+1
                console.warn(
                  `[RETRY] Failed to fetch version from DB. ` +
                  `Retrying with incrementedVersion: ${attemptVersion + 1}`
                );
                attemptVersion = attemptVersion + 1;

                const delay = Math.min(
                  finalConfig.initialDelayMs * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
                  finalConfig.maxDelayMs
                );
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
              }
            } else {
              // Outro erro (NOT_FOUND, QUANTITY_COMPLETE, etc.) - não fazer retry
              console.error(`[RETRY] Non-retryable error: ${scanError.code}`);

              setLastError(scanError);
              setIsRetrying(false);

              return {
                success: false,
                error: {
                  code: scanError.code,
                  message: scanError.error
                }
              };
            }
          }

          // Resposta inesperada
          throw new Error('Unexpected response format');

        } catch (error: any) {
          lastErrorState = error;

          if (attempt >= finalConfig.maxAttempts) {
            console.error(`[RETRY] Network/unknown error after ${finalConfig.maxAttempts} attempts:`, error);

            setLastError(error);
            setIsRetrying(false);

            return {
              success: false,
              error: {
                code: 'NETWORK_ERROR',
                message: error.message || 'Network error'
              }
            };
          }

          // Retry com backoff
          const delay = Math.min(
            finalConfig.initialDelayMs * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
            finalConfig.maxDelayMs
          );

          if (finalConfig.logVerbose) {
            console.log(`[RETRY] Network error, waiting ${delay}ms before retry...`);
          }

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // Fallthrough (não deve chegar aqui)
      return {
        success: false,
        error: {
          code: 'UNKNOWN',
          message: lastErrorState?.message || 'Unknown error'
        }
      };
    },
    [finalConfig, fetchLatestVersion]
  );

  /**
   * Atualiza versão no cache (útil quando soubemos a versão recente)
   */
  const updateVersionCache = useCallback((rentalId: string, version: number) => {
    versionCacheRef.current.set(rentalId, version);
  }, []);

  /**
   * Obtém versão em cache (se existir)
   */
  const getCachedVersion = useCallback((rentalId: string): number | null => {
    return versionCacheRef.current.get(rentalId) || null;
  }, []);

  /**
   * Limpa cache de versões
   */
  const clearVersionCache = useCallback(() => {
    versionCacheRef.current.clear();
  }, []);

  return {
    // Métodos
    submitScan,
    fetchLatestVersion,
    updateVersionCache,
    getCachedVersion,
    clearVersionCache,

    // Estado
    isRetrying,
    lastError
  };
}
