# 🔧 CORREÇÕES PRÁTICAS: Implementação das Recomendações

## 1️⃣ CORREÇÃO CRÍTICA #1: Schema Prisma - Bulk Scan Fields

### Ficheiro: `prisma/schema.prisma`

**Encontrar a secção (linha ~656):**
```prisma
model Rental {
  id             String        @id
  eventId        String
  equipmentId    String
  quantityRented Int
  prepStatus     String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime
  EquipmentItem  EquipmentItem @relation(fields: [equipmentId], references: [id])
  Event          Event         @relation(fields: [eventId], references: [id], onDelete: Cascade)
}
```

**Substituir por:**
```prisma
model Rental {
  id             String                 @id
  eventId        String
  equipmentId    String
  quantityRented Int
  
  // NOVOS: Suporte a bulk scanning
  scannedOut     Int                   @default(0)
  scannedIn      Int                   @default(0)
  version        Int                   @default(1)        // OCC (Optimistic Concurrency Control)
  
  prepStatus     String?
  createdAt      DateTime              @default(now())
  updatedAt      DateTime
  
  // Relations
  EquipmentItem  EquipmentItem         @relation(fields: [equipmentId], references: [id])
  Event          Event                 @relation(fields: [eventId], references: [id], onDelete: Cascade)
  EquipmentScanLog EquipmentScanLog[]
  
  // Índices otimizados para bulk scanning
  @@index([eventId, equipmentId])
  @@index([prepStatus])
  @@index([version])
}
```

**Adicionar novo model após Rental (para auditoria):**
```prisma
model EquipmentScanLog {
  id              String        @id @default(cuid())
  rentalId        String
  equipmentId     String
  userId          String?
  eventId         String
  scanType        String        // 'checkout' | 'checkin'
  status          String        // 'success' | 'error' | 'conflict'
  timestamp       DateTime      @default(now())
  ipAddress       String?
  
  Rental          Rental        @relation(fields: [rentalId], references: [id], onDelete: Cascade)
  EquipmentItem   EquipmentItem @relation(fields: [equipmentId], references: [id], onDelete: Cascade)
  Event           Event         @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  @@index([rentalId])
  @@index([equipmentId])
  @@index([timestamp])
  @@index([scanType])
  @@index([eventId])
}
```

**E adicionar relação ao model EquipmentItem:**
```prisma
model EquipmentItem {
  // ... campos existentes ...
  EquipmentScanLog EquipmentScanLog[]  // ← ADICIONAR ESTA LINHA
}
```

**E ao model Event:**
```prisma
model Event {
  // ... campos existentes ...
  EquipmentScanLog EquipmentScanLog[]  // ← ADICIONAR ESTA LINHA
}
```

### Criar Migration:
```bash
cd /media/feli/38826d41-4b6a-4f13-9e48-d9628771bfe5/AC/Acrobaticz
npx prisma migrate dev --name add_bulk_scan_fields_to_rental
```

---

## 2️⃣ CORREÇÃO CRÍTICA #2: scanQueueManager com eventId

### Ficheiro: `src/lib/scanQueueManager.ts`

**Substituir interface QueuedScan (linha ~15):**

```typescript
export interface QueuedScan {
  id: string;
  equipmentId: string;
  eventId: string;              // ← NOVO
  scanType: 'checkout' | 'checkin';
  timestamp: number;
  status: 'pending' | 'synced' | 'failed';
  attemptCount: number;
}
```

**Atualizar método addScan (linha ~40):**

```typescript
/**
 * Adiciona um scan à fila
 */
static addScan(
  equipmentId: string, 
  scanType: 'checkout' | 'checkin',
  eventId: string              // ← NOVO PARÂMETRO
): QueuedScan {
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const scan: QueuedScan = {
    id,
    equipmentId,
    eventId,                   // ← ADICIONAR
    scanType,
    timestamp: Date.now(),
    status: 'pending',
    attemptCount: 0
  };

  this.queue.set(id, scan);
  console.log(`[ScanQueue] Added scan: ${equipmentId} for event ${eventId}`, scan);

  if (!this.syncInProgress) {
    this.scheduleSyncIfNeeded();
  }

  return scan;
}
```

**Atualizar método sync (linha ~130) para enviar eventId:**

