/**
 * Scan Queue Manager - Gerenciamento de fila de sincronização
 * Permite acumular scans localmente e sincronizar com backend
 * Com PERSISTÊNCIA via localStorage
 */

export interface QueuedScan {
  id: string;
  equipmentId: string;
  eventId: string;              // ← NOVO
  scanType: 'checkout' | 'checkin';
  timestamp: number;
  status: 'pending' | 'synced' | 'failed';
  attemptCount: number;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{ scanId: string; error: string }>;
}

export class ScanQueueManager {
  private static queue: Map<string, QueuedScan> = new Map();
  private static syncInProgress = false;
  private static maxRetries = 3;
  private static syncInterval = 5000; // Sync a cada 5 segundos
  private static syncTimer: NodeJS.Timeout | null = null;
  private static readonly STORAGE_KEY = 'acrobaticz_scan_queue_v2';
  private static initialized = false;

  /**
   * Carrega a fila do localStorage (para persistência após crash/refresh)
   */
  private static loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const scans = JSON.parse(stored) as QueuedScan[];
        this.queue.clear();
        scans.forEach(scan => {
          this.queue.set(scan.id, scan);
        });
        console.log(`[ScanQueue] 💾 Loaded ${scans.length} scans from localStorage`);
      }
    } catch (e) {
      console.warn('[ScanQueue] Failed to load from localStorage:', e);
    }
  }

  /**
   * Salva a fila no localStorage (para persistência)
   */
  private static saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const scans = Array.from(this.queue.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scans));
    } catch (e) {
      console.warn('[ScanQueue] Failed to save to localStorage:', e);
    }
  }

  /**
   * Inicializa o manager (carrega dados persistidos)
   * IMPORTANTE: Chamar uma vez no startup da app
   */
  static initialize(): void {
    if (this.initialized) return;
    this.loadFromStorage();
    this.initialized = true;
  }

  /**
   * Adiciona um scan à fila
   */
  static addScan(
    equipmentId: string, 
    scanType: 'checkout' | 'checkin',
    eventId: string                    // ← NOVO
  ): QueuedScan {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const scan: QueuedScan = {
      id,
      equipmentId,
      eventId,                         // ← NOVO
      scanType,
      timestamp: Date.now(),
      status: 'pending',
      attemptCount: 0
    };

    this.queue.set(id, scan);
    this.saveToStorage();              // ← PERSISTIR
    console.log(`[ScanQueue] ➕ Added: ${equipmentId} (event: ${eventId})`);

    // Auto-iniciar sync se não estiver a correr
    if (!this.syncInProgress) {
      this.scheduleSyncIfNeeded();
    }

    return scan;
  }

  /**
   * Obtém todos os scans pendentes
   */
  static getPendingScans(): QueuedScan[] {
    return Array.from(this.queue.values()).filter((s) => s.status === 'pending');
  }

  /**
   * Obtém todos os scans
   */
  static getAllScans(): QueuedScan[] {
    return Array.from(this.queue.values());
  }

  /**
   * Obtém um scan específico
   */
  static getScan(id: string): QueuedScan | undefined {
    return this.queue.get(id);
  }

  /**
   * Marca um scan como sincronizado
   */
  static markSynced(id: string): void {
    const scan = this.queue.get(id);
    if (scan) {
      scan.status = 'synced';
      this.saveToStorage();            // ← PERSISTIR
      console.log(`[ScanQueue] ✅ Marked as synced: ${id}`);
    }
  }

  /**
   * Marca um scan como falhado
   */
  static markFailed(id: string): void {
    const scan = this.queue.get(id);
    if (scan) {
      scan.attemptCount++;
      if (scan.attemptCount >= this.maxRetries) {
        scan.status = 'failed';
        this.saveToStorage();          // ← PERSISTIR
        console.error(`[ScanQueue] ❌ Max retries reached for: ${id}`);
      } else {
        this.saveToStorage();          // ← PERSISTIR
      }
    }
  }

  /**
   * Sincroniza com o servidor
   * Chama a API para enviar todos os scans pendentes
   */
  static async sync(apiEndpoint: string): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('[ScanQueue] Sync already in progress');
      return { success: false, synced: 0, failed: 0, errors: [] };
    }

    this.syncInProgress = true;
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] };

    const pendingScans = this.getPendingScans();
    if (pendingScans.length === 0) {
      console.log('[ScanQueue] No pending scans to sync');
      this.syncInProgress = false;
      return result;
    }

    console.log(`[ScanQueue] 🔄 Starting sync of ${pendingScans.length} scans...`);

    // Agrupar scans por eventId para optimizar requisições
    const scansByEvent = new Map<string, QueuedScan[]>();
    pendingScans.forEach(scan => {
      if (!scansByEvent.has(scan.eventId)) {
        scansByEvent.set(scan.eventId, []);
      }
      scansByEvent.get(scan.eventId)!.push(scan);
    });

    // Processar cada grupo de scans
    for (const [eventId, scans] of scansByEvent) {
      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            scans: scans.map(s => ({
              equipmentId: s.equipmentId,
              scanType: s.scanType,
              timestamp: s.timestamp
            }))
          })
        });

        if (response.ok) {
          const data = await response.json();
          
          // Processar resposta do servidor
          if (data.successful) {
            data.successful.forEach((equipmentId: string) => {
              const scan = scans.find(s => s.equipmentId === equipmentId);
              if (scan) {
                this.markSynced(scan.id);
                result.synced++;
              }
            });
          }
          
          if (data.failed) {
            data.failed.forEach((item: any) => {
              const scan = scans.find(s => s.equipmentId === item.equipmentId);
              if (scan) {
                if (item.error === 'VERSION_CONFLICT') {
                  // OCC conflict - refetch and retry
                  scan.attemptCount = Math.max(0, scan.attemptCount - 1);
                } else {
                  this.markFailed(scan.id);
                }
                result.failed++;
                result.errors.push({
                  scanId: scan.id,
                  error: item.error || 'Unknown error'
                });
              }
            });
          }

          console.log(`[ScanQueue] ✅ Synced event ${eventId}: ${result.synced} success, ${result.failed} failures`);
        } else {
          // Erro HTTP - marcar todos como failed
          const errorData = await response.json().catch(() => ({}));
          scans.forEach(scan => {
            this.markFailed(scan.id);
            result.failed++;
            result.errors.push({
              scanId: scan.id,
              error: `HTTP ${response.status}: ${errorData.message || 'Server error'}`
            });
          });
          console.error(`[ScanQueue] ❌ HTTP ${response.status} for event ${eventId}`);
        }
      } catch (error) {
        scans.forEach(scan => {
          this.markFailed(scan.id);
          result.failed++;
          result.errors.push({
            scanId: scan.id,
            error: `Network error: ${error instanceof Error ? error.message : 'Unknown'}`
          });
        });
        console.error('[ScanQueue] Network error:', error);
      }
    }

    this.syncInProgress = false;
    this.saveToStorage();             // ← PERSISTIR após sync
    
    if (result.synced > 0) {
      console.log(`[ScanQueue] 🎉 Sync complete: ${result.synced} synced, ${result.failed} failed`);
    }

    return result;
  }

  /**
   * Limpa scans sincronizados
   */
  static clearSynced(): void {
    const before = this.queue.size;
    for (const [id, scan] of Array.from(this.queue.entries())) {
      if (scan.status === 'synced') {
        this.queue.delete(id);
      }
    }
    const after = this.queue.size;
    if (before !== after) {
      this.saveToStorage();
      console.log(`[ScanQueue] 🗑️ Cleared ${before - after} synced scans`);
    }
  }

  /**
   * Agenda a próxima sincronização
   */
  private static scheduleSyncIfNeeded(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    if (this.getPendingScans().length > 0) {
      this.syncTimer = setTimeout(() => {
        console.log('[ScanQueue] Auto-sync scheduled');
      }, this.syncInterval);
    }
  }

  /**
   * Limpa toda a fila
   */
  static clear(): void {
    this.queue.clear();
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }
    this.saveToStorage();
    console.log('[ScanQueue] Queue cleared');
  }

  /**
   * Obtém estatísticas da fila
   */
  static getStats() {
    const all = Array.from(this.queue.values());
    return {
      total: all.length,
      pending: all.filter((s) => s.status === 'pending').length,
      synced: all.filter((s) => s.status === 'synced').length,
      failed: all.filter((s) => s.status === 'failed').length
    };
  }

  /**
   * Debug: Mostra estado atual da fila
   */
  static debug(): void {
    console.group('[ScanQueue] Debug Info');
    console.log('Stats:', this.getStats());
    console.log('Queue:', Array.from(this.queue.values()));
    console.groupEnd();
  }
}
