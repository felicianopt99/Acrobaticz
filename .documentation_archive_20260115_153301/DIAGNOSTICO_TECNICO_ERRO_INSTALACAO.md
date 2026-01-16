# 📋 DIAGNÓSTICO TÉCNICO - Erro "Installation Failed"

**Data**: 15 de Janeiro de 2026  
**Sistema**: Acrobaticz  
**Erro**: "Installation Failed" no passo final (Review & Install)  
**Status**: Análise Completa com Causa Raiz Identificada

---

## 🎯 RESUMO EXECUTIVO

O erro "Installation Failed" que aparece ao clicar em "Complete Installation" é um **sintoma de falha numa das operações backend** que envolvem:

1. **Ligação à Base de Dados (Prisma)**
2. **Escrita de dados na tabela SystemSetting**
3. **Transação atómica PostgreSQL**
4. **Encriptação e persistência de secrets**

O **ecrã só mostra**: `"Installation failed"` (mensagem genérica)  
A **verdadeira causa** está oculta em: **logs do servidor, erro da BD, ou timeout de rede**

---

## 🔍 ANÁLISE DA ARQUITETURA

### 1. FLUXO DE INSTALAÇÃO (Frontend → Backend)

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND: /app/(setup)/install/page.tsx                        │
│  ============================================================    │
│  ✓ Múltiplos passos: General → Auth → DeepL → Branding → Storage │
│  ✓ Validação client-side com Zod schema                         │
│  ✓ Submit final: POST /api/setup/complete                       │
│  ✓ Espera resposta: { success: true, redirectUrl: "/dashboard" }│
└─────────────────────────────────────────────────────────────────┘
                              ↓
                         HTTP POST
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND: /api/setup/complete/route.ts                          │
│  ============================================================    │
│  STEP 1: Parsing JSON payload                                   │
│  STEP 2: Validação com Zod Schema                               │
│  STEP 3: Verificação se já foi instalado                        │
│  STEP 4: Hash de password com bcryptjs                          │
│  STEP 5: Geração de username único                              │
│  STEP 6: TRANSAÇÃO ATÓMICA Prisma (PONTO CRÍTICO!)              │
│         ├─ Criar User admin                                      │
│         ├─ Gravar SystemSetting: Domain, Company, Auth, Branding│
│         ├─ Gravar Secrets encriptados: JWT, MinIO keys          │
│         └─ Flag INSTALLATION_COMPLETE = true                    │
│  STEP 7: Invalidar cache do configService                       │
│  STEP 8: Construir resposta de sucesso                          │
│  STEP 9: Adicionar cookie 'app_installed'                       │
│  FINALLY: Fechar conexões Prisma                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                      Resposta HTTP
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND: Tratamento da Resposta                               │
│  ============================================================    │
│  if (res.ok && responseData.success)                            │
│    → Redirect para /dashboard                                   │
│  else                                                            │
│    → Toast: errorMsg (detalhes da falha)                        │
│    → setSubmitError(errorMsg)                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2. LOCALIZAÇÃO DO PROBLEMA

O erro ocorre **obrigatoriamente** num destes pontos:

| Ponto | Local | Causa Possível | Sintoma |
|-------|-------|---|---|
| **A** | Parsing JSON | Payload malformado | 400: Invalid JSON |
| **B** | Validação Zod | Dados não passam schema | 422: Validation failed |
| **C** | Verificação re-install | Sistema já instalado | 403: Installation already completed |
| **D** | Hashing password | Erro em bcryptjs | 500: Encryption error |
| **E** | TRANSAÇÃO Prisma | **❌ BD indisponível ou erro SQL** | **500: catch block genérico** |
| **F** | configService.loadConfig | Problema cache/reload | 500: catch block genérico |
| **G** | Cookie setting | Problema com response headers | 500: silencioso |

**O ponto E é o MAIS PROVÁVEL!**

---

## 🔴 CAUSA RAIZ MAIS PROVÁVEL

### Cenário 1: DATABASE_URL Não Está Configurado (MAIS COMUM)

```typescript
// Em /api/setup/complete/route.ts, linha 22:
const prisma = new PrismaClient();

// ❌ Se DATABASE_URL não está no .env, Prisma falha aqui!
```

