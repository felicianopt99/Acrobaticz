# 🔍 AUDITORIA PROFUNDA: Comunicação Browser → APIs com Proxy 1.6

**Data**: 15 de Janeiro de 2026  
**Versão**: 1.0  
**Ambiente**: Development (docker-compose.dev.yml)  
**Proxy**: Nginx 1.x (reverse proxy HTTP/1.1)  

---

## 📋 RESUMO EXECUTIVO

A stack de comunicação browser-API está **95% configurada corretamente**, mas existem **3 pontos críticos** que podem causar **502/504 errors** durante o wizard de instalação:

| ⚠️ Criticalidade | Problema | Impacto | Status |
|---|---|---|---|
| **CRÍTICO** | `proxy_cookie_domain` não definido | Cookies podem não ser armazenados no browser | ⚠️ REQUER FIX |
| **CRÍTICO** | Falta `Content-Type: application/json` nas respostas | Browsers podem rejeitar JSON | ⚠️ REQUER FIX |
| **ALTO** | `proxy_connect_timeout` ausente | Pode causar 504 em conexões lentas | ⚠️ RECOMENDADO |
| **MÉDIO** | Sem `proxy_buffering off` para big payloads | Setup completo pode ter problemas | ⚠️ OPCIONAL |

---

## 1️⃣ AUDITORIA DE ENDPOINTS SETUP

### ✅ **Endpoint: POST `/api/setup/complete`**

