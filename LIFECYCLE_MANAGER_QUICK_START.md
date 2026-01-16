# ⚡ QUICK START: Lifecycle Manager Setup

**Documento:** Quick start guide & FAQ  
**Duração:** 30 minutos para compreender a solução  
**Público:** Qualquer membro do time  

---

## 🎯 5-MINUTE OVERVIEW

### O Problema em 2 Frases
1. O Setup Wizard é **one-time-only** - não funciona se algo der errado depois
2. Admin fica **sem ferramentas** para diagnosticar e reparar quando BD ou Storage falham

### A Solução em 2 Frases
1. Novo **Repair Hub** que deteta automaticamente se sistema está quebrado
2. Oferece **diagnósticos em tempo real** + **auto-repair** + **config editor** com validação

### Resultado
```
Antes:  BD cai → Admin não vê → App morre → 30 min de downtime
Depois: BD cai → Auto-detect (2s) → Repair Hub mostra → Admin clica "Fix" → Online (2 min)
```

---

## 🏗️ ARQUITETURA EM 30 SEGUNDOS

```
┌─────────────────────────────────────────────────────────────┐
│ Admin acessa /repair (requer login)                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Carrega GET /api/setup/status (diagnóstico completo)       │
│ Retorna: systemState, healthCheck, recommendations         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ UI mostra Status Badges (DB ✅/❌, Storage ✅/❌, etc)     │
│ Se quebrado: Mostra Repair Wizard com opções               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Admin escolhe:                                              │
│  • Auto-Repair (tenta arrumar automaticamente)             │
│  • Manual Edit (abre Config Editor)                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Se mudou config:                                            │
│  POST /api/setup/config {DATABASE_URL: "novo..."}         │
│  Sistema valida → Testa conexão → Aplica → Log auditoria  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Sistema é health check-ado novamente                        │
│ Muda de PARTIALLY_INSTALLED → FULLY_OPERATIONAL            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 ARQUIVOS PRINCIPAIS

### Novos Arquivos Criados (Você vai implementar estes)

```
src/
├── types/
│   └── lifecycle.ts                    ← Types (SystemState, HealthCheckResponse, etc)
│
├── lib/
│   ├── health-check.ts                 ← HealthCheckService (diagnósticos)
│   ├── lifecycle-manager.ts            ← LifecycleManager (state machine)
│   ├── repair-service.ts               ← RepairService (auto-repair) [Phase 3]
│   └── config-audit.ts                 ← ConfigAuditService (logging) [Phase 3]
│
└── app/
    └── (setup)/
        └── repair/                     ← Repair Hub UI
            ├── page.tsx
            ├── layout.tsx
            └── components/
                ├── StatusOverview.tsx
                ├── HealthMetrics.tsx
                ├── RepairWizard.tsx
                ├── ConfigEditor.tsx
                └── AuditLog.tsx
```

### Arquivos Existentes (Modificar)

```
prisma/
├── schema.prisma                       ← Estender SystemSetting + adicionar ConfigAuditLog
└── migrations/                         ← Nova migration criada

src/app/api/setup/
├── complete/route.ts                  ← Já existe (não mexer)
└── status/                             ← Novo endpoint
    └── route.ts                        ← GET /api/setup/status
```

---

## 🚀 COMO COMEÇAR (Hoje)

### 1. Entender o Design (30 min)
```bash
# Ler documentação arquitetura
cat LIFECYCLE_MANAGER_ARCHITECTURE.md

# Focar em:
# - Section 2: Matriz de Estados
# - Section 3: Arquitetura de Solução
# - Section 4: Endpoints de Diagnóstico
```

### 2. Preparar Ambiente (15 min)
```bash
# 1. Fazer checkout do branch
git checkout -b feat/lifecycle-manager
git pull origin develop

# 2. Verificar versões
node --version          # v18+
npx prisma --version   # v5+

# 3. Instalar dependências (se necessário)
npm install react-chartjs-2 chart.js  # Para gráficos

