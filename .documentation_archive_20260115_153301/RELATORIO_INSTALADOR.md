# 📋 RELATÓRIO: Sistema de Instalação Automática - Acrobaticz

**Data:** 15 Jan 2026  
**Objetivo:** Avaliar completude e funcionalidade do instalador automático com redirecionamento no primeiro acesso

---

## ✅ O QUE JÁ EXISTE

### 1. **Frontend - Página de Instalação** 
📁 `src/app/(setup)/install/page.tsx`

**Status:** ✅ Implementado e funcional
- ✅ 6 passos de configuração (General, Auth, Translation, Branding, Storage, Review)
- ✅ Validação em tempo real com React Hook Form
- ✅ Verificação de instalação já completa (redireciona para dashboard)
- ✅ Loading state enquanto verifica status
- ✅ Componentes modulares para cada etapa
- ✅ UI com Tailwind CSS (gradientes, animações, cards)
- ✅ Barra de progresso visual

**Componentes por Passo:**
1. **StepGeneral** - Domain, Company Name, Purchase Code
2. **StepAuth** - JWT Secret, Admin Email, Admin Password
3. **StepDeepL** - Chave API DeepL (opcional)
4. **StepBranding** - Logo, Colors (primary, secondary, accent)
5. **StepStorage** - MinIO credentials (endpoint, access key, secret, bucket)
6. **StepReview** - Resumo de todas as configurações

---

### 2. **Backend - API de Conclusão**
📁 `src/app/api/setup/complete/route.ts`

**Status:** ✅ Implementado e robusto
- ✅ Validação com Zod schema (`InstallationCompleteSchema`)
- ✅ Transações atómicas com Prisma (consistência garantida)
- ✅ Criação de admin user com password hasheada (bcryptjs)
- ✅ Persistência em `SystemSetting` table (tudo criptografado)
- ✅ Proteção contra re-instalação (HTTP 403 se já instalado)
- ✅ Cache invalidation após instalação
- ✅ Tratamento de erros detalhado

**Fluxo:**
1. Parse e validação do JSON
2. Check se já foi instalado
3. Hash da password do admin
4. Transação (tudo ou nada):
   - Criar admin user
   - Gravar configurações gerais
   - Gravar configurações de auth
   - Gravar configurações de branding
   - Gravar configurações de storage
   - Flag INSTALLATION_COMPLETE = "true"
5. Invalidar cache de configService

---

### 3. **Middleware de Roteamento**
📁 `src/middleware.ts`

**Status:** ⚠️ Implementado MAS COM PROBLEMA CRÍTICO

**O que tem:**
- ✅ Identifica rotas públicas vs privadas
- ✅ Skip para /api, /_next/, arquivos estáticos
- ✅ Lógica de redirecionamento

**O PROBLEMA:**
```typescript
// ❌ PROBLEMA: Fetch de API interna em middleware
const installStatusRes = await fetch(
  new URL('/api/config?category=General&key=INSTALLATION_COMPLETE', request.url)
);
```

⚠️ **Risco:** 
- Pode não funcionar em alguns ambientes (edge runtime limitations)
- Timeouts possíveis
- Calls de API interna podem falhar silenciosamente

---

### 4. **API de Configuração**
📁 `src/app/api/config/route.ts`

**Status:** ✅ Implementado
- ✅ GET com query params (category, key)
- ✅ Retorna valores do banco de dados
- ✅ Retorna `{}` se não existir (fresh install)

---

### 5. **Validação com Zod**
📁 `src/lib/schemas/install.schema.ts`

**Status:** ✅ Implementado
- ✅ Schema completo com validações
- ✅ Campos obrigatórios vs opcionais bem definidos
- ✅ Formato de email validado
- ✅ Tamanho de password validado

---

### 6. **API de Teste de Storage**
📁 `src/app/api/setup/test-storage/route.ts`

**Status:** ✅ Implementado
- ✅ Testa conexão com MinIO antes de salvar
- ✅ Cria bucket se não existir
- ✅ Feedback detalhado de erros

---

## ❌ O QUE FALTA OU ESTÁ QUEBRADO

### 1. **Middleware - Implementação Insegura** 🔴 CRÍTICO

**Problema:** Fetch de API interna no middleware não é confiável

**Solução:**
```typescript
// ✅ CORRETO: Ler cookie ou usar variável de ambiente
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Opção 1: Usar cookie de instalação
  const isInstalledCookie = request.cookies.get('app_installed');
  const isInstalled = isInstalledCookie?.value === 'true';
  
  // Opção 2: Usar arquivo de lock
  // const fs = require('fs');
  // const isInstalled = fs.existsSync('.installed');
  
  if (pathname === '/' && !isInstalled) {
    return NextResponse.redirect(new URL('/install', request.url));
  }
}
```

---

### 2. **Instalação Não Define Cookie/Flag de Status** 🔴 CRÍTICO

**Problema:** Após instalação, não há marcação que o sistema foi instalado (para o middleware saber)

**Solução:** No final de `/api/setup/complete`, adicionar:

```typescript
// ===== STEP 8: Set cookie de instalação =====
const response = NextResponse.json({ success: true, ... });
response.cookies.set('app_installed', 'true', {
  maxAge: 60 * 60 * 24 * 365, // 1 year
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax'
});
return response;
```

---

### 3. **Redirecionamento `/` → `/install` NÃO FUNCIONA** 🔴 CRÍTICO

**Problema:** 
- Middleware tenta fetch que pode falhar
- `/` rota mostra dashboard que redireciona para `/login`
- Usuário vê login em vez de wizard

