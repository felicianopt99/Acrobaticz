# 🎯 GUIA PRÁTICO: OCC COM RETRY AUTOMÁTICO

## Sintaxe Prisma Correta para Increment

### ❌ ERRADO (não funciona em updateMany)
```typescript
data: {
  version: { increment: 1 }  // ← Syntax error em updateMany
}
```

### ✅ CORRETO (usado na implementação)
```typescript
const newVersion = rental.version + 1;
const updateResult = await tx.rental.updateMany({
  where: { id, version: rental.version },
  data: {
    version: newVersion,  // ← Valor directo, não increment
    scannedOut: currentValue + 1,
    updatedAt: new Date()
  }
});
```

---

## Uso do Hook useScanWithRetry

### Exemplo Básico
```typescript
import { useScanWithRetry } from '@/hooks/useScanWithRetry';

export function ScanComponent() {
  const { submitScan, isRetrying, lastError } = useScanWithRetry();

  const handleScan = async (equipmentId: string) => {
    const result = await submitScan(
      'rental-123',        // rentalId
      equipmentId,
      'checkout',          // scanType
      1,                   // currentVersion (obtém do estado)
      'event-456'          // eventId
    );

    if (result.success) {
      console.log('✅ Scan bem-sucedido');
    } else {
      console.log('❌ Falha após retries:', result.error);
    }
  };

  return (
    <>
      <button onClick={() => handleScan('eq-123')}>
        Scan Equipment
      </button>
      {isRetrying && <p>🔄 Sincronizando...</p>}
    </>
  );
}
```

### Com Configuração Customizada
```typescript
const { submitScan } = useScanWithRetry({
  maxAttempts: 5,           // Até 5 retries
  initialDelayMs: 500,      // Começar com 500ms
  maxDelayMs: 3000,         // Máximo 3 segundos
  logVerbose: true          // Debug console.log
});
```

---

## Fluxo de Retry Automático

```
Cliente A faz Scan (version=1)
  ↓
DB: UPDATE Rental SET version=2 WHERE id=rental-123 AND version=1
  ↓
✅ SUCCESS (count=1)
  └─ Cliente A recebe: { success: true, newVersion: 2 }

Cliente B faz Scan simultâneamente (version=1, mas DB já é 2)
  ↓
DB: UPDATE Rental SET version=2 WHERE id=rental-123 AND version=1
  ↓
❌ CONFLITO (count=0) → Lança erro 409
  ↓
Hook detecta VERSION_CONFLICT
  ↓
Hook faz fetch: GET /api/rentals/rental-123/version
  ↓
Retorna: { version: 2 }
  ↓
Hook aguarda 300ms (backoff)
  ↓
Hook retry com version=2
  ↓
DB: UPDATE Rental SET version=3 WHERE id=rental-123 AND version=2
  ↓
✅ SUCCESS (count=1)
  └─ Cliente B recebe: { success: true, newVersion: 3 }
```

---

## API Response Format

### Sucesso
```json
{
  "success": true,
  "processed": 1,
  "failed": 0,
  "errors": [],
  "timestamp": 1705382400000
}
```

### Conflito de Versão (Trigger Retry)
```json
{
  "success": false,
  "processed": 0,
  "failed": 1,
  "errors": [
    {
      "equipmentId": "eq-123",
      "error": "Version conflict - rental was modified by another user",
      "code": "VERSION_CONFLICT"
    }
  ],
  "timestamp": 1705382400000
}
```

### Outros Erros (Sem Retry)
```json
{
  "success": false,
  "processed": 0,
  "failed": 1,
  "errors": [
    {
      "equipmentId": "eq-456",
      "error": "Equipment not found in event",
      "code": "NOT_FOUND"
    }
  ]
}
```

---

## Debugging

### Ativar Logging Detalhado
```typescript
// No hook
useScanWithRetry({ logVerbose: true })

// Saída no console:
// [RETRY] Attempt 1/3 for eq-123 (scanType=checkout, version=1)
// [RETRY] Version conflict (current=1). Fetching latest version...
// [RETRY] Fetched latest version for rental-123: 2
// [RETRY] Waiting 300ms before retry...
// [RETRY] Attempt 2/3 for eq-123 (scanType=checkout, version=2)
// [RETRY] ✅ Scan successful on attempt 2
```

### Ver Histórico de Scans
```typescript
// Query do histórico via API
fetch('/api/equipment/eq-123/scan-history')
  .then(r => r.json())
  .then(data => {
    data.history.forEach(log => {
      console.log(`${log.scanType} by ${log.User.name} at ${log.timestamp}`);
    });
  });
```

