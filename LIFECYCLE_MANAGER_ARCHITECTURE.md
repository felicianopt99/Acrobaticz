# 🏗️ Plano Arquitectural: Lifecycle Manager / Repair Hub

**Status:** Documento de Arquitetura Senior  
**Data:** 15/01/2026  
**Escopo:** Transformação do Setup Wizard em Lifecycle Management System  
**Objetivo:** Detetar automaticamente estado do sistema e oferecer diagnóstico, reparação e atualização

---

## 📋 ÍNDICE
1. [Análise do Estado Atual](#1-análise-do-estado-atual)
2. [Matriz de Estados & Transições](#2-matriz-de-estados--transições)
3. [Arquitetura de Solução](#3-arquitetura-de-solução)
4. [Endpoints de Diagnóstico](#4-endpoints-de-diagnóstico)
5. [Fluxo de Reparação](#5-fluxo-de-reparação)
6. [Design UX/UI](#6-design-uxui)
7. [Cronograma de Implementação](#7-cronograma-de-implementação)

---

## 1. ANÁLISE DO ESTADO ATUAL

### 1.1 Arquitetura Atual

#### **Ponto de Entrada (install/page.tsx)**
```
┌─────────────────────────────────────────┐
│ /install/page.tsx (Client Component)    │
├─────────────────────────────────────────┤
│ • 8 steps sequenciais (wizard linear)    │
│ • useEffect faz fallback check           │
│ • /api/config?...INSTALLATION_COMPLETE  │
│ • POST /api/setup/complete (submit)     │
│ • Redireciona para /dashboard            │
└─────────────────────────────────────────┘
```

#### **Detecção de Instalação (proxy.ts)**
```
┌─────────────────────────────────────────┐
│ Middleware Pattern (proxy.ts)            │
├─────────────────────────────────────────┤
│ Cookie: app_installed = 'true'          │
│                                         │
│ Sistema NOT Instalado (sem cookie):     │
│  GET / → /install                       │
│  Rotas protegidas → /install            │
│                                         │
│ Sistema Instalado (com cookie):         │
│  GET /install → /dashboard              │
│  Rotas protegidas → Permitir            │
└─────────────────────────────────────────┘
```

#### **Configurações (SystemSetting Model)**
```prisma
model SystemSetting {
  id             String   @id
  category       String
  key            String
  value          String?           # Plaintext
  isEncrypted    Boolean  @default(false)
  encryptedValue String?           # AES-256 encrypted
  description    String?
  isEditable     Boolean  @default(true)
  version        Int      @default(1)
  createdAt      DateTime @default(now())
  updatedAt      DateTime
  @@unique([category, key])
}
```

**Campos Críticos:**
- ✅ `updatedAt` - Rastreamento de mudanças
- ✅ `version` - Suporte a versionamento
- ❌ `healthStatus` - **AUSENTE** (necessário para repair hub)
- ❌ `lastVerified` - **AUSENTE** (necessário para diagnóstico)

#### **Autenticação & Segurança (proxy.ts)**
- Verificação por **cookie `app_installed`** (server-side)
- **NO middleware.ts** encontrado (deprecated no Next.js 15+)
- Validações em `src/app/admin/layout.tsx` usando JWT
- **Risco:** Sem proteção específica para "Repair Mode"

### 1.2 Problemas Identificados

| Problema | Impacto | Criticalidade |
|----------|---------|-----------------|
| Instalador é **one-time only** | Sem capacidade de auto-reparação | 🔴 ALTA |
| Sem estado intermediate (partially installed) | Não detecta instalações quebradas | 🔴 ALTA |
| SystemSetting sem `healthStatus` | Impossível rastrear saúde | 🟡 MÉDIA |
| Sem diagnósticos DB/Storage | Erros ocultos durante operação | 🟡 MÉDIA |
| Sem "repair mode" UI | Admin não pode diagnosticar facilmente | 🟡 MÉDIA |
| POST /api/config sem auth | Qualquer pessoa pode alterar config | 🔴 ALTA |
| Sem histórico de mudanças config | Auditoria limitada | 🟡 MÉDIA |

---

## 2. MATRIZ DE ESTADOS & TRANSIÇÕES

### 2.1 Estados do Sistema

```
┌──────────────────────────────────────────────────────────────────┐
│                        3 ESTADOS PRINCIPAIS                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1️⃣  NOT_INSTALLED (Fresh)                              │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ • Sem cookie app_installed                             │   │
│  │ • SystemSetting sem INSTALLATION_COMPLETE              │   │
│  │ • Sem dados de usuário                                 │   │
│  │ • UI: Setup Wizard (steps 1-8)                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             ↓                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 2️⃣  PARTIALLY_INSTALLED (Broken/Incomplete)            │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ • SystemSetting.INSTALLATION_COMPLETE = 'false'        │   │
│  │ • Campos críticos faltam (DB, MinIO, etc)              │   │
│  │ • Erros detectados em health check                      │   │
│  │ • UI: Repair Dashboard (status + fix options)          │   │
│  │                                                         │   │
│  │ Sub-estados:                                           │   │
│  │  • INCOMPLETE: Setup não completado                    │   │
│  │  • BROKEN_DB: Conectividade DB falhou                 │   │
│  │  • BROKEN_STORAGE: MinIO/FileSystem inacessível       │   │
│  │  • DEGRADED: Rodando com limitações                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             ↓                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 3️⃣  FULLY_OPERATIONAL (Healthy)                        │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ • SystemSetting.INSTALLATION_COMPLETE = 'true'         │   │
│  │ • Health check ✓ (DB, Storage, Disk)                   │   │
│  │ • Admin autenticado                                     │   │
│  │ • UI: Dashboard + Repair Hub (opcional)                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Transições de Estado

```
┌─────────────────────────────────────────────────────────────────┐
│              MÁQUINA DE ESTADOS COM TRANSIÇÕES                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  NOT_INSTALLED                                                 │
│      │                                                         │
│      │ POST /api/setup/complete [válido]                       │
│      ├─────────────────────────────────────────┬──────────┐   │
│      │                                          │          │   │
│      ▼                                          ▼          ▼   │
│  PARTIALLY_INSTALLED           ──[reparo]──→ FULLY_OP      │   │
│      │                           ◄──[erro]─── │          │   │
│      │                                          │          │   │
│      └──────────────────────┬──────────────────┘          │   │
│                             │                             │   │
│      [GET /api/setup/status]│                             │   │
│         └─ BROKEN_DB        │                             │   │
│         └─ BROKEN_STORAGE   │                             │   │
│         └─ DEGRADED         │                             │   │
│         └─ INCOMPLETE       │                             │   │
│                                                            │   │
│  ┌────────────────────────────────────────────────────────┘   │
│  │                                                             │
│  └──→ FULLY_OPERATIONAL (Dashboard normal)                    │
│         │                                                     │
│         │ [Opção] Repair Hub (diagnósticos periódicos)      │
│         │                                                     │
│         └─ Health check falha: PARTIALLY_INSTALLED           │
│                                                               │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Comportamento da UI por Estado

#### **NOT_INSTALLED**
```
┌─────────────────────────────────────────────┐
│   🔧 Setup Wizard (Existente)               │
│                                             │
│  [Step 1/8] General Settings                │
│  ⚙️ Domain, Company Name                   │
│  🔐 JWT Secret                              │
│  🌐 Translation (DeepL)                     │
│  🎨 Branding                                │
│  📦 Storage (MinIO)                         │
│  🦆 DuckDNS                                 │
│  📊 Data Seeding                            │
│  ✅ Review & Install                        │
│                                             │
│         [← Back] [Next →]                   │
└─────────────────────────────────────────────┘
```

#### **PARTIALLY_INSTALLED**
```
┌─────────────────────────────────────────────────┐
│  ⚠️  REPAIR MODE - Sistema Incompleto           │
├─────────────────────────────────────────────────┤
│                                                 │
│  Status: BROKEN_DB                             │
│                                                 │
│  ❌ Database Connection: FAILED                 │
│     • Tentativa: postgresql://...              │
│     • Erro: Connection refused (Port 5432)     │
│     • Última verificação: 2 min atrás          │
│                                                 │
│     [🔧 Tentar Reparar]  [⚙️ Editar Config]   │
│                                                 │
│  ✅ Storage: OK (Local filesystem)             │
│  ✅ Admin User: Created                         │
│  ⚠️  Disk Space: 2.5GB available (Low!)        │
│                                                 │
│     ┌──────────────────────────────────────┐   │
│     │ Sugestões de Reparação:              │   │
│     │ 1. Verificar status Docker/Database  │   │
│     │ 2. Reconfigurar DATABASE_URL         │   │
│     │ 3. Executar migração Prisma          │   │
│     └──────────────────────────────────────┘   │
│                                                 │
│         [↺ Re-testar]  [← Voltar]             │
└─────────────────────────────────────────────────┘
```

#### **FULLY_OPERATIONAL**
```
┌─────────────────────────────────────────────────┐
│  ✅ SISTEMA OPERACIONAL                         │
├─────────────────────────────────────────────────┤
│                                                 │
│  Status: HEALTHY                               │
│  Last Check: Now (5m ago)                      │
│                                                 │
│  ✅ Database: Online (latency: 45ms)           │
│  ✅ Storage: MinIO (3.2GB used / 50GB)         │
│  ✅ Disk Space: 85GB free (Healthy)            │
│  ✅ Admin User: Configured                     │
│                                                 │
│  ┌────────────────────────────────────┐        │
│  │ 🔧 Repair Hub (Opcional - Admin)   │        │
│  ├────────────────────────────────────┤        │
│  │ • Diagnósticos detalhados          │        │
│  │ • Ajuste de configurações          │        │
│  │ • Histórico de mudanças            │        │
│  │ • Health check automático          │        │
│  └────────────────────────────────────┘        │
│                                                 │
│         [🏠 Dashboard]  [⚙️ Admin]             │
└─────────────────────────────────────────────────┘
```

---

## 3. ARQUITETURA DE SOLUÇÃO

### 3.1 Extensões ao Schema Prisma

```prisma
# Adicionar a model SystemSetting:

model SystemSetting {
  id             String   @id
  category       String
  key            String
  value          String?
  isEncrypted    Boolean  @default(false)
  encryptedValue String?
  description    String?
  isEditable     Boolean  @default(true)
  version        Int      @default(1)
  
  # ✨ NOVOS CAMPOS para Lifecycle Management
  healthStatus   String   @default("unknown")  # "healthy", "degraded", "critical"
  lastVerified   DateTime?                      # Quando foi último health check
  lastModified   DateTime @default(now())       # Quando foi alterado
  modifiedBy     String?                        # User ID que modificou
  changeReason   String?                        # Por que foi alterado
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime

  @@unique([category, key])
  @@index([healthStatus])
  @@index([lastVerified])
}

# Nova model para auditoria de config

model ConfigAuditLog {
  id         String   @id
  settingId  String
  oldValue   String?
  newValue   String?
  changedBy  String?  # User ID
  reason     String?  # "initial_setup", "repair", "update", etc.
  success    Boolean  @default(true)
  error      String?  # Se falhou
  createdAt  DateTime @default(now())

  @@index([settingId])
  @@index([changedBy])
  @@index([createdAt])
}

# Model para rastrear estado instalação (alternativa a flag)

model InstallationState {
  id           String   @id @default(cuid())
  step         Int      # 0-8 (por referência)
  status       String   # "not_started", "in_progress", "paused", "complete", "broken"
  completedAt  DateTime?
  lastUpdated  DateTime @default(now())
  errors       Json     @default("[]")  # [{step: 1, error: "..."}]
  progress     Int      @default(0)     # 0-100%

  @@unique([step]) # Uma por instalação
}
```

### 3.2 Estrutura de Diretórios (Novos)

```
src/
├── app/
│   ├── (setup)/
│   │   ├── install/              (Existente)
│   │   │   └── page.tsx
│   │   │
│   │   └── repair/               (NOVO - Repair Hub)
│   │       ├── page.tsx
│   │       ├── components/
│   │       │   ├── StatusOverview.tsx
│   │       │   ├── HealthMetrics.tsx
│   │       │   ├── RepairWizard.tsx
│   │       │   ├── ConfigEditor.tsx
│   │       │   └── AuditLog.tsx
│   │       └── layout.tsx
│   │
│   └── api/
│       └── setup/
│           ├── complete/         (Existente)
│           │   └── route.ts
│           │
│           ├── status/           (NOVO - Diagnóstico)
│           │   └── route.ts
│           │
│           ├── repair/           (NOVO - Reparação)
│           │   └── route.ts
│           │
│           └── config/           (NOVO - Gerenciar)
│               └── route.ts
│
├── lib/
│   ├── config-service.ts         (Existente - estender)
│   │
│   ├── lifecycle-manager.ts      (NOVO - Orquestração)
│   │
│   ├── health-check.ts           (NOVO - Diagnósticos)
│   │
│   ├── repair-service.ts         (NOVO - Reparação)
│   │
│   └── config-audit.ts           (NOVO - Auditoria)
│
└── types/
    └── lifecycle.ts              (NOVO - Types)
```

### 3.3 Serviços Core (Pseudo-código)

#### **health-check.ts**
```typescript
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: DateTime;
  checks: {
    database: { status: boolean; latency?: number; error?: string };
    storage: { status: boolean; type: string; error?: string };
    disk: { status: boolean; available: number; percent: number };
    config: { status: boolean; missing?: string[] };
  };
  recommendations: string[];
}

export class HealthCheckService {
  async runFullCheck(): Promise<HealthStatus>;
  async checkDatabase(): Promise<DatabaseHealth>;
  async checkStorage(): Promise<StorageHealth>;
  async checkDisk(): Promise<DiskHealth>;
  async detectBrokenState(): Promise<PartialInstallState>;
}
```

#### **lifecycle-manager.ts**
```typescript
export type SystemState = 
  | 'NOT_INSTALLED' 
  | 'PARTIALLY_INSTALLED' 
  | 'FULLY_OPERATIONAL' 
  | 'DEGRADED';

interface StateTransition {
  from: SystemState;
  to: SystemState;
  trigger: 'setup_complete' | 'health_check_fail' | 'repair_success' | 'health_check_pass';
  timestamp: DateTime;
}

export class LifecycleManager {
  async getCurrentState(): Promise<SystemState>;
  async transitionState(trigger: string): Promise<StateTransition>;
  async recordStateChange(state: SystemState, reason: string);
  
  // Métodos de detecção
  private async detectInstallationState(): Promise<SystemState>;
  private async detectBrokenState(): Promise<boolean>;
}
```

#### **repair-service.ts**
```typescript
interface RepairAction {
  id: string;
  component: 'database' | 'storage' | 'config' | 'auth';
  action: string;
  severity: 'critical' | 'warning' | 'info';
  canAutoRepair: boolean;
  manualSteps?: string[];
}

export class RepairService {
  async diagnose(): Promise<RepairAction[]>;
  async attemptAutoRepair(action: RepairAction): Promise<{success: boolean; output: string}>;
  async updateConfiguration(key: string, value: string): Promise<void>;
  async validateRepair(component: string): Promise<boolean>;
}
```

---

## 4. ENDPOINTS DE DIAGNÓSTICO

### 4.1 GET `/api/setup/status` - Diagnóstico Completo

**Propósito:** Retornar estado completo do sistema em tempo real

**Acesso:** 
- ✅ Público durante NOT_INSTALLED
- ✅ Admin durante reparação
- ✅ Qualquer pessoa após instalação (apenas health check básico)

**Request:**
```http
GET /api/setup/status?detailed=true&includeAudit=false
```

**Response (200 - Healthy):**
```json
{
  "systemState": "FULLY_OPERATIONAL",
  "installationState": {
    "status": "complete",
    "completedAt": "2026-01-10T14:30:00Z",
    "progress": 100,
    "errors": []
  },
  "healthCheck": {
    "status": "healthy",
    "timestamp": "2026-01-15T12:00:00Z",
    "database": {
      "status": true,
      "latency": 45,
      "version": "15.2"
    },
    "storage": {
      "status": true,
      "type": "minio",
      "used": 3200,
      "total": 50000
    },
    "disk": {
      "status": true,
      "available": 85000,
      "percent": 65,
      "critical": false
    },
    "config": {
      "status": true,
      "missingFields": []
    }
  },
  "configurations": {
    "general": {
      "DOMAIN": "rentals.example.com",
      "COMPANY_NAME": "AV Pro Rentals",
      "lastVerified": "2026-01-15T11:55:00Z",
      "healthStatus": "healthy"
    },
    "auth": {
      "JWT_SECRET": "***ENCRYPTED***",
      "healthStatus": "healthy"
    },
    "storage": {
      "MINIO_ENDPOINT": "minio.example.com:9000",
      "healthStatus": "healthy"
    }
  },
  "recommendations": []
}
```

**Response (503 - Degraded/Broken):**
```json
{
  "systemState": "PARTIALLY_INSTALLED",
  "installationState": {
    "status": "broken",
    "completedAt": null,
    "progress": 75,
    "errors": [
      {
        "step": "storage",
        "error": "MinIO connection failed",
        "timestamp": "2026-01-15T10:30:00Z"
      }
    ]
  },
  "healthCheck": {
    "status": "critical",
    "timestamp": "2026-01-15T12:00:00Z",
    "database": {
      "status": true,
      "latency": 45
    },
    "storage": {
      "status": false,
      "type": "minio",
      "error": "Connection refused (Port 9000)"
    },
    "disk": {
      "status": true,
      "available": 2500,
      "percent": 95,
      "critical": true,
      "warning": "Low disk space"
    },
    "config": {
      "status": false,
      "missingFields": ["MINIO_ENDPOINT", "MINIO_BUCKET"]
    }
  },
  "recommendations": [
    "Storage service is unavailable. Check MinIO status.",
    "Disk space is critically low (2.5GB). Free up space.",
    "Reconfigure MinIO settings or switch to local storage."
  ]
}
```

### 4.2 POST `/api/setup/repair` - Auto-Reparação

**Propósito:** Tentar reparar componentes quebrados automaticamente

**Requer:** Admin authentication

**Request:**
```json
{
  "component": "database|storage|config|all",
  "action": "reconnect|reconfigure|validate",
  "params": {
    "DATABASE_URL": "postgresql://user:pass@host:5432/db"
  }
}
```

**Response:**
```json
{
  "success": true,
  "repaired": [
    {
      "component": "database",
      "status": "success",
      "message": "Database connection re-established",
      "latency": 52
    }
  ],
  "failed": [],
  "newSystemState": "FULLY_OPERATIONAL",
  "recommendations": []
}
```

### 4.3 POST `/api/setup/config` - Atualizar Configuração

**Propósito:** Alterar configurações sem quebrar o sistema

**Requer:** Admin authentication + CSRF token

**Request:**
```json
{
  "category": "Storage",
  "key": "MINIO_ENDPOINT",
  "value": "new-minio.example.com:9000",
  "encrypt": false,
  "reason": "Migração para novo servidor MinIO"
}
```

**Response:**
```json
{
  "success": true,
  "updated": {
    "key": "MINIO_ENDPOINT",
    "newValue": "***ENCRYPTED***",
    "timestamp": "2026-01-15T12:00:00Z"
  },
  "auditLog": {
    "id": "audit_12345",
    "changedBy": "admin_user",
    "reason": "Migração para novo servidor MinIO",
    "timestamp": "2026-01-15T12:00:00Z"
  },
  "requiresRestart": false,
  "recommendations": [
    "Restart MinIO connection pool for immediate effect"
  ]
}
```

### 4.4 GET `/api/setup/audit` - Histórico de Mudanças

**Propósito:** Auditoria completa de mudanças de configuração

**Requer:** Admin authentication

**Request:**
```http
GET /api/setup/audit?limit=50&since=2026-01-01
```

**Response:**
```json
{
  "logs": [
    {
      "id": "audit_12345",
      "timestamp": "2026-01-15T12:00:00Z",
      "user": "admin_user",
      "action": "updated",
      "component": "Storage",
      "key": "MINIO_ENDPOINT",
      "oldValue": "***ENCRYPTED***",
      "newValue": "***ENCRYPTED***",
      "reason": "Migração para novo servidor",
      "success": true
    }
  ],
  "total": 1,
  "moreAvailable": false
}
```

---

## 5. FLUXO DE REPARAÇÃO

### 5.1 User Journey: From Broken to Healthy

```
┌────────────────────────────────────────────────────────────────┐
│  DIAGRAMA DE FLUXO: Reparação de Sistema Quebrado              │
└────────────────────────────────────────────────────────────────┘

1. DETECÇÃO AUTOMÁTICA
   ┌──────────────────────────────────┐
   │ Health check (periódico ou login)│
   └────────────────┬─────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
    HEALTHY               BROKEN/DEGRADED
        │                       │
        │          ┌────────────┴────────────┐
        │          │                         │
        │      [Detect Sub-State]            │
        │      ├─ INCOMPLETE (setup não ok)  │
        │      ├─ BROKEN_DB (no connection)  │
        │      ├─ BROKEN_STORAGE (minio/fs)  │
        │      └─ DEGRADED (alguns erros)    │
        │                                    │
        │                    ▼               │
        │          ┌─────────────────────┐   │
        │          │ Suggestões:         │   │
        │          │ 1. Auto-repair (se) │   │
        │          │ 2. Manual steps     │   │
        │          │ 3. Config editor    │   │
        │          └─────────────────────┘   │
        │                    │                │
        │         ┌──────────┴──────────┐    │
        │         │                     │    │
        │     [AUTO]              [MANUAL]   │
        │         │                     │    │
        │     Try Fix             Open UI    │
        │         │                     │    │
        │         ├─ Reconnect DB       │    │
        │         ├─ Switch Storage     │    │
        │         ├─ Restart Services   │    │
        │         └─ Validate Config    │    │
        │         │                     │    │
        │         ▼                     ▼    │
        │     [Re-test]          [Admin    │
        │         │              Manually  │
        │         │              Edits]    │
        │         │                     │   │
        │         └──────────┬──────────┘   │
        │                    │              │
        │                    ▼              │
        │            ┌──────────────┐      │
        │            │ SUCCESS?     │      │
        │            └────┬─────┬───┘      │
        │                 │     │          │
        │             YES │     │ NO       │
        │                 │     │          │
        │             [SAVE]   [RETRY]    │
        │                 │     │          │
        │                 └─────┘          │
        │                    │             │
        │                    ▼             │
        │         [Log to Audit]          │
        │                    │             │
        └────────────────────┴─────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   OPERATIONAL   │
                    │  + Dashboard    │
                    └─────────────────┘
```

### 5.2 Configurações Dinâmicas sem Downtime

**Cenário:** Admin quer mudar DATABASE_URL em produção

```
┌─ ANTES (Atual): Requer reinício da aplicação
│
│  1. Admin edita .env.local
│  2. Faz deploy/restart
│  3. 5-10 minutos de downtime
│  4. Sistema volta online

┌─ DEPOIS (Proposto): Zero downtime
│
│  1. Admin acessa /repair/config
│  │
│  2. Seleciona "DATABASE_URL"
│  │
│  3. Valida nova string:
│  │  ├─ Testa conexão (timeout 5s)
│  │  ├─ Verifica esquema Prisma
│  │  └─ Confirma migrações compatíveis
│  │
│  4. Se OK:
│  │  ├─ Grava nova config em SystemSetting
│  │  ├─ Registra em ConfigAuditLog
│  │  ├─ Reconecta connection pool
│  │  └─ Testa 3 queries de teste
│  │
│  5. Se erro:
│  │  ├─ Reverte para versão anterior
│  │  ├─ Mostra erro específico
│  │  └─ Oferece troubleshooting
│
│  Resultado: ~2 segundos de latência, sem downtime
```

**Implementação:**

```typescript
// lib/repair-service.ts

export async function updateConfigurationSafely(
  category: string,
  key: string,
  newValue: string
) {
  // 1. Validar se é seguro alterar
  const isDangerous = isDangerousChange(category, key);
  if (isDangerous) {
    // Requer confirmação extra
    return { requiresConfirmation: true };
  }

  // 2. Fazer backup da config atual
  const oldSetting = await configService.get(category, key);
  
  // 3. Tentar nova config
  try {
    // Teste específico por tipo de config
    if (key === 'DATABASE_URL') {
      await testDatabaseConnection(newValue);
    } else if (key === 'MINIO_ENDPOINT') {
      await testMinIOConnection(newValue);
    }
    
    // 4. Aplicar a mudança
    await configService.set(category, key, newValue);
    
    // 5. Registrar auditoria
    await auditService.log({
      action: 'updated',
      component: category,
      key,
      oldValue,
      newValue,
      success: true
    });
    
    return { success: true };
  } catch (error) {
    // Reverter à config anterior
    await configService.set(category, key, oldSetting);
    
    // Registrar erro
    await auditService.log({
      action: 'attempted_update',
      component: category,
      key,
      success: false,
      error: error.message
    });
    
    throw error;
  }
}
```

---

## 6. DESIGN UX/UI

### 6.1 Componentes Novo (Repair Hub)

#### **StatusOverview.tsx** - Dashboard Status
```tsx
// Mostra estado global do sistema com badges

interface StatusOverviewProps {
  state: 'FULLY_OPERATIONAL' | 'PARTIALLY_INSTALLED' | 'NOT_INSTALLED';
  healthMetrics: HealthMetrics;
  lastCheck: DateTime;
}

export function StatusOverview({ state, healthMetrics, lastCheck }: StatusOverviewProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Badge Global Status */}
      <StatusBadge 
        status={state}
        emoji={state === 'FULLY_OPERATIONAL' ? '✅' : '⚠️'}
        label={state}
        details={`Last verified ${formatDistance(lastCheck)}`}
      />
      
      {/* Individual Component Badges */}
      <ComponentBadge
        label="Database"
        status={healthMetrics.database.status}
        latency={healthMetrics.database.latency}
        action={() => startRepair('database')}
      />
      
      <ComponentBadge
        label="Storage"
        status={healthMetrics.storage.status}
        size={`${healthMetrics.storage.used}GB / ${healthMetrics.storage.total}GB`}
        action={() => startRepair('storage')}
      />
      
      <ComponentBadge
        label="Disk"
        status={!healthMetrics.disk.critical}
        size={`${healthMetrics.disk.available}GB available`}
        warning={healthMetrics.disk.critical ? "⚠️ Low space" : null}
      />
    </div>
  );
}
```

**Visual:**
```
┌─────────────────────────────────────────────────────────┐
│  ✅ FULLY OPERATIONAL                                   │
│  Last check: 5 minutes ago                              │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ ✅ DB    │  │ ✅ MinIO │  │ ✅ Disk  │  │ ✅ Auth │ │
│  │ 45ms     │  │ 3.2 / 50 │  │ 85GB     │  │ OK      │ │
│  │ [Repair] │  │ [Repair] │  │          │  │ [Repair]│ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                                         │
│  [📊 Health Details]  [🔧 Repair Wizard]  [⚙️ Settings]│
└─────────────────────────────────────────────────────────┘
```

#### **HealthMetrics.tsx** - Gráficos Detalhados
```tsx
export function HealthMetrics({ metrics, timeRange }: HealthMetricsProps) {
  return (
    <div className="space-y-6">
      {/* Database Latency Chart */}
      <MetricChart
        title="Database Latency"
        data={metrics.databaseLatency}
        yAxis="milliseconds"
        threshold={100}
        color="blue"
      />
      
      {/* Storage Usage Chart */}
      <MetricChart
        title="Storage Usage"
        data={metrics.storageUsage}
        yAxis="GB"
        max={metrics.storageTotal}
        color="green"
      />
      
      {/* Error Trend */}
      <MetricChart
        title="Health Check Failures"
        data={metrics.errorTrend}
        yAxis="count"
        color="red"
      />
    </div>
  );
}
```

#### **RepairWizard.tsx** - Auto-Repair Assistant
```tsx
export function RepairWizard({ brokenComponent }: RepairWizardProps) {
  const [step, setStep] = useState(0);
  const [repairOptions, setRepairOptions] = useState<RepairAction[]>([]);
  
  useEffect(() => {
    // Diagnose broken component
    diagnoseBrokenComponent(brokenComponent).then(setRepairOptions);
  }, [brokenComponent]);

  return (
    <div className="space-y-4">
      {repairOptions.map((option, idx) => (
        <RepairActionCard
          key={option.id}
          action={option}
          onAutoRepair={() => attemptAutoRepair(option)}
          onManual={() => showManualSteps(option.manualSteps)}
          isExecuting={step === idx}
        />
      ))}
      
      {/* Progress */}
      <div className="h-2 bg-gray-200 rounded">
        <div 
          className="h-full bg-green-500 transition-all"
          style={{ width: `${(step / repairOptions.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
```

#### **ConfigEditor.tsx** - Editor de Configurações Seguro
```tsx
export function ConfigEditor({ category }: ConfigEditorProps) {
  const [config, setConfig] = useState<ConfigItem[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newValue, setNewValue] = useState('');

  const handleSave = async (key: string) => {
    // Validar antes de salvar
    const validation = await validateConfig(category, key, newValue);
    
    if (!validation.success) {
      toast.error(`Validation failed: ${validation.error}`);
      return;
    }

    // Mostrar confirmação
    const confirmed = await showConfirmDialog({
      title: `Update ${key}?`,
      description: validation.message,
      dangerous: validation.isDangerous
    });

    if (!confirmed) return;

    // Aplicar mudança
    try {
      await updateConfig(category, key, newValue, {
        reason: 'Manual update via Repair Hub'
      });
      
      toast.success(`${key} updated successfully`);
      setEditingKey(null);
    } catch (error) {
      toast.error(`Update failed: ${error.message}`);
    }
  };

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Key</th>
          <th>Value</th>
          <th>Status</th>
          <th>Last Modified</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {config.map(item => (
          <tr key={item.key}>
            <td>{item.key}</td>
            <td>
              {editingKey === item.key ? (
                <ConfigValueInput 
                  value={newValue}
                  onChange={setNewValue}
                  type={item.type}
                  isEncrypted={item.isEncrypted}
                />
              ) : (
                <span>{item.isEncrypted ? '***ENCRYPTED***' : item.value}</span>
              )}
            </td>
            <td>
              <HealthBadge status={item.healthStatus} />
            </td>
            <td>{formatDistance(item.lastModified)} ago</td>
            <td>
              {editingKey === item.key ? (
                <>
                  <button onClick={() => handleSave(item.key)}>Save</button>
                  <button onClick={() => setEditingKey(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditingKey(item.key)}>Edit</button>
                  <button onClick={() => showAuditLog(item.key)}>History</button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 6.2 Visual Design System

#### **Color Scheme para Estados**
```
┌────────────────────────────────────┐
│ Healthy      → Green (#10b981)     │
│ Degraded     → Yellow (#f59e0b)    │
│ Critical     → Red (#ef4444)       │
│ Unknown      → Gray (#6b7280)      │
│ Information  → Blue (#3b82f6)      │
└────────────────────────────────────┘
```

#### **Badge Components**
```
✅ HEALTHY        ⚠️  DEGRADED       ❌ CRITICAL      ❓ UNKNOWN
   Green              Amber             Red              Gray
   Hover: Details     Hover: Action     Hover: Help      Hover: Help
```

#### **Icons & Emojis Consistentes**
```
🔧 Repair/Fix
⚙️ Configuration
🏥 Health
📊 Metrics
📝 Audit/Logs
✅ Success
❌ Error
⚠️ Warning
💾 Save/Persist
🔄 Retry/Sync
```

---

## 7. CRONOGRAMA DE IMPLEMENTAÇÃO

### Fase 1: Fundações (1-2 semanas)
- [ ] 1.1 Estender `SystemSetting` schema (healthStatus, lastVerified, auditLog)
- [ ] 1.2 Criar `LifecycleManager` service
- [ ] 1.3 Criar `HealthCheckService` com testes para DB/Storage/Disk
- [ ] 1.4 Implementar `GET /api/setup/status` endpoint
- [ ] 1.5 Testes unitários para health checks

**Saídas:**
- ✅ Schema Prisma atualizado
- ✅ Service layer funcional
- ✅ Endpoint de diagnóstico básico

### Fase 2: Repair Hub UI (1-2 semanas)
- [ ] 2.1 Criar `src/app/(setup)/repair/page.tsx`
- [ ] 2.2 Implementar `StatusOverview.tsx` component
- [ ] 2.3 Implementar `HealthMetrics.tsx` com charts
- [ ] 2.4 Implementar `ConfigEditor.tsx` com validação
- [ ] 2.5 Autenticação Admin (verificar role)
- [ ] 2.6 E2E tests para fluxo de repair

**Saídas:**
- ✅ Interface visual Repair Hub
- ✅ Componentes reutilizáveis

### Fase 3: Auto-Repair & Config Management (1-2 semanas)
- [ ] 3.1 Criar `RepairService` com tentativas automáticas
- [ ] 3.2 Implementar `POST /api/setup/repair` endpoint
- [ ] 3.3 Implementar `POST /api/setup/config` com validação
- [ ] 3.4 Criar `ConfigAuditService` para logging
- [ ] 3.5 Implementar `GET /api/setup/audit` endpoint
- [ ] 3.6 Testes de segurança (CSRF, auth, input validation)

**Saídas:**
- ✅ Endpoints de reparação funcional
- ✅ Auditoria de configurações

### Fase 4: Integração & Polish (1 semana)
- [ ] 4.1 Integrar health check periódico (background job)
- [ ] 4.2 Notificações de estado degradado
- [ ] 4.3 Documentação de troubleshooting
- [ ] 4.4 Performance tunning
- [ ] 4.5 Testes de carga

**Saídas:**
- ✅ Sistema de Lifecycle Management completo
- ✅ Documentação
- ✅ Performance otimizado

---

## 8. RESTRIÇÕES & CONSIDERAÇÕES

### ✅ No Scope (Mantém Estabilidade)
- ✅ Reparação de dados existentes (backup/restore)
- ✅ Migração de schemas Prisma
- ✅ Multi-tenancy
- ✅ Novas integrações (deviations do atual)

### ⚠️ Cuidados de Segurança
```
🔴 CRÍTICO:
  1. POST /api/setup/config requer autenticação Admin + CSRF token
  2. Validar TODOS os inputs (especialmente DATABASE_URL, MINIO_ENDPOINT)
  3. Nunca retornar valores encryptados em plain text (sempre ***ENCRYPTED***)
  4. Log todas as mudanças em ConfigAuditLog
  5. Rate limit para /api/setup/repair (max 5 tentativas/min)

🟡 IMPORTANTE:
  6. Timeout para testes de conexão (5s max)
  7. Rollback automático se validação falhar
  8. Diferenciação de erros (não expor stack traces ao usuario)
  9. Notificar admin sobre mudanças criticas
```

### 📊 Monitoramento Contínuo
```typescript
// Rodar periodicamente (a cada 5 min em background)
async function backgroundHealthCheck() {
  const health = await healthCheckService.runFullCheck();
  
  if (health.status !== 'healthy') {
    // Gravar em SystemSetting.healthStatus
    // Notificar admin via notification
    // Log em sistema
    notifyAdmin({
      title: `System Status: ${health.status}`,
      severity: health.status === 'critical' ? 'high' : 'medium'
    });
  }
  
  // Registrar histórico para gráficos
  await storeHealthSnapshot(health);
}
```

---

## 9. PRÓXIMAS AÇÕES (IMEDIATAS)

### Pré-requisitos para Implementação
1. **Aprovação do Schema:** Confirmar extensões ao `SystemSetting` modelo
2. **Segurança:** Review de endpoints `/api/setup/*` com tim security
3. **Testing Strategy:** Definir approach para testes de reparação
4. **Deployment:** Plano de rollout sem downtime (migrations incremental)

### Tarefas Iniciais
```bash
# 1. Criar migration Prisma para novos campos
npx prisma migrate dev --name add_lifecycle_management_fields

# 2. Implementar HealthCheckService
# Arquivo: src/lib/health-check.ts

# 3. Implementar LifecycleManager
# Arquivo: src/lib/lifecycle-manager.ts

# 4. Criar endpoint GET /api/setup/status
# Arquivo: src/app/api/setup/status/route.ts
```

---

## 📚 REFERÊNCIAS

- [Prisma Schema Migrations](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/migration-history)
- [Next.js API Routes Security](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)
- [Health Check Best Practices](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Configuration Management Patterns](https://martinfowler.com/articles/patterns-of-distributed-systems/configuration.html)

---

**Documento Assinado:**  
Senior Architect - System Design  
Data: 15/01/2026  
Status: Ready for Implementation Review