```typescript
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

  console.log(`[ScanQueue] Starting sync of ${pendingScans.length} scans...`);

  for (const scan of pendingScans) {
    try {
      const response = await fetch(`${apiEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId: scan.equipmentId,
          eventId: scan.eventId,           // ← ADICIONAR (era passado separadamente)
          scanType: scan.scanType,
          timestamp: scan.timestamp
        })
      });

      if (response.ok) {
        this.markSynced(scan.id);
        result.synced++;
        console.log(`[ScanQueue] Synced: ${scan.equipmentId} in event ${scan.eventId}`);
      } else {
        this.markFailed(scan.id);
        result.failed++;
        result.errors.push({
          scanId: scan.id,
          error: `HTTP ${response.status}`
        });
      }
    } catch (error) {
      this.markFailed(scan.id);
      result.failed++;
      result.errors.push({
        scanId: scan.id,
        error: String(error)
      });
    }
  }

  this.syncInProgress = false;
  return result;
}
```

---

## 3️⃣ CORREÇÃO ALTA: BulkScanner.tsx - Tipos e Validação

### Ficheiro: `src/components/rentals/BulkScanner.tsx`

**Adicionar interface (linha ~30, antes de BulkScannerProps):**

```typescript
interface ScanData {
  scanType: 'checkout' | 'checkin';
  eventId: string;
  timestamp: number;
}
```

**Atualizar BulkScannerProps (linha ~33):**

```typescript
interface BulkScannerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (equipmentId: string, scanData: ScanData) => Promise<boolean>;  // ← Remover `any`
  targetQuantity?: number;
  autoStopWhenComplete?: boolean;
  eventId: string;
  scanType: 'checkout' | 'checkin';
}
```

**Atualizar chamada ao addScan (linha ~195, método handleQRCodeDetected):**

```typescript
// Antes (linha ~195):
const { success, isDuplicate } = bulkSession.addScan(equipmentId);

// Depois:
// O useBulkScanSession não precisa de eventId para dedup local
// eventId é adicionado apenas ao scanQueueManager para batch sync
const { success, isDuplicate } = bulkSession.addScan(equipmentId);
```

**Adicionar validação de completude (linha ~400, antes do handleFinishSession):**

```typescript
/**
 * Valida se técnico pode fechar modal
 */
const canClose = useCallback((): boolean => {
  if (bulkSession.totalScans < targetQuantity && targetQuantity > 0) {
    const remainingCount = targetQuantity - bulkSession.totalScans;
    
    return window.confirm(
      `⚠️ AVISO: Faltam ${remainingCount} items para atingir a meta de ${targetQuantity}.\n\n` +
      `Clique OK para sair mesmo assim, ou Cancelar para continuar escaneando.`
    );
  }
  return true;
}, [bulkSession.totalScans, targetQuantity]);
```

**Atualizar botão X (linha ~490):**

```typescript
// Antes:
<Button
  variant="ghost"
  size="icon"
  onClick={() => onOpenChange(false)}
  className="h-8 w-8"
>
  <X className="h-4 w-4" />
</Button>

// Depois:
<Button
  variant="ghost"
  size="icon"
  onClick={() => {
    if (canClose()) {
      bulkSession.endSession();
      onOpenChange(false);
    }
  }}
  className="h-8 w-8"
>
  <X className="h-4 w-4" />
