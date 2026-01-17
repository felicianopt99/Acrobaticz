# 📊 Code Quality & Cleanup Audit Report
**Data**: 17 de Janeiro, 2026  
**Workspace**: Acrobaticz (AC)  
**Escopo**: src/components, src/lib, src/hooks, src/app/api

---

## 🎯 Sumário Executivo

Este relatório identifica:
- ✅ **884 declarações de console** distribuídas em **150+ ficheiros**
- ⚠️ **Secções de código comentado** (JSX comments vs. código legacy)
- 🔍 **Potenciais funções/hooks não utilizadas** em utilitários principais

---

## 📍 1. CONSOLE.LOG / CONSOLE.ERROR / CONSOLE.WARN (884 Ocorrências)

### 1.1 Distribuição por Tipo

| Tipo | Contagem Estimada | Status |
|------|------------------|--------|
| `console.error()` | ~400+ | ⚠️ Prod - Manter (logs de erro) |
| `console.warn()` | ~150+ | ⚠️ Prod - Verificar |
| `console.log()` | ~250+ | ❌ Dev - Remover em prod |
| `console.debug()` | ~60+ | ❌ Dev - Remover em prod |
| `console.info()` | ~20+ | ❌ Dev - Remover em prod |

### 1.2 Ficheiros com Mais Console Statements (Top 15)

