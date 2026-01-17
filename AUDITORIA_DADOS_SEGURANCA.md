# Auditoria Técnica de Dados e Segurança

## 1. Mapeamento de Entidades

### 1.1 Tabelas Principais e Campos-Chave

#### Núcleo de Negócio

| Entidade | Campos-Chave | Descrição |
|----------|--------------|-----------|
| **EquipmentItem** | `id`, `name`, `categoryId`, `subcategoryId`, `quantity`, `status`, `dailyRate`, `deletedAt` | Equipamento em aluguel com suporte a soft-delete |
| **Rental** | `id`, `eventId`, `equipmentId`, `quantityRented`, `scannedOut`, `scannedIn`, `version` | Aluguel com Optimistic Concurrency Control (OCC) |
| **Event** | `id`, `name`, `clientId`, `location`, `startDate`, `endDate`, `agencyId`, `quoteId` | Evento associado a cliente e parceiros |
| **Quote** | `id`, `quoteNumber`, `clientId`, `name`, `startDate`, `endDate`, `subTotal`, `totalAmount`, `status` | Cotação com estado (Draft/Sent/Accepted/Rejected/Expired) |
| **QuoteItem** | `id`, `quoteId`, `type`, `equipmentId`, `serviceName`, `feeName`, `lineTotal` | Itens de cotação (equipamentos, serviços, taxas) |
| **Client** | `id`, `name`, `contactPerson`, `email`, `phone`, `address`, `partnerId` | Cliente com relação opcional a parceiro |
| **Partner** | `id`, `name`, `companyName`, `email`, `phone`, `isActive`, `partnerType`, `commission` | Parceiro/Agência com tipos (provider/agency) |
| **Category** | `id`, `name`, `icon`, `version`, `createdBy`, `updatedBy` | Categoria de equipamento |
| **Subcategory** | `id`, `name`, `parentId`, `version` | Subcategoria aninhada em categoria |
| **User** | `id`, `name`, `username`, `password`, `role`, `isActive`, `version` | Utilizador do sistema com auditoria |

#### Operações e Auditoria

| Entidade | Campos-Chave | Descrição |
|----------|--------------|-----------|
| **ActivityLog** | `id`, `userId`, `action`, `entityType`, `entityId`, `oldData`, `newData`, `ipAddress`, `userAgent` | Log de todas as operações (CREATE/UPDATE/DELETE) |
| **EquipmentScanLog** | `id`, `rentalId`, `equipmentId`, `userId`, `scanType`, `status`, `timestamp`, `conflictVersion` | Auditoria de scans (checkout/checkin) com rastreabilidade |
| **BatchOperation** | `id`, `operationType`, `status`, `fileCount`, `performedBy`, `initiatedAt`, `completedAt` | Operações em lote com utilizador responsável |

#### Armazenamento e Ficheiros

| Entidade | Campos-Chave | Descrição |
|----------|--------------|-----------|
| **CloudFile** | `id`, `name`, `originalName`, `mimeType`, `size`, `storagePath`, `ownerId`, `isPublic`, `folderId` | Ficheiro com metadata e sharing |
| **CloudFolder** | `id`, `name`, `parentId`, `ownerId`, `color`, `isStarred`, `isTrashed` | Pasta com suporte a hierarquia |
| **FileShare** | `id`, `fileId`, `sharedWith`, `permission`, `shareToken`, `expiresAt` | Partilha de ficheiros com expiração |
| **FileTag**, **FolderTag** | `id`, `fileId`/`folderId`, `tagId`, `addedAt` | Etiquetagem de ficheiros/pastas |

#### Notificações e Preferências

| Entidade | Campos-Chave | Descrição |
|----------|--------------|-----------|
| **Notification** | `id`, `userId`, `type`, `title`, `message`, `priority`, `isRead`, `entityType`, `actionUrl` | Notificações com priorização |
| **NotificationPreference** | `id`, `userId`, `conflictAlerts`, `statusChanges`, `eventReminders`, `criticalAlerts` | Preferências granulares por utilizador |

#### Internacionalização e Tradução