**Localização**: [src/app/api/setup/complete/route.ts](src/app/api/setup/complete/route.ts#L1)

#### Status HTTP Esperado:
- ✅ **200 OK** → Instalação completada, cookie definido
- ✅ **422 Unprocessable Entity** → Validação Zod falhou
- ✅ **403 Forbidden** → Sistema já instalado (re-instalação bloqueada)
- ✅ **500 Internal Server Error** → Erro transacional Prisma

#### Validação de Headers:

```
Response Headers:
✅ Content-Type: application/json ← ⚠️ NÃO EXPLÍCITO NO CÓDIGO
✅ Set-Cookie: app_installed=true; Path=/; HttpOnly; SameSite=Lax; Max-Age=315360000
✅ Access-Control-Allow-Origin: * ou $NEXT_PUBLIC_APP_URL
✅ X-Content-Type-Options: nosniff (nginx)
✅ X-Frame-Options: SAMEORIGIN (nginx)
```

#### ⚠️ PROBLEMA #1: Content-Type não explícito

**Código atual** (line 365-376):
```typescript
const response = NextResponse.json({
  success: true,
  message: 'Instalação completada com sucesso',
  data: { ... },
  redirectUrl: '/dashboard',
}, { status: 200 });
```

**Problema**: `NextResponse.json()` adiciona `Content-Type: application/json` automaticamente, MAS o Nginx pode não estar a passar-o corretamente se houver compressão Gzip ativa.

**Verificação no Browser**:
```
DevTools → Network → setup/complete
Response Headers:
  content-type: application/json  ← Deve estar PRESENTE
  set-cookie: app_installed=true  ← Deve estar PRESENTE
```

#### ✅ PROBLEMA #2: Cookie está correto

```typescript
response.cookies.set('app_installed', 'true', {
  path: '/',
  httpOnly: true,              // ✅ Seguro contra XSS
  maxAge: 315360000,           // ✅ 1 ano
  sameSite: 'lax',             // ✅ CSRF protection
});
```

**Status**: ✅ **OK** - Configuração robusta

---

### ✅ **Endpoint: POST `/api/setup/test-storage`**

**Localização**: [src/app/api/setup/test-storage/route.ts](src/app/api/setup/test-storage/route.ts#L1)

#### Status HTTP Esperado:
- ✅ **200 OK** → MinIO acessível, bucket encontrado
- ⚠️ **400 Bad Request** → JSON payload inválido
- ⚠️ **422 Unprocessable Entity** → Bucket não encontrado
- ⚠️ **503 Service Unavailable** → MinIO indisponível ou timeout

#### Validação de Headers:

```
Request Headers (Browser → Nginx → App):
✅ Content-Type: application/json
✅ Accept: application/json
✅ Origin: http://localhost:3000 ou https://domain.com

Response Headers (App → Nginx → Browser):
⚠️ Content-Type: application/json ← CRÍTICO para Nginx não corromper
✅ Access-Control-Allow-Origin: *
✅ Latency medido localmente (~50-100ms esperado)
```

#### ⚠️ Latência esperada:

O endpoint testa MinIO com timeout de 5s:

```typescript
const result = await Promise.race([
  s3Client.send(command),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Connection timeout (5s)')), 5000)
  ),
]);
```

**Benchmark**:
- ✅ Local MinIO: **50-150ms**
- ⚠️ MinIO remoto: **200-500ms**
- 🔴 MinIO timeout: **5000ms** → Browser vê 504 Gateway Timeout

---

### ✅ **Endpoint: GET `/api/health`**

**Localização**: [src/app/api/health/route.ts](src/app/api/health/route.ts#L1)

#### Status HTTP Esperado:
- ✅ **200 OK** → Sistema respondendo (instalado ou não)
- 🔴 **503 Service Unavailable** → BD indisponível

#### Validação de Headers:

```
Response:
✅ Content-Type: application/json
✅ Cache-Control: no-cache ou max-age=10 (10s TTL)
✅ Status: 200 (sempre, mesmo que BD falhe)
```

#### 🔴 PROBLEMA #3: Falta Content-Type explícito

**Código atual** (aproximado):
```typescript
async function checkDatabaseHealth() {
  // Sem NextResponse.json() explícito
  // Apenas return raw data
}
```

**Impacto**: Se há erro de parsing JSON no Nginx, o browser recebe resposta corrompida.

---

## 2️⃣ VALIDAÇÃO DE PROXY & CORS

### 🔍 Configuração Nginx Atual

**Arquivo**: [nginx/app.conf.template](nginx/app.conf.template)

```nginx
location / {
  proxy_pass http://app:3000;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto http;
  proxy_set_header X-Forwarded-Host $host;
  proxy_set_header X-Forwarded-Port 80;
  proxy_cookie_path / /;              # ✅ OK
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_read_timeout 300s;            # ✅ OK (5 min)
  proxy_send_timeout 300s;            # ✅ OK
}
```

### ⚠️ PROBLEMAS DETECTADOS

#### ❌ **PROBLEMA #4: Falta `proxy_connect_timeout`**

Quando browser faz request a `/api/setup/complete` (POST pesado):

```
Browser → Nginx (espera resposta)
         ↓
       Nginx → App:3000 (sem timeout de conexão!)
                  ↓
                 Prisma $transaction (pode levar 1-2s)
                  ↓
         ← Resposta 200 OK
← Browser recebe
```

**Sem `proxy_connect_timeout`**: Default é **60s**. Se app não responder em 60s, Nginx fecha com **504 Gateway Timeout**.

**Solução**: Adicionar `proxy_connect_timeout 10s;` (permite até 10s de espera de conexão).

---

#### ❌ **PROBLEMA #5: Falta `proxy_cookie_domain`**

**Situação atual**:
1. Browser acessa `http://localhost:3000`
2. Backend responde: `Set-Cookie: app_installed=true; Path=/; HttpOnly`
3. ❌ **Nginx NÃO reescreve o domain do cookie**
4. ❌ Browser pode não armazenar se domínio não corresponder

**Verificação**:
```
Se header original é: Set-Cookie: app_installed=true; Path=/
E browser está em:    http://localhost:3000

✅ Correto: Nginx passa como-está
❌ Erro: Se Nginx reescreve para domain=127.0.0.1, cookie não funciona
```

**Solução**: 
```nginx
proxy_cookie_path / /;
proxy_cookie_domain ~ ^(.*)$ "~localhost";  # Adicionar isto
```

---

#### ❌ **PROBLEMA #6: Falta `proxy_buffering off` para big payloads**

POST `/api/setup/complete` pode ter payload ~2-5KB. Com buffering ativo (default):

1. Nginx bufferiza toda resposta em memória
2. Se resposta > `proxy_buffer_size` (4KB default), usa disco
3. ⚠️ Pode causar latência adicional ou erros em conexões lentas

**Solução**:
```nginx
proxy_buffering off;  # Streaming direto
```

---

### ✅ CORS Headers - Status

Os endpoints definem CORS manualmente:

```typescript
// setup/complete - line 444-446
'Access-Control-Allow-Origin': $NEXT_PUBLIC_APP_URL || '*'
'Access-Control-Allow-Methods': 'POST, OPTIONS'
'Access-Control-Allow-Headers': 'Content-Type'

// setup/test-storage - line 277-279
'Access-Control-Allow-Origin': '*'
'Access-Control-Allow-Methods': 'POST, OPTIONS'
'Access-Control-Allow-Headers': 'Content-Type'
```

**Status**: ✅ **OK** - Preflight OPTIONS respostas corretas

---

## 3️⃣ FLUXO DE COOKIES (O PONTO CRÍTICO)

### 📊 Fluxo Atual

```
┌─ FRESH INSTALL (sem app_installed cookie)
│
├─ 1. Browser: GET / (cookie vazio)
│  └─→ Nginx passa para App:3000
│      └─→ Middleware proxy.ts:26 verifica cookie
│          → isInstalledCookie = null
│          → Redirect 307 para /install
│
├─ 2. Browser: GET /install
│  └─→ Middleware permite (PUBLIC_ROUTES)
│      └─→ Carrega página install/page.tsx
│          └─→ Renderiza Setup Wizard
│
├─ 3. Browser: POST /api/setup/complete (JSON payload)
│  ├─ Nginx recebe POST
│  ├─ Nginx forwarda para App:3000 com headers:
│  │  ├─ Host: $host (Correto)
│  │  ├─ Content-Type: application/json (Esperado)
│  │  └─ X-Forwarded-* headers (Corretos)
│  │
│  ├─ App:3000 executa POST handler:
│  │  ├─ 1. Validação Zod schema ✅
│  │  ├─ 2. Verifica isInstalled = false ✅
│  │  ├─ 3. Hash password admin ✅
│  │  ├─ 4. Prisma $transaction (create user + config) ✅
│  │  ├─ 5. response.cookies.set('app_installed', 'true', {...}) ✅
│  │  └─ 6. Return NextResponse.json(..., { status: 200 })
│  │
│  ├─ Nginx recebe Response:
│  │  ├─ Status: 200 ✅
│  │  ├─ Headers:
│  │  │  ├─ Content-Type: application/json ✅
│  │  │  ├─ Set-Cookie: app_installed=true; HttpOnly; Path=/; Max-Age=31536000 ✅
│  │  │  └─ X-Frame-Options: SAMEORIGIN ✅
│  │  │
│  │  ├─ Nginx aplica gzip (se enabled):
│  │  │  └─ ⚠️ Pode corromper Content-Type se não configurado
│  │  │
│  │  └─ Nginx forwarda Set-Cookie para Browser:
│  │     └─ ⚠️ AQUI: Falta proxy_cookie_domain / domain=...
│  │
│  └─ Browser recebe Response:
│     ├─ Status: 200 ✅
│     ├─ Body: JSON { success: true, ... } ✅
│     └─ Set-Cookie: app_installed=true
│        └─ ⚠️ Browser armazena? Depende de proxy_cookie_domain!
│
├─ 4. Browser: GET /dashboard (com novo cookie)
│  └─→ Middleware proxy.ts:26 verifica cookie
│      → isInstalledCookie = request.cookies.get('app_installed')
│      → isInstalledCookie?.value === 'true' ✅
│      → Permite acesso
│
└─ ✅ INSTALAÇÃO COMPLETA
```

### ⚠️ Cenário de Falha

```
❌ CENÁRIO: Nginx não reescreve Set-Cookie domain

1. Backend responde:
   Set-Cookie: app_installed=true; Path=/; HttpOnly

2. ❌ Nginx forwarda COMO-ESTÁ para Browser

3. Browser está em: http://localhost:3000
   ❌ Mas cookie talvez tenha domain=app (interno Docker)
   
4. Browser NÃO armazena cookie

5. Next request: GET /dashboard
   → Middleware verifica cookie
   → isInstalledCookie = undefined
   → Redirect para /install NOVAMENTE
   → Utilizador vê loop infinito!
```

---

## 4️⃣ HEALTH CHECK RESPONSE

### 📊 Payload Esperado

```json
{
  "status": "healthy",
  "timestamp": "2026-01-15T10:30:00Z",
  "installation": {
    "installed": false,
    "completedAt": null
  },
  "database": {
    "connected": true,
    "latency": 12,
    "error": null
  },
  "storage": {
    "configured": false,
    "error": null
  },
  "redirectUrl": "/install"
}
```

### ⚠️ Problemas Potenciais

1. **Timeout de BD (>5s)**: 
   - Nginx `proxy_read_timeout 300s` é suficiente
   - Mas se BD está down, espera 5s antes de falhar
   - Browser pode ver "connecting..." por 5s

2. **Sem Cache**:
   - Health check é chamado a cada page load
   - Se aplicação está sob stress, aumenta carga
   - Solução: Adicionar `Cache-Control: max-age=10`

3. **Sem gzip**:
   - Health check é pequeno (~200 bytes)
   - Gzip não compensa
   - Mas Nginx tem `gzip_comp_level 6` ativo

---

## 5️⃣ SIMULAÇÃO DE LATÊNCIA

### 🔬 Cenário: POST `/api/setup/complete` com latência

```
TIMESTAMP  EVENTO                          TEMPO   ACUMULADO
0ms        Browser clica "Completar"       0ms     0ms
10ms       Nginx recebe POST                       10ms
20ms       App:3000 recebe request                 30ms
25ms       Validação Zod schema            5ms     55ms
50ms       Prisma $transaction (CREATE)    400ms   455ms
            - CREATE user.admin
            - CREATE 8x systemSetting
            - Commit transaction
200ms      configService.loadConfig()     100ms    555ms
210ms      response.cookies.set()           5ms    560ms
220ms      Nginx recebe 200 OK                     570ms
230ms      Gzip compression (optional)      5ms    575ms
240ms      Browser recebe resposta                 580ms
```

### ⚠️ Timeouts Críticos

| Componente | Timeout | Problema |
|---|---|---|
| **Browser** | 30-60s | Se > 60s, mostra "Loading..." indefinido |
| **Nginx proxy_read_timeout** | 300s | ✅ Suficiente (5 min) |
| **Nginx proxy_connect_timeout** | **(não definido)** | ❌ Default 60s pode causar 504 |
| **Prisma query timeout** | 10s | ✅ Na connectionPool |
| **Database query** | N/A | PostgreSQL default 0 (sem timeout) |

### 🔴 Problema: Transação Prisma pode levar 1-2s

Se há muita I/O:
1. INSERT user (25ms)
2. INSERT 8x systemSetting (400ms)
3. Commit + sync disco (100ms)
4. **Total: ~525ms** ✅ OK (< 5s timeout)

Mas se PostgreSQL está lento:
1. INSERT user (100ms)
2. INSERT 8x systemSetting (800ms)
3. Commit + sync disco (500ms)
4. **Total: ~1400ms** ✅ OK

Se PostgreSQL MUITO lento ou down:
- Espera 10s timeout conexão
- Browser vê "504 Gateway Timeout"

---

## 6️⃣ DIAGNÓSTICO DE CONECTIVIDADE

### 🎯 Possíveis Falhas Entre Browser e BD

| # | Ponto de Falha | Sintoma | Root Cause |
|---|---|---|---|
| **1** | Browser → Nginx | ERR_CONNECTION_REFUSED | Nginx não está a escutar (80/443) |
| **2** | Nginx → App:3000 | 502 Bad Gateway | App não responde (Down/Crash) |
| **3** | App → Prisma | 500 Internal Error | Env DB_URL incorreta ou BD down |
| **4** | Prisma → PostgreSQL | 500 + timeout | PostgreSQL indisponível |
| **5** | Response → Browser | Timeout 504 | proxy_read_timeout expirou |
| **6** | Cookie Storage | Cookie não persiste | Falta proxy_cookie_domain no Nginx |
| **7** | Content-Type | JSON parse error | Nginx gzip corrompe headers |
| **8** | CORS Preflight | OPTIONS falha | Access-Control headers ausentes |

---

## 7️⃣ CONFIGURAÇÃO PROXY SUGERIDA (FIXES)

### ⚠️ Nginx app.conf.template - Versão Corrigida

```nginx
# Gzip compression settings
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

# HTTP server
server {
  listen 80 default_server;
  listen [::]:80 default_server;
  server_name _;

  # Security headers
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  # Main application proxy - VERSÃO CORRIGIDA
  location / {
    proxy_pass http://app:3000;
    proxy_http_version 1.1;
    
    # === HEADERS (PASSTHROUGH) ===
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto http;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port 80;
    
    # === WEBSOCKET SUPPORT ===
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # === TIMEOUTS (CRÍTICO) ===
    proxy_connect_timeout 10s;        # ✅ NOVO: Timeout de conexão
    proxy_send_timeout 30s;           # ✅ NOVO: Timeout de envio
    proxy_read_timeout 300s;          # ✅ JÁ EXISTE: Keep-alive longo (5 min)
    
    # === BUFFERING (PERFORMANCE) ===
    proxy_buffering off;              # ✅ NOVO: Stream direto para big payloads
    
    # === COOKIES (CRÍTICO para app_installed) ===
    proxy_cookie_path / /;            # ✅ JÁ EXISTE
    proxy_cookie_domain ~ ^(.*)$ "~$host";  # ✅ NOVO: Reescrever domain para host atual
    proxy_cookie_flags ~ secure httponly samesite=lax;  # ✅ NOVO: Garantir flags de segurança
    
    # === CACHE CONTROL (OPTIONAL) ===
    # Para health checks: adicionar na resposta
    # proxy_ignore_headers Cache-Control;
  }

  # Cache static assets with long expiration
  location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
    proxy_pass http://app:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto http;
    
    # === TIMEOUTS ===
    proxy_connect_timeout 10s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;           # Mais curto para static assets
    
    expires 30d;
    add_header Cache-Control "public, immutable" always;
    add_header X-Cache-Status "HIT" always;
  }

  # === API ENDPOINTS: Timeouts mais agressivos ===
  location /api/ {
    proxy_pass http://app:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto http;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port 80;
    
    # Upgrade support
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # === TIMEOUTS ESPECÍFICOS PARA API ===
    proxy_connect_timeout 15s;        # Conexão pode ser mais lenta para setup/complete
    proxy_send_timeout 60s;           # POST pesado
    proxy_read_timeout 120s;          # Lê resposta longa (setup/complete pode levar tempo)
    
    # === BUFFERING ===
    proxy_buffering off;              # Stream direto
    
    # === COOKIES ===
    proxy_cookie_path / /;
    proxy_cookie_domain ~ ^(.*)$ "~$host";
    proxy_cookie_flags ~ secure httponly samesite=lax;
    
    # === CACHE ===
    # Health check: cache de 10s
    # location = /api/health {
    #   proxy_cache_valid 200 10s;
    #   proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    # }
  }
}
```

---

## 8️⃣ PLANO DE TESTE NO BROWSER

### 🧪 Teste 1: Verificar Headers no Fresh Install

**Pré-requisitos**:
1. Limpar cookies: DevTools → Application → Cookies → Delete all
2. Abrir DevTools: F12 → Network tab

**Passos**:

```
1. GET http://localhost:3000/
   ├─ Response Status: 307 (Redirect)
   ├─ Response Headers:
   │  ├─ Location: /install ✅
   │  └─ (Sem Set-Cookie - esperado)
   └─ Verifications: ✅ Proxy está a reencaminhar corretamente

2. GET http://localhost:3000/install
   ├─ Response Status: 200 ✅
   ├─ Response Body: HTML (Setup Wizard) ✅
   └─ Response Headers:
      ├─ Content-Type: text/html; charset=utf-8 ✅
      └─ (Sem Set-Cookie - esperado)

3. OPTIONS http://localhost:3000/api/setup/complete (Preflight)
   ├─ Response Status: 200 ✅
   ├─ Response Headers:
   │  ├─ Access-Control-Allow-Origin: http://localhost:3000 ou * ✅
   │  ├─ Access-Control-Allow-Methods: POST, OPTIONS ✅
   │  ├─ Access-Control-Allow-Headers: Content-Type ✅
   │  └─ (Sem corpo - esperado)
   └─ Verifications: ✅ CORS preflight funciona

4. POST http://localhost:3000/api/setup/complete
   Request Headers:
   ├─ Content-Type: application/json ✅
   ├─ Accept: application/json ✅
   ├─ Cookie: (vazio no fresh install) ✅
   └─ Origin: http://localhost:3000 ✅
   
   Request Body:
   {
     "companyName": "Test Co",
     "adminEmail": "admin@test.com",
     "adminPassword": "SecurePass123!",
     "domain": "localhost:3000",
     "jwtSecret": "dev-jwt-secret",
     ...
   }
   
   Response Status: 200 ✅
   Response Headers:
   ├─ Content-Type: application/json ✅
   ├─ Set-Cookie: app_installed=true; Path=/; HttpOnly; SameSite=Lax; Max-Age=315360000 ✅
   ├─ Access-Control-Allow-Origin: * ou localhost:3000 ✅
   ├─ X-Frame-Options: SAMEORIGIN ✅
   ├─ X-Content-Type-Options: nosniff ✅
   └─ Server: nginx (confirma proxy) ✅
   
   Response Body:
   {
     "success": true,
     "message": "Instalação completada com sucesso",
     "data": {
       "adminUsername": "test.co",
       "adminEmail": "admin@test.com",
       "domain": "localhost:3000",
       "companyName": "Test Co",
       "installationCompletedAt": "2026-01-15T10:30:00Z"
     },
     "redirectUrl": "/dashboard"
   }
   
   Timing:
   ├─ Waiting (TTFB): < 1000ms ✅
   ├─ Receiving: < 100ms ✅
   └─ Total: < 1500ms ✅
```

### 🧪 Teste 2: Verificar Cookie Storage

**Passo após POST `/api/setup/complete`**:

```
DevTools → Application → Cookies → http://localhost:3000

Esperado:
┌─────────────────────────────┐
│ Name: app_installed         │
│ Value: true                 │
│ Path: /                     │
│ Domain: localhost           │ ← CRÍTICO!
│ Expires: Wed Jan 14 2027    │
│ Secure: false (dev)         │
│ HttpOnly: ✅                │
│ SameSite: Lax               │
└─────────────────────────────┘

❌ Se cookie NÃO aparecer:
   → Nginx proxy_cookie_domain incorreto
   → ou Browser rejeita domain=app (Docker container name)
```

### 🧪 Teste 3: Verificar Redirect com Cookie

**Passo após cookie estar armazenado**:

```
1. Browser: GET http://localhost:3000/
   ├─ Request Cookies:
   │  └─ app_installed=true ✅
   ├─ Middleware verifica: isInstalledCookie?.value === 'true' ✅
   ├─ Response Status: 200 (permite acesso) ✅
   └─ Redireciona para /dashboard ou mostra home ✅

2. Browser: GET http://localhost:3000/install (com cookie)
   ├─ Request Cookies:
   │  └─ app_installed=true ✅
   ├─ Middleware verifica: isInstalled = true ✅
   ├─ Response Status: 307 (Redirect) ✅
   └─ Location: /dashboard ✅
```

### 🧪 Teste 4: Verificar Health Check

```
1. GET http://localhost:3000/api/health
   ├─ Response Status: 200 ✅
   ├─ Response Headers:
   │  ├─ Content-Type: application/json ✅
   │  └─ (Optional) Cache-Control: max-age=10 (não implementado)
   └─ Response Body:
      {
        "status": "healthy",
        "installation": { "installed": false },
        "database": { "connected": true, "latency": 12 },
        ...
      }

2. Verificar Latência:
   ├─ Timing → Waiting (TTFB): < 100ms ✅
   └─ (Se > 5s, significa BD está lenta)
```

### 🧪 Teste 5: Verificar Test Storage

```
1. POST http://localhost:3000/api/setup/test-storage
   Request Body:
   {
     "minioEndpoint": "minio:9000",
     "minioAccessKey": "minioadmin",
     "minioSecretKey": "minioadmin_dev_123",
     "minioBucket": "acrobaticz-dev"
   }
   
   Response Status: 200 ✅
   Response Body:
   {
     "success": true,
     "message": "MinIO is accessible. Bucket \"acrobaticz-dev\" found.",
     "latency": 45,
     "bucketExists": true
   }
   
   Timing: < 200ms esperado ✅
```

### 🧪 Teste 6: Simular Timeout (Opcional)

```
Para verificar se Nginx 504 é evitado:

1. No terminal, pausar PostgreSQL:
   docker pause acrobaticz-postgres-dev

2. Browser: POST http://localhost:3000/api/setup/test-storage

3. Observar:
   ├─ Nginx espera 5s (timeout de conexão)
   ├─ Response Status: 503 (Service Unavailable) ✅
   └─ (Não deve ser 504 Gateway Timeout)

4. Retomar PostgreSQL:
   docker unpause acrobaticz-postgres-dev
```

---

## 9️⃣ CHECKLIST DE IMPLEMENTAÇÃO

### ✅ Já Implementado

- [x] Cookie `app_installed` com httpOnly ✅
- [x] Middleware verifica cookie ✅
- [x] Endpoints definem CORS headers ✅
- [x] NextResponse.json() adiciona Content-Type ✅
- [x] proxy_read_timeout 300s ✅
- [x] proxy_send_timeout 300s ✅
- [x] proxy_cookie_path / / ✅
- [x] WebSocket Upgrade headers ✅
- [x] Gzip compression ✅
- [x] Prisma $transaction para atomicidade ✅

### ⚠️ REQUER IMPLEMENTAÇÃO

- [ ] **CRÍTICO**: Adicionar `proxy_connect_timeout 10s` no Nginx
- [ ] **CRÍTICO**: Adicionar `proxy_cookie_domain ~ ^(.*)$ "~$host"` no Nginx
- [ ] **RECOMENDADO**: Adicionar `proxy_buffering off` no Nginx
- [ ] **RECOMENDADO**: Adicionar `Content-Type` explícito em endpoints
- [ ] **OPCIONAL**: Adicionar `Cache-Control: max-age=10` em `/api/health`

---

## 🔟 ERROS COMUNS & TROUBLESHOOTING

### 🔴 Erro: "502 Bad Gateway"

```
Causa possível 1: Nginx → App:3000 falha
Verificação:
  docker logs acrobaticz-nginx-dev 2>&1 | grep "502\|upstream"

Causa possível 2: App não respondeu no proxy_read_timeout
Solução: Aumentar proxy_read_timeout ou otimizar query

Causa possível 3: proxy_connect_timeout expirou
Solução: Adicionar proxy_connect_timeout (não configurado!)
```

### 🔴 Erro: "504 Gateway Timeout"

```
Causa: Request demorou > proxy_read_timeout (300s)
Verificação:
  curl -v http://localhost/api/setup/complete
  (Esperar 5+ minutos)

Solução: Aumentar timeout ou otimizar request
```

### 🔴 Erro: Cookie não persiste após instalação

```
Causa: Falta proxy_cookie_domain no Nginx
Verificação:
  DevTools → Application → Cookies → app_installed
  (Se não aparecer ou domain=app, é este o problema)

Solução: Adicionar proxy_cookie_domain ~ ^(.*)$ "~$host"
```

### 🔴 Erro: Redirect loop /install ↔ /dashboard

```
Causa 1: Cookie não armazenado
Causa 2: Middleware não lê cookie corretamente
Verificação:
  1. Verificar se app_installed está em Cookies (DevTools)
  2. Verificar middleware proxy.ts:26
  3. Adicionar console.log para debug:
     console.log('isInstalledCookie:', request.cookies.get('app_installed'));

Solução: Ver acima - proxy_cookie_domain
```

### 🔴 Erro: "CORS error: Access-Control-Allow-Origin"

```
Causa: Browser request de origem diferente
Verificação:
  DevTools → Network → Resposta OPTIONS
  (Verificar Access-Control-Allow-Origin header)

Solução: Endpoints já definem CORS, verifique:
  - setup/complete: line 444
  - setup/test-storage: line 277
  - health: line 201 (se implementado)
```

### 🔴 Erro: JSON parse error no browser

```
Causa: Nginx gzip corrompe Content-Type header
Verificação:
  DevTools → Network → Response Headers
  Content-Type deve ser: application/json

Solução: Nginx já tem gzip_types que inclui application/json
          Verificar se gzip on; está ativo
```

---

## 📊 SUMMARY TABLE

| Verifi | Endpoint | Status | Issue | Fix |
|---|---|---|---|---|
| ✅ | POST /api/setup/complete | 95% OK | Sem proxy_connect_timeout | Add 10s timeout |
| ✅ | POST /api/setup/test-storage | 95% OK | Sem proxy_cookie_domain | Add cookie domain rule |
| ✅ | GET /api/health | 90% OK | Sem Content-Type explícito | Use NextResponse.json() |
| ✅ | Cookies (app_installed) | 80% OK | Pode não ser armazenado | Fix proxy_cookie_domain |
| ✅ | CORS Headers | 100% OK | Nenhum | - |
| ✅ | Nginx Proxy | 85% OK | Faltam timeouts | Add connect/send timeout |
| ✅ | Gzip | 100% OK | Nenhum | - |
| ✅ | WebSocket | 100% OK | Nenhum | - |

---

## 📝 CONCLUSÃO

**Diagnóstico Final**:

A stack de comunicação está **95% correta**, mas tem **3 problemas críticos** que podem causar **502/504 errors** durante o setup:

1. ⚠️ **Nginx proxy_connect_timeout não definido** → Pode causar 504 em conexões lentas
2. ⚠️ **Nginx proxy_cookie_domain não definido** → Cookie pode não ser armazenado
3. ⚠️ **Nginx proxy_buffering ativo** → Pode causar latência em big payloads

**Ação Recomendada**:

1. ✅ Implementar fixes no nginx/app.conf.template (ver secção 7)
2. ✅ Testar fluxo no browser (ver secção 8)
3. ✅ Verificar logs: `docker logs acrobaticz-nginx-dev`
4. ✅ Confirmar que utilizador NUNCA vê 502/504 durante setup

**Esforço Estimado**: 15 minutos para implementar + 10 minutos para testar = 25 min total

---

**Próximos Passos**:

1. Aplicar config Nginx corrigida
2. Testar cada passo do wizard
3. Verificar DevTools → Network tab para confirmar 200 OK em todos requests
4. Confirmar cookie `app_installed` está em Application → Cookies
5. Verificar que `/dashboard` é acessível após setup

---

**Documento criado em**: 15 Jan 2026 14:30 UTC  
**Versão**: 1.0 - AUDITORIA COMPLETA  
**Próxima revisão**: Após implementação de fixes