</Button>
```

---

## 4️⃣ CORREÇÃO ALTA: Performance - FPS Limiting

### Ficheiro: `src/components/rentals/BulkScanner.tsx`

**Atualizar scanLoop (linha ~160) para throttling baseado em tempo:**

```typescript
const scanLoop = useCallback(() => {
  if (!videoRef.current || !canvasRef.current) {
    scanLoopRef.current = requestAnimationFrame(scanLoop);
    return;
  }

  const video = videoRef.current;
  const canvas = canvasRef.current;

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    // OTIMIZAÇÃO: Processar apenas a cada 100ms (~10 FPS para QR processing)
    const now = Date.now();
    const lastProcessTime = (scanLoopRef.current as any)?.lastProcessTime || 0;
    
    if (now - lastProcessTime >= 100) {  // 100ms = ~10 FPS
      (scanLoopRef.current as any) = { lastProcessTime: now };
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        scanLoopRef.current = requestAnimationFrame(scanLoop);
        return;
      }

      // Reduzir resolução para performance
      const maxWidth = 480;  // 480px é suficiente para QR codes
      const ratio = video.videoHeight / video.videoWidth;
      const scaledWidth = maxWidth;
      const scaledHeight = Math.round(maxWidth * ratio);

      canvas.width = scaledWidth;
      canvas.height = scaledHeight;

      ctx.drawImage(video, 0, 0, scaledWidth, scaledHeight);
      const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      const warmupComplete = warmupTimestampRef.current && now - warmupTimestampRef.current > 600;

      if (code && warmupComplete) {
        handleQRCodeDetected(code.data);
      }
    }
  }

  scanLoopRef.current = requestAnimationFrame(scanLoop);
}, []);
```

---

## 5️⃣ CORREÇÃO MÉDIA: Criar Endpoint API para Bulk Scan

### Ficheiro: `src/app/api/rentals/scan-batch/route.ts` (MOVER de EXAMPLE_API_SCAN_BATCH.ts)

**Conteúdo:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

interface ScanItem {
  equipmentId: string;
  scanType: 'checkout' | 'checkin';
  eventId: string;
  timestamp: number;
}

interface BatchScanRequest {
  scans: ScanItem[];
}

interface ScanError {
  equipmentId: string;
  error: string;
}

interface BatchScanResponse {
  success: boolean;
  processed: number;
  failed: number;
  errors: ScanError[];
}

export async function POST(req: NextRequest): Promise<NextResponse<BatchScanResponse>> {
  try {
    // 1. Autenticação
    const user = await requirePermission(req, 'canManageEquipment');

    // 2. Validar request
    const body = await req.json() as BatchScanRequest;
    if (!body.scans || !Array.isArray(body.scans) || body.scans.length === 0) {
      return NextResponse.json(
        { success: false, processed: 0, failed: 0, errors: [] },
        { status: 400 }
      );
    }

    // 3. Processar cada scan
    const response: BatchScanResponse = {
      success: true,
      processed: 0,
      failed: 0,
      errors: []
    };

    for (const scan of body.scans) {
      try {
        // Validar campos
        if (!scan.equipmentId || !scan.scanType || !scan.eventId) {
          throw new Error('Missing required fields');
        }

        // Buscar rental
        const rental = await prisma.rental.findFirst({
          where: {
            equipmentId: scan.equipmentId,
            eventId: scan.eventId
          }
        });

        if (!rental) {
          throw new Error(`Equipment not in event ${scan.eventId}`);
        }

        // Validar quantidade
        const fieldName = scan.scanType === 'checkout' ? 'scannedOut' : 'scannedIn';
        const currentValue = rental[fieldName as keyof typeof rental] as number;
        
        if (currentValue >= rental.quantityRented) {
          throw new Error(`Already fully ${scan.scanType}ed`);
        }

        // ATUALIZAR com OCC (Optimistic Concurrency Control)
        const updated = await prisma.rental.update({
          where: { 
            id: rental.id,
            version: rental.version  // ← Garante que versão corresponde
          },
          data: {
            [fieldName]: currentValue + 1,
            version: { increment: 1 },  // ← Incrementa versão
            updatedAt: new Date()
          }
        });

        // LOG de sucesso
        try {
          await prisma.equipmentScanLog.create({
            data: {
              rentalId: rental.id,
              equipmentId: scan.equipmentId,
              userId: user.userId,
              eventId: scan.eventId,
              scanType: scan.scanType,
              status: 'success',
              timestamp: new Date(scan.timestamp),
              ipAddress: req.headers.get('x-forwarded-for') || undefined
            }
          });
        } catch (logError) {
          console.warn('[ScanBatch] Failed to log scan:', logError);
          // Não falhar o scan se logging falhar
        }

        response.processed++;
        console.log(`[ScanBatch] Processed: ${scan.equipmentId} (${scan.scanType})`);

      } catch (error) {
        response.success = false;
        response.failed++;
        response.errors.push({
          equipmentId: scan.equipmentId,
          error: error instanceof Error ? error.message : String(error)
        });
        console.warn(`[ScanBatch] Error: ${scan.equipmentId}`, error);
      }
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('[ScanBatch] Request error:', error);
    return NextResponse.json(
      {
        success: false,
        processed: 0,
        failed: 0,
        errors: [{ equipmentId: 'N/A', error: 'Server error' }]
      },
      { status: 500 }
    );
  }
}
```

---