**Por quê?**
- Prisma lê `DATABASE_URL` do `.env` **na inicialização**
- Se não existe, `new PrismaClient()` falha silenciosamente
- Depois, qualquer `await prisma.*` dispara erro de conexão

**Como verificar:**
```bash
# Verificar se DATABASE_URL existe
grep DATABASE_URL /media/feli/.../Acrobaticz/.env

# Se não existir:
# ❌ PROBLEMA ENCONTRADO!
```

---

### Cenário 2: PostgreSQL Indisponível

```bash
# Se o container PostgreSQL não está a correr
docker ps | grep postgres
# Resultado: (nada)

# Ou se a porta 5432 está em uso/bloqueada
sudo lsof -i :5432
```

**Sintoma no backend:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

---

### Cenário 3: Erro na Transação Prisma

Mesmo que a BD esteja ok, a transação pode falhar se:

1. **Tabela `SystemSetting` não existe**
   ```sql
   -- Verificar no PostgreSQL
   SELECT * FROM information_schema.tables WHERE table_name='SystemSetting';
   ```

2. **Constraint `category_key` violado**
   ```sql
   -- Prisma tenta upsert com unique constraint
   -- Se a combinação (category, key) está corrompida
   ```

3. **Permissões de BD insuficientes**
   ```sql
   -- User `acrobaticz_user` talvez não tenha permissão INSERT/UPDATE
   ```

---

### Cenário 4: Erro Silencioso no catch Block

```typescript
// Linha 418-433 de /api/setup/complete/route.ts:
catch (error) {
  console.error('Installation completion error:', error);  // ← LOGS AQUI!
  
  const errorMessage =
    error instanceof Error
      ? error.message
      : 'Unknown error during installation completion';

  return NextResponse.json(
    {
      success: false,
      error: 'Installation failed',  // ← MENSAGEM GENÉRICA NO FRONTEND
      message: 'Erro ao completar instalação. Por favor contacte suporte.',
      // Em desenvolvimento, incluir detalhe (remover em produção)
      ...(process.env.NODE_ENV === 'development' && { details: errorMessage }),
    },
    { status: 500 }
  );
}
```

**O PROBLEMA**: 
- O backend lança um erro (ex: `PrismaClientInitializationError`)
- O bloco `catch` imprime em `console.error` (logs do servidor)
- **Mas o frontend só vê**: `"Installation failed"` 
- **Os detalhes estão ESCONDIDOS nos logs!**

---

## 📊 MATRIZ DE DIAGNÓSTICO

Para identificares EXATAMENTE o problema:

### PASSO 1: Verificar DATABASE_URL

```bash
# Terminal 1: Verificar variável de ambiente
cat /media/feli/.../Acrobaticz/.env | grep -i database

# Resultado esperado:
# DATABASE_URL=postgresql://acrobaticz_user:dev_password_123@postgres:5432/acrobaticz_dev?schema=public
# OU (se em Docker): DATABASE_URL=postgresql://acrobaticz_user:dev_password_123@localhost:5432/acrobaticz_dev?schema=public

# Se não existe: ❌ PROBLEMA ENCONTRADO
```

### PASSO 2: Verificar se PostgreSQL Está Acessível

```bash
# Terminal: Testar ligação à BD
# Opção A: Se é Docker
docker exec postgres_container psql -U acrobaticz_user -d acrobaticz_dev -c "SELECT 1;"

# Opção B: Se é Localhost
psql -h localhost -U acrobaticz_user -d acrobaticz_dev -c "SELECT 1;"

# Opção C: Se é Docker mas sem container acesso direto
nc -zv postgres 5432
```

### PASSO 3: Verificar Tabelas Prisma

```bash
# Terminal: Listar tabelas da BD
psql -h localhost -U acrobaticz_user -d acrobaticz_dev -c "\dt"

# Procurar por: SystemSetting, User
# Se não existe: ❌ Prisma migrations não correram!
```

### PASSO 4: Ler Logs do Servidor

```bash
# Terminal: Se está a correr com npm run dev
# (Logs aparecem no terminal onde correu npm run dev)
# Procurar por: "Installation completion error" ou "PrismaClientInitializationError"

# Terminal: Se está em Docker
docker logs <container_id> -f

# Terminal: Se são ficheiros de log
tail -100 /path/to/logs/*.log
```

