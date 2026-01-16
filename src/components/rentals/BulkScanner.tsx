'use client';

/**
 * BulkScanner.tsx - Componente de scanning em lote (Modo Pistola)
 * Mobile-first, feedback háptico/sonoro, lista flutuante, alta performance
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Camera,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  X,
  Zap,
  AlertCircle,
  Clock
} from 'lucide-react';
import jsQR from 'jsqr';
import { useToast } from '@/hooks/use-toast';
import { parseEquipmentQRCode } from '@/lib/qrCodeUtils';
import { ScanFeedbackManager } from '@/lib/scanFeedbackManager';
import { useBulkScanSession } from '@/hooks/useBulkScanSession';
import { ScanQueueManager } from '@/lib/scanQueueManager';
import { useScanWithRetry } from '@/hooks/useScanWithRetry';

/**
 * Dados de um scan (para type safety)
 */
interface ScanData {
  scanType: 'checkout' | 'checkin';
  eventId: string;
  timestamp: number;
}

interface BulkScannerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (equipmentId: string, scanData: ScanData) => Promise<boolean>;
  targetQuantity?: number;
  autoStopWhenComplete?: boolean;
  eventId: string;
  scanType: 'checkout' | 'checkin';
}

export function BulkScanner({
  isOpen,
  onOpenChange,
  onScanSuccess,
  targetQuantity = 50,
  autoStopWhenComplete = true,
  eventId,
  scanType
}: BulkScannerProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanLoopRef = useRef<number | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const warmupTimestampRef = useRef<number | null>(null);
  const lastScanProcessRef = useRef<number>(0);  // ← NOVO: Para FPS limiting

  // State
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<{ equipmentId: string; time: number } | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);  // ← NOVO: Confirmação de fechamento

  // Session management
  const bulkSession = useBulkScanSession(targetQuantity);
  
  // Retry management com OCC
  const { submitScan: submitScanWithRetry, isRetrying: isRetryingOCC } = useScanWithRetry({
    maxAttempts: 3,
    initialDelayMs: 300,
    logVerbose: false
  });

  // ← NOVO: Configuração de FPS (15 FPS = ~67ms por frame)
  const MAX_FPS = 15;
  const MIN_FRAME_TIME = 1000 / MAX_FPS;

  // Inicializar sessão ao abrir
  useEffect(() => {
    if (isOpen && !bulkSession.isActive) {
      bulkSession.startSession();
    }
  }, [isOpen, bulkSession]);

  // Verificar se atingiu meta
  useEffect(() => {
    if (
      autoStopWhenComplete &&
      bulkSession.totalScans >= targetQuantity &&
      bulkSession.totalScans > 0
    ) {
      toast({
        title: '✅ Meta atingida!',
        description: `${bulkSession.totalScans}/${targetQuantity} itens escaneados`
      });

      setTimeout(() => {
        handleFinishSession();
      }, 500);
    }
  }, [bulkSession.totalScans, targetQuantity, autoStopWhenComplete, toast]);

  // Inicializar câmera
  useEffect(() => {
    if (!isOpen) return;

    let stream: MediaStream | null = null;
    let mounted = true;  // ← NOVO: Flag para evitar state updates após unmount

    const initCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        if (!mounted) return;  // ← Verificar se ainda montado

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();

          // Iniciar warmup
          warmupTimestampRef.current = Date.now();
          setHasCameraPermission(true);
          setScanError(null);

          // Iniciar loop de scanning
          scanLoop();
        }
      } catch (error) {
        if (mounted) {  // ← Verificar antes de state update
          console.error('Camera error:', error);
          setHasCameraPermission(false);
          setScanError('Câmera não disponível. Verifique as permissões.');
        }
      }
    };

    initCamera();

    return () => {
      mounted = false;  // ← Sinalizar que está desmontando
      
      // 🔒 CLEANUP CRÍTICO: Liberta RAM em Optiplex 3040
      if (scanLoopRef.current) {
        cancelAnimationFrame(scanLoopRef.current);
        scanLoopRef.current = null;
      }
      
      // Parar stream de vídeo
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
          track.dispatchEvent(new Event('stop'));  // Evento adicional de cleanup
        });
        stream = null;  // ← Desreferenciar explicitamente
      }
      
      // Limpar referências do canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      
      // Limpar referência do vídeo
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.pause();
      }
    };
  }, [isOpen]);

  /**
   * Processa QR Code detectado
   * COM suporte a retry automático em VERSION_CONFLICT (erro 409)
   * DEVE ser definido ANTES de scanLoop (hoisting)
   */
  const handleQRCodeDetected = useCallback(
    async (qrData: string) => {
      // Ignorar scans muito rápidos (throttling)
      if (lastScannedRef.current === qrData) {
        return;
      }

      if (isProcessing) return;

      setIsProcessing(true);

      try {
        // 1. Normalizar dados
        const parsed = parseEquipmentQRCode(qrData);

        if (!parsed.isValid) {
          console.warn('[BulkScanner] Invalid QR:', parsed.error);
          ScanFeedbackManager.indicateError();
          setIsProcessing(false);
          return;
        }

        const equipmentId = parsed.id;

        // 2. Adicionar à sessão (com deduplicação)
        const { success, isDuplicate } = bulkSession.addScan(equipmentId, eventId);

        if (!success) {
          if (isDuplicate) {
            console.log('[BulkScanner] Duplicate scan');
            ScanFeedbackManager.indicateWarning();
          }
          setIsProcessing(false);
          return;
        }

        // 3. 🔒 Validar com backend usando retry automático com OCC
        try {
          const scanData: ScanData = {
            scanType,
            eventId,
            timestamp: Date.now()
          };
          
          // Usar onScanSuccess se existir, senão usar submitScanWithRetry
          let scanValid: boolean;
          
          if (onScanSuccess) {
            // Modo legacy: usar callback direto
            scanValid = await onScanSuccess(equipmentId, scanData);
          } else {
            // Modo novo: usar retry automático com OCC
            const result = await submitScanWithRetry(
              'rental-id-placeholder',  // TODO: obter rentalId real
              equipmentId,
              scanType,
              1,  // TODO: obter currentVersion real
              eventId
            );
            
            scanValid = result.success;
            
            // Se VERSION_CONFLICT, retry foi feito automaticamente
            if (!result.success && result.error?.code === 'VERSION_CONFLICT') {
              toast({
                variant: 'destructive',
                title: 'Conflito de Versão',
                description: 'Outro técnico modificou este item. Tente novamente.'
              });
            }
          }

          if (scanValid) {
            // ✅ Sucesso
            lastScannedRef.current = qrData;
            setLastScanResult({ equipmentId, time: Date.now() });

            ScanFeedbackManager.indicateSuccess();

            // Auto-limpar após 2 segundos
            setTimeout(() => {
              setLastScanResult(null);
            }, 2000);
          } else {
            // ❌ Rejeição do servidor (ex: item não pertence ao evento)
            toast({
              variant: 'destructive',
              title: 'Item inválido',
              description: `${equipmentId} não pertence a este evento`
            });

            ScanFeedbackManager.indicateError();
            bulkSession.removeScan(equipmentId); // Remover se foi rejeitado
          }
        } catch (error) {
          console.error('[BulkScanner] Backend error:', error);
          toast({
            variant: 'destructive',
            title: 'Erro de sincronização',
            description: 'Tente novamente'
          });
          ScanFeedbackManager.indicateError();
          bulkSession.removeScan(equipmentId);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, bulkSession, onScanSuccess, submitScanWithRetry, scanType, eventId, toast]
  );

  /**
   * Loop principal de scanning - COM MEMOIZAÇÃO e LIMITAÇÃO DE FPS
   * useCallback garante que a função não é recriada a cada render
   */
  const scanLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      scanLoopRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const now = Date.now();
    
    // ← NOVO: Throttling de FPS - processar apenas a cada ~67ms (15 FPS)
    if (now - lastScanProcessRef.current < MIN_FRAME_TIME) {
      scanLoopRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    lastScanProcessRef.current = now;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // 🔒 jsQR processing - usar Uint8ClampedArray para melhor performance
        // jsQR internamente já otimiza, mas limitamos FPS acima para não sobrecarregar
        try {
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          // Validação de warmup
          const warmupComplete = warmupTimestampRef.current && now - warmupTimestampRef.current > 600;

          if (code && warmupComplete) {
            handleQRCodeDetected(code.data);
          }
        } catch (error) {
          // jsQR pode lançar erro em imagens muito corrompidas
          console.warn('[BulkScanner] jsQR processing error:', error);
        }
        
        // 🔒 CLEANUP: Desreferenciar imageData para liberta RAM rapidamente
        // Nota: ctx.getImageData cria uma cópia, então podemos descartar imageData.data
        // Sem isto, a Uint8ClampedArray fica na memória até GC rodar
        Object.defineProperty(imageData, 'data', {
          value: new Uint8ClampedArray(0),
          writable: false
        });
      }
    }

    scanLoopRef.current = requestAnimationFrame(scanLoop);
  }, [handleQRCodeDetected]);

  /**
   * Finaliza a sessão
   */
  const handleFinishSession = useCallback(() => {
    const summary = bulkSession.getSessionSummary();

    console.log('[BulkScanner] Session summary:', summary);

    toast({
      title: '✅ Sessão concluída',
      description: `${summary.totalQuantity} itens, ${summary.duplicates} duplicados`
    });

    bulkSession.endSession();
    onOpenChange(false);
  }, [bulkSession, toast, onOpenChange]);

  /**
   * Handler para fechar o modal COM validação
   */
  const handleRequestClose = useCallback(() => {
    const summary = bulkSession.getSessionSummary();
    
    // ← NOVO: Se há scans incompletos, pedir confirmação
    if (summary.totalQuantity < targetQuantity && summary.totalQuantity > 0) {
      setShowCloseConfirm(true);
      return;
    }
    
    bulkSession.endSession();
    onOpenChange(false);
  }, [bulkSession, targetQuantity, onOpenChange]);

  /**
   * Renderiza item recente - COM useMemo para evitar re-renders
   */
  const renderRecentItem = useCallback((item: any, index: number) => {
    return (
      <div
        key={item.id}
        className="flex items-center justify-between px-3 py-2 bg-green-50 border border-green-200 rounded"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-900">{item.equipmentId}</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {item.quantity}x
        </Badge>
      </div>
    );
  }, []);

  /**
   * Cálculo de progresso - COM useMemo para evitar recálculos desnecessários
   */
  const { progress, isComplete } = useMemo(() => ({
    progress: targetQuantity > 0 ? (bulkSession.totalScans / targetQuantity) * 100 : 0,
    isComplete: bulkSession.totalScans >= targetQuantity && targetQuantity > 0
  }), [bulkSession.totalScans, targetQuantity]);

  return (
    <>
      {/* Diálogo de confirmação de fechamento */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-80 p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="font-semibold">Fechar sem completar?</h2>
            </div>
            <p className="text-sm text-gray-600">
              Você tem {bulkSession.totalScans} de {targetQuantity} itens. Tem certeza que deseja fechar?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCloseConfirm(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setShowCloseConfirm(false);
                  bulkSession.endSession();
                  onOpenChange(false);
                }}
              >
                Fechar mesmo assim
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={handleRequestClose}>
        <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col gap-0 p-0 md:max-w-lg">
        {/* Header */}
        <DialogHeader className="border-b px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Scanning em Lote - Modo Pistola</DialogTitle>
              <DialogDescription>
                {scanType === 'checkout' ? 'Check-Out' : 'Check-In'} de equipamento
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Progresso</span>
              <span className="text-sm text-muted-foreground">
                {bulkSession.totalScans}/{targetQuantity}
              </span>
            </div>
            <Progress
              value={progress}
              className="h-2"
            />
          </div>

          {/* Status Alert */}
          {hasCameraPermission === false && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Câmera Indisponível</AlertTitle>
              <AlertDescription>
                {scanError || 'Verifique as permissões de câmera no navegador'}
              </AlertDescription>
            </Alert>
          )}

          {isComplete && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">Meta Atingida!</AlertTitle>
              <AlertDescription className="text-green-800">
                {bulkSession.totalScans} itens escaneados com sucesso
              </AlertDescription>
            </Alert>
          )}

          {bulkSession.duplicateCount > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-900">Duplicados Detectados</AlertTitle>
              <AlertDescription className="text-yellow-800">
                {bulkSession.duplicateCount} tentativas de reescanear o mesmo item
              </AlertDescription>
            </Alert>
          )}

          {/* Video/Camera Area */}
          {hasCameraPermission === true ? (
            <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                autoPlay
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Overlay com frame visual */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {/* Frame guide */}
                <div className="relative w-40 h-40 border-2 border-green-500/60 rounded-lg shadow-lg animate-pulse">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-green-500" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-green-500" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-green-500" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-green-500" />
                </div>

                {/* Last scan indicator */}
                {lastScanResult && (
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-2 rounded-full text-xs font-semibold">
                    ✓ {lastScanResult.equipmentId}
                  </div>
                )}

                {/* Processing indicator */}
                {isProcessing && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 text-white px-3 py-2 rounded-full">
                    <Zap className="h-4 w-4 animate-pulse" />
                    <span className="text-xs font-semibold">Processando...</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <Camera className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
                <p className="text-sm text-muted-foreground">Solicitando acesso à câmera...</p>
              </div>
            </div>
          )}

          {/* Recent Items */}
          {bulkSession.recentItems.length > 0 && (
            <Card className="p-3 space-y-2 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-900">
                <CheckCircle2 className="w-4 h-4" />
                Últimos Itens Lidos
              </div>
              <div className="space-y-1.5">
                {bulkSession.recentItems.map((item) => renderRecentItem(item, 0))}
              </div>
            </Card>
          )}

          {/* Session Stats */}
          <Card className="p-3 space-y-2 bg-slate-50 border-slate-200">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="font-semibold text-slate-900">{bulkSession.totalScans}</p>
                <p className="text-slate-600">Total</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{bulkSession.scannedItems.length}</p>
                <p className="text-slate-600">Únicos</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{bulkSession.duplicateCount}</p>
                <p className="text-slate-600">Duplicados</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer com botões */}
        <div className="border-t px-4 py-4 flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              bulkSession.reset();
              lastScannedRef.current = null;
            }}
            className="flex-1"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpar
          </Button>

          <Button
            onClick={handleFinishSession}
            className={`flex-1 ${isComplete ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            <span className="text-lg">✓</span>
            Finalizar ({bulkSession.totalScans}/{targetQuantity})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
