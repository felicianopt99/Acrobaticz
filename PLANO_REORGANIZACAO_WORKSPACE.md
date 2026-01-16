# 🏗️ PLANO DE REORGANIZAÇÃO DO WORKSPACE ACROBATICZ

**Data:** 15 de Janeiro de 2026  
**Autor:** Senior Systems Architect  
**Versão:** 1.0 (Draft para Revisão)  
**Status:** ⏳ AGUARDA APROVAÇÃO ANTES DE EXECUÇÃO

---

## 📑 ÍNDICE

1. [Inventário de Purga (Cleanup)](#1-inventário-de-purga-cleanup)
2. [Mapeamento da Nova Estrutura (Tree View)](#2-mapeamento-da-nova-estrutura-tree-view)
3. [Análise de Impacto na Build (Integridade)](#3-análise-de-impacto-na-build-integridade)
4. [Validação de Funcionalidades Core](#4-validação-de-funcionalidades-core)
5. [Plano de Execução](#5-plano-de-execução)

---

## 1. INVENTÁRIO DE PURGA (CLEANUP)

### 1.1 🗑️ Ficheiros de Lixo Detetados

| Tipo | Ficheiro | Localização | Tamanho | Ação |
|------|----------|-------------|---------|------|
| `.bak` | `BottomNav.tsx.bak` | `src/components/layout/` | ~5KB | **ELIMINAR** |
| `.bak` | `BottomNav.tsx.bak` | `.next/standalone/src/components/layout/` | ~5KB | **ELIMINAR** (build artifact) |
| `.log` | `.build-test.log` | Raiz | ~1KB | **ELIMINAR** |
| `.txt` | `.build-diagnostic.txt` | Raiz | ~1KB | **ELIMINAR** (artefato de diagnóstico) |
| `.txt` | `.build-summary.txt` | Raiz | ~1KB | **ELIMINAR** (artefato de diagnóstico) |
| `.tar.gz` | `migrations_backup_20260114_230858.tar.gz` | Raiz | ~10KB | **MOVER** para `backups/` ou **ELIMINAR** |
| `.py` | `fix_prisma_creates.py` | Raiz | - | **ELIMINAR** (script one-time) |

### 1.2 📁 Diretórios a Eliminar/Arquivar

| Diretório | Tamanho | Motivo | Ação |
|-----------|---------|--------|------|
| `.documentation_archive_20260115_153301/` | **620KB** | Documentação arquivada de fases anteriores | **ELIMINAR** após confirmar que `docs/` tem tudo |
| `.next/` | ~variável | Build cache regenerável | Mantido (mas reconstruível) |
| `tools/utilities/` | ~20KB | Scripts de cleanup obsoletos | **REVER** - consolidar úteis em `scripts/` |

### 1.3 📄 Ficheiros Markdown na Raiz (31 ficheiros!)

#### ✅ MANTER NA RAIZ (Ficheiros Essenciais)
| Ficheiro | Justificação |
|----------|--------------|
| `README.md` | Documentação principal do projeto |
| `CONTRIBUTING.md` | Guia de contribuição |
| `DEPLOYMENT.md` | Guia de deploy |

#### ⚠️ MOVER PARA `docs/` (Documentação Técnica)
| Ficheiro | Destino Proposto |
|----------|------------------|
| `BUILD_ANALYSIS.md` | `docs/DEPLOYMENT/` |
| `DOCKER_BUILD_REPORT.md` | `docs/DEPLOYMENT/` |
| `DOCKER_DEV_SETUP.md` | `docs/DEPLOYMENT/` |
| `PRODUCTION_READINESS_REPORT.md` | `docs/DEPLOYMENT/` |
| `QUICK_BUILD_TESTING.md` | `docs/DEPLOYMENT/` |
| `TYPESCRIPT_FIX_GUIDE.md` | `docs/SETUP/` |
| `INSTALL_GUIDE.md` | `docs/SETUP/` |
| `QUICK_START.md` | `docs/SETUP/` |
| `INDICE_BUILD_TESTING.md` | `docs/DEPLOYMENT/` |
| `VERIFICATION_CHECKLIST.md` | `docs/DEPLOYMENT/` |

#### 🔴 ELIMINAR (Documentação Obsoleta/Redundante)
| Ficheiro | Motivo |
|----------|--------|
| `RELATORIO_FINAL_BUILD.md` | Relatório histórico - arquivável |
| `RELATORIO_RESUMO_EXECUTIVO.md` | Relatório histórico - arquivável |
| `EXECUTIVE_SUMMARY.md` | Duplicado com docs existentes |
| `DOCUMENTATION_CLEANUP_SUMMARY.md` | Meta-doc sobre limpeza anterior |
| `NEXT_STEPS.md` | Documento temporário |
| `README_API_TESTS.md` | Mover conteúdo para `docs/API/` |
| `FORMS_TEST_GUIDE.md` | Mover conteúdo para `docs/API/` |

#### 🔴 ELIMINAR/CONSOLIDAR (Série LIFECYCLE_MANAGER - 8 ficheiros!)
| Ficheiro | Ação |
|----------|------|
| `LIFECYCLE_MANAGER_ARCHITECTURE.md` | Consolidar em `docs/ARCHITECTURE.md` |
| `LIFECYCLE_MANAGER_DECISION_ROADMAP.md` | **ELIMINAR** (histórico) |
| `LIFECYCLE_MANAGER_DELIVERABLES.md` | **ELIMINAR** (histórico) |
| `LIFECYCLE_MANAGER_EXECUTIVE_SUMMARY.md` | **ELIMINAR** (histórico) |
| `LIFECYCLE_MANAGER_IMPLEMENTATION.md` | Consolidar útil em `docs/` |
| `LIFECYCLE_MANAGER_INDEX.md` | **ELIMINAR** |
| `LIFECYCLE_MANAGER_QUICK_START.md` | Consolidar em `QUICK_START.md` |
| `LIFECYCLE_MANAGER_README.md` | **ELIMINAR** |

#### 🔴 ELIMINAR/CONSOLIDAR (Série INSTALLER - 3 ficheiros!)
| Ficheiro | Ação |
|----------|------|
| `INSTALLER_ADVANCED.md` | Consolidar em `docs/SETUP/` |
| `INSTALLER_COMPARISON.md` | **ELIMINAR** (histórico) |
| `INSTALLER_README.md` | Consolidar em `INSTALL_GUIDE.md` |

### 1.4 📜 Scripts na Raiz a Reorganizar

| Ficheiro | Tamanho | Ação |
|----------|---------|------|
| `cleanup.sh` | 4.4KB | **MOVER** para `scripts/maintenance/` |
| `cleanup_documentation.sh` | 8.8KB | **ELIMINAR** (já executado) |
| `docker-entrypoint.sh` | 11KB | **MANTER** (usado pelo Dockerfile) |
| `install.sh` | 28KB | **MANTER** (instalador principal) |
| `uninstall.sh` | 5.5KB | **MANTER** |
| `restore-prod-backup.sh` | 6.5KB | **MOVER** para `scripts/maintenance/` |
| `verify_implementation.sh` | 17KB | **ELIMINAR** (script de verificação one-time) |
| `test-installation-fix.sh` | 3.4KB | **ELIMINAR** (script de debug) |
| `API_TEST_DELIVERY_REPORT.sh` | 13KB | **ELIMINAR** (relatório obsoleto) |

### 1.5 📊 Sumário de Purga

| Categoria | Itens | Espaço Estimado |
|-----------|-------|-----------------|
| Ficheiros `.bak/.log/.txt` | 5 | ~15KB |
| Diretório arquivo doc | 1 | ~620KB |
| Markdown obsoletos/redundantes | ~20 | ~300KB |
| Scripts obsoletos | 5 | ~50KB |
| **TOTAL ESTIMADO** | **~31 itens** | **~985KB** |

---

## 2. MAPEAMENTO DA NOVA ESTRUTURA (TREE VIEW)

### 2.1 Comparação: Estrutura Atual vs. Proposta

```
┌─────────────────────────────────────────┬─────────────────────────────────────────┐
│         ESTRUTURA ATUAL                 │         ESTRUTURA PROPOSTA              │
├─────────────────────────────────────────┼─────────────────────────────────────────┤
│ src/                                    │ src/                                    │
│ ├── app/           (✅ mantém)          │ ├── app/           (mantém)             │
│ ├── components/    (⚠️ flat demais)     │ ├── components/                         │
│ │   ├── ui/        (43 ficheiros)       │ │   ├── ui/         (primitivos Radix)  │
│ │   ├── admin/                          │ │   └── modules/    (NOVO)              │
│ │   ├── auth/                           │ │       ├── admin/                      │
│ │   ├── catalog/                        │ │       ├── auth/                       │
│ │   ├── categories/                     │ │       ├── catalog/                    │
│ │   ├── clients/                        │ │       ├── cloud/                      │
│ │   ├── cloud/                          │ │       ├── equipment/                  │
│ │   ├── dashboard/                      │ │       ├── inventory/                  │
│ │   ├── equipment/                      │ │       ├── rentals/                    │
│ │   ├── events/                         │ │       ├── layout/                     │
│ │   ├── inventory/                      │ │       └── ...                         │
│ │   ├── layout/                         │ │                                       │
│ │   ├── maintenance/                    │ ├── core/          (NOVO)               │
│ │   ├── native/                         │ │   ├── interfaces/ (tipos de contrato) │
│ │   ├── notifications/                  │ │   ├── types/      (de src/types/)     │
│ │   ├── partners/                       │ │   └── constants/  (constantes globais)│
│ │   ├── quotes/                         │ │                                       │
│ │   ├── rentals/                        │ ├── lib/           (REORGANIZADO)       │
│ │   ├── setup/                          │ │   ├── clients/    (NOVO)              │
│ │   ├── translation/                    │ │   │   ├── prisma.ts (de db.ts)        │
│ │   └── composites/ (vazio!)            │ │   │   ├── gemini.ts                   │
│ │                                       │ │   │   └── auth.ts (api-auth.ts)       │
│ ├── config/        (vazio!)             │ │   ├── repositories/                   │
│ ├── contexts/                           │ │   ├── schemas/                        │
│ ├── hooks/                              │ │   └── utils/      (utilitários gerais)│
│ ├── lib/           (⚠️ mistura tudo)    │ │                                       │
│ │   ├── db.ts                           │ ├── services/      (NOVO)               │
│ │   ├── api-auth.ts                     │ │   ├── cloud/                          │
│ │   ├── gemini.service.ts               │ │   ├── rentals/                        │
│ │   ├── storage.ts                      │ │   ├── inventory/                      │
│ │   ├── cache.ts                        │ │   ├── translation/                    │
│ │   ├── repositories/                   │ │   └── notifications/                  │
│ │   ├── schemas/                        │ │                                       │
│ │   ├── jobs/                           │ ├── scripts/       (REORGANIZADO)       │
│ │   └── ...50+ ficheiros misturados     │ │   └── catalog-seed-complete.ts        │
│ │                                       │ │                                       │
│ ├── providers/                          │ ├── contexts/      (mantém)             │
│ ├── scripts/       (1 ficheiro)         │ ├── hooks/         (mantém)             │
│ ├── state/         (vazio!)             │ ├── providers/     (mantém)             │
│ ├── styles/                             │ └── styles/        (mantém)             │
│ └── types/                              │                                       │
│                                         │                                       │
│ scripts/           (raiz - 15+ items)   │ scripts/          (CONSOLIDADO)        │
│ ├── database/                           │ ├── database/                           │
│ ├── deployment/                         │ ├── deployment/                         │
│ ├── maintenance/                        │ ├── maintenance/   (+cleanup.sh)        │
│ └── notifications/                      │ ├── dev/           (NOVO)               │
│                                         │ │   ├── diagnose-build.sh               │
│ tools/             (utilitários)        │ │   └── first-time-setup.sh             │
│ ├── docker/                             │ └── seed.ts        (se existir)         │
│ └── utilities/     (cleanups antigos)   │                                       │
│                                         │ tools/             (ELIMINAR/INTEGRAR) │
│                                         │                                       │
│ docs/              (estruturada)        │ docs/              (EXPANDIDO)          │
│ ├── API/                                │ ├── API/                                │
│ ├── DATABASE/                           │ ├── DATABASE/                           │
│ ├── DEPLOYMENT/    (+novos .md)         │ ├── DEPLOYMENT/                         │
│ ├── FEATURES/      (vazio!)             │ ├── FEATURES/                           │
│ └── SETUP/         (vazio!)             │ └── SETUP/         (+novos .md)         │
└─────────────────────────────────────────┴─────────────────────────────────────────┘
```

### 2.2 Detalhes da Nova Estrutura `src/`

#### 📁 `src/lib/clients/` - Instâncias de Clientes (NOVO)
```
src/lib/clients/
├── prisma.ts        # PrismaClient singleton (de db.ts)
├── gemini.ts        # Gemini AI client (de gemini.service.ts)
├── auth.ts          # JWT utilities (de api-auth.ts)
├── redis.ts         # Redis/IORedis client (se aplicável)
└── index.ts         # Re-exports centralizados
```

#### 📁 `src/core/` - Interfaces, Types, Constantes (NOVO)
```
src/core/
├── interfaces/
│   ├── api.interface.ts       # Contratos de API
│   ├── service.interface.ts   # Contratos de serviços
│   └── repository.interface.ts
├── types/
│   ├── index.ts               # (mover de src/types/)
│   ├── entities.ts
│   ├── nav.ts
│   └── translation.types.ts
└── constants/
    ├── index.ts               # (mover de src/lib/constants.ts)
    ├── equipment.constants.ts
    └── app.constants.ts
```

#### 📁 `src/services/` - Lógica de Negócio (NOVO)
```
src/services/
├── cloud/
│   ├── storage.service.ts     # (de src/lib/storage.ts)
│   ├── disk-monitor.service.ts
│   └── orphan-cleanup.service.ts
├── rentals/
│   ├── rental.service.ts      # Lógica extraída das routes
│   └── conflict-checker.service.ts
├── inventory/
│   └── equipment.service.ts
├── translation/
│   ├── translation.service.ts
│   ├── deepl.service.ts
│   └── gemini-translation.service.ts
└── notifications/
    └── notification.service.ts
```

#### 📁 `src/components/` - Reorganização
```
src/components/
├── ui/                # Primitivos (manter como está - 43 componentes)
│   ├── button.tsx
│   ├── dialog.tsx
│   └── ...
└── modules/           # Componentes de domínio (NOVO agrupamento)
    ├── admin/
    ├── auth/
    ├── catalog/
    ├── cloud/
    ├── equipment/
    ├── inventory/
    ├── rentals/
    ├── layout/        # AppHeader, AppLayout, BottomNav, etc.
    └── shared/        # ErrorBoundary, LanguageToggle, etc.
```

### 2.3 Estrutura `scripts/` Consolidada

```
scripts/                        # Na raiz do projeto
├── database/
│   ├── run-seed.sh
│   ├── run_overnight.sh
│   ├── setup_automation.sh
│   └── setup_translation.sh
├── deployment/
│   ├── certbot-entrypoint.sh
│   ├── docker-entrypoint.sh   # (duplicado com raiz - ELIMINAR um)
│   ├── docker-redeploy.sh
│   └── nginx-*.sh
├── maintenance/
│   ├── backup-daily.sh
│   ├── cleanup-backups.sh
│   ├── cleanup.sh             # (MOVER da raiz)
│   └── verify-backups.sh
├── dev/                        # NOVO
│   ├── diagnose-build.sh
│   ├── first-time-setup.sh
│   └── dev-docker-setup.sh
├── seed-from-catalog.ts        # Script principal de seed
├── export-complete-data.ts
└── README.md
```

---

## 3. ANÁLISE DE IMPACTO NA BUILD (INTEGRIDADE)

### 3.1 📝 Ficheiros de Configuração a Editar

| Ficheiro | Edição Necessária | Prioridade |
|----------|-------------------|------------|
| `tsconfig.json` | Adicionar novos aliases de path | 🔴 CRÍTICO |
| `package.json` | Atualizar scripts se paths mudarem | 🟡 MÉDIA |
| `Dockerfile` | Verificar COPY paths | 🟡 MÉDIA |
| `docker-compose.yml` | Sem alterações previstas | ✅ OK |
| `next.config.ts` | Sem alterações previstas | ✅ OK |
| `vitest.config.ts` | Atualizar aliases se necessário | 🟡 MÉDIA |

### 3.2 Alterações Propostas ao `tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      // NOVOS ALIASES PROPOSTOS:
      "@/core/*": ["./src/core/*"],
      "@/services/*": ["./src/services/*"],
      "@/lib/clients/*": ["./src/lib/clients/*"],
      "@/components/ui/*": ["./src/components/ui/*"],
      "@/components/modules/*": ["./src/components/modules/*"]
    }
  }
}
```

### 3.3 📦 Ficheiros com Imports a Migrar

#### Imports da pasta `/scripts` (1 encontrado - comentado)
| Ficheiro | Linha | Import Atual | Migração |
|----------|-------|--------------|----------|
| `src/app/api/setup/seed-catalog/route.ts` | 482 | `// import { CatalogSeedServiceV3 } from '@/scripts/catalog-seed-service-v3';` | N/A (comentado) |

#### Imports de `@/lib/db` (múltiplos) - SEM ALTERAÇÃO se mantiver alias
```typescript
// Ficheiros que usam: import { prisma } from '@/lib/db'
// Se mover para @/lib/clients/prisma.ts, precisam atualizar para:
// import { prisma } from '@/lib/clients/prisma'
// OU criar re-export em @/lib/db.ts → @/lib/clients/prisma
```

**Ficheiros afetados por `@/lib/db`:**
- Todas as rotas em `src/app/api/**/*.ts` (~50+ ficheiros)
- `src/lib/gemini.service.ts`
- `src/lib/repositories/*.ts`

#### Imports de `@/lib/storage` (11 encontrados)
| Ficheiro | Import |
|----------|--------|
| `src/app/api/cloud/health/route.ts` | `checkDiskHealth` |
| `src/app/api/cloud/trash/empty/route.ts` | `deleteFile` |
| `src/app/api/cloud/files/[id]/route.ts` | `readFile, deleteFile` |
| `src/app/api/cloud/trash/route.ts` | `deleteFile` |
| `src/app/api/cloud/files/upload/route.ts` | múltiplos exports |
| `src/app/api/cloud/folders/[id]/route.ts` | `deleteDirectory, deleteFile` |
| `src/lib/orphan-cleanup.ts` | `deleteFile, getStoragePath, CLOUD_STORAGE_PATH` |

**Estratégia:** Criar re-export em `@/lib/storage.ts` que aponta para `@/services/cloud/storage.service.ts`

### 3.4 🔄 Estratégia de Migração Segura

```
FASE 1: Criar estrutura paralela
├── Criar src/core/, src/services/, src/lib/clients/
├── Copiar ficheiros (NÃO mover ainda)
└── Atualizar tsconfig.json com novos aliases

FASE 2: Criar ficheiros de re-export (backward compatibility)
├── src/lib/db.ts → re-export de @/lib/clients/prisma
├── src/lib/storage.ts → re-export de @/services/cloud/storage.service
└── Manter imports antigos funcionais

FASE 3: Testar build
├── npm run build
├── npm run typecheck
└── Verificar 0 erros

FASE 4: Migração gradual de imports
├── Atualizar imports ficheiro a ficheiro
└── Remover re-exports obsoletos após migração completa
```

---

## 4. VALIDAÇÃO DE FUNCIONALIDADES CORE

### 4.1 ✅ Auth Guards em `/api/rentals`

**Confirmação:** Os Auth Guards estão **IMPLEMENTADOS E FUNCIONAIS**.

| Ficheiro | Função | Status |
|----------|--------|--------|
| `src/app/api/rentals/route.ts` | `requireReadAccess()` no GET | ✅ Implementado |
| `src/app/api/rentals/route.ts` | `requirePermission()` no POST | ✅ Implementado |
| `src/lib/api-auth.ts` | `requireAuth()`, `requirePermission()`, `requireReadAccess()` | ✅ Core Functions |
| `src/lib/permissions.ts` | `hasPermission()` | ✅ RBAC Check |

**Código verificado em `src/app/api/rentals/route.ts`:**
```typescript
import { requireReadAccess, requirePermission } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    await requireReadAccess(request);  // ✅ AUTH GUARD
  } catch (error) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  // ...
}
```

**Ação Necessária:** **NENHUMA** - Manter `@/lib/api-auth.ts` intacto. Se mover para `@/lib/clients/auth.ts`, criar re-export.

### 4.2 ✅ Script `seed.ts` Identificado

**Situação Atual:**

| Script | Localização | Referenciado em | Status |
|--------|-------------|-----------------|--------|
| `seed.ts` | **NÃO EXISTE** em `scripts/` | `package.json` (`tsx scripts/seed.ts`) | ⚠️ FICHEIRO EM FALTA |
| `seed-from-catalog.ts` | `scripts/` | Manual | ✅ Existe (454 linhas) |
| `catalog-seed-complete.ts` | `src/scripts/` | API seed-catalog | ✅ Existe (838 linhas) |

**Problema Identificado:**
O `package.json` referencia `scripts/seed.ts` que **NÃO EXISTE**:
```json
"db:seed": "tsx scripts/seed.ts",
```

**Resolução Proposta:**
1. Renomear `seed-from-catalog.ts` → `seed.ts` **OU**
2. Atualizar `package.json` para apontar para o ficheiro correto:
```json
"db:seed": "tsx scripts/seed-from-catalog.ts",
```

### 4.3 📋 Catálogo Estático e Wizard de Instalação

| Componente | Ficheiro | Status |
|------------|----------|--------|
| Catálogo 65 Produtos | `CATALOG_65_PRODUTOS/CATALOGO_65_PRODUTOS.md` | ✅ Existe |
| Dados JSON | `CATALOG_65_PRODUTOS/SUPPLEMENTARY_DATA.json` | ✅ Existe |
| Seed Service | `src/scripts/catalog-seed-complete.ts` | ✅ Pronto para uso |
| API Seed Endpoint | `src/app/api/setup/seed-catalog/route.ts` | ✅ Implementado |
| UI Wizard Step | `src/components/setup/CatalogSeedStep.tsx` | ✅ Componente existe |

**Ação:** Garantir que a migração **NÃO** afeta estes ficheiros.

---

## 5. PLANO DE EXECUÇÃO

### 5.1 📅 Sequência Proposta

| Fase | Descrição | Duração Est. | Dependências |
|------|-----------|--------------|--------------|
| **0** | Backup completo | 5 min | - |
| **1** | Purga de ficheiros obsoletos | 15 min | Aprovação |
| **2** | Consolidação de documentação `.md` | 20 min | Fase 1 |
| **3** | Criação de nova estrutura de pastas | 10 min | Fase 2 |
| **4** | Migração de ficheiros com re-exports | 30 min | Fase 3 |
| **5** | Atualização de `tsconfig.json` | 5 min | Fase 4 |
| **6** | Build de validação | 5 min | Fase 5 |
| **7** | Testes funcionais | 10 min | Fase 6 |

**Tempo Total Estimado:** ~1h30

### 5.2 🛡️ Checklist de Segurança Pré-Execução

- [ ] Backup do workspace criado
- [ ] `git status` limpo (sem alterações pendentes)
- [ ] Branch dedicada criada (`feat/workspace-reorganization`)
- [ ] Build atual passa (`npm run build` ✅)
- [ ] Testes passam (`npm run test:run`)

### 5.3 ⚠️ Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Quebra de imports | Média | Alto | Re-exports temporários |
| Build falha | Baixa | Alto | Rollback via git |
| Perda de funcionalidade | Baixa | Crítico | Testes após cada fase |

---

## 📌 DECISÕES PENDENTES PARA APROVAÇÃO

1. **Eliminar** `.documentation_archive_20260115_153301/`? (620KB de docs arquivados)
2. **Eliminar** série `LIFECYCLE_MANAGER_*.md` (8 ficheiros)?
3. **Criar** `src/core/` e `src/services/` ou manter estrutura atual mais flat?
4. **Renomear** `seed-from-catalog.ts` → `seed.ts` ou atualizar `package.json`?
5. **Mover** `components/` para estrutura `ui/` + `modules/`?

---

**⏳ AGUARDO APROVAÇÃO PARA INICIAR EXECUÇÃO**

*Documento gerado em: 15/01/2026*  
*Próxima revisão: Após feedback do stakeholder*
