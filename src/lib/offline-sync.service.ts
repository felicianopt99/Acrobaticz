/**
 * Offline Sync Service - Mobile App
 * 
 * Permite operação offline com:
 * 1. IndexedDB para glossário + nomes traduzidos
 * 2. Service Worker com sync automático
 * 3. Download de glossário na init
 * 4. Tradução instantânea via localStorage
 */

import { glossaryService } from '@/lib/glossary.service';
import type { Language } from '@/types/translation.types';

interface OfflineGlossaryData {
  version: number;
  checksum: string;
  terms: any[];
  lastSync: number;
  expiresAt: number;
}

/**
 * Serviço de Sincronização Offline
 * 
 * Client-side: usa IndexedDB (browser)
 * Server-side: prepara dados para download
 */
export class OfflineSyncService {
  private static instance: OfflineSyncService;
  private dbName = 'AcrobaticzL10N';
  private glossaryStore = 'glossary_data';
  private db: IDBDatabase | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeIndexedDB();
    }
  }

  static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService();
    }
    return OfflineSyncService.instance;
  }

  /**
   * Inicializa IndexedDB (client-side)
   */
  private initializeIndexedDB(): void {
    if (typeof window === 'undefined') return;

    const request = indexedDB.open(this.dbName, 1);

    request.onerror = () => {
      console.error('[OfflineSync] Failed to open IndexedDB:', request.error);
    };

    request.onsuccess = () => {
      this.db = request.result;
      console.log('[OfflineSync] IndexedDB initialized');
    };

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;

      // Cria stores
      if (!db.objectStoreNames.contains(this.glossaryStore)) {
        const store = db.createObjectStore(this.glossaryStore, { keyPath: 'id' });
        store.createIndex('language', 'language', { unique: false });
        store.createIndex('checksum', 'checksum', { unique: true });
      }
    };
  }

  /**
   * Download de glossário completo (executado na init da app)
   */
  async downloadGlossaryForOfflineSync(): Promise<OfflineGlossaryData> {
    try {
      // 1. Obtém glossário do servidor
      const glossaryData = await glossaryService.exportForOfflineSync();

      // 2. Armazena em IndexedDB (se disponível)
      if (typeof window !== 'undefined' && this.db) {
        await this.storeGlossaryInIndexedDB(glossaryData);
      }

      // 3. Armazena em localStorage como fallback
      const localStorageData: OfflineGlossaryData = {
        version: glossaryData.version,
        checksum: glossaryData.checksum,
        terms: glossaryData.terms,
        lastSync: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h TTL
      };

      localStorage.setItem(
        'acrobaticz_glossary_offline',
        JSON.stringify(localStorageData)
      );

      console.log(
        `[OfflineSync] ✅ Downloaded glossary: ${glossaryData.terms.length} terms, checksum=${glossaryData.checksum}`
      );

      return localStorageData;
    } catch (err) {
      console.error('[OfflineSync] Failed to download glossary:', err);

      // Retorna glossário em cache se falhar
      const cached = localStorage.getItem('acrobaticz_glossary_offline');
      if (cached) {
        return JSON.parse(cached);
      }

      throw err;
    }
  }

  /**
   * Armazena glossário no IndexedDB
   */
  private async storeGlossaryInIndexedDB(data: any): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([this.glossaryStore], 'readwrite');
      const store = tx.objectStore(this.glossaryStore);

      // Limpa dados antigos
      store.clear();

      // Adiciona novo glossário
      for (const term of data.terms) {
        store.add({
          id: `${term.language}:${term.sourceText}`,
          ...term,
          syncedAt: Date.now(),
        });
      }

      tx.oncomplete = () => {
        console.log('[OfflineSync] Glossary stored in IndexedDB');
        resolve();
      };

      tx.onerror = () => {
        console.error('[OfflineSync] Failed to store glossary:', tx.error);
        reject(tx.error);
      };
    });
  }

  /**
   * Tradução instantânea offline (usa localStorage/IndexedDB)
   */
  async translateOffline(
    text: string,
    language: Language
  ): Promise<string | null> {
    // 1. Tenta IndexedDB
    if (this.db) {
      const result = await this.lookupInIndexedDB(text, language);
      if (result) return result;
    }

    // 2. Tenta localStorage (fallback)
    const result = this.lookupInLocalStorage(text, language);
    if (result) return result;

    // 3. Se não encontrou: retorna null (deixar em inglês)
    return null;
  }

  /**
   * Busca em IndexedDB
   */
  private lookupInIndexedDB(
    text: string,
    language: Language
  ): Promise<string | null> {
    if (!this.db) return Promise.resolve(null);

    return new Promise((resolve) => {
      const tx = this.db!.transaction([this.glossaryStore], 'readonly');
      const store = tx.objectStore(this.glossaryStore);
      const index = store.index('language');

      const request = index.getAll(language);

      request.onsuccess = () => {
        const terms = request.result;
        const match = terms.find(
          t => t.sourceText.toLowerCase() === text.toLowerCase()
        );
        resolve(match ? match.translatedText : null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  }

  /**
   * Busca em localStorage (fallback rápido)
   */
  private lookupInLocalStorage(
    text: string,
    language: Language
  ): string | null {
    try {
      const cached = localStorage.getItem('acrobaticz_glossary_offline');
      if (!cached) return null;

      const data: OfflineGlossaryData = JSON.parse(cached);

      // Verifica expiração
      if (Date.now() > data.expiresAt) {
        localStorage.removeItem('acrobaticz_glossary_offline');
        return null;
      }

      // Busca termo
      const term = data.terms.find(
        t =>
          t.language === language &&
          t.sourceText.toLowerCase() === text.toLowerCase()
      );

      return term ? term.translatedText : null;
    } catch (err) {
      console.error('[OfflineSync] Error looking up in localStorage:', err);
      return null;
    }
  }

  /**
   * Valida integridade do glossário
   */
  async validateGlossaryChecksum(): Promise<boolean> {
    try {
      const cached = localStorage.getItem('acrobaticz_glossary_offline');
      if (!cached) return false;

      const data: OfflineGlossaryData = JSON.parse(cached);

      // Recalcula checksum
      const currentChecksum = this.calculateChecksum(JSON.stringify(data.terms));

      if (currentChecksum !== data.checksum) {
        console.warn(
          '[OfflineSync] Checksum mismatch! Glossary may be corrupted'
        );
        return false;
      }

      return true;
    } catch (err) {
      console.error('[OfflineSync] Checksum validation failed:', err);
      return false;
    }
  }

  /**
   * Calcula checksum dos dados
   */
  private calculateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Limpa dados offline (manual cleanup)
   */
  async clearOfflineData(): Promise<void> {
    // localStorage
    localStorage.removeItem('acrobaticz_glossary_offline');

    // IndexedDB
    if (this.db) {
      const tx = this.db.transaction([this.glossaryStore], 'readwrite');
      tx.objectStore(this.glossaryStore).clear();
    }

    console.log('[OfflineSync] Cleared all offline data');
  }

  /**
   * Obtém status de sincronização
   */
  getOfflineSyncStatus(): {
    hasOfflineData: boolean;
    lastSync: number | null;
    expiresAt: number | null;
    termCount: number;
    checksum: string | null;
  } {
    try {
      const cached = localStorage.getItem('acrobaticz_glossary_offline');
      if (!cached) {
        return {
          hasOfflineData: false,
          lastSync: null,
          expiresAt: null,
          termCount: 0,
          checksum: null,
        };
      }

      const data: OfflineGlossaryData = JSON.parse(cached);

      return {
        hasOfflineData: true,
        lastSync: data.lastSync,
        expiresAt: data.expiresAt,
        termCount: data.terms.length,
        checksum: data.checksum,
      };
    } catch (err) {
      return {
        hasOfflineData: false,
        lastSync: null,
        expiresAt: null,
        termCount: 0,
        checksum: null,
      };
    }
  }

  /**
   * Hook para executar na inicialização da app
   * Carrega glossário em background se online
   */
  async initializeOfflineSync(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Carrega glossário existente do localStorage
      const existing = localStorage.getItem('acrobaticz_glossary_offline');
      if (existing) {
        const data: OfflineGlossaryData = JSON.parse(existing);

        // Se expirou: baixa novo
        if (Date.now() > data.expiresAt) {
          console.log('[OfflineSync] Glossary expired, downloading new...');
          await this.downloadGlossaryForOfflineSync();
        } else {
          console.log(
            `[OfflineSync] Using cached glossary (expires in ${Math.round((data.expiresAt - Date.now()) / 1000)}s)`
          );
        }
      } else {
        // Primeiro carregamento
        console.log('[OfflineSync] First load, downloading glossary...');
        await this.downloadGlossaryForOfflineSync();
      }

      // Registra Service Worker para sync em background
      if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker) {
        navigator.serviceWorker.ready.then(reg => {
          const registration = reg as any;
          if (registration.sync) {
            registration.sync.register('sync-glossary').catch((err: any) =>
              console.warn('[OfflineSync] Failed to register sync tag:', err)
            );
          }
        });
      }
    } catch (err) {
      console.error('[OfflineSync] Initialization failed:', err);
    }
  }
}

export const offlineSyncService = OfflineSyncService.getInstance();

/**
 * Hook para usar em componentes React
 * Exemplo: const translated = await useOfflineTranslation('Equipment', 'pt');
 */
export function useOfflineTranslation() {
  return async (text: string, language: Language = 'pt'): Promise<string> => {
    const service = OfflineSyncService.getInstance();
    const result = await service.translateOffline(text, language);
    return result || text; // Fallback: retorna original se não traduzido
  };
}
