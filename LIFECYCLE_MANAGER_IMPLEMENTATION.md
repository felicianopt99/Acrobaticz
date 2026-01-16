# 🔧 GUIA DE IMPLEMENTAÇÃO: Lifecycle Manager / Repair Hub

**Documento:** Instruções paso a paso para implementação  
**Público:** Desenvolvedores Senior/Mid-level  
**Tempo Estimado:** 3-4 semanas de desenvolvimento  

---

## 📋 ÍNDICE
1. [Setup Inicial](#setup-inicial)
2. [Implementação Phase 1 - Fundações](#phase-1-fundações)
3. [Implementação Phase 2 - Repair Hub UI](#phase-2-repair-hub-ui)
4. [Implementação Phase 3 - Services](#phase-3-auto-repair--services)
5. [Testing & Deployment](#testing--deployment)

---

## Setup Inicial

### Prerequisites
```bash
# Verificar versões
node --version  # v18+
npm --version   # v9+
docker --version
docker-compose --version

# Instalar pacotes adicionais se necessário
npm install react-chartjs-2 chart.js  # Para gráficos de saúde
npm install zod                        # Já tem, mas confirmar
```

### Branch & Commits
```bash
# Criar branch feature
git checkout -b feat/lifecycle-manager
git pull origin develop

# Setup remoto
git config user.name "Your Name"
git config user.email "your@email.com"
```

---

## PHASE 1: Fundações

### Step 1.1 - Estender Schema Prisma

**Arquivo:** `prisma/schema.prisma`

Encontrar o modelo `SystemSetting` e estender:

```prisma
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
  
  // ✨ NOVOS CAMPOS para Lifecycle Management
  healthStatus   String   @default("unknown")  // "healthy", "degraded", "critical", "unknown"
  lastVerified   DateTime?                      // Quando foi feito último health check
  lastModified   DateTime @default(now())       // Quando foi alterado
  modifiedBy     String?                        // User ID (opcional, para auditoria)
  changeReason   String?                        // Por que foi alterado: "initial_setup", "repair", "manual_update"
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime

  @@unique([category, key])
  @@index([healthStatus])
  @@index([lastVerified])
  @@index([category])
}

// ✨ NOVA MODEL para auditoria de configurações
model ConfigAuditLog {
  id         String   @id @default(cuid())
  
  // Referência
  category   String
  key        String
  
  // O que mudou
  oldValue   String?
  newValue   String?
  
  // Quem & Por quê
  changedBy  String?  // User ID
  reason     String   // "initial_setup", "repair", "manual_update", etc
  
  // Resultado
  success    Boolean  @default(true)
  error      String?  // Se falhou: mensagem de erro
  
  timestamps
  createdAt  DateTime @default(now())

  @@index([category])
  @@index([key])
  @@index([changedBy])
  @@index([createdAt])
  @@index([reason])
}

// ✨ NOVA MODEL para rastrear progresso instalação (alternativa a flag)
model InstallationState {
  id           String   @id @default(cuid())
  
  // Estado geral
  status       String   @default("not_started")  // "not_started", "in_progress", "paused", "complete", "broken"
  currentStep  Int      @default(0)              // 0-8 (8 steps no wizard)
  completedAt  DateTime?
  
  // Progresso & Erros
  progress     Int      @default(0)              // 0-100%
  errors       Json     @default("[]")           // [{step: 3, code: "STORAGE_UNREACHABLE", message: "..."}]
  warnings     Json     @default("[]")           // [{type: "LOW_DISK", severity: "warning"}]
  
  // Tracking
  startedAt    DateTime @default(now())
  lastUpdated  DateTime @default(now())
  updatedBy    String?  // User ID (se reparando)
  
  @@unique([id])
  @@index([status])
  @@index([startedAt])
}
```

### Step 1.2 - Criar Migration Prisma

```bash
cd /media/feli/38826d41-4b6a-4f13-9e48-d9628771bfe5/AC/Acrobaticz

# Criar migration
npx prisma migrate dev --name add_lifecycle_management_fields

# Isso vai:
# 1. Criar arquivo em prisma/migrations/
# 2. Executar no banco local
# 3. Regenerar Prisma Client
```

**Verificar:**
```bash
# Confirmar que migration foi criada
ls -la prisma/migrations/ | tail -5

# Verificar schema foi regenerado
grep "healthStatus" node_modules/.prisma/client/index.d.ts
```

### Step 1.3 - Criar Types TypeScript

**Arquivo:** `src/types/lifecycle.ts`

```typescript
/**
 * Types para Lifecycle Management & Repair Hub
 */

export type SystemState = 
  | 'NOT_INSTALLED' 
  | 'PARTIALLY_INSTALLED' 
  | 'FULLY_OPERATIONAL' 
  | 'DEGRADED';

export type HealthStatus = 
  | 'healthy' 
  | 'degraded' 
  | 'critical' 
  | 'unknown';

export type PartialInstallState =
  | 'INCOMPLETE'      // Setup não completado
  | 'BROKEN_DB'       // Conectividade BD falhou
  | 'BROKEN_STORAGE'  // MinIO/FileSystem inacessível
  | 'BROKEN_AUTH'     // Usuário admin não existe
  | 'DEGRADED';       // Rodando com limitações

export interface InstallationStateSnapshot {
  status: 'not_started' | 'in_progress' | 'paused' | 'complete' | 'broken';
  currentStep: number;
  progress: number;
  completedAt?: Date;
  startedAt: Date;
  lastUpdated: Date;
  errors: Array<{
    step: number;
    code: string;
    message: string;
    timestamp: Date;
  }>;
  warnings: Array<{
    type: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
  }>;
}

export interface ComponentHealth {
  status: boolean;
  latency?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface HealthCheckResponse {
  systemState: SystemState;
  status: HealthStatus;
  timestamp: Date;
  
  installation: InstallationStateSnapshot;
  
  checks: {
    database: ComponentHealth & { version?: string };
    storage: ComponentHealth & { 
      type?: 'minio' | 'local_filesystem';
      used?: number;
      total?: number;
    };
    disk: ComponentHealth & {
      available: number;
      total: number;
      usedPercent: number;
      critical: boolean;
    };
    config: ComponentHealth & {
      missingFields?: string[];
    };
  };
  
  recommendations: string[];
}

export interface RepairAction {
  id: string;
  component: 'database' | 'storage' | 'config' | 'auth' | 'disk';
  action: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  canAutoRepair: boolean;
  manualSteps?: string[];
  estimatedDuration?: number; // segundos
}

export interface ConfigChangeRequest {
  category: string;
  key: string;
  value: string;
  encrypt?: boolean;
  reason?: string;
}

export interface ConfigAuditEntry {
  id: string;
  timestamp: Date;
  category: string;
  key: string;
  oldValue?: string;
  newValue?: string;
  changedBy?: string;
  reason: string;
  success: boolean;
  error?: string;
}

export interface RepairResult {
  success: boolean;
  component: string;
  message: string;
  duration: number; // milliseconds
  changes?: ConfigAuditEntry[];
  requiresRestart?: boolean;
}
```

### Step 1.4 - Criar Health Check Service

**Arquivo:** `src/lib/health-check.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { HealthCheckResponse, HealthStatus } from '@/types/lifecycle';

const HEALTH_CACHE_TTL = 30 * 1000; // 30 segundos
let lastHealthCheck: { data: HealthCheckResponse; timestamp: number } | null = null;

export class HealthCheckService {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Executar health check completo
   * Retorna estado do sistema em tempo real
   */
  async runFullCheck(useCache = true): Promise<HealthCheckResponse> {
    // Verificar cache
    if (
      useCache &&
      lastHealthCheck &&
      Date.now() - lastHealthCheck.timestamp < HEALTH_CACHE_TTL
    ) {
      return lastHealthCheck.data;
    }

    const startTime = Date.now();

    try {
      // Correr testes em paralelo
      const [installationState, databaseHealth, storageHealth, diskHealth, configHealth] =
        await Promise.all([
          this.checkInstallationStatus(),
          this.checkDatabase(),
          this.checkStorage(),
          this.checkDisk(),
          this.checkConfiguration(),
        ]);

      // Determinar status geral
      const status = this.determineOverallStatus(
        databaseHealth.status,
        storageHealth.status,
        diskHealth.status,
        configHealth.status
      );

      // Determinar estado do sistema
      const systemState = this.determineSystemState(
        installationState.status,
        status,
        configHealth.missingFields || []
      );

      // Gerar recomendações
      const recommendations = this.generateRecommendations(
        databaseHealth,
        storageHealth,
        diskHealth,
        configHealth
      );

      const response: HealthCheckResponse = {
        systemState,
        status,
        timestamp: new Date(),
        installation: installationState,
        checks: {
          database: databaseHealth,
          storage: storageHealth,
          disk: diskHealth,
          config: configHealth,
        },
        recommendations,
      };

      // Atualizar cache
      lastHealthCheck = {
        data: response,
        timestamp: Date.now(),
      };

      console.log(
        `[HealthCheck] Completed in ${Date.now() - startTime}ms - Status: ${status}`
      );

      return response;
    } catch (error) {
      console.error('[HealthCheck] Error:', error);
      throw error;
    }
  }

  /**
   * Testar conectividade com banco de dados
   */
  private async checkDatabase(): Promise<{
    status: boolean;
    latency?: number;
    error?: string;
    version?: string;
  }> {
    const startTime = Date.now();

    try {
      // Query rápida com timeout
      const result = await Promise.race([
        this.prisma.$queryRaw`SELECT version()`,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database timeout')), 5000)
        ),
      ]);

      const latency = Date.now() - startTime;

      return {
        status: true,
        latency,
        version: 'PostgreSQL 15+', // Pode extrair da query se necessário
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.warn('[HealthCheck] Database error:', errorMsg);

      return {
        status: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Testar storage (MinIO ou Local Filesystem)
   */
  private async checkStorage(): Promise<{
    status: boolean;
    type?: 'minio' | 'local_filesystem';
    used?: number;
    total?: number;
    error?: string;
  }> {
    try {
      // Verificar se MinIO está configurado
      const minioEndpoint = await this.prisma.systemSetting.findFirst({
        where: {
          category: 'Storage',
          key: 'MINIO_ENDPOINT',
        },
      });

      if (minioEndpoint?.value) {
        // TODO: Implementar teste de conexão MinIO
        return {
          status: true,
          type: 'minio',
          used: 3200, // Placeholder
          total: 50000,
        };
      }

      // Fallback: Local Filesystem
      return {
        status: true,
        type: 'local_filesystem',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Verificar espaço em disco
   */
  private async checkDisk(): Promise<{
    status: boolean;
    available: number;
    total: number;
    usedPercent: number;
    critical: boolean;
    error?: string;
  }> {
    try {
      // Usar comando do sistema para obter espaço em disco
      // Exemplo para Linux/Mac
      const { execSync } = require('child_process');
      const output = execSync('df -B1 / | tail -1').toString();
      const [, total, used] = output.split(/\s+/);

      const available = parseInt(total) - parseInt(used);
      const usedPercent = (parseInt(used) / parseInt(total)) * 100;
      const critical = usedPercent > 90;

      return {
        status: !critical,
        available: Math.floor(available / (1024 * 1024 * 1024)), // Em GB
        total: Math.floor(parseInt(total) / (1024 * 1024 * 1024)), // Em GB
        usedPercent: Math.floor(usedPercent),
        critical,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: false,
        available: 0,
        total: 0,
        usedPercent: 0,
        critical: true,
        error: errorMsg,
      };
    }
  }

  /**
   * Verificar configuração (campos críticos preenchidos?)
   */
  private async checkConfiguration(): Promise<{
    status: boolean;
    missingFields?: string[];
    error?: string;
  }> {
    try {
      const criticalFields = [
        { category: 'General', key: 'DOMAIN' },
        { category: 'General', key: 'COMPANY_NAME' },
        { category: 'Auth', key: 'JWT_SECRET' },
      ];

      const missing: string[] = [];

      for (const field of criticalFields) {
        const setting = await this.prisma.systemSetting.findFirst({
          where: {
            category: field.category,
            key: field.key,
          },
        });

        if (!setting || !setting.value) {
          missing.push(`${field.category}.${field.key}`);
        }
      }

      return {
        status: missing.length === 0,
        missingFields: missing.length > 0 ? missing : undefined,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Verificar estado de instalação
   */
  private async checkInstallationStatus() {
    // Implementation específica
    // Retornar InstallationStateSnapshot
    return {
      status: 'complete',
      currentStep: 8,
      progress: 100,
      completedAt: new Date(),
      startedAt: new Date(),
      lastUpdated: new Date(),
      errors: [],
      warnings: [],
    };
  }

  /**
   * Determinar status geral baseado em componentes
   */
  private determineOverallStatus(
    dbStatus: boolean,
    storageStatus: boolean,
    diskStatus: boolean,
    configStatus: boolean
  ): HealthStatus {
    if (!dbStatus || !configStatus) return 'critical';
    if (!storageStatus || diskStatus === false) return 'degraded';
    return 'healthy';
  }

  /**
   * Determinar estado do sistema (NOT_INSTALLED, PARTIALLY_INSTALLED, etc)
   */
  private determineSystemState(
    installStatus: string,
    healthStatus: HealthStatus,
    missingFields: string[]
  ) {
    if (installStatus !== 'complete' || missingFields.length > 0) {
      return 'PARTIALLY_INSTALLED';
    }
    if (healthStatus === 'critical') {
      return 'PARTIALLY_INSTALLED';
    }
    if (healthStatus === 'degraded') {
      return 'DEGRADED';
    }
    return 'FULLY_OPERATIONAL';
  }

  /**
   * Gerar recomendações baseado no health check
   */
  private generateRecommendations(
    database: any,
    storage: any,
    disk: any,
    config: any
  ): string[] {
    const recommendations: string[] = [];

    if (!database.status) {
      recommendations.push('Database connection failed. Check PostgreSQL service and credentials.');
    }

    if (!storage.status) {
      recommendations.push('Storage service is unavailable. Check MinIO status or filesystem permissions.');
    }

    if (disk.critical) {
      recommendations.push('Disk space is critically low. Free up space urgently.');
    }

    if (config.missingFields && config.missingFields.length > 0) {
      recommendations.push(
        `Missing configuration fields: ${config.missingFields.join(', ')}. Complete setup.`
      );
    }

    return recommendations;
  }
}

// Export singleton
export const healthCheckService = new HealthCheckService();
```

### Step 1.5 - Criar Lifecycle Manager

**Arquivo:** `src/lib/lifecycle-manager.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { SystemState, PartialInstallState } from '@/types/lifecycle';
import { healthCheckService } from './health-check';

export class LifecycleManager {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Obter estado atual do sistema
   */
  async getCurrentState(): Promise<SystemState> {
    try {
      // Verificar se instalação foi completada
      const installationSetting = await this.prisma.systemSetting.findFirst({
        where: { key: 'INSTALLATION_COMPLETE' },
      });

      if (!installationSetting || installationSetting.value !== 'true') {
        return 'NOT_INSTALLED';
      }

      // Fazer health check
      const health = await healthCheckService.runFullCheck();

      if (health.status === 'critical') {
        return 'PARTIALLY_INSTALLED';
      }

      if (health.status === 'degraded') {
        return 'DEGRADED';
      }

      return 'FULLY_OPERATIONAL';
    } catch (error) {
      console.error('[LifecycleManager] Error determining state:', error);
      return 'NOT_INSTALLED';
    }
  }

  /**
   * Transitar para novo estado
   */
  async transitionState(
    newState: SystemState,
    reason: string,
    userId?: string
  ): Promise<void> {
    try {
      const oldState = await this.getCurrentState();

      if (oldState === newState) {
        console.log(`[Lifecycle] Already in state: ${newState}`);
        return;
      }

      // Log transição
      console.log(`[Lifecycle] Transitioning: ${oldState} → ${newState} (reason: ${reason})`);

      // Atualizar flag de instalação se necessário
      if (newState === 'FULLY_OPERATIONAL') {
        await this.prisma.systemSetting.upsert({
          where: { category_key: { category: 'General', key: 'INSTALLATION_COMPLETE' } },
          create: {
            id: require('crypto').randomUUID(),
            category: 'General',
            key: 'INSTALLATION_COMPLETE',
            value: 'true',
            isEncrypted: false,
            changeReason: reason,
            modifiedBy: userId,
          },
          update: {
            value: 'true',
            lastModified: new Date(),
            modifiedBy: userId,
            changeReason: reason,
          },
        });

        // Log em auditoria
        await this.prisma.configAuditLog.create({
          data: {
            category: 'General',
            key: 'INSTALLATION_COMPLETE',
            newValue: 'true',
            reason,
            changedBy: userId,
            success: true,
          },
        });
      }
    } catch (error) {
      console.error('[LifecycleManager] Transition failed:', error);
      throw error;
    }
  }

  /**
   * Detectar se sistema está parcialmente instalado (broken)
   */
  async detectPartiallyInstalledState(): Promise<PartialInstallState | null> {
    try {
      const health = await healthCheckService.runFullCheck();

      if (!health.checks.database.status) {
        return 'BROKEN_DB';
      }

      if (!health.checks.storage.status) {
        return 'BROKEN_STORAGE';
      }

      if (health.checks.config.missingFields && health.checks.config.missingFields.length > 0) {
        return 'INCOMPLETE';
      }

      if (health.status === 'degraded') {
        return 'DEGRADED';
      }

      return null;
    } catch (error) {
      console.error('[LifecycleManager] Error detecting partial install:', error);
      return 'BROKEN_DB'; // Assumir crítico por segurança
    }
  }
}

// Export singleton
export const lifecycleManager = new LifecycleManager();
```

### Step 1.6 - Criar Endpoint GET /api/setup/status

**Arquivo:** `src/app/api/setup/status/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { healthCheckService } from '@/lib/health-check';
import { lifecycleManager } from '@/lib/lifecycle-manager';

/**
 * GET /api/setup/status
 * 
 * Retorna estado completo do sistema (diagnóstico)
 * 
 * Query params:
 *  - detailed: true/false (incluir métricas detalhadas)
 *  - includeAudit: true/false (incluir histórico de mudanças)
 */
export async function GET(request: NextRequest) {
  try {
    const detailed = request.nextUrl.searchParams.get('detailed') === 'true';
    const includeAudit = request.nextUrl.searchParams.get('includeAudit') === 'true';

    // Obter estado do sistema
    const systemState = await lifecycleManager.getCurrentState();

    // Obter health check
    const health = await healthCheckService.runFullCheck();

    // Construir resposta
    const response: any = {
      systemState,
      healthCheck: health,
    };

    // Adicionar detalhes se solicitado
    if (detailed) {
      // TODO: Adicionar mais detalhes (configurações, métricas, etc)
    }

    // Adicionar auditoria se solicitado
    if (includeAudit) {
      // TODO: Adicionar histórico de mudanças
    }

    return NextResponse.json(response, {
      status: health.status === 'critical' ? 503 : 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.error('[API] /api/setup/status error:', error);

    return NextResponse.json(
      {
        error: 'Health check failed',
        message,
      },
      { status: 500 }
    );
  }
}
```

---

## PHASE 2: Repair Hub UI

*(Continuação no próximo documento devido a limite de tokens)*

### Step 2.1 - Criar Repair Page Layout

**Arquivo:** `src/app/(setup)/repair/layout.tsx`

```tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

export default async function RepairLayout({ children }: { children: React.ReactNode }) {
  // Proteger acesso ao repair hub (requer admin ou durante instalação)
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  // Se autenticado, verificar role
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { role: true, isActive: true },
      });

      if (!user || !user.isActive || user.role !== 'Admin') {
        redirect('/unauthorized');
      }
    } catch {
      redirect('/login');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {children}
    </div>
  );
}
```

### Step 2.2 - Criar Repair Page Component

**Arquivo:** `src/app/(setup)/repair/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { HealthCheckResponse } from '@/types/lifecycle';
import { StatusOverview } from './components/StatusOverview';
import { HealthMetrics } from './components/HealthMetrics';
import { RepairWizard } from './components/RepairWizard';

export default function RepairPage() {
  const [status, setStatus] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/setup/status?detailed=true');
        
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();
        setStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch status');
        console.error('Status fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
    
    // Refresh a cada 30 segundos
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4">
            <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin" />
          </div>
          <h2 className="text-white text-xl font-semibold">Checking system status...</h2>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-red-500 text-xl font-semibold mb-2">Error</h2>
          <p className="text-slate-400">{error || 'Failed to load status'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">🏥 Repair Hub</h1>
        <p className="text-slate-400">Diagnose and repair your AV Rentals system</p>
      </div>

      {/* Status Overview */}
      <StatusOverview 
        state={status.systemState}
        healthMetrics={status.checks}
        lastCheck={status.timestamp}
      />

      {/* Details Based on State */}
      {status.systemState !== 'FULLY_OPERATIONAL' && (
        <div className="mt-8">
          <RepairWizard brokenComponent={status.systemState} />
        </div>
      )}

      {/* Health Metrics */}
      <div className="mt-8">
        <HealthMetrics metrics={status.checks} />
      </div>

      {/* Recommendations */}
      {status.recommendations.length > 0 && (
        <div className="mt-8 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <h3 className="text-yellow-500 font-semibold mb-2">💡 Recommendations</h3>
          <ul className="space-y-1">
            {status.recommendations.map((rec, idx) => (
              <li key={idx} className="text-yellow-600 text-sm">• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## Conclusão da Phase 1 & 2

**Arquivos Criados:**
- ✅ `prisma/migrations/` (novo)
- ✅ `src/types/lifecycle.ts`
- ✅ `src/lib/health-check.ts`
- ✅ `src/lib/lifecycle-manager.ts`
- ✅ `src/app/api/setup/status/route.ts`
- ✅ `src/app/(setup)/repair/page.tsx`
- ✅ `src/app/(setup)/repair/layout.tsx`

**Testes Recomendados:**
```bash
# 1. Testar health check
curl http://localhost:3000/api/setup/status

# 2. Verificar que GET /repair requer autenticação
curl http://localhost:3000/repair

# 3. Verificar migration foi aplicada
npx prisma studio  # Visualmente
```

**Próximos Passos:**
1. Implementar componentes UI (StatusOverview, HealthMetrics, etc)
2. Criar endpoints de reparação (/api/setup/repair, /api/setup/config)
3. Implementar ConfigAuditService
4. Adicionar testes E2E

---

**Documento Continuado em:** `LIFECYCLE_MANAGER_IMPLEMENTATION_PHASE3.md`