# 4. Rodar testes existentes (confirmar setup)
npm run test            # Não deve quebrar nada
```

### 3. Começar Phase 1 (2-3 dias)
```bash
# Seguir LIFECYCLE_MANAGER_IMPLEMENTATION.md
# Step by step:
# 1.1 - Estender schema Prisma
# 1.2 - Criar migration
# 1.3 - Criar tipos TypeScript
# 1.4 - Implementar HealthCheckService
# 1.5 - Implementar LifecycleManager
# 1.6 - Criar endpoint GET /api/setup/status
```

---

## ❓ FAQ TÉCNICO

### P: Por que criar um novo serviço ao invés de estender o wizard existente?
**A:** O wizard é um componente client-side complexo com fluxo linear. O Repair Hub precisa ser um sistema independente que funciona em paralelo, sem quebrar a lógica existente. Também permite que seja acessível mesmo se o setup falhou.

### P: Como funciona a detecção automática de estado?
**A:** 
1. Ao visitar qualquer página, um `useEffect` chama `GET /api/setup/status`
2. O endpoint verifica 4 coisas: Database, Storage, Disk, Config
3. Se alguma falhar, retorna `PARTIALLY_INSTALLED` (em vez de `FULLY_OPERATIONAL`)
4. Proxy redireciona para `/repair` em vez de `/dashboard`

### P: E se o database estiver down?
**A:** A health check tem timeout de 5s. Se falhar, retorna `status: false` para database. O sistema marcar como `PARTIALLY_INSTALLED` e oferece opções de repair.

### P: Pode danificar o banco de dados?
**A:** 
- Antes de aplicar qualquer config, validamos (teste de conexão com timeout)
- Se falhar, revertemos para valor anterior
- Todas as tentativas são logged em auditoria
- Admin recebe confirmação com warnings para operações perigosas

### P: Quanto tempo leva para fazer health check?
**A:** 
- Primeira execução: 100-500ms (testa DB, Storage, Disk, Config)
- Execuções subsequentes: < 50ms (cache de 30 segundos)

### P: Quando usuário comum vs Admin vê o Repair Hub?
**A:**
```
┌─────────────────────────────────────────────────────────────┐
│ USUÁRIO COMUM:                                              │
│  • NÃO vê /repair (redireciona para unauthorized)          │
│  • VÊ UI de status básico se system degraded               │
│  • Sem acesso a config editor                              │
├─────────────────────────────────────────────────────────────┤
│ ADMIN:                                                      │
│  • VÊ /repair (interface completa)                         │
│  • Acesso a StatusOverview, HealthMetrics, RepairWizard   │
│  • Pode editar configurações (com confirmação)             │
│  • VÊ auditoria de mudanças                                │
└─────────────────────────────────────────────────────────────┘
```

### P: Preciso de nova dependência npm?
**A:** Apenas:
- `react-chartjs-2` & `chart.js` - Para gráficos de saúde (opcional, pode usar tabelas)
- Tudo o resto já está no `package.json` (Prisma, zod, etc)

### P: Que fazer se health check falhar completamente?
**A:** 
1. Temos try/catch em tudo
2. Se falhar, retorna status 500 com mensagem de erro
3. Frontend mostra "Health check failed" + recomendação de refreshar
4. Admin pode ainda acessar `/repair?manual=true` para modo manual

### P: Como notificar admin de problemas?
**A:** (Phase 4, não está no escopo inicial)
- Background job roda health check a cada 5 min
- Se degraded/critical, cria Notification record
- Admin vê badge em dashboard + pode ler detalhes

---

## 🔄 WORKFLOW DE REPARAÇÃO

### Cenário 1: Database Connection Lost
```
1. Health check detecta: database.status = false
2. System transita: FULLY_OPERATIONAL → PARTIALLY_INSTALLED
3. Admin acessa /repair
4. Vê: "❌ Database Connection FAILED"
5. Opções:
   a) [Auto-Repair] → Tenta reconectar, se falhar mostra erro
   b) [Manual Edit] → Abre Config Editor
   c) [Help] → Mostra troubleshooting steps

Se Admin escolhe [Manual Edit]:
   6. Editor mostra: DATABASE_URL = "postgresql://old..."
   7. Admin altera: DATABASE_URL = "postgresql://new..."
   8. Sistema valida antes de aplicar:
      ├─ Testa nova conexão (timeout 5s)
      ├─ Verifica schema Prisma é compatível
      └─ Se OK: Aplica + Log auditoria
   9. Re-testa health check
   10. Se OK: System → FULLY_OPERATIONAL + Dashboard
```

### Cenário 2: Storage Misconfiguration
```
1. Health check detecta: storage.status = false
2. System mostra repair options
3. Opções:
   a) Switch to local filesystem (if possible)
   b) Reconfigure MinIO connection
   c) Manual edit MinIO settings

Se escolhe [Switch to local]:
   4. RepairService muda:
      ├─ MINIO_ENDPOINT = "" (empty)
      ├─ MINIO_BUCKET = "" (empty)
      └─ LOCAL_STORAGE_PATH = "/app/uploads"
   5. System valida: local filesystem é acessível?
   6. Se OK: Aplica + Notifica + Re-test
```

### Cenário 3: Configuration Incomplete
```
1. Health check detecta: config.missingFields = ["DOMAIN", "COMPANY_NAME"]
2. System mostra: "❌ Installation Incomplete"
3. Opções:
   a) Continue Setup (abre wizard em tela incompleta)
   b) Manual Config (abre editor com campos faltando)

Admin escolhe [Manual Config]:
   4. Editor mostra todos os campos faltando
   5. Admin preenche, salva
   6. Sistema valida cada campo
   7. Se OK: Mark installation as complete
   8. System → FULLY_OPERATIONAL
```

---

## 🧪 COMO TESTAR

### Teste Local (Sem Fazer Deploy)

#### 1. Teste Health Check
```bash
# Terminal 1: Rodar app
npm run dev

# Terminal 2: Chamar endpoint
curl http://localhost:3000/api/setup/status | jq .