| Ficheiro | Conta | Tipo Predominante | Recomendação |
|----------|-------|-------------------|--------------|
| [src/app/api/setup/complete/route.ts](src/app/api/setup/complete/route.ts#L1) | 48 | Misto (setup) | 🔍 Revisar - Setup debug |
| [src/app/api/setup/complete/ROUTE_CORRIGIDO.ts](src/app/api/setup/complete/ROUTE_CORRIGIDO.ts#L1) | 47 | Misto (setup) | ❌ **REMOVER** - Ficheiro duplicado/legacy |
| [src/lib/professional-catalog-generator.ts](src/lib/professional-catalog-generator.ts#L1) | 31 | `console.debug/warn/error` | ⚠️ Manter alguns, remover debug |
| [src/lib/scanQueueManager.ts](src/lib/scanQueueManager.ts#L1) | 18 | `console.log/warn` | 🔍 Verificar - Possível debug |
| [src/lib/orphan-cleanup.ts](src/lib/orphan-cleanup.ts#L1) | 18 | `console.log/error` | 🔍 Verificar - Possível debug |
| [src/lib/notifications.ts](src/lib/notifications.ts#L1) | 18 | `console.error/log` | ⚠️ Manter erros, remover logs |
| [src/components/equipment/EquipmentForm.tsx](src/components/equipment/EquipmentForm.tsx#L1) | 18 | `console.log` | ❌ **REMOVER** - Dev logging |
| [src/lib/translation-analyzer.ts](src/lib/translation-analyzer.ts#L1) | 16 | `console.log/error` | 🔍 Verificar - Possível debug |
| [src/app/api/partners/catalog/generate/route.ts](src/app/api/partners/catalog/generate/route.ts#L1) | 16 | Misto | ⚠️ Avaliar contexto |
| [src/lib/offline-sync.service.ts](src/lib/offline-sync.service.ts#L1) | 15 | `console.log/warn` | 🔍 Possível debug |
| [src/app/api/ai/analyze-equipment/route.ts](src/app/api/ai/analyze-equipment/route.ts#L1) | 15 | Misto | 🔍 Verificar |
| [src/lib/storage.ts](src/lib/storage.ts#L1) | 14 | `console.error/log` | ⚠️ Manter erros, remover logs |
| [src/app/api/equipment/route.ts](src/app/api/equipment/route.ts#L1) | 14 | `console.error` | ✅ OK - Erros críticos |
| [src/lib/fallback-strategy.service.ts](src/lib/fallback-strategy.service.ts#L1) | 13 | Misto | 🔍 Verificar |
| [src/app/api/clients/route.ts](src/app/api/clients/route.ts#L1) | 13 | `console.error` | ✅ OK - Erros críticos |

### 1.3 Exemplos de Console Statements por Categoria

#### ✅ Aceitáveis (Erros de API/Sistema):
```typescript
// src/lib/translation.ts:234
console.error('Batch fetch error:', error);

// src/lib/soft-delete.ts:118
console.error(`[Soft-Delete] Failed to permanently delete ${model} ${id}:`, error);

// src/app/api/equipment/route.ts:13
console.error('Error fetching fees:', error);
```

#### ⚠️ Revisar (Debug/Info para Remover):
```typescript
// src/lib/professional-catalog-generator.ts:754
console.debug('[PDF GENERATOR] Starting generatePDF', { ... });

// src/lib/scanQueueManager.ts (múltiplas)
console.log('Scanning queue item...');

// src/lib/l10n-background-jobs.ts:24
console.log('[L10N] Retranslation job...');
```

#### ❌ Remover (Development Only):
```typescript
// src/components/equipment/EquipmentForm.tsx (18 ocorrências)
console.log('Form data:', data);

// src/lib/realtime-sync.ts:38
console.log(`User connected: ${socket.id}`);
```

---

## 📌 2. CÓDIGO COMENTADO EM BLOCO

### 2.1 Padrão de Comentários JSX (Aceitável)
As seguintes ocorrências SÃO comentários JSX legítimos (não código comentado):

```tsx
// CORRETO - Comentários descritivos em JSX
{/* Header */}
{/* Content */}
{/* Footer */}

{/* Overlay com frame visual */}
{/* QR frame guide */}
{/* Recent Items */}
```

**Total de comentários JSX**: ~200+  
**Status**: ✅ Aceitável - São marcadores de estrutura, não código legacy

### 2.2 Blocos de Código Comentado (Código Legacy)

#### Ficheiro: [src/app/api/setup/seed-catalog/route.ts](src/app/api/setup/seed-catalog/route.ts#L480)
```typescript
// Lines 481-482 - Código comentado que deveria ser removido:
// import { CatalogSeedServiceV3 } from '@/scripts/catalog-seed-service-v3';

// Status: 🔍 REVISAR - Decidir se remover ou implementar
```

#### Ficheiro: [src/app/api/setup/complete/ROUTE_CORRIGIDO.ts](src/app/api/setup/complete/ROUTE_CORRIGIDO.ts#L1)
```
⚠️ CRÍTICO: Este ficheiro inteiro é possivelmente um backup comentado/legacy
Recomendação: REMOVER após confirmação
```

#### Ficheiro: [src/app/api/rentals/route.example.ts](src/app/api/rentals/route.example.ts#L71)
```typescript
// Lines 71, 138 - Comentários de exemplo/documentação
// Validate equipment exists and is not deleted
// Centralized error handling - converts Prisma errors to user-friendly messages

Status: ✅ Aceitável - Documentação
```

### 2.3 Sumário de Código Comentado

| Tipo | Contagem | Status | Ação |
|------|----------|--------|------|
| Comentários JSX estruturais | ~200+ | ✅ OK | Manter |
| Comentários de documentação | ~150+ | ✅ OK | Manter |
| Código comentado (legacy) | ~10-15 | ❌ Remover | Ver lista abaixo |
| Ficheiros com `.example` ou `_CORRIGIDO` | 2 | 🔍 Verificar | Possível cleanup |

---

## 🔍 3. FUNÇÕES/VARIABLES NÃO UTILIZADAS

### 3.1 Funções Exportadas em Utilitários (Revisão)

#### [src/lib/utils.ts](src/lib/utils.ts) - Funções de Utilidade
```typescript
✅ USADAS:
- cn() - Utilizado em todo o projeto
- formatBytes() - Storage/Cloud components
- formatDate() - Multiple components

⚠️ VERIFICAR:
- responsiveGrid() - Verificar uso em responsivas
- responsiveHeight() - Verificar uso em componentes de layout
- safeAreaPadding() - Mobile layout components
- responsiveText() - Typography components
- debounce() - Event handlers
```

**Recomendação**: Fazer `grep` de cada função para confirmar

#### [src/lib/localStorage-utils.ts](src/lib/localStorage-utils.ts)
```typescript
✅ Todas as funções parecem utilizadas:
- safeParseLocalStorage()
- safeSetLocalStorage()
- cleanupLocalStorage()
- getLocalStorageItem()
- setLocalStorageItem()
```

#### [src/lib/roles.ts](src/lib/roles.ts)
```typescript
✅ Todas parecem utilizadas em:
- Permission guards
- UI components
- Admin panels

⚠️ VERIFICAR:
- toNormalizedRole() vs normalizeRole() - Duplicadas?
- getAllRoles() - Confirmr uso
```

### 3.2 Hooks Potencialmente Não Utilizados

**Ficheiros de Hooks encontrados**:
- `src/hooks/useNotifications.ts`
- `src/hooks/useLocalStorage.ts`
- `src/hooks/useTranslate.ts`
- `src/hooks/usePullToRefresh.ts`
- `src/hooks/use-cart-store.ts`
- `src/hooks/useRealTimeSync.ts`
- `src/hooks/useCatalogData.ts`
- `src/hooks/useScanWithRetry.ts`
- `src/hooks/use-filter-store.ts`
- `src/hooks/useHapticFeedback.ts`
- `src/hooks/useTranslationStatus.ts`
- `src/hooks/useToastWithTranslation.ts`
- `src/hooks/useConfig.ts`
- `src/hooks/useCustomizationSettings.ts`
- `src/hooks/usePageTranslation.ts`
- `src/hooks/useBulkScanSession.ts`

**Nota**: Requer busca adicional para confirmar uso de cada hook

### 3.3 Funções de Sistema Potencialmente Não Utilizadas

| Função | Ficheiro | Prioridade | Ação |
|--------|----------|-----------|------|
| `clearApiKeyCache()` | src/lib/gemini.service.ts | 🔍 | Verificar chamadas |
| `clearRulesCache()` | src/lib/translation-rules-loader.ts | 🔍 | Verificar chamadas |
| `resetRateLimitForIP()` | src/lib/api-wrapper.ts | 🔍 | Verificar chamadas |
| `resetAllRateLimits()` | src/lib/api-wrapper.ts | 🔍 | Verificar chamadas |

---

## 📊 4. FICHEIROS COM PROBLEMAS CRÍTICOS

### 4.1 Ficheiros Duplicados/Legacy (REMOVER)

| Ficheiro | Status | Tamanho | Ação |
|----------|--------|--------|------|
| [src/app/api/setup/complete/ROUTE_CORRIGIDO.ts](src/app/api/setup/complete/ROUTE_CORRIGIDO.ts) | 🔴 **REMOVER** | 47 consoles | Aparenta ser backup/legacy |
| [src/app/api/rentals/route.example.ts](src/app/api/rentals/route.example.ts) | 🟡 REVISAR | Exemplo | Decidir se manter como referência |

### 4.2 Ficheiros com Muita Complexidade de Debug (REVISAR)

| Ficheiro | Problemas | Prioridade |
|----------|-----------|-----------|
| [src/lib/professional-catalog-generator.ts](src/lib/professional-catalog-generator.ts) | 31 consoles, múltiplos debug levels | 🟡 Alta |
| [src/app/api/setup/complete/route.ts](src/app/api/setup/complete/route.ts) | 48 consoles, setup complexity | 🟡 Alta |
| [src/components/equipment/EquipmentForm.tsx](src/components/equipment/EquipmentForm.tsx) | 18 console.log dev | 🔴 Alta |

---

## ✅ PLANO DE AÇÃO RECOMENDADO

### Fase 1: Cleanup Imediato (2-4 horas)
```
1. ❌ REMOVER ficheiro:
   - src/app/api/setup/complete/ROUTE_CORRIGIDO.ts

2. 🔴 REMOVER consoles em:
   - src/components/equipment/EquipmentForm.tsx (18 logs dev)
   - src/lib/realtime-sync.ts (conexão logs)
   - src/lib/l10n-background-jobs.ts (job logs)

3. 🟡 REVISAR & REMOVER debug em:
   - src/lib/professional-catalog-generator.ts (debug levels)
   - src/lib/scanQueueManager.ts (queue logs)
   - src/lib/offline-sync.service.ts
```

### Fase 2: Otimização (4-6 horas)
```
1. ✅ Manter console.error() - São críticos
2. ⚠️ Convertr console.warn() em production environment guards
3. 🔄 Implementar logging configurável (dev vs. prod)

Exemplo:
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) console.log(...);
```

### Fase 3: Funções Não Utilizadas (4-8 horas)
```
1. Executar grep para cada função em:
   - src/lib/utils.ts
   - src/lib/roles.ts
   - src/hooks/*

2. Exemplo:
   grep -r "responsiveGrid" src/ --include="*.tsx" --include="*.ts"

3. Remover se não encontrar imports
```

---

## 📈 Métricas Finais

| Métrica | Valor | Target |
|---------|-------|--------|
| **Console.log (dev)** | 250+ | < 50 |
| **Console.warn/debug** | 150+ | < 30 |
| **Console.error** | 400+ | OK (manter) |
| **Código comentado** | 10-15 | 0 |
| **Ficheiros duplicados** | 1-2 | 0 |
| **JSX Comments** | 200+ | ✅ OK |

---

## 🔗 Referências de Ficheiros Críticos

### Ficheiros com Maior Impacto em Cleanup:
1. [src/app/api/setup/complete/route.ts](src/app/api/setup/complete/route.ts) - 48 logs (revisar)
2. [src/lib/professional-catalog-generator.ts](src/lib/professional-catalog-generator.ts) - 31 logs (debug)
3. [src/components/equipment/EquipmentForm.tsx](src/components/equipment/EquipmentForm.tsx) - 18 logs (remover)

### Ficheiros a Remover:
1. [src/app/api/setup/complete/ROUTE_CORRIGIDO.ts](src/app/api/setup/complete/ROUTE_CORRIGIDO.ts) - Backup/Legacy

---

## 📝 Notas

- Este audit foi realizado em **17/01/2026**
- Scopeado em: `src/components`, `src/lib`, `src/hooks`, `src/app/api`
- Total de ficheiros analisados: **200+**
- Total de console statements: **884**
- Código comentado legítimo (JSX): **~200+** ✅
- Código comentado legacy: **~10-15** ❌

---

**Recomendação Final**: Priorizar limpeza de `console.log/debug` em componentes e utilitários de setup para reduzir ruído nos logs de produção.