## 6️⃣ INTEGRAÇÃO EM RentalPrepPage.tsx

### Ficheiro: `src/app/rentals/[id]/prep/page.tsx`

**Adicionar import:**
```typescript
import { BulkScanner } from '@/components/rentals/BulkScanner';
```

**Adicionar state para modal:**
```typescript
const [isBulkScannerOpen, setIsBulkScannerOpen] = useState(false);
```

**Implementar handler:**
```typescript
const handleScanSuccess = async (equipmentId: string, scanData: { scanType: 'checkout' | 'checkin'; eventId: string; timestamp: number }): Promise<boolean> => {
  try {
    // Validar que equipmentId existe na prepList
    const listToUpdate = scanData.scanType === 'checkout' ? prepList : checkInList;
    const itemIndex = listToUpdate.findIndex(item => item.equipmentId === equipmentId);

    if (itemIndex === -1) {
      // Item não pertence a este evento
      return false;
    }

    // Enviar para fila local (será sincronizado em batch)
    const scan = ScanQueueManager.addScan(equipmentId, scanData.scanType, eventId);
    console.log('[RentalPrep] Scan enqueued:', scan);

    // Atualizar UI local otimisticamente
    const setList = scanData.scanType === 'checkout' ? setPrepList : setCheckInList;
    setList(currentList => {
      const newList = [...currentList];
      const item = newList[itemIndex];
      if (item.scannedQuantity < item.quantity) {
        newList[itemIndex] = {
          ...item,
          scannedQuantity: item.scannedQuantity + 1
        };
      }
      return newList;
    });

    return true;

  } catch (e) {
    console.error('[RentalPrep] Scan validation error:', e);
    return false;
  }
};
```

**Adicionar botão para abrir BulkScanner:**
```tsx
<Button onClick={() => setIsBulkScannerOpen(true)}>
  <BarChart3 className="mr-2 h-4 w-4" />
  Modo Bulk Scan (Pistola)
</Button>
```

**Adicionar componente:**
```tsx
<BulkScanner
  isOpen={isBulkScannerOpen}
  onOpenChange={setIsBulkScannerOpen}
  onScanSuccess={handleScanSuccess}
  targetQuantity={totalCheckoutNeeded}
  autoStopWhenComplete={true}
  eventId={eventId}
  scanType="checkout"
/>
```

**Adicionar botão de sincronização (opcional, para manual sync):**
```typescript
const handleManualSync = async () => {
  toast({ title: "Syncing...", description: "Enviando scans acumulados..." });
  const result = await ScanQueueManager.sync('/api/rentals/scan-batch');
  
  if (result.success) {
    toast({ title: "✅ Sincronizado", description: `${result.synced} scans enviados` });
  } else {
    toast({ 
      variant: "destructive",
      title: "❌ Sync Falhou", 
      description: `${result.failed} scans não sincronizados`
    });
  }
};

<Button onClick={handleManualSync} variant="outline">
  <Cloud className="mr-2 h-4 w-4" />
  Sincronizar Agora ({ScanQueueManager.getStats().pending})
</Button>
```

---

## ✅ CHECKLIST DE APLICAÇÃO

- [ ] Editar `prisma/schema.prisma` (adicionar scannedOut, scannedIn, version, EquipmentScanLog)
- [ ] Executar `npx prisma migrate dev --name add_bulk_scan_fields_to_rental`
- [ ] Executar `npx prisma generate`
- [ ] Atualizar `src/lib/scanQueueManager.ts` (adicionar eventId)
- [ ] Atualizar `src/components/rentals/BulkScanner.tsx` (tipos, FPS limiting, validação)
- [ ] Criar `src/app/api/rentals/scan-batch/route.ts`
- [ ] Integrar BulkScanner em RentalPrepPage
- [ ] Testar com curl:
  ```bash
  curl -X POST http://localhost:3000/api/rentals/scan-batch \
    -H "Content-Type: application/json" \
    -d '{
      "scans": [
        {
          "equipmentId": "eq-123",
          "scanType": "checkout",
          "eventId": "event-1",
          "timestamp": 1705412400000
        }
      ]
    }'
  ```
- [ ] Testar em browser (abrir modal, verificar que usa câmara)
- [ ] Testar offline (desabilitar Wi-Fi, escanear, reconectar)
- [ ] Testar race conditions (2+ técnicos simultâneos)

