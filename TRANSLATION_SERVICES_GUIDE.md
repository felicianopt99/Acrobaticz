# Guia Completo dos Serviços de Tradução - Acrobaticz

## 📋 Índice
1. [Visão Geral da Arquitetura](#visão-geral)
2. [DeepL Service](#deepl-service)
3. [Translation Library](#translation-library)
4. [Translation Server Actions](#translation-actions)
5. [Fluxo de Tradução Automática](#fluxo-automático)
6. [Cache e Performance](#cache-performance)
7. [Tratamento de Erros](#tratamento-erros)
8. [Configuração e Setup](#configuração)

---

## 🏗️ Visão Geral da Arquitetura {#visão-geral}

O sistema de tradução do Acrobaticz é composto por **3 camadas principais**:

```
┌─────────────────────────────────────┐
│   UI/API Routes                     │
│   (Triggers automáticas)            │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│   Translation Server Actions        │
│   (translation.actions.ts)          │
│   - translateProduct()              │
│   - translateCategory()             │
│   - retranslateProduct()            │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│   Translation Wrapper Library       │
│   (translation.ts)                  │
│   - translateText()                 │
│   - translateBatch()                │
│   - Cache + Rules                   │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│   DeepL Service                     │
│   (deepl.service.ts)                │
│   - API Key Management              │
│   - Retry Logic                     │
│   - Concurrency Control             │
│   - Database Cache                  │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│   DeepL API (External Service)      │
│   https://api-free.deepl.com/v2/... │
└─────────────────────────────────────┘
```

---

## ⚙️ DeepL Service (`src/lib/deepl.service.ts`) {#deepl-service}

### Propósito
O serviço mais baixo da pilha. Gerencia **toda a comunicação com a API DeepL**, incluindo:
- Recuperação segura da API key
- Retry automático com backoff exponencial
- Controle de concorrência (máx 4 requisições simultâneas)
- Cache persistente no banco de dados
- Tratamento de erros detalhado

### Componentes Principais

#### 1. **Recuperação da API Key** (`getDeeplApiKey()`)

```typescript
// Tenta 3 métodos em sequência:
1. ConfigService (systemSetting table com decrypt automático)
   - Categoria: "Integration"
   - Chave: "DEEPL_API_KEY"
   - Pode estar criptografada

2. aPIConfiguration table (método alternativo)
   - Provider: "deepl"

3. Variável de ambiente
   - DEEPL_API_KEY

// Com cache de 5 minutos
// Logging detalhado para diagnóstico
```

**Fluxo de Recuperação:**
```
getDeeplApiKey()
  ↓
Check Cache (5 min TTL)
  ├─ Hit? → Return cached key
  ├─ Miss? → Continue
  ↓
Try configService.get('Integration', 'DEEPL_API_KEY')
  ├─ Found? → Cache and return
  ├─ Not found? → Continue
  ↓
Try getAPIKey('deepl') from aPIConfiguration
  ├─ Found? → Cache and return
  ├─ Not found? → Continue
  ↓
Try process.env.DEEPL_API_KEY
  ├─ Found? → Cache and return
  ├─ Not found? → Log warning and return null
```

#### 2. **Função Principal: `deeplTranslateText()`**

```typescript
async function deeplTranslateText(
  sourceText: string,
  targetLanguage: Language ('en' | 'pt')
): Promise<ApiResponse<TranslationResult>>

// Retorno:
{
  status: 'success' | 'error',
  data?: {
    sourceText: string,
    translatedText: string,
    targetLanguage: Language,
    usedCache: boolean,
    timestamp: ISO string
  },
  message?: string,
  timestamp: ISO string
}
```

**Processo Detalhado:**

```
deeplTranslateText(text, lang)
  ↓
withConcurrency (Semaphore - max 4 simultâneas)
  ↓
Verificar Cache (BD)
  ├─ Encontrou? → Return com {usedCache: true}
  ├─ Não encontrou? → Continue
  ↓
Verificar API Key
  ├─ Não tem? → Return error
  ├─ Tem? → Continue
  ↓
Retry Loop (máx 3 tentativas)
  │
  ├─ Tentativa 1:
  │   └─ POST para DeepL API
  │      ├─ Success? → Save to cache, return
  │      ├─ Fail? → Log erro, aguarda backoff
  │
  ├─ Tentativa 2:
  │   └─ Mesmo que acima (backoff = 500ms * 2 + jitter)
  │
  └─ Tentativa 3:
      └─ Mesmo que acima (backoff = 500ms * 4 + jitter)
      ├─ Success? → Return
      ├─ Fail? → Return error
```

#### 3. **Controle de Concorrência** (`withConcurrency()`)

```typescript
// Semaphore que limita a 4 requisições simultâneas
// Evita rate limiting da DeepL API

// Estados:
- inflight: número de requisições em progresso
- waitQueue: fila de requisições aguardando slot livre

// Quando inflight >= 4:
while (inflight >= MAX_CONCURRENCY) {
  await Promise que resolve quando slot ficar livre
}
```

#### 4. **Cache em Banco de Dados** (`checkCache()` e `saveToCache()`)

```typescript
// Tabela: translationCache
{
  hash: SHA256(sourceText + ':' + targetLanguage),
  sourceText: string,
  translatedText: string,
  targetLanguage: Language,
  contentType: 'general',
  expiresAt: Date (30 dias por padrão),
  updatedAt: Date
}

// TTL: 30 dias (configurável via CACHE_TTL_DAYS)
// Verificação: Antes de fazer requisição para DeepL
// Limpeza: Automática quando expirado
```

#### 5. **Batch Translation** (`batchTranslate()`)

```typescript
// Para múltiplas requisições (produtos, categorias)
async function batchTranslate(
  requests: TranslationRequest[]
): Promise<ApiResponse<BatchTranslationResult>>

// Traduz cada texto + idioma combinação
// Processa sequencialmente para respeitar rate limits
// Suporta fallover para tradução individual em caso de erro
```

---

## 📚 Translation Library (`src/lib/translation.ts`) {#translation-library}

### Propósito
Camada de **abstração e compatibilidade** que fornece interface simples para o resto da aplicação.

### Componentes Principais

#### 1. **Cache em Memória (LRU)**

```typescript
class LRUCache {
  // Configurável via env var: TRANSLATION_CACHE_MAX (default: 5000)
  // Estrutura: Map com limite de tamanho
  
  Operações:
  - get(key): string | undefined
  - set(key, value): void (remove LRU item se cheio)
  - clear(): void
  - size(): number
  - keys(): string[]
}

// Objetivo: Cache super rápido (< 1ms)
// Fallback: translationCache se não tem em memória
```

#### 2. **Função Principal: `translateText()`**

```typescript
export async function translateText(
  text: string,
  targetLang: Language = 'pt'
): Promise<string>

// Retorna sempre uma string (nunca Promise<string | null>)
// Em caso de erro, retorna o texto original
```

**Processo:**

```
translateText(text, 'pt')
  ↓
Se lang === 'en' OU text está vazio:
  └─ Return text (sem traduzir)
  ↓
Check Translation Rules (override exato)
  ├─ Encontrou match exato? → Apply rule com case preservation
  ├─ Não encontrou? → Continue
  ↓
Chamar deeplTranslateText() via deepl.service
  ├─ Success? → Continue
  ├─ Erro? → Return original text
  ↓
Apply Post-Translation Rules
  └─ Replace termos conhecidos que DeepL pode traduzir errado
     (ex: "Quotes" → "citações" → "orçamentos")
  ↓
Apply Glossary (PT-BR → PT-PT)
  └─ Correções automáticas:
     - contato → contacto
     - aluguel → aluguer
     - banheiro → casa de banho
     - etc...
  ↓
Return translated text
```

#### 3. **Regras de Tradução** (`loadTranslationRules()`)

```typescript
// Permite override customizado de traduções
// Exemplo: "Quote" → sempre "Orçamento"

// Aplicadas em 2 níveis:
1. ANTES de chamar DeepL (para termos simples)
2. DEPOIS de DeepL (para correções)

// Estrutura:
{
  "Quote": "Orçamento",
  "Quotes": "Orçamentos",
  "Invoice": "Fatura",
  ...
}
```

#### 4. **Glossário PT-BR → PT-PT**

```typescript
// Correções automáticas após tradução
const PT_GLOSSARY = [
  { pattern: /\bcontato\b/gi, replace: 'contacto' },
  { pattern: /\baluguel\b/gi, replace: 'aluguer' },
  { pattern: /\bcelular\b/gi, replace: 'telemóvel' },
  { pattern: /\bônibus\b/gi, replace: 'autocarro' },
  { pattern: /\bbanheiro\b/gi, replace: 'casa de banho' },
  // ... mais 15+
]

// Aplicadas SEMPRE quando targetLang === 'pt'
// Case-preserving: "CONTATO" → "CONTACTO", "Contato" → "Contacto"
```

#### 5. **Batch Translation: `translateBatch()`**

```typescript
export async function translateBatch(
  texts: string[],
  targetLang: Language = 'pt',
  progressive: boolean = false
): Promise<string[]>

// Modo Progressive:
// - Retorna resultado com cache + rules em < 10ms
// - Carrega BD em background
// - Traduz com IA em background
// - Atualiza array de resultados conforme chega

// Modo Normal:
// - Aguarda tudo e retorna resultado completo
```

**Processo (Modo Normal):**

```
translateBatch(['text1', 'text2', 'text3'], 'pt')
  ↓
Loop 1: Check In-Memory Cache + Rules
  ├─ Hit para text1 → results[0] = cached
  ├─ Hit para text2 → results[1] = cached
  └─ Miss para text3 → results[2] = original

Se todos hit: Return results immediately ✓
  ↓
Loop 2: Batch Fetch from Database (1 query)
  └─ SELECT * FROM translation WHERE sourceText IN (...) AND targetLang = 'pt'
     ├─ Encontrou text2 em BD → Update results[2]
     └─ Não encontrou → Continua

Se todos resolvidos: Return results ✓
  ↓
Loop 3: Batch Translate with AI (DeepL)
  ├─ Traduz text3 via deepl.service.batchTranslate()
  ├─ Aplica glossário: "contato" → "contacto"
  ├─ Salva em BD (bulk insert, skip duplicates)
  ├─ Aquece cache em memória
  └─ Update results[2]
  ↓
Return results (100% traduzido)
```

#### 6. **Background Progressive Loading**

```typescript
// Se progressive=true, retorna em < 10ms
// E continua carregando em background

// Permite UI ficar responsiva
// Tradução + BD salvam conforme pronto
```

---

## 🎯 Translation Server Actions (`src/app/api/actions/translation.actions.ts`) {#translation-actions}

### Propósito
Ações server-side que **coordenam tradução com persistência** em tabelas especializadas:
- `ProductTranslation` (para produtos/equipment)
- `CategoryTranslation` (para categorias)

### Funções Principais

#### 1. **`translateProduct()`**

```typescript
export async function translateProduct(
  productId: string,
  name: string,
  description: string | null,
  targetLanguages: Language[] = ['pt']
): Promise<ServerActionResult<TranslationStatus>>

// Retorno:
{
  status: 'success' | 'error',
  data: {
    translations: {
      'pt': { status: 'completed', text: '...', translatedAt: ISO },
      'en': { status: 'completed', text: '...', translatedAt: ISO }
    }
  },
  timestamp: ISO
}
```

**Processo:**

```
translateProduct(id, name, description, ['pt'])
  ↓
Validar inputs
  ├─ ProductId e Name obrigatórios
  └─ Continua
  ↓
Para cada language em targetLanguages:
  │
  ├─ Chamar deeplTranslateText(name, language)
  │   ├─ Success → Continue
  │   └─ Fail → Add to errors, continue
  │
  ├─ Se description:
  │   └─ Chamar deeplTranslateText(description, language)
  │
  ├─ Fazer upsert em ProductTranslation:
  │   ├─ Se existe → update
  │   └─ Se não → create (com id: randomUUID())
  │       Fields: productId, language, name, description, isAutomatic, updatedAt
  │
  └─ Add to result com status 'completed'
  ↓
Return results (com lista de erros se houver)
```

#### 2. **`translateCategory()`**

Exatamente igual ao `translateProduct()`, mas:
- Salva em `CategoryTranslation` table
- Toma `categoryId` em vez de `productId`

#### 3. **`retranslateProduct()` / `retranslateCategory()`**

```typescript
// Força retradução (ignora cache)
// 1. Busca produto/categoria do BD
// 2. Chama translateProduct/translateCategory
// 3. Limpa cache com resetApiKeyCache()
```

#### 4. **`getCacheStats()`**

```typescript
// Retorna estatísticas de cache do DeepL Service
{
  totalCached: number,      // Entradas válidas
  totalExpired: number,     // Expiradas (será limpas)
  byLanguage: {
    'pt': 1234,
    'en': 567
  }
}
```

#### 5. **`clearExpiredCache()`**

```typescript
// Manual cleanup de cache expirado
// Deleta entries onde expiresAt < now()
```

---

## 🔄 Fluxo de Tradução Automática {#fluxo-automático}

### Cenário 1: Criar Equipment (com Tradução Automática)

```
1. POST /api/equipment
   └─ Input: { name: 'Forklift', description: 'Heavy duty forklift' }

2. Validação + Salvar no BD (equipmentItem)
   └─ Retorna imediatamente ao cliente ✓

3. Background Task (fire-and-forget):
   └─ translateEquipmentDescription(description)
      ├─ Chamar translateText(description, 'pt')
      ├─ Aguarda resposta
      ├─ Update equipmentItem.descriptionPt com tradução
      └─ Log: "[Background] Translation completed"

4. Cliente recebe resposta em ~100ms
   └─ Tradução completa em ~2-5s em background
```

**Código na rota:**
```typescript
// POST /api/equipment
const equipment = await prisma.equipmentItem.create({ ... });

// Fire-and-forget background translation
if (validatedData.description) {
  translateEquipmentDescription(validatedData.description)
    .then(async (translated) => {
      if (translated) {
        await prisma.equipmentItem.update({
          where: { id: equipment.id },
          data: { descriptionPt: translated }
        });
      }
    })
    .catch(error => console.error('Translation failed:', error));
}

return NextResponse.json(equipment, { status: 201 });
```

### Cenário 2: Traduzir Batch de Produtos (Admin)

```
1. User clica "Retranslate All Products"

2. Action Server: translateProductsInBatch()
   └─ SELECT * FROM product LIMIT 1000
   └─ Para cada product:
      └─ Chamar translateProduct(id, name, description, ['pt'])

3. Resultado:
   ├─ ~1000 produtos traduzidos
   ├─ Cache preenchido
   └─ Tabela ProductTranslation atualizada
```

---

## ⚡ Cache e Performance {#cache-performance}

### 3 Níveis de Cache

#### Nível 1: In-Memory (LRU)
```
Estrutura: translationCache (Map)
Size: até 5000 entradas (configurável)
TTL: ∞ (mas pode ser limpo manualmente)
Speed: < 1ms
Keys: `${language}:${text}`

Quando limpar:
- clearTranslationCache()
- Manual ou após alterações de rules
```

#### Nível 2: Database (translationCache table)
```
Tabela: translationCache
TTL: 30 dias (renovado a cada uso)
Speed: ~5-20ms
Queries: 1 por tradução (com hash)

Trigger: Automático em cada tradução sucesso
Cleanup: Automático (quando expirado)
```

#### Nível 3: Specialized Tables
```
Tabelas: ProductTranslation, CategoryTranslation
Purpose: Histórico + versionamento
Speed: ~5-20ms
Queries: Mais específicas por produto

Example:
SELECT * FROM productTranslation
WHERE productId = '123' AND language = 'pt'
```

### Fluxo de Cache (Lookup)

```
translateText('Hello', 'pt')
  ↓
1. In-Memory Cache? → HIT: return ~1ms ✓
  ↓
2. DB translationCache? → HIT: return ~10ms ✓
  ↓
3. DeepL API? 
   ├─ Rate limit OK? → API call ~500-2000ms
   ├─ Rate limited? → Retry com backoff
   └─ Success → Save to all caches
```

### Estatísticas Típicas

| Operação | Tempo | Cache? |
|----------|-------|--------|
| Termo em memória | 1ms | ✓✓✓ |
| Termo no BD | 10-20ms | ✓✓ |
| Nova tradução (API) | 800-1500ms | ✓ |
| Batch 20 textos (novo) | 5-10s | Paralelo |
| Batch 20 textos (cache) | 5-10ms | ✓✓✓ |

---

## 🚨 Tratamento de Erros {#tratamento-erros}

### Erro 1: Sem API Key Configurada

```
Symptom: Todas as traduções retornam original

Debug:
1. Check systemSetting:
   SELECT * FROM systemSetting 
   WHERE category='Integration' AND key='DEEPL_API_KEY'

2. Check env:
   echo $DEEPL_API_KEY

3. Check logs:
   [DeepL] ⚠️ No API key found...

Fix:
- Admin Dashboard → API Configuration → Add DeepL
- Ou set env var DEEPL_API_KEY=...
```

### Erro 2: Rate Limiting (429)

```
Symptom: DeepL API returns 429 Too Many Requests

Auto-handled:
- withConcurrency() limita a 4 simultâneas
- Retry com backoff exponencial
- MAX_RETRIES = 3
- Delay: 500ms * 2^attempt + jitter

Se persiste:
- Aumentar BASE_DELAY_MS
- Diminuir MAX_CONCURRENCY
- Esperar 1 hora para reset DeepL quota
```

### Erro 3: API Key Inválida

```
Symptom: 401 Unauthorized da DeepL

Debug:
1. Verificar formato da chave (deve ter ':' se encriptada)
2. Testar em Admin → API Configuration → Test button
3. Check console logs para mensagem específica

Fix:
- Regenerar API key em https://www.deepl.com/account
- Atualizar em Admin Dashboard
- Chamar resetApiKeyCache() ou reiniciar
```

### Erro 4: Timeout ou Falha de Rede

```
Symptom: Tradução nunca completa

Auto-handled:
- Retry automático 3x
- Backoff exponencial (500ms → 1s → 2s)
- Timeout implícito do fetch (~30s)

Se persiste:
- Verificar conexão internet
- Verificar firewall/proxy
- Verificar status da API DeepL
```

### Padrão de Resposta para Todos os Erros

```typescript
// Sempre retorna este padrão:
{
  status: 'error',
  message: 'Descrição do erro',
  timestamp: '2024-01-16T...',
  data?: null
}

// NUNCA lança exception (tudo é tratado)
// Aplicação continua funcionando (fallback ao texto original)
```

---

## 🔐 Configuração e Setup {#configuração}

### Pré-requisitos

1. **Conta DeepL**
   - Ir para: https://www.deepl.com/pro
   - Sign up (free plan disponível: 500k chars/mês)
   - Get API key

2. **Banco de Dados**
   - Tabelas: `systemSetting`, `translationCache`, `productTranslation`, `categoryTranslation`
   - Indices: hash em translationCache, productId_language em productTranslation

### Setup Automático (Installer)

```typescript
// src/app/(setup)/install/components/StepDeepL.tsx

// 1. Form pede API key (opcional)
// 2. Se preenchida:
//    - POST /api/setup/complete
//    - systemSetting upsert com DEEPL_API_KEY
//    - Encriptação automática
// 3. Se vazio:
//    - Avisa "Tradução desativada"
//    - Permite continuar
```

### Setup Manual (Admin)

```typescript
// Admin Dashboard → API Configuration

// 1. Click "Add API"
// 2. Select "DeepL"
// 3. Paste API key
// 4. Click "Test" (testa conexão)
// 5. Click "Save"
// 6. API ativada imediatamente
```

### Variáveis de Ambiente

```bash
# .env
DEEPL_API_KEY=your_key_here          # Fallback se BD vazio
CONFIG_ENCRYPTION_KEY=your_key       # Para encriptar chaves
TRANSLATION_CACHE_MAX=5000           # Max items em memória

# docker-compose.yml
DEEPL_API_KEY=${DEEPL_API_KEY:-}    # Pass from host
```

### Verificação de Setup

```bash
# 1. Verificar conexão
curl -X POST https://api-free.deepl.com/v1/translate \
  -H "Authorization: DeepL-Auth-Key YOUR_KEY" \
  -d '{"text": ["test"], "target_lang": "PT"}'

# 2. Verificar BD
SELECT * FROM systemSetting WHERE key='DEEPL_API_KEY';

# 3. Verificar cache
SELECT COUNT(*) FROM translationCache;

# 4. Check logs
docker logs acrobaticz_app | grep DeepL
```

---

## 📊 Monitoramento

### Dashboard Admin

```
Admin → Translations → View Stats

Mostra:
- Total de traduções em cache
- Por idioma
- Data de última sincronização
- Opção de "Clear Cache"
- Opção de "Retranslate All"
```

### Logs para Debug

```typescript
// Ativar debug logging:
// 1. Procurar por [DeepL] nos logs
// 2. Procurar por [Translation] nos logs
// 3. Procurar por [Background] para tasks de fundo

// Exemplos:
[DeepL] ✓ API key loaded successfully
[DeepL] ❌ Failed to retrieve API key: error message
[Background] Translation completed for equipment 123
[Translation] Cache hit: "Hello" → cached 50ms ago
```

### Otimizações Possíveis

1. **Aumentar MAX_CONCURRENCY**
   - Padrão: 4
   - Se BD rápido: até 8-10

2. **Aumentar TRANSLATION_CACHE_MAX**
   - Padrão: 5000
   - Se memória disponível: até 50.000

3. **Usar Batch Translation**
   - Para > 5 textos simultâneos
   - Mais eficiente que individual

4. **Implementar Webhooks**
   - Notificar frontend quando tradução completa
   - Melhor UX para traduções grandes

---

## 🎓 Resumo Técnico

| Aspecto | Detalhe |
|---------|---------|
| **API** | DeepL Free (`api-free.deepl.com`) |
| **Limite** | 500k chars/mês (free) ou ilimitado (pro) |
| **Retry** | 3 tentativas com backoff exp |
| **Concorrência** | Max 4 requisições simultâneas |
| **Cache BD** | 30 dias TTL |
| **Cache Memória** | Up to 5000 entradas |
| **Idiomas** | EN ↔ PT (expansível) |
| **Fallback** | Sempre retorna texto original se erro |
| **Persistência** | ProductTranslation, CategoryTranslation |
| **Setup** | Automático no installer ou manual no admin |

---

## 📞 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Sem tradução | Verificar API key no Admin |
| Tradução lenta | Aumentar MAX_CONCURRENCY |
| Cache cresce muito | Limpar em Admin ou aumentar TTL |
| Termo traduzido errado | Adicionar rule em translation-rules.ts |
| Português (Brasil) aparecer | Glossário automático converte para PT-PT |
| Erro 429 | Rate limited - esperar ou upgrade DeepL plan |
| Erro 401 | API key inválida - regenerar |

---

**Última atualização: 16 de Janeiro de 2026**