### PASSO 5: Modo DEBUG - Adicionar Logs Detalhados

Editar `/api/setup/complete/route.ts` e adicionar logs:

```typescript
// Linha 22, DEPOIS de:
const prisma = new PrismaClient();

// ADICIONAR:
console.log('[DEBUG] PrismaClient initializado');
console.log('[DEBUG] DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 30) + '***');
```

---

## 🛠️ SOLUÇÕES POR CAUSA

### ✅ SOLUÇÃO 1: DATABASE_URL Está em Falta

**Sintoma**: 
- `grep DATABASE_URL .env` retorna nada
- Logs: `PrismaClientInitializationError: Environment variable does not contain a valid connection string`

**Corrigir**:

```bash
# 1. Verificar qual é o .env que está sendo usado
cat /media/feli/.../Acrobaticz/.env

# 2. Se está vazio ou não tem DATABASE_URL, adicionar:
cat >> /media/feli/.../Acrobaticz/.env << 'EOF'

# Database Connection String
DATABASE_URL="postgresql://acrobaticz_user:dev_password_123@localhost:5432/acrobaticz_dev?schema=public"

EOF

# 3. Reiniciar o servidor:
# - Se npm run dev: Ctrl+C, depois npm run dev novamente
# - Se Docker: docker-compose restart app
```

---

### ✅ SOLUÇÃO 2: PostgreSQL Não Está Acessível

**Sintoma**:
- Logs: `Error: connect ECONNREFUSED 127.0.0.1:5432`
- Ou: `FATAL: password authentication failed for user "acrobaticz_user"`

**Corrigir (Docker)**:

```bash
# 1. Verificar se container PostgreSQL está ativo
docker ps | grep postgres

# 2. Se não está, iniciar:
docker-compose -f docker-compose.dev.yml up -d postgres

# 3. Aguardar 10 segundos para PostgreSQL ficar pronto
sleep 10

# 4. Testar ligação:
docker exec postgres_container psql -U acrobaticz_user -c "SELECT 1;"

# 5. Se falhar com erro de autenticação:
#    Verificar DATABASE_URL tem USER e PASSWORD corretos
#    (Devem corresponder a DB_USER e DB_PASSWORD no .env)
```

**Corrigir (Localhost)**:

```bash
# 1. Verificar se PostgreSQL está a correr
sudo systemctl status postgresql

# 2. Se não está, iniciar:
sudo systemctl start postgresql

# 3. Testar ligação:
psql -h localhost -U acrobaticz_user -d acrobaticz_dev -c "SELECT 1;"
```

---

### ✅ SOLUÇÃO 3: Tabelas Prisma Não Existem (Migrations Não Correram)

**Sintoma**:
- Logs: `ERROR: relation "SystemSetting" does not exist` 
- Ou: `ERROR: relation "User" does not exist`

**Corrigir**:

```bash
# 1. Executar Prisma migrations
cd /media/feli/.../Acrobaticz

# 2. Opção A: Push schema (desenvolvimento)
npm run db:push

# 3. Opção B: Migrate dev (desenvolvimento com histórico)
npm run db:migrate

# 4. Opção C: Gerar Prisma Client (se necessário)
npm run db:generate

# 5. Verificar tabelas foram criadas:
psql -h localhost -U acrobaticz_user -d acrobaticz_dev -c "\dt" | grep SystemSetting
```

---

### ✅ SOLUÇÃO 4: Adicionar DEBUG Mode para Logs Detalhados

Se ainda está com erro "Installation failed" e não consegues ver os logs:

**Ficheiro**: [src/app/api/setup/complete/route.ts](src/app/api/setup/complete/route.ts#L1-L50)

```typescript
// ANTES (linha 22):
export async function POST(request: NextRequest) {
  const prisma = new PrismaClient();

  try {
    // ===== STEP 1: Parsing do request body =====

// DEPOIS (adicionar logs):
export async function POST(request: NextRequest) {
  const prisma = new PrismaClient();
  
  // DEBUG: Log inicial
  console.log('[INSTALL-DEBUG] Installation POST started');
  console.log('[INSTALL-DEBUG] NODE_ENV:', process.env.NODE_ENV);
  console.log('[INSTALL-DEBUG] DATABASE_URL exists:', !!process.env.DATABASE_URL);

  try {
    // ===== STEP 1: Parsing do request body =====
    console.log('[INSTALL-DEBUG] Step 1: Parsing JSON payload');
    let payload: unknown;
    try {
      payload = await request.json();
      console.log('[INSTALL-DEBUG] JSON parsed successfully');
    } catch (error) {
      console.error('[INSTALL-DEBUG] JSON parse error:', error);
      // ... resto do código
```

---

## 📋 CHECKLIST DE DIAGNÓSTICO

Executa estas verificações **por ordem**:

```bash
# 1. DATABASE_URL configurado?
echo "1. DATABASE_URL:"
grep DATABASE_URL /media/feli/.../Acrobaticz/.env || echo "❌ NÃO ENCONTRADO"

# 2. PostgreSQL acessível?
echo -e "\n2. PostgreSQL conectável:"
psql -h localhost -U acrobaticz_user -d acrobaticz_dev -c "SELECT 1;" 2>&1 | head -5 || echo "❌ Falha de conexão"

# 3. Tabelas Prisma existem?
echo -e "\n3. Tabelas Prisma:"
psql -h localhost -U acrobaticz_user -d acrobaticz_dev -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' LIMIT 5;"

# 4. Logs do servidor (se npm run dev está ativo)
echo -e "\n4. Logs recentes do servidor:"
# (Verificar terminal onde npm run dev está a correr)

# 5. Testar endpoint manualmente
echo -e "\n5. Testar endpoint POST:"
curl -X POST http://localhost:3000/api/setup/complete \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "localhost:3000",
    "companyName": "Test",
    "adminEmail": "admin@test.com",
    "adminPassword": "Password123",
    "adminPasswordConfirm": "Password123",
    "jwtSecret": "thisisaverylong32characterjwtsecretkey",
    "logoUrl": "",
    "primaryColor": "",
    "secondaryColor": "",
    "accentColor": "",
    "minioEndpoint": "",
    "minioAccessKey": "",
    "minioSecretKey": "",
    "minioBucket": ""
  }' 2>&1 | jq .
```

---

## 🔧 CÓDIGO A IMPLEMENTAR (PARA MAIS VISIBILIDADE)

Se precisas de mais detalhes no erro, edita [src/app/api/setup/complete/route.ts](src/app/api/setup/complete/route.ts#L410-L435):

**ANTES** (mensagem genérica):
```typescript
    return NextResponse.json(
      {
        success: false,
        error: 'Installation failed',
        message: 'Erro ao completar instalação. Por favor contacte suporte.',
      },
      { status: 500 }
    );
```

**DEPOIS** (com detalhes em desenvolvimento):
```typescript
    return NextResponse.json(
      {
        success: false,
        error: 'Installation failed',
        message: 'Erro ao completar instalação. Por favor contacte suporte.',
        // ✨ ADICIONAR ISTO:
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && {
          errorName: error instanceof Error ? error.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    );
```

Assim o frontend recebe mais detalhes em modo development.

---

## 📞 PRÓXIMOS PASSOS

1. **Executa o checklist acima** (5 comandos)
2. **Coloca-me os resultados** (especialmente logs do servidor)
3. **Dou-te a solução exata** com base na causa raiz

**O erro "Installation failed" é apenas a PONTA DO ICEBERG!**

---

**Documentação Relacionada:**
- [src/app/api/setup/complete/route.ts](src/app/api/setup/complete/route.ts) - Endpoint POST
- [src/app/(setup)/install/page.tsx](src/app/(setup)/install/page.tsx) - Frontend
- [src/lib/schemas/install.schema.ts](src/lib/schemas/install.schema.ts) - Validação Zod
- [src/lib/config-service.ts](src/lib/config-service.ts) - ConfigService
- [prisma/schema.prisma](prisma/schema.prisma) - Esquema BD

---

**Status**: ✅ Análise Completa | Pronto para Execução  
**Próxima Ação**: Executar Checklist de Diagnóstico