| Entidade | Campos-Chave | Descrição |
|----------|--------------|-----------|
| **Translation** | `id`, `sourceText`, `targetLang`, `translatedText`, `model`, `needsReview`, `status`, `qualityScore` | Tradução com QA e versionamento |
| **TranslationCache** | `id`, `sourceText`, `targetLanguage`, `translatedText`, `hash`, `expiresAt` | Cache de traduções com expiração |
| **TranslationJob** | `id`, `contentType`, `contentId`, `sourceLanguage`, `targetLanguages`, `status`, `progress` | Job assíncrono de tradução em massa |
| **CategoryTranslation**, **SubcategoryTranslation**, **ProductTranslation** | `id`, `categoryId`/`subcategoryId`/`productId`, `language`, `name` | Traduções por língua (isAutomatic flag) |

#### Sistema e Configuração

| Entidade | Campos-Chave | Descrição |
|----------|--------------|-----------|
| **customization_settings** | `id`, `companyName`, `primaryColor`, `loginBackgroundType`, `customCSS`, `enableTwoFactor` | Customizações globais com branding |
| **SystemSetting** | `id`, `category`, `key`, `value`, `isEncrypted`, `encryptedValue` | Configurações por categoria com suporte a encriptação |
| **StorageQuota** | `id`, `userId`, `usedBytes`, `quotaBytes`, `cloudEnabled` | Quota por utilizador com histórico |

### 1.2 Relações Críticas (1:N e N:N)

#### Relações 1:N

```
Category (1) ──→ EquipmentItem (N)
            ──→ Subcategory (N)

Subcategory (1) ──→ EquipmentItem (N)

Event (1) ──→ Rental (N)
         ──→ Subrental (N)
         ──→ EquipmentScanLog (N)
         ──→ EventSubClient (N)

Client (1) ──→ Event (N)
         ──→ Quote (N)
         ──→ EventSubClient (N)
         ──→ CatalogShareInquiry (N)

Partner (1) ──→ CatalogShare (N)
           ──→ CatalogShareInquiry (N)
           ──→ Event (N) [via agencyId]
           ──→ JobReference (N)
           ──→ Subrental (N)
           ──→ Client (N) [via Client.partnerId]

EquipmentItem (1) ──→ Rental (N)
               ──→ MaintenanceLog (N)
               ──→ QuoteItem (N)
               ──→ EquipmentScanLog (N)

Quote (1) ──→ QuoteItem (N)
        ──→ Event (N) [via Event.quoteId]
        ──→ JobReference (N)

Rental (1) ──→ EquipmentScanLog (N)

CatalogShare (1) ──→ CatalogShareInquiry (N)

User (1) ──→ BatchOperation (N)
         ──→ CloudFile (N)
         ──→ CloudFolder (N)
         ──→ FileActivity (N)
         ──→ Notification (N)
         ──→ NotificationPreference (1:1)
         ──→ StorageQuota (1:1)
         ──→ TagDefinition (N)

CloudFile (1) ──→ FileActivity (N)
            ──→ FileShare (N)
            ──→ FileTag (N)
            ──→ FileVersion (N)

CloudFolder (1) ──→ CloudFile (N)
              ──→ CloudFolder (N) [self-referential]
              ──→ FolderShare (N)
              ──→ FolderTag (N)

TagDefinition (1) ──→ FileTag (N)
                ──→ FolderTag (N)

Translation (1) ──→ TranslationHistory (N)

TranslationJob (1) ──→ [não tem relações, apenas metadata]
```

#### Relações Especiais

- **EventSubClient**: Junção N:N entre Event e Client (permite múltiplos sub-clientes por evento)
- **FileTag/FolderTag**: Junção N:N com TagDefinition (constraint único por file/tag)
- **Client.partnerId** → Partner (opcional, permite cliente-parceiro)
- **Partner.clientId** → Client (opcional, permite parceiro-cliente, criando relação bidirecional)
- **CloudFolder.parentId** → CloudFolder (auto-referência, suportando hierarquia)

---

## 2. Motor de Validação & Segurança

### 2.1 Arquitetura de Validação com Zod

O ficheiro `src/lib/schemas.ts` implementa validação em duas camadas:

#### Camada 1: Transformadores de Sanitização