**Status Atual:**
```
Usuario acessa / 
  ↓
Middleware não consegue determinar isInstalled (fetch falha ou timeout)
  ↓
Permite acesso a /
  ↓
/page.tsx renderiza dashboard
  ↓
AppContext checa auth, usuário não autenticado
  ↓
Redireciona para /login
  ❌ Usuário vê login, não wizard
```

**Status Esperado:**
```
Usuario acessa /
  ↓
Middleware determina que sistema NÃO está instalado
  ↓
Redireciona para /install
  ✅ Usuário vê wizard
```

---

### 4. **Login Page - Sem Check de Instalação** ⚠️ SECUNDÁRIO

**Problema:** Usuário pode acessar `/login` antes de completar instalação

**Solução:** Adicionar em `/src/app/login/page.tsx`:

```typescript
useEffect(() => {
  checkInstallation().then(isInstalled => {
    if (!isInstalled) {
      window.location.href = '/install';
    }
  });
}, []);
```

---

### 5. **Após Instalação - Redirecionamento** ⚠️ SECUNDÁRIO

**Problema:** Após clicar "Instalar", não sabemos para onde redirecionar

**Status Atual:** Provavelmente fica no form ou mostra erro

**Solução:** No `InstallPage.tsx`, após POST bem-sucedido:

```typescript
if (response.ok) {
  toast({ title: "✅ Installation complete!" });
  // Set cookie para middleware saber
  document.cookie = "app_installed=true; max-age=31536000";
  
  setTimeout(() => {
    window.location.href = "/login"; // ou criar admin direto e ir pro dashboard
  }, 2000);
}
```

---

### 6. **Transição Admin User → Login** ⚠️ SECUNDÁRIO

**Problema:** Após instalação, admin está criado mas não está logado

**Opções:**
- A) Criar uma session logo após instalação (auto-login)
- B) Redirecionar para login com toast sugerindo credenciais
- C) Mostrar modal com credenciais geradas

---

## 🎯 PLANO DE AÇÃO - O QUE FAZER PARA FICAR "TOP"

### Prioridade 1 (CRÍTICO): Conserta o Middleware

```
[ ] 1.1 Reescrever middleware.ts para usar cookie em vez de fetch
[ ] 1.2 Testar redirecionamento / → /install em fresh install
[ ] 1.3 Testar que /install → /dashboard quando já instalado
```

### Prioridade 2 (CRÍTICO): Marcar Instalação

```
[ ] 2.1 Adicionar response.cookies.set() em /api/setup/complete
[ ] 2.2 Testar que cookie é criado após POST bem-sucedido
[ ] 2.3 Testar que middleware lê o cookie corretamente
```

### Prioridade 3 (IMPORTANTE): Fluxo de Redirecionamento Pós-Instalação

```
[ ] 3.1 Adicionar logic ao final do StepReview.tsx para POST
[ ] 3.2 Validar resposta de /api/setup/complete
[ ] 3.3 Set cookie localmente se não vier no response
[ ] 3.4 Redirecionar para /login com mensagem de sucesso
```

### Prioridade 4 (NICE-TO-HAVE): Polish

```
[ ] 4.1 Adicionar check de instalação em /login page
[ ] 4.2 Adicionar auto-login após instalação (opcional)
[ ] 4.3 Melhorar mensagens de erro
[ ] 4.4 Adicionar teste E2E (fresh install → dashboard)
```

---

## 🧪 TESTE MANUAL - COMO VALIDAR

```bash
# 1. Limpar estado (fresh install)
docker compose down -v
docker compose up -d

# 2. Acessar aplicação
curl http://localhost

# Esperado: Redirecionamento para /install
# Atual: Provavelmente redireciona para /login ❌

# 3. Preencher wizard
# Navegar em http://localhost/install
# Completar todos os 6 passos
# Clicar "Instalar"

# 4. Acessar aplicação de novo
curl http://localhost

# Esperado: Redirecionamento para /login (ou dashboard se auto-login)
# Atual: Precisa testar
```

---

## 📊 RESUMO VISUAL

```
┌─────────────────────────────────────┐
│     PRIMEIRO ACESSO - FLUXO         │
├─────────────────────────────────────┤
│ GET /                               │
│         ↓                           │
│ Middleware (❌ PROBLEMA)            │
│         ↓                           │
│ /install (Wizard)                   │
│         ↓                           │
│ Preencher 6 passos                  │
│         ↓                           │
│ POST /api/setup/complete (✅ OK)   │
│         ↓                           │
│ Set cookie (❌ FALTA)               │
│         ↓                           │
│ Redirecionar /login (⚠️ INCERTO)    │
│         ↓                           │
│ GET /login                          │
│ (sem check de instalação ⚠️)        │
│         ↓                           │
│ Login + Create Session (✅ OK)      │
│         ↓                           │
│ GET /dashboard (✅ OK)              │
└─────────────────────────────────────┘
```

---

## 💡 CONCLUSÃO

**Status:** 70% completo

- ✅ **Frontend:** Bonito e funcional (6 passos)
- ✅ **Backend:** Robusto (transações atómicas, validação)
- ✅ **API Setup:** Tudo bem estruturado
- ❌ **Middleware:** Não confiável para primeiro acesso
- ❌ **Marcação de Instalação:** Não persiste entre requests
- ⚠️ **Fluxo Pós-Instalação:** Redirecionamento incerto

**Para ficar "TOP":** Precisa de 2-3 horas para:
1. Reescrever middleware (usar cookie)
2. Adicionar cookie no response de setup/complete
3. Testar fluxo end-to-end
4. Adicionar UX polish (mensagens, loading states)

---

**Gerado por:** AI Assistant  
**Próximas ações:** Implementar prioridades 1 e 2
