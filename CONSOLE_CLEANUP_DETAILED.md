# 🔧 DETAILED CONSOLE CLEANUP CHECKLIST

## Estatísticas Precisas - Console Methods

```
console.error()  → 457 ocorrências [MANTER - são erros de sistema]
console.log()    → 299 ocorrências [❌ REVISAR - maioria é dev logging]
console.warn()   →  83 ocorrências [⚠️  REVISAR - alguns são dev]
console.debug()  →  44 ocorrências [❌ REMOVER - dev only]
console.info()   →   1 ocorrência  [❌ REMOVER - dev only]
─────────────────────────────────────────────────────
TOTAL            → 884 ocorrências
```

---

## 📋 CONSOLE.LOG Que Precisam Revisão (299 ocorrências)

### Categoria 1: Development Logging (REMOVER)

```typescript
// ❌ REMOVER - Exemplos de console.log em produção

// src/lib/realtime-sync.ts:38
console.log(`User connected: ${socket.id}`)  // DEV

// src/lib/realtime-sync.ts:53
console.log(`User disconnected: ${socket.id}`)  // DEV

// src/lib/l10n-background-jobs.ts:24-25
console.log('[L10N] Retranslation job...')  // DEV

// src/lib/database-cleanup.ts:27, 60, 93, 122, 148
console.log('[Database Cleanup] ...')  // DEV

// src/lib/storage.ts:108, 110, 134, 298
console.log('✅ Storage directories initialized:', ...)  // DEV

// src/lib/scanFeedbackManager.ts:191-204
console.log('[ScanFeedback] Testing all feedback patterns...')  // DEV
console.log('- Testing success beep')  // DEV
console.log('- Testing error beep')  // DEV
console.log('- Testing warning beep')  // DEV

// src/lib/translation.ts:641
console.log('In-memory translation cache cleared')  // DEV

// src/lib/soft-delete.ts:205
console.log(`[Soft-Delete] Purged ${result.count}...`)  // DEV

// src/lib/jobs/notification-jobs.ts:71, 121, 170, 241, 255
console.log('Event Timeline Job: ...')  // MULTIPLE DEV

// src/lib/repositories/category.repository.ts:17, 62
console.log('[CategoryRepository] ...')  // DEV
```

**AÇÃO**: Remover OU envolver em `if (process.env.NODE_ENV === 'development')`

---

### Categoria 2: Setup/Installation Debug (MANTER COM CUIDADO)

```typescript
// ⚠️ REVISAR - Possível remover em produção

// src/app/api/setup/complete/route.ts (48 ocorrências)
console.log('Setup step 1...')
console.log('Setup step 2...')
// AÇÃO: OK durante setup, mas deveria estar em "silent mode" em prod

// src/app/api/setup/seed-catalog/route.ts
console.log('Seeding catalog...')
// AÇÃO: OK durante seed, manter mas considerar log file

// src/app/api/setup/test-storage/route.ts
console.log('Testing storage connection...')
// AÇÃO: OK durante setup
```

---

### Categoria 3: Conditional Logging (MANTER)

```typescript
// ✅ ACEITAR - Bem estruturados

// src/lib/professional-catalog-generator.ts
console.debug('[IMAGE] Loading image from:', resolved)
console.debug('[PDF GENERATOR] Starting generatePDF', {...})
// AÇÃO: Já usa console.debug - mudar para if(isDev) ou logger

// src/lib/predictive-translation.service.ts
console.log(`[PredictiveTranslation] Using glossary for...`)
console.log(`[PredictiveTranslation] Cache warmed for...`)
// AÇÃO: Colocar em [TIMESTAMP] logs estruturados
```

---

## ⚠️ CONSOLE.WARN (83 ocorrências) - Revisar

```typescript
// 🟡 Alguns podem ser dev-only

// src/lib/deepl-rate-limiter.ts:188
console.warn('[RATE LIMIT] ...')  // KEEP - é aviso

// src/lib/realtime-broadcast.ts:27, 49, 70, 91
console.warn('Socket.IO server not initialized...')  // KEEP - importante

// src/lib/api-auth.ts:19
console.warn('[API Auth] JWT_SECRET not set, using dev fallback')  // MANTER

// src/lib/localStorage-utils.ts:25, 30, 32, 81, 85
console.warn(`Error parsing localStorage...`)  // KEEP - erros

// src/lib/professional-catalog-generator.ts:144, 178, 192, 333
console.warn('[IMAGE] Could not determine dimensions...')  // KEEP - warnings

// src/lib/scanFeedbackManager.ts:20, 51, 89, 117, 130, 144, 158
console.warn('[ScanFeedback] ... not available')  // KEEP - device features
```

**AÇÃO**: Manter a maioria, apenas revisar contexto

---

## 🔴 CONSOLE.DEBUG (44 ocorrências) - REMOVER

```typescript
// ❌ Remover em produção - apenas desenvolvimento

// src/lib/professional-catalog-generator.ts (MÚLTIPLAS)
console.debug('[PDF HEADER] Logo settings:', {...})  // 8x ocorrências
console.debug('[PDF GENERATOR] Grouped items:', {...})
console.debug('[IMAGE] No URL provided')
console.debug('[IMAGE] Loading image from:', resolved)
console.debug('[IMAGE] Successfully loaded:', {...})

// Ação: Converter para logger condicional
if (process.env.DEBUG === 'true') {
  console.debug('[PDF GENERATOR]', {...})
}
```