### Monitorar Conflitos
```typescript
// Adicionar ao dashboard
const conflictCount = await prisma.equipmentScanLog.count({
  where: { status: 'conflict' }
});

console.log(`Conflitos detectados hoje: ${conflictCount}`);
```

---

## Performance Tuning

### Reduzir FPS Ainda Mais (Baixo-end)
```typescript
// Em BulkScanner.tsx
const MAX_FPS = 10;  // ← Reduzir para 10 FPS
const MIN_FRAME_TIME = 1000 / MAX_FPS;  // 100ms
```

### Aumentar Retry Attempts
```typescript
useScanWithRetry({
  maxAttempts: 5,  // ← Para redes instáveis
  backoffMultiplier: 2  // ← Crescimento mais lento
})
```

### Aumentar Timeout de Transação
```typescript
// Em scan-batch/route.ts
await prisma.$transaction(
  async (tx) => { /* ... */ },
  {
    isolationLevel: 'Serializable',
    timeout: 10000  // ← Aumentar para 10s se muitos conflitos
  }
);
```

---

## Problemas Conhecidos & Soluções

### Problema: "VERSION_CONFLICT" repetindo
**Causa:** Múltiplos clientes atualizando continuamente  
**Solução:** Aumentar `maxAttempts` e `maxDelayMs`
```typescript
useScanWithRetry({
  maxAttempts: 5,
  maxDelayMs: 5000
})
```

### Problema: Timeout "5000ms exceeded"
**Causa:** Muitas transações simultâneas bloqueiam  
**Solução:** Aumentar timeout ou distribuir load
```typescript
// scan-batch/route.ts
timeout: 15000  // ← Aumentar conforme carga
```

### Problema: RAM 300MB+ em BulkScanner
**Causa:** Cleanup inadequado de canvas/stream  
**Solução:** Verificar que `mounted` flag está sendo usado
```typescript
// Cleanup em useEffect return
if (stream) {
  stream.getTracks().forEach((track) => {
    track.stop();
    track.dispatchEvent(new Event('stop'));  // ← Importante!
  });
}
```

---

## Métricas para Monitorar

```typescript
// Adicionar ao dashboard
const metrics = {
  // Taxa de sucesso
  successRate: (processed / (processed + failed)) * 100,
  
  // Taxa de conflitos detectados
  conflictRate: (
    await prisma.equipmentScanLog.count({
      where: { status: 'conflict' }
    })
  ) / totalScans * 100,
  
  // Tempo médio de retry
  avgRetryTime: (
    await prisma.equipmentScanLog.aggregate({
      where: { status: 'success' },
      _avg: { timestamp: true }
    })
  ),
  
  // Versão mais alta em uso
  maxVersion: (
    await prisma.rental.aggregate({
      _max: { version: true }
    })
  ).max.version
};
```

---

## Testes Unitários (Recomendado)

```typescript
// __tests__/scan-batch.test.ts
describe('OCC Scan Batch', () => {
  test('should detect version conflict', async () => {
    const rental = await createRental({ version: 1 });
    
    // Simular dois requests simultâneos
    const [result1, result2] = await Promise.all([
      scanBatch(rental.id, 'eq-123', 1),
      scanBatch(rental.id, 'eq-123', 1)
    ]);
    
    // Um deve ter sucesso, outro deve ter VERSION_CONFLICT
    expect(result1.success || result2.success).toBe(true);
    expect(
      result1.errors?.[0]?.code === 'VERSION_CONFLICT' ||
      result2.errors?.[0]?.code === 'VERSION_CONFLICT'
    ).toBe(true);
  });

  test('should retry and succeed', async () => {
    const { submitScan } = useScanWithRetry({ maxAttempts: 3 });
    
    const result = await submitScan('rental-123', 'eq-123', 'checkout', 1);
    
    expect(result.success).toBe(true);
  });
});
```

---

## Migration do Sistema Antigo

Se você está atualizando de um sistema sem OCC:

```sql
-- Adicionar campos (já feito pela migration)
ALTER TABLE "Rental" ADD COLUMN "scannedOut" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Rental" ADD COLUMN "scannedIn" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Rental" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- Criar tabela de auditoria (já feito pela migration)
CREATE TABLE "EquipmentScanLog" (...)

-- Migrar dados antigos de scan (se houver)
-- INSERT INTO EquipmentScanLog SELECT ... FROM OldScanTable;
```

---

## Links Úteis

- Prisma OCC: https://www.prisma.io/docs/orm/prisma-client/queries/upsert#find-and-update
- Transaction Isolation: https://www.postgresql.org/docs/current/transaction-iso.html
- RequestAnimationFrame: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame

---

**Last Updated:** 16 de Janeiro de 2026  
**Author:** Engineering Team  
**Status:** ✅ Production Ready