```typescript
// SafeString: Remove HTML, limita a 500 chars
export const SafeString = z
  .string()
  .min(1, 'Campo obrigatório')
  .max(500, 'Máximo 500 caracteres')
  .transform(sanitizeString);

// SafeStringLong: Permite até 5000 chars para descrições
export const SafeStringLong = z
  .string()
  .min(1, 'Campo obrigatório')
  .max(5000, 'Máximo 5000 caracteres')
  .transform(sanitizeString);

// SafeEmail: Validação RFC 5322 + sanitização
export const SafeEmail = z
  .string()
  .email('Email inválido')
  .max(255, 'Máximo 255 caracteres')
  .transform(sanitizeEmail);

// SafePhone: Remove caracteres não numéricos, 9+ dígitos obrigatório
export const SafePhone = z
  .string()
  .min(9, 'Mínimo 9 dígitos')
  .max(20, 'Máximo 20 caracteres')
  .transform(sanitizePhone);

// SafeUrl: Validação de URL + sanitização
export const SafeUrl = z
  .string()
  .url('URL inválida')
  .max(2048, 'URL muito longa')
  .transform(sanitizeUrl)
  .optional();

// SafeDateFuture: Validação ISO 8601 + rejeita datas passadas
export const SafeDateFuture = z
  .string()
  .datetime('Data/hora inválida')
  .transform((val) => new Date(val))
  .refine(
    (date) => date > new Date(),
    'A data deve estar no futuro',
  );
```

#### Camada 2: Função `sanitizeString()` com DOMPurify

```typescript
function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim();
}
```

**Mecanismo de Proteção XSS:**
- `DOMPurify.sanitize()` com `ALLOWED_TAGS: []` remove **todos** os tags HTML
- Exemplo: `"<script>alert('xss')</script>"` → `""` (string vazia)
- Exemplo: `"<img src=x onerror=alert(1)>"` → `""` (removido completamente)
- `.trim()` remove espaços em branco desnecessários

**Sanitizadores Específicos:**
- `sanitizeEmail()`: Lowercase + sanitização geral
- `sanitizePhone()`: Remove `\D` (non-digits) com regex, validação de comprimento
- `sanitizeUrl()`: Tenta instanciar `new URL()`, falha se inválido

#### Camada 3: Schemas de Entidades com Validação Lógica

**RentalCreateSchema:**
```typescript
export const RentalCreateSchema = z.object({
  clientId: z.string().uuid('ID de cliente inválido'),
  equipmentIds: z.array(z.string().uuid('ID de equipamento inválido')).min(1),
  startDate: SafeDateFuture,
  endDate: SafeDateFuture,
  totalPrice: z.number().positive('Preço deve ser positivo'),
  discountPercentage: z.number().min(0).max(100).optional().default(0),
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional().default('PENDING'),
  paymentStatus: z.enum(['PENDING', 'PARTIAL', 'COMPLETED', 'REFUNDED']).optional().default('PENDING'),
}).refine(
  (data) => data.endDate > data.startDate,
  { message: 'Data de fim deve ser posterior à data de início', path: ['endDate'] },
);
```

**Validações Críticas por Entidade:**

