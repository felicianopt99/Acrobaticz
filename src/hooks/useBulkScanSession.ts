'use client';

/**
 * Hook: useBulkScanSession
 * Gerencia estado de uma sessão de scanning em lote (Modo Pistola)
 * Inclui: Deduplicação, throttling, histórico de últimos items
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface ScannedItem {
  id: string;
  equipmentId: string;
  eventId: string;              // ← NOVO: Para validação
  timestamp: number;
  quantity: number;
  sessionId: string;
}

export interface BulkScanSessionState {
  isActive: boolean;
  scannedItems: ScannedItem[];
  totalScans: number;
  recentItems: ScannedItem[]; // Últimos 3 items para feedback
  duplicateCount: number;
  sessionStartTime: number | null;
}

const DUPLICATE_WINDOW_MS = 1000; // Janela de 1 segundo para deduplicação
const RECENT_ITEMS_LIMIT = 3;
const THROTTLE_DELAY_MS = 150; // Throttle de 150ms entre scans

export function useBulkScanSession(targetQuantity: number = 50) {
  const [state, setState] = useState<BulkScanSessionState>({
    isActive: false,
    scannedItems: [],
    totalScans: 0,
    recentItems: [],
    duplicateCount: 0,
    sessionStartTime: null
  });

  // Set para rastrear IDs únicos e evitar duplicatas
  const duplicateTrackerRef = useRef<Map<string, number>>(new Map());
  const lastScanTimeRef = useRef<number>(0);
  const sessionIdRef = useRef<string>(generateSessionId());

  /**
   * Inicia uma nova sessão de scanning
   */
  const startSession = useCallback(() => {
    sessionIdRef.current = generateSessionId();
    duplicateTrackerRef.current.clear();
    lastScanTimeRef.current = 0;

    setState((prev) => ({
      ...prev,
      isActive: true,
      scannedItems: [],
      totalScans: 0,
      recentItems: [],
      duplicateCount: 0,
      sessionStartTime: Date.now()
    }));

    console.log('[BulkScan] Session started:', sessionIdRef.current);
  }, []);

  /**
   * Finaliza a sessão
   */
  const endSession = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false
    }));

    console.log('[BulkScan] Session ended');
  }, []);

  /**
   * Adiciona um scan à sessão (com deduplicação e throttling)
   *
   * @returns { success: boolean, isDuplicate: boolean, item?: ScannedItem }
   */
  const addScan = useCallback(
    (equipmentId: string, eventId: string): { success: boolean; isDuplicate: boolean; item?: ScannedItem } => {
      // 1. Throttling: evitar múltiplos scans muito próximos
      const now = Date.now();
      if (now - lastScanTimeRef.current < THROTTLE_DELAY_MS) {
        console.warn('[BulkScan] Scan too fast, throttled');
        return { success: false, isDuplicate: true };
      }
      lastScanTimeRef.current = now;

      // 2. Deduplicação: verificar se este ID foi scaneado recentemente
      const lastScanTime = duplicateTrackerRef.current.get(equipmentId);
      if (lastScanTime && now - lastScanTime < DUPLICATE_WINDOW_MS) {
        setState((prev) => ({
          ...prev,
          duplicateCount: prev.duplicateCount + 1
        }));
        console.log(`[BulkScan] Duplicate scan detected: ${equipmentId}`);
        return { success: false, isDuplicate: true };
      }

      // 3. Registar no tracker
      duplicateTrackerRef.current.set(equipmentId, now);

      // 4. Criar novo item
      const newItem: ScannedItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        equipmentId,
        eventId,              // ← NOVO: Incluir eventId
        timestamp: now,
        quantity: 1,
        sessionId: sessionIdRef.current
      };

      // 5. Actualizar estado
      setState((prev) => {
        const updatedItems = [...prev.scannedItems, newItem];
        const recentItems = updatedItems.slice(-RECENT_ITEMS_LIMIT);

        return {
          ...prev,
          scannedItems: updatedItems,
          totalScans: prev.totalScans + 1,
          recentItems
        };
      });

      console.log('[BulkScan] Scan added:', equipmentId);
      return { success: true, isDuplicate: false, item: newItem };
    },
    []
  );

  /**
   * Remove um scan do histórico
   */
  const removeScan = useCallback((scanId: string) => {
    setState((prev) => {
      const updatedItems = prev.scannedItems.filter((item) => item.id !== scanId);
      const recentItems = updatedItems.slice(-RECENT_ITEMS_LIMIT);

      return {
        ...prev,
        scannedItems: updatedItems,
        recentItems
      };
    });
  }, []);

  /**
   * Incrementa a quantidade de um equipamento específico
   */
  const incrementQuantity = useCallback((equipmentId: string) => {
    setState((prev) => {
      const lastItem = prev.scannedItems.find((item) => item.equipmentId === equipmentId);
      if (!lastItem) return prev;

      return {
        ...prev,
        scannedItems: prev.scannedItems.map((item) =>
          item.equipmentId === equipmentId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      };
    });
  }, []);

  /**
   * Obtém resumo da sessão
   */
  const getSessionSummary = useCallback(() => {
    const equipmentMap = new Map<string, number>();

    state.scannedItems.forEach((item) => {
      equipmentMap.set(item.equipmentId, (equipmentMap.get(item.equipmentId) || 0) + item.quantity);
    });

    return {
      sessionId: sessionIdRef.current,
      totalUniqueItems: equipmentMap.size,
      totalQuantity: state.totalScans,
      itemsList: Array.from(equipmentMap.entries()).map(([id, qty]) => ({ id, qty })),
      duplicates: state.duplicateCount,
      duration: state.sessionStartTime ? Date.now() - state.sessionStartTime : 0
    };
  }, [state.scannedItems, state.totalScans, state.sessionStartTime, state.duplicateCount]);

  /**
   * Limpa a sessão e reseta estado
   */
  const reset = useCallback(() => {
    setState({
      isActive: false,
      scannedItems: [],
      totalScans: 0,
      recentItems: [],
      duplicateCount: 0,
      sessionStartTime: null
    });
    duplicateTrackerRef.current.clear();
    lastScanTimeRef.current = 0;
  }, []);

  return {
    // State
    state,
    isActive: state.isActive,
    scannedItems: state.scannedItems,
    recentItems: state.recentItems,
    totalScans: state.totalScans,
    duplicateCount: state.duplicateCount,

    // Actions
    startSession,
    endSession,
    addScan,
    removeScan,
    incrementQuantity,
    reset,

    // Info
    getSessionSummary
  };
}

/**
 * Gera um ID único para uma sessão
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