# Esperado: Objeto com systemState, healthCheck, etc
```

#### 2. Teste Health Check Broken
```bash
# Parar PostgreSQL
sudo systemctl stop postgresql
# OU no Docker:
docker-compose down postgres

# Chamar endpoint novamente
curl http://localhost:3000/api/setup/status | jq .

# Esperado: database.status = false
# healthCheck.status = "critical" ou "degraded"
# systemState = "PARTIALLY_INSTALLED"
```

#### 3. Teste Repair Hub UI
```bash
# Login como admin
# Ir para /repair
# Verificar que Status Overview mostra DB como ❌

# Reiniciar PostgreSQL
sudo systemctl start postgresql
# OU:
docker-compose up postgres

# Refresh /repair
# Verificar que Status Overview agora mostra DB como ✅
```

### Teste Automatizado

```bash
# Testes unitários
npm run test -- src/lib/health-check.test.ts
npm run test -- src/lib/lifecycle-manager.test.ts

# Testes E2E
npm run test:e2e -- tests/repair-hub.e2e.ts
```

---

## 📊 MÉTRICAS A MONITORAR

Depois de implementar, track estas métricas:

| Métrica | Target | Verificação |
|---------|--------|-------------|
| Health Check Latency | < 500ms | `curl -w @curl-format.txt /api/setup/status` |
| Auto-Repair Success Rate | > 80% | Logs em ConfigAuditLog |
| MTTR (Mean Time To Repair) | < 5 min | Timestamps em auditoria |
| False Positives | < 5% | Manual review de alertas |
| API Error Rate | < 1% | Monitoring/Sentry |
| UI Load Time | < 1s | Browser DevTools |

---

## 🆘 TROUBLESHOOTING

### "Health check endpoint returns 500"
```bash
# 1. Verificar logs
tail -f logs/app.log | grep health-check

# 2. Verificar conexão DB
psql -U postgres -h localhost -d acrobaticz -c "SELECT 1"

# 3. Verificar Prisma Client
npm run build  # Force rebuild

# 4. Limpar cache
rm -rf node_modules/.prisma
npm install
```

### "Repair page shows 403 Unauthorized"
```bash
# 1. Verificar login
# Se não logged in, goto /login primeiro

# 2. Verificar role
# Só Admin pode acessar /repair
SELECT role FROM "User" WHERE id = '<your-id>';

# 3. Se não é Admin, pedir upgrade
# SQL: UPDATE "User" SET role = 'Admin' WHERE id = '<id>';
```

### "Config change fails with validation error"
```bash
# 1. Ler mensagem de erro exatamente
# Pode ser: DATABASE_URL format invalid, connection timeout, etc

# 2. Validar formato
# DATABASE_URL deve ser: postgresql://user:pass@host:port/db

# 3. Se timeout: aumentar timeout em health-check.ts de 5s para 10s
```

---

## 📚 DOCUMENTOS DE REFERÊNCIA

1. **LIFECYCLE_MANAGER_ARCHITECTURE.md** - Design técnico completo
2. **LIFECYCLE_MANAGER_IMPLEMENTATION.md** - Guia passo a passo
3. **Este documento** - Quick start & FAQ
4. **Prisma Docs** - https://www.prisma.io/docs
5. **Next.js API Routes** - https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

## ✅ PRÉ-CHECKLIST ANTES DE COMEÇAR

- [ ] Ler LIFECYCLE_MANAGER_ARCHITECTURE.md (30 min)
- [ ] Ler este documento (20 min)
- [ ] Clonar branch feat/lifecycle-manager
- [ ] Rodar `npm install` e `npm run dev`
- [ ] Verificar que testes existentes passam (`npm run test`)
- [ ] Ter PostgreSQL rodando localmente
- [ ] Ter Docker instalado (para poder matar containers se necessário)
- [ ] Confirmar que consegue acessar /install e /dashboard
- [ ] Criar arquivo de notas `.env.local` com secrets (se necessário)

---

## 🎓 LEARNING PATH RECOMENDADO

**Dia 1:**
- Ler ARCHITECTURE (2 horas)
- Entender state machine (1 hora)
- Discutir com tech lead (30 min)

**Dia 2:**
- Setup local (30 min)
- Implementar Step 1.1-1.3 (Schema, Types)
- Criar migration e verificar (1 hora)

**Dia 3:**
- Implementar HealthCheckService (4 horas)
- Testes unitários (2 horas)

**Dia 4:**
- Implementar LifecycleManager (3 horas)
- Criar endpoint /api/setup/status (2 horas)
- E2E test (1 hora)

**Semana 2:**
- Phase 2: Repair Hub UI (3-4 dias)
- Components, styling, integration

**Semana 3:**
- Phase 3: Repair services & config management (4 dias)
- POST endpoints, auditoria, segurança

**Semana 4:**
- Polish, testing, documentation (5 dias)

---

## 📞 CONTATOS

- **Tech Lead:** [nome]
- **Security Lead:** [nome]  
- **Product Manager:** [nome]
- **Slack Channel:** #lifecycle-manager-dev

---

**Documento Finalizado**  
Quick Start Guide v1.0  
Data: 15/01/2026