| Entidade | Validações Implementadas |
|----------|--------------------------|
| **Rental** | UUID para clientId/equipmentIds, datas futuras, endDate > startDate, preço positivo, discount 0-100% |
| **Equipment** | SKU 3-50 chars, preço positivo, dailyRate positivo, enum condition (NEW/GOOD/FAIR/POOR) |
| **Client** | Email válido, telefone 9+ dígitos, taxId 8-20 chars, status enum (ACTIVE/INACTIVE/BLOCKED) |
| **Quote** | UUID para clientId, datas futuras, subtotal positivo, tax/discount 0-100%, status enum |
| **Event** | Datas futuras, título SafeString, endDate > startDate |
| **User** | Email único, senha com regex (8+ chars, uppercase, digit, special char), role enum |
| **Category** | Cor em formato hex (#RRGGBB), nome SafeString |

### 2.2 Implementação de Proteção contra XSS

**Fluxo de Proteção:**

1. **Entrada de Dados**: Utilizador submete formulário
2. **Validação Zod**: Schema aplica `.transform(sanitizeString)`
3. **DOMPurify**: Remove todo HTML/scripts com `ALLOWED_TAGS: []`
4. **Armazenamento**: Apenas texto sanitizado é persistido em BD
5. **Renderização**: Dados já estão seguros (defesa em profundidade)

**Exemplos de Atenuação:**

```typescript
// Antes da sanitização
const malicious = `<div onclick="alert('xss')">Click me</div>`;

// Após sanitização
const safe = sanitizeString(malicious);
// Resultado: "" (vazio, pois sem ALLOWED_TAGS)

// Email com tentativa de XSS
const emailAttempt = "user+<script>alert(1)</script>@example.com";
const cleanEmail = sanitizeEmail(emailAttempt);
// Resultado: "user+alert(1)@example.com" (após sanitização + lowercase)
// Nota: Depois falha na validação .email() pois não é mais um email válido
```

**Campos de Risco Especial:**

- `notes`, `description` (SafeStringLong): Suportam até 5000 chars, mas todo HTML é removido
- `address`, `company`, `location`: SafeString com proteção XSS
- Campos JSON como `quantityByStatus`: Armazenados como JSON estruturado, não como strings

---

## 3. Lógica de Middlewares (Prisma Extended)

### 3.1 Soft-Delete Transparente

**Configuração:**

```typescript
const SOFT_DELETE_MODELS = new Set([
  'Rental', 'EquipmentItem', 'Event', 'Client', 
  'Category', 'Subcategory', 'Quote', 'User', 'Subrental'
] as const);
```

**Tabelas Afetadas:** 9 modelos com campo `deletedAt` (DateTime, nullable)

**Funcionamento:**

1. **DELETE → UPDATE com soft-delete:**
   ```typescript
   // Operação original: await prisma.rental.delete({ where: { id: '123' } })
   // Executado como:
   await prisma.rental.update({
     where: { id: '123' },
     data: { deletedAt: new Date() }
   });
   ```

2. **Operações de Leitura com Filtro Automático:**
   ```typescript
   // Operação original: prisma.rental.findMany()
   // Executado como:
   prisma.rental.findMany({
     where: { deletedAt: null, ...originalWhere }
   });
   ```

3. **Cobertura de Operações:**
   - Read: `findUnique`, `findUniqueOrThrow`, `findFirst`, `findFirstOrThrow`, `findMany`, `count`, `aggregate`, `groupBy`
   - Delete: `delete` → `update` com `deletedAt: now()`
   - Bulk: `deleteMany` → `updateMany` com `deletedAt: now()`

**Implicações:**

- Records nunca são realmente deletados → auditoria completa
- Queries automáticas filtram `deletedAt = null`
- Sem mudanças no código da aplicação (transparente via `$extends`)
- Função helper `getSoftDeletedRecords()` para recuperar deletados
- Função helper `restoreSoftDeleted()` para reverter soft-delete

### 3.2 Activity Logging Intersecção com Queries

**Contexto Global:**

```typescript
export interface ApiOperationContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

// Funções de gerenciamento
export function setOperationContext(context: ApiOperationContext): void
export function clearOperationContext(): void
export function getOperationContext(): ApiOperationContext
```

**Fluxo de Logging:**

1. **Middleware de API captura contexto:**
   ```typescript
   setOperationContext({
     userId: req.user?.id,
     ipAddress: req.ip,
     userAgent: req.get('user-agent'),
     requestId: req.id
   });
   ```

2. **Operação de Query acontece (interceptada por $extends)**

3. **Após execução, `logActivityOperation()` é chamado:**
   ```typescript
   interface ActivityOperationParams {
     operation: string;      // 'create', 'update', 'delete'
     model: ActivityEntity;   // 'Rental', 'EquipmentItem', etc.
     args: any;              // Argumentos Prisma originais
     result: any;            // Resultado da operação
     context: ApiOperationContext;
   }
   ```

4. **Registo em ActivityLog:**
   ```typescript
   await prisma.activityLog.create({
     data: {
       userId: context.userId || null,
       entityType: model,
       entityId: result.id,
       action: 'CREATE' | 'UPDATE' | 'DELETE',
       changes: extractChanges(args.data, result),
       ipAddress: context.ipAddress,
       userAgent: context.userAgent,
       createdAt: new Date()
     }
   });
   ```

**Extração de Mudanças (UPDATE):**

```typescript
function extractChanges(
  newData: Record<string, any>,
  oldResult: Record<string, any>,
): Record<string, { old: any; new: any }> {
  const changes = {};
  for (const [key, newValue] of Object.entries(newData)) {
    const oldValue = oldResult?.[key];
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = { old: oldValue, new: newValue };
    }
  }
  return changes;
}
```

**Campos Registados por Ação:**

| Ação | Campos ActivityLog |
|------|-------------------|
| **CREATE** | userId, entityType, entityId, action='CREATE', ipAddress, userAgent |
| **UPDATE** | userId, entityType, entityId, action='UPDATE', changes={old/new}, ipAddress, userAgent |
| **DELETE** | userId, entityType, entityId, action='DELETE', ipAddress, userAgent |

**Estrutura do Registo:**

```typescript
interface ActivityLogEntry {
  id: string;
  userId: string | null;
  entityType: ActivityEntity;  // 'Rental', 'EquipmentItem', etc.
  entityId: string;
  action: ActivityAction;      // 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW'
  changes?: Record<string, { old: any; new: any }>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
```

**Índices em ActivityLog:**
```
@@index([action])
@@index([createdAt])
@@index([entityType])
@@index([userId])
```

### 3.3 Optimistic Concurrency Control (OCC) em Rental

**Implementação via Campo `version`:**

```typescript
model Rental {
  id: String @id
  // ... outros campos
  scannedOut: Int @default(0)
  scannedIn: Int @default(0)
  version: Int @default(1)  // ← OCC counter
}
```

**Uso em Bulk Scanner:**
- Cada scan (checkout/checkin) valida `version` antes de atualizar
- Se `version` não corresponder ao esperado, operação falha
- `EquipmentScanLog` registra `conflictVersion` se houver conflito
- Permite múltiplos utilizadores a escanear equipamento sem race conditions

**Índices:**
```
@@index([eventId, equipmentId])
@@index([prepStatus])
@@index([version])
```

---

## 4. Divergências Críticas Não Documentadas

### 4.1 Problemas de Implementação

#### ⚠️ **1. Activity Log sem Documentação de Integração**

**Encontrado em `src/lib/prisma-extended.ts` (linhas 151-217)**

A função `logActivityOperation()` existe mas:
- Não está integrada aos `$extends` do Prisma
- Função `logActivityOperation()` é definida mas nunca chamada após `query(args)`
- Comentário no código: `"// Nota: Assumir que Prisma tem modelo ActivityLog"`

**Impacto:** Activity logging **não está funcional** atualmente. Requer integração explícita no ciclo de query.

#### ⚠️ **2. EquipmentScanLog com Conflito de Schema**

**Encontrado em `prisma/schema.prisma` (linhas 661-689)**

```typescript
model Rental {
  scannedOut: Int @default(0)
  scannedIn: Int @default(0)
  version: Int @default(1)
}

model EquipmentScanLog {
  conflictVersion: Int?  // ← Campo sem explicação de quando é populado
  scanType: String       // 'checkout' | 'checkin' (comentário informal)
  status: String         // 'success' | 'error' | 'conflict' (comentário informal)
}
```

**Problema:**
- `conflictVersion` é nullable, mas lógica de população está indefinida
- `scanType` e `status` devem ser ENUMs, não strings genéricas
- Sem constraint que valide os valores, permitindo dados inválidos

#### ⚠️ **3. Soft-Delete Incompleto em Relações**

**Encontrado em `prisma-extended.ts` (linhas 51-63)**

Modelos com soft-delete: `Rental`, `EquipmentItem`, `Event`, `Client`, `Category`, `Subcategory`, `Quote`, `User`, `Subrental`

**Problema:**
- Quando `Client` é soft-deleted, suas `Event` (relação 1:N) **não** são cascata soft-deleted
- Quando `Event` é soft-deleted, suas `Rental` **não** são cascata soft-deleted
- Schema Prisma usa `onDelete: Cascade` em foreign keys, mas `$extends` não aplica soft-delete em cascata

**Risco:** Órfãos de dados (events sem client, rentals sem event)

#### ⚠️ **4. Validação de Dates em Schemas sem Timezone**

**Encontrado em `src/lib/schemas.ts`**

```typescript
export const SafeDateFuture = z
  .string()
  .datetime('Data/hora inválida')
  .transform((val) => new Date(val))
  .refine((date) => date > new Date(), 'A data deve estar no futuro');
```

**Problema:**
- Valida contra hora **actual do servidor** (UTC)
- Utilizador em fuso horário diferente pode ter datas "no passado" localmente
- Sem suporte a `timeZone` explícito

**Exemplo:** Utilizador em PT-BR (UTC-3) quer agendar evento para amanhã 08:00 local = 11:00 UTC
- Se chamada é feita antes das 11:00 UTC, validação falha

#### ⚠️ **5. Senhas em ActivityLog sem Mascaramento**

**Encontrado em `prisma-extended.ts` (linhas 176-180)**

```typescript
async function logActivityOperation(params: ActivityOperationParams): Promise<void> {
  // ...
  if (args?.data) {
    changes = extractChanges(args.data, result);  // ← Registra TODO, incluindo senhas
  }
}
```

**Problema:**
- UPDATE de User com senha muda registra senha em claro em `ActivityLog`
- Campo `changes.password.new` expõe credencial em BD
- Sem mascaramento tipo `[REDACTED]`

#### ⚠️ **6. Validação de UUID Incompleta**

**Encontrado em `src/lib/schemas.ts`**

```typescript
export const RentalCreateSchema = z.object({
  clientId: z.string().uuid('ID de cliente inválido'),
  equipmentIds: z.array(z.string().uuid('ID de equipamento inválido')).min(1),
});
```

**Problema:**
- Zod valida **formato** de UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- NÃO valida se o UUID **existe** em BD
- Permite criação de Rental com clientId inexistente, causando falha em FK no Prisma

#### ⚠️ **7. DOMPurify Configuration Muito Restritiva**

**Encontrado em `src/lib/schemas.ts` (linha 20)**

```typescript
return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim();
```

**Impacto:**
- Descritivos de equipamento, notas de clientes ficam completamente vazios se contêm qualquer HTML
- Utilizadores não conseguem formatar texto (negrito, itálico, listas)
- Melhor: Permitir tags seguras como `<b>`, `<i>`, `<br>`, `<ul>`, `<li>`

#### ⚠️ **8. Falta de Validação de Hierarquia em Subcategory**

**Encontrado em `prisma/schema.prisma` (linhas 879-892)**

```typescript
model Subcategory {
  id: String @id
  name: String
  parentId: String
  Category Category @relation(fields: [parentId], references: [id], onDelete: Cascade)
}
```

**Problema:**
- Campo `parentId` é String simples, sem constraint de existência
- Schema Zod não valida que `parentId` existe antes de criar Subcategory
- Permite criar Subcategory com `parentId` inválido

#### ⚠️ **9. Campos JSON não Validados em EquipmentItem**

**Encontrado em `prisma/schema.prisma` (linha 263)**

```typescript
model EquipmentItem {
  quantityByStatus Json @default("{\"good\": 0, \"damaged\": 0, \"maintenance\": 0}")
}
```

**Problema:**
- Campo JSON sem schema de validação
- Aplicação pode inserir: `{"good": "abc"}` (string em vez de número)
- Sem validação na camada de schemas Zod

#### ⚠️ **10. Falta de Proteção contra Força Bruta em User**

**Encontrado em `prisma/schema.prisma`**

```typescript
model User {
  username: String @unique
  password: String
  isActive: Boolean @default(true)
  lastLoginAt: DateTime?
}
```

**Problema:**
- Sem campo `failedLoginAttempts` para rastrear tentativas
- Sem field `accountLockedUntil` para travamento temporário
- Campo `password` sem hash especificado (presume-se bcrypt em aplicação, mas não é explícito)

### 4.2 Lacunas de Segurança

#### 🔴 **Encriptação em Repouso**

**Encontrado em `prisma/schema.prisma`**

```typescript
model User {
  nif: String?
  iban: String?
  contactPhone: String?
  contactEmail: String?
  emergencyPhone: String?
  password: String
}
```

**Problema:**
- NIF, IBAN são dados sensíveis mas armazenados em texto claro
- Apenas `SystemSetting` tem suporte a `isEncrypted` + `encryptedValue`, não é usado para User

#### 🔴 **Tokens sem Expiração em FileShare/FolderShare**

**Encontrado em `prisma/schema.prisma`**

```typescript
model FileShare {
  shareToken: String? @unique
  expiresAt: DateTime?
}
```

**Problema:**
- `expiresAt` é opcional (nullable)
- Permite criar shares com tokens permanentes
- Risco de token leakage permanente

#### 🔴 **Sem Rate Limiting em API**

**Encontrado em `src/lib/schemas.ts`**

- Schemas validam dados mas não implementam rate limiting
- Sem proteção contra enumeração de UUIDs
- Sem proteção contra brute force em login

### 4.3 Inconsistências no Schema

#### 🟡 **Subrental sem Soft-Delete**

**Encontrado em `prisma/schema.prisma`**

```typescript
model Subrental {
  id: String @id
  // Suportado em SOFT_DELETE_MODELS
  // MAS não tem campo deletedAt no schema!
}
```

**Problema:** Subrental está em `SOFT_DELETE_MODELS` mas não tem `deletedAt` field

#### 🟡 **Quote sem Suporte a Soft-Delete**

```typescript
model Quote {
  // Sem campo deletedAt
  // MAS está em SOFT_DELETE_MODELS
}
```

**Problema:** Mesma inconsistência - Model na lista de soft-delete mas sem campo

#### 🟡 **Event sem `deletedAt` Visível**

```typescript
model Event {
  // Sem campo deletedAt declarado
  // MAS está em SOFT_DELETE_MODELS
}
```

---

## 5. Recomendações Críticas

### Prioritário (P1)

1. **Adicionar `deletedAt` aos modelos:** Rental, EquipmentItem, Event, Client, Category, Subcategory, Quote, User, Subrental
2. **Integrar Activity Logging:** Chamar `logActivityOperation()` após cada `query(args)` em `$extends`
3. **Mascarar senhas em ActivityLog:** Adicionar filtro em `extractChanges()` para campos sensíveis
4. **Validação de ForeignKey:** Adicionar `.refine()` em schemas Zod para validar existência de relações

### Importante (P2)

5. **Encriptar dados sensíveis:** NIF, IBAN, emergencyPhone em User
6. **Converter Status Strings em ENUMs:** `EquipmentScanLog.scanType`, `.status`
7. **Timezone-aware dates:** Suporte explícito em `SafeDateFuture`
8. **Rate limiting:** Implementar em middleware de API

### Desejável (P3)

9. **Relaxar DOMPurify:** Permitir tags seguras (b, i, ul, li, br)
10. **Cascade soft-delete:** Implementar lógica de soft-delete em cascata para relações
11. **JSON schema validation:** Validar `EquipmentItem.quantityByStatus`
12. **Account lockout:** Implementar `failedLoginAttempts` + `accountLockedUntil` em User

---

## 6. Índices de Performance

### Índices Definidos em Schema

**EquipmentItem (14 índices):**
- `categoryId` (query por categoria)
- `name` (busca por nome)
- `status, categoryId` (filtros compostos)
- `categoryId, name` (categoria + nome)
- Índices com sort DESC para listas paginadas

**Event (7 índices):**
- `clientId` (query por cliente)
- `startDate, endDate` (range de datas)
- `agencyId` (query por parceiro)

**Quote (4 índices):**
- `quoteNumber` (lookup único)
- `clientId, status` (queries comuns)

**CatalogShare (5 índices):**
- `token` (lookup de share)
- `partnerId, expiresAt` (queries filtradas)
- `createdAt(sort: Desc)` (listas ordenadas)

**Índices não definidos (gap):**
- `Rental(eventId, equipmentId)` - Existe
- `EquipmentScanLog` - Bem indexada
- ActivityLog - 4 índices (good coverage)
- FileShare, FolderShare - Sem índice em `userId` (problema para "meus shares")