---

## 🟢 CONSOLE.ERROR (457 ocorrências) - ACEITAR

```typescript
// ✅ MANTER - São erros do sistema

console.error('Failed to translate notes:', error)
console.error('Batch fetch error:', error)
console.error('Translation error:', error)
console.error('Failed to persist batch translations:', err)
console.error('Background translation error:', error)
console.error('Error getting DB stats:', error)
console.error('[Soft-Delete] Failed to permanently delete...', error)
console.error('[API Error] ...', error)
console.error('Error searching files:', error)
console.error('Activity fetch error:', error)

// TODAS SÃO ACEITÁVEIS EM PRODUÇÃO
// Status: ✅ OK - Manter como está
```

---

## 📁 TOP 10 Ficheiros para Limpeza

| Ranking | Ficheiro | console.log | console.debug | AÇÃO |
|---------|----------|------------|---------------|------|
| 1 | src/app/api/setup/complete/route.ts | 35+ | 10+ | 🔍 REVISAR setup |
| 2 | src/app/api/setup/complete/ROUTE_CORRIGIDO.ts | 35+ | 10+ | ❌ REMOVER ficheiro |
| 3 | src/lib/professional-catalog-generator.ts | 5+ | 15+ | 🔴 Remover debug |
| 4 | src/components/equipment/EquipmentForm.tsx | 18 | 0 | ❌ Remover logs |
| 5 | src/lib/realtime-sync.ts | 8 | 0 | 🔴 Remover dev logs |
| 6 | src/lib/l10n-background-jobs.ts | 6 | 0 | 🔴 Remover logs |
| 7 | src/lib/database-cleanup.ts | 8 | 0 | 🔴 Remover logs |
| 8 | src/lib/storage.ts | 6 | 0 | 🔴 Remover logs |
| 9 | src/lib/scanQueueManager.ts | 10 | 0 | 🔴 Remover logs |
| 10 | src/lib/scanFeedbackManager.ts | 6 | 3 | 🟡 Revisar |

---

## 🛠️ Script para Cleanup

### 1. Encontrar todos console.log em ficheiro específico:
```bash
grep -n "console.log" src/components/equipment/EquipmentForm.tsx
```

### 2. Encontrar todos console.debug:
```bash
grep -rn "console.debug" src/lib --include="*.ts"
```

### 3. Remover console.log em ficheiro:
```bash
sed -i '/console\.log/d' src/components/equipment/EquipmentForm.tsx
```

### 4. Contar por tipo:
```bash
grep -r "console\.\(log\|error\|warn\|debug\)" src/ --include="*.ts" | \
  grep -oE "console\.[a-z]+" | sort | uniq -c | sort -rn
```

---

## 📊 Benchmark Após Cleanup

**ANTES**:
- console.log: 299
- console.debug: 44
- console.warn: 83
- Total Dev Logging: 426 (48% do total)

**DEPOIS (Alvo)**:
- console.log: < 50 (apenas setup/prod important)
- console.debug: 0 (remover tudo ou usar logger condicional)
- console.warn: 70 (manter warnings críticos)
- Total Dev Logging: ~120 (13.6% do total)

**Reduction Target**: -75% de dev logging

---

## 🎯 Implementar Logger Condicional

### Opção 1: Simples (Inline)
```typescript
const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  console.log('[Scanner] Scanning item:', item.id);
}
```

### Opção 2: Utility Helper (Recomendado)
```typescript
// src/lib/logger.ts
export const logger = {
  dev: (label: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${label}]`, data || '');
    }
  },
  error: (label: string, error: Error) => {
    console.error(`[${label}]`, error.message);
  },
  warn: (label: string, message: string) => {
    console.warn(`[${label}]`, message);
  }
};

// Uso:
logger.dev('Scanner', item);
logger.error('API', error);
logger.warn('Deprecated', 'Use newMethod instead');
```

### Opção 3: Logger Library (Melhor)
```typescript
// Considerar: winston, pino, bunyan para estruturado logging
// Exemplo com bunyan:
const bunyan = require('bunyan');
const log = bunyan.createLogger({name: "app"});

log.info({user_id: 123}, "User login");
log.error({err: err}, "Error message");
```

---

## ✅ Checklist Final

- [ ] Remover `src/app/api/setup/complete/ROUTE_CORRIGIDO.ts`
- [ ] Remover 18x console.log em `EquipmentForm.tsx`
- [ ] Remover console.log em `realtime-sync.ts`
- [ ] Remover console.debug em `professional-catalog-generator.ts`
- [ ] Remover console.log em `l10n-background-jobs.ts`
- [ ] Remover console.log em `database-cleanup.ts`
- [ ] Remover console.log em `storage.ts` (exceto erros)
- [ ] Remover console.log em `scanQueueManager.ts`
- [ ] Revisar setup logging em `route.ts`
- [ ] Implementar logger condicional ou library
- [ ] Testar em produção
- [ ] Documentar logging strategy

---

## 🔗 Ficheiros de Referência

**Ficheiros com console.error bem estruturado (MODELO)**:
- src/lib/api.ts
- src/lib/error-handler.ts
- src/app/api/equipment/route.ts

**Ficheiros para remover completamente**:
- src/app/api/setup/complete/ROUTE_CORRIGIDO.ts ← **CRÍTICO**

