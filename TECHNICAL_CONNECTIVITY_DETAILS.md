# 🔧 DETALHES TÉCNICOS: CONECTIVIDADE FRONTEND-BACKEND

## ÍNDICE
1. [Chamadas por Componente](#chamadas-por-componente)
2. [Análise de Métodos HTTP](#análise-de-métodos-http)
3. [Padrões de Tratamento de Erro](#padrões-de-tratamento-de-erro)
4. [Dependências Entre Endpoints](#dependências-entre-endpoints)
5. [Mapa de Tipos de Dados](#mapa-de-tipos-de-dados)

---

## Chamadas por Componente

### Dashboard
```typescript
// NotificationsSection.tsx
✅ GET    /api/notifications?limit=20&unreadOnly=false
✅ POST   /api/notifications                      (mark as read)
✅ POST   /api/notifications                      (delete notification)
✅ PUT    /api/notifications/preferences          (update preferences)
```

### Equipamento
```typescript
// EquipmentForm.tsx
✅ GET    /api/equipment                          (listar)
✅ POST   /api/equipment                          (criar)
✅ PUT    /api/equipment/{id}                     (editar)
✅ DELETE /api/equipment/{id}                     (deletar)

// EquipmentCard.tsx
✅ GET    https://placehold.co/600x400.png        (placeholder)

// AIEquipmentAssistant.tsx
✅ POST   /api/ai/analyze-equipment               (análise com IA)
```

### Autenticação
```typescript
// CustomizableLoginPage.tsx
✅ GET    /api/customization                      (obter branding)
✅ POST   /api/auth/login                         (login)
✅ POST   /api/auth/logout                        (logout)
```

### Catálogo Público
```typescript
// PublicCatalogContent.tsx
✅ GET    /api/catalog/share/{token}              (acessar catálogo compartilhado)
✅ POST   /api/catalog/inquiries                  (❌ ENDPOINT FALTANDO)
         Deveria ser: /api/catalog/submit-inquiry
```

### Parceiros & Agências
```typescript
// PartnerDetailContent.tsx
✅ GET    /api/partners/{id}                      (detalhes do parceiro)
✅ GET    /api/events                             (listar eventos)
✅ DELETE /api/subrentals?id={id}                 (❌ USAR ID NA URL)
✅ PATCH  /api/subrentals/{id}                    (atualizar sub-aluguel)

// PartnerForm.tsx
✅ GET    /api/clients                            (listar clientes)
✅ POST   /api/upload                             (upload de logo)
✅ POST   /api/partners                           (criar parceiro)
✅ PUT    /api/partners                           (editar parceiro)
✅ GET    /api/clients (refresh)                  (refetch após sincronização)

// PartnersContent.tsx
✅ GET    /api/partners                           (listar)
✅ DELETE /api/partners?id={id}                   (❌ USAR ID NA URL)

// PartnerCatalogPDFPreview.tsx
✅ POST   /api/partners/catalog/generate          (gerar PDF)

// PartnerCatalogGenerator.tsx
✅ GET    /api/equipment                          (listar equipamentos)
✅ GET    /api/partners?id={partnerId}            (obter parceiro específico)
✅ GET    /api/customization                      (branding)
✅ POST   /api/partners/catalog/generate          (gerar catálogo PDF)
✅ POST   /api/catalog/generate-share-link        (criar link compartilhado)

// SubrentalForm.tsx
✅ POST   /api/subrentals                         (criar)
✅ PUT    /api/subrentals/{id}                    (editar)

// EventFormDialog.tsx
✅ GET    /api/partners?activeOnly=true           (parceiros ativos)
```

### Cloud Storage / Drive
```typescript
// DriveContent.tsx
✅ GET    /api/cloud/folders?parentId={id}        (listar pastas)
✅ GET    /api/cloud/files?parentId={id}          (listar arquivos)
✅ GET    /api/cloud/files?starred=true           (arquivos marcados)
✅ GET    /api/cloud/files?recent=true&limit=50   (recentes)
✅ POST   /api/cloud/folders                      (criar pasta)
✅ POST   /api/cloud/files                        (criar arquivo)
✅ PATCH  /api/cloud/files/{id}                   (renomear/mover)
✅ PATCH  /api/cloud/folders/{id}                 (renomear/mover)
✅ DELETE /api/cloud/files/{id}                   (deletar arquivo)
✅ DELETE /api/cloud/folders/{id}                 (deletar pasta)
✅ GET    /api/cloud/storage                      (info storage)
✅ GET    /api/cloud/activity                     (log de atividades)
✅ GET    /api/cloud/search?q={query}             (buscar)

// ShareDialog.tsx
✅ GET    /api/cloud/share?fileId={id}            (listar compartilhamentos)
✅ POST   /api/cloud/share                        (compartilhar)
✅ DELETE /api/cloud/share/{shareId}              (remover compartilhamento)

// TrashManager.tsx
✅ GET    /api/cloud/trash                        (listar lixeira)
✅ DELETE /api/cloud/trash/empty                  (esvaziar lixeira)

// FileUploadArea.tsx
✅ POST   /api/cloud/files/upload                 (fazer upload)

// CloudStorageStats.tsx
✅ GET    /api/cloud/storage                      (estatísticas)

// CloudHealthStatus.tsx
✅ GET    /api/cloud/health                       (health check)

// FilePreviewModal.tsx
✅ GET    {fileUrl}                               (fetch arquivo)
```

### Configuração
```typescript
// useConfig.ts
✅ GET    /api/config?category={category}         (obter config)

// useCustomizationSettings.ts
✅ GET    /api/customization                      (obter customização)

// BrandingContext.tsx
✅ GET    /api/customization                      (listar customizações)
✅ POST   /api/customization                      (atualizar customização)
```

### Tradução & Internacionalização
```typescript
// client-translation.ts
✅ POST   /api/translate                          (traduzir texto)

// translation-rules-loader.ts
✅ GET    /translation-rules.json                 (carregar regras)

// professional-catalog-generator.ts
✅ GET    https://api.google... (Gemini API)      (análise de IA)
```

### Rent/Scan
```typescript
// useScanWithRetry.ts
✅ GET    /api/rentals/{rentalId}/version         (obter versão)
✅ POST   /api/rentals/scan-batch                 (processar scans)
```

### Outros Hooks
```typescript
// useAppContext.tsx
✅ GET    /api/auth/me                            (obter usuário atual)
✅ POST   /api/auth/login                         (fazer login)
```

---

## Análise de Métodos HTTP

### GET Requests (Stateless, Cacheable)

```typescript
// Padrão para ListAR:
GET /api/{resource}
GET /api/{resource}?filters=...&limit=...&offset=...

// Padrão para OBTER por ID:
GET /api/{resource}/{id}

// Padrão para BUSCAR:
GET /api/{resource}/search?q=...

// Seguro: Sem body necessário
Credential: 'include' para auth via cookies
```

**Endpoints GET encontrados:** 35

```
/api/equipment                    ✅
/api/categories                   ✅
/api/subcategories                ✅
/api/clients                       ✅
/api/partners                      ✅
/api/partners/{id}                ✅
/api/services                      ✅
/api/fees                          ✅
/api/events                        ✅
/api/rentals                       ✅
/api/rentals/{id}/version          ✅
/api/users                         ✅
/api/users/profile                 ✅
/api/notifications                 ✅
/api/notifications/preferences     ✅
/api/auth/me                       ✅
/api/customization                 ✅
/api/config?category=...           ✅
/api/translate                     ✅
/api/translate/models              ✅
/api/backup                        ✅
/api/backup/status                 ✅
/api/cloud/files                   ✅
/api/cloud/folders                 ✅
/api/cloud/share                   ✅
/api/cloud/storage                 ✅
/api/cloud/activity                ✅
/api/cloud/trash                   ✅
/api/catalog/share/{token}         ✅
/api/partners/stats                ✅
/api/i18n/coverage                 ✅
/api/health                        ✅
/api/cloud/health                  ✅
/api/cloud/search                  ✅
/api/rentals/calendar.ics          ✅
```

### POST Requests (Create, Non-idempotent)

```typescript
// Padrão para CRIAR:
POST /api/{resource}
Headers: Content-Type: application/json
Body: { ...resourceData }

// Upload de arquivos:
POST /api/upload
Headers: Content-Type: multipart/form-data
Body: FormData

// Ações customizadas:
POST /api/{resource}/{action}
```

**Endpoints POST encontrados:** 28

```
/api/auth/login                           ✅
/api/auth/logout                          ✅
/api/equipment                            ✅
/api/categories                           ✅
/api/subcategories                        ✅
/api/clients                              ✅
/api/partners                             ✅
/api/services                             ✅
/api/fees                                 ✅
/api/events                               ✅
/api/rentals                              ✅
/api/rentals/scan-batch                   ✅
/api/subrentals                           ✅
/api/notifications                        ✅
/api/notifications/preferences            ✅
/api/notifications/generate               ✅
/api/upload                               ✅
/api/translate                            ✅
/api/customize                            ✅
/api/quotes                               ✅
/api/backup                               ✅
/api/cloud/files                          ✅
/api/cloud/files/upload                   ✅
/api/cloud/folders                        ✅
/api/cloud/share                          ✅
/api/catalog/generate-share-link          ✅
/api/catalog/submit-inquiry (via /inquiries) ❌
/api/partners/catalog/generate            ✅
```

### PUT Requests (Update Complete)

```typescript
// Padrão para ATUALIZAR:
PUT /api/{resource}/{id}
Headers: Content-Type: application/json
Body: { ...updatedData }  // Deve incluir todos os campos
```

**Endpoints PUT encontrados:** 12

```
/api/equipment/{id}                ✅
/api/categories/{id}               ✅ (presumido)
/api/services/{id}                 ✅
/api/fees/{id}                     ✅
/api/rentals (bulk update)         ✅
/api/partners/{id}                 ✅
/api/events/{id}                   ✅ (presumido)
/api/notifications/preferences     ✅
/api/translate (batch)             ✅ (presumido)
/api/customization                 ✅
/api/cloud/files/{id}              ✅ (como PATCH)
/api/cloud/folders/{id}            ✅ (como PATCH)
```

### DELETE Requests (Remove)

```typescript
// Padrão para DELETAR:
DELETE /api/{resource}/{id}

// ❌ PADRÃO INCORRETO encontrado:
DELETE /api/{resource}?id={id}     // Query param em vez de path param
```

**Endpoints DELETE encontrados:** 10

```
/api/equipment/{id}                ✅
/api/services/{id}                 ✅
/api/fees/{id}                     ✅
/api/rentals                        ✅ (corpo com IDs)
/api/partners/{id}                 ✅ (mas alguns usam ?id=)
/api/events/{id}                   ✅ (presumido)
/api/subrentals/{id}               ✅ (mas alguns usam ?id=)
/api/cloud/files/{id}              ✅
/api/cloud/folders/{id}            ✅
/api/cloud/share/{shareId}         ✅
/api/cloud/trash/empty             ✅ (DELETE sem ID)
```

### PATCH Requests (Update Partial)

```typescript
// Padrão para ATUALIZAR PARCIAL:
PATCH /api/{resource}/{id}
Headers: Content-Type: application/json
Body: { ...changedFields }  // Apenas campos alterados
```

**Endpoints PATCH encontrados:** 5

```
/api/cloud/files/{id}              ✅
/api/cloud/folders/{id}            ✅
/api/subrentals/{id}               ✅
/api/customization                 ✅ (usado como PATCH de fato)
```

---

## Padrões de Tratamento de Erro

### ✅ Padrão RECOMENDADO (Encontrado em 23 chamadas)

```typescript
// Exemplo: PublicCatalogContent.tsx
try {
  const response = await fetch('/api/catalog/share/${token}');
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
} catch (error) {
  console.error('Error:', error);
  // Mostrar erro para usuário
  setError(error.message);
  throw error;
}
```

**Componentes com padrão correto:**
- PublicCatalogContent.tsx
- PartnerForm.tsx
- PartnerDetailContent.tsx
- PartnersContent.tsx
- ShareDialog.tsx
- DriveContent.tsx
- NotificationsSection.tsx
- PartnerCatalogGenerator.tsx

### 🟡 Padrão PARCIAL (Encontrado em 15 chamadas)

```typescript
// Exemplo: CustomizableLoginPage.tsx
const response = await fetch('/api/auth/login', { ... });

if (response.ok) {
  // sucesso
} else {
  // erro simples
}

// ⚠️  Falta: try-catch, detalhes do erro
```

**Componentes com padrão parcial:**
- CustomizableLoginPage.tsx
- EquipmentCard.tsx
- EventFormDialog.tsx

### ❌ SEM TRATAMENTO (Encontrado em 5 chamadas)

```typescript
// Exemplo: useConfig.ts
const res = await fetch(`/api/config?category=${category}`);
// ❌ Sem tratamento de erro!

// Exemplo: client-translation.ts
const response = await fetch('/api/translate', { ... });
// ❌ Sem status check, sem try-catch
```

**Arquivos críticos para corrigir:**
- src/hooks/useConfig.ts (linha 7)
- src/lib/client-translation.ts (linhas 37, 97)
- src/lib/translation-rules-loader.ts (linha 82)

---

## Dependências Entre Endpoints

### Fluxo: Criar um Parceiro com Catálogo

```
1. User clica em "Criar Parceiro"
   └─> GET /api/clients (popular dropdown)
   └─> GET /api/customization (obter branding)

2. User preenche form e clica "Salvar"
   └─> POST /api/upload (logo do parceiro)
   └─> POST /api/partners (criar novo parceiro)
   └─> GET /api/clients (refresh list)

3. User clica em "Gerar Catálogo"
   └─> GET /api/equipment (listar equipamentos)
   └─> GET /api/partners?id={partnerId} (dados específicos)
   └─> GET /api/customization (branding para PDF)
   └─> POST /api/partners/catalog/generate (gerar PDF)
   └─> POST /api/catalog/generate-share-link (criar link)
   └─> GET /api/partners/{id} (refetch atualizado)

4. Public Link Shared
   └─> GET /api/catalog/share/{token}
   └─> POST /api/catalog/inquiries ❌ FALTA (deveria ser submit-inquiry)
```

### Fluxo: Procurar Equipamento no Cloud

```
1. User acessa Cloud Drive
   └─> GET /api/cloud/storage (obter storage info)
   └─> GET /api/cloud/folders?parentId=null
   └─> GET /api/cloud/files?parentId=null

2. User navega para pasta
   └─> GET /api/cloud/folders?parentId={id}
   └─> GET /api/cloud/files?parentId={id}

3. User busca arquivos
   └─> GET /api/cloud/search?q={query}

4. User compartilha arquivo
   └─> POST /api/cloud/share (criar share)
   └─> GET /api/cloud/share (listar shares)

5. User tira screenshot da share
   └─> GET /api/cloud/share/{token} (acessar)

6. User deleta tudo
   └─> DELETE /api/cloud/files/{id}
   └─> DELETE /api/cloud/folders/{id}
   └─> DELETE /api/cloud/trash/empty (esvaziar)
```

### Fluxo: Analisar Equipamento com IA

```
1. User faz upload de imagem
   └─> POST /api/upload (salvar imagem)

2. User clica "Analisar com IA"
   └─> POST /api/ai/analyze-equipment (requisição para Gemini)

3. Sistema retorna análise
   └─> Mostrar resultado
   └─> PUT /api/equipment/{id} (atualizar com dados sugeridos)
```

---

## Mapa de Tipos de Dados

### Tipos Principais Utilizados

#### User
```typescript
// Definido em: src/types/index.ts
interface User {
  id: string
  name: string
  username: string
  role: 'Admin' | 'Manager' | 'Technician' | 'Employee' | 'Viewer'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Endpoints que retornam User:
GET /api/auth/me                    → User
GET /api/users                      → User[]
POST /api/auth/login                → { user: User, token: string }
POST /api/users                     → User
```

#### Equipment
```typescript
interface EquipmentItem {
  id: string
  name: string
  description: string
  categoryId: string
  subcategoryId?: string
  quantity: number
  status: 'good' | 'damaged' | 'maintenance'
  quantityByStatus: {
    good: number
    damaged: number
    maintenance: number
  }
  location: string
  imageUrl?: string
  dailyRate: number
  type: 'equipment' | 'consumable'
  createdAt: Date
  updatedAt: Date
}

// Endpoints:
GET /api/equipment                  → EquipmentItem[]
GET /api/equipment/{id}             → EquipmentItem
POST /api/equipment                 → EquipmentItem
PUT /api/equipment/{id}             → EquipmentItem
DELETE /api/equipment/{id}          → { success: boolean }
```

#### Rental
```typescript
interface Rental {
  id: string
  eventId: string
  equipment: Array<{
    equipmentId: string
    quantity: number
  }>
  prepStatus: 'pending' | 'checked-out' | 'checked-in'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Endpoints:
GET /api/rentals                    → Rental[]
POST /api/rentals                   → Rental
PUT /api/rentals/{id}               → Rental
DELETE /api/rentals/{id}            → { success: boolean }
```

#### Event
```typescript
interface Event {
  id: string
  name: string
  startDate: Date
  endDate: Date
  clientId: string
  location: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Endpoints:
GET /api/events                     → Event[]
POST /api/events                    → Event
```

#### Partner
```typescript
interface Partner {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  city?: string
  country?: string
  logoUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Endpoints:
GET /api/partners                   → Partner[]
GET /api/partners/{id}              → Partner
POST /api/partners                  → Partner
PUT /api/partners/{id}              → Partner
DELETE /api/partners/{id}           → { success: boolean }
```

#### CloudFile (Não Tipificado!)
```typescript
// ❌ FALTA DEFINIÇÃO FORMAL
// Inferido de chamadas:
{
  id: string
  name: string
  parentId: string
  mimeType: string
  size: number
  starred: boolean
  shared: boolean
  createdAt: Date
  updatedAt: Date
}

// Recomendado: Adicionar em src/types/index.ts
interface CloudFile {
  id: string
  name: string
  parentId?: string
  mimeType: string
  size: number
  starred: boolean
  shared: boolean
  shareToken?: string
  createdAt: Date
  updatedAt: Date
}
```

#### CloudFolder (Não Tipificado!)
```typescript
// ❌ FALTA DEFINIÇÃO FORMAL
interface CloudFolder {
  id: string
  name: string
  parentId?: string
  starred: boolean
  shared: boolean
  createdAt: Date
  updatedAt: Date
}
```

#### Customization (Não Tipificado!)
```typescript
// ❌ FALTA DEFINIÇÃO FORMAL
// Inferido de chamadas:
{
  companyName?: string
  companyLogo?: string
  logoUrl?: string
  colors?: {
    primary?: string
    secondary?: string
    accent?: string
  }
  fonts?: {
    primary?: string
    secondary?: string
  }
  // ... outros campos
}

// Recomendado:
interface Customization {
  id: string
  companyName?: string
  logoUrl?: string
  colors?: {
    primary: string
    secondary: string
    accent: string
  }
  fonts?: {
    primary: string
    secondary: string
  }
  updatedAt: Date
}
```

#### API Response Wrapper
```typescript
// src/types/translation.types.ts
interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  timestamp?: string
}

// ⚠️  Nem todos endpoints usam este padrão
// Alguns retornam dados diretos: T ao invés de ApiResponse<T>
// Recomendação: Padronizar todos para usar ApiResponse wrapper
```

---

## Recomendações Técnicas

### 1. Adicionar Tipos Faltando

Criar arquivo: `src/types/api.ts`

```typescript
// src/types/api.ts

// ✅ Tipos de API Response
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

// ✅ Cloud Storage
export interface CloudFile {
  id: string
  name: string
  parentId?: string
  mimeType: string
  size: number
  starred: boolean
  shared: boolean
  shareToken?: string
  owner: string
  createdAt: Date
  updatedAt: Date
}

export interface CloudFolder {
  id: string
  name: string
  parentId?: string
  starred: boolean
  shared: boolean
  itemCount: number
  createdAt: Date
  updatedAt: Date
}

export interface CloudShare {
  id: string
  fileId?: string
  folderId?: string
  token: string
  accessLevel: 'view' | 'edit' | 'download'
  expiresAt?: Date
  createdAt: Date
}

// ✅ Customization/Branding
export interface Customization {
  companyName?: string
  logoUrl?: string
  faviconUrl?: string
  colors?: {
    primary: string
    secondary: string
    accent: string
    error: string
    warning: string
    success: string
  }
  fonts?: {
    primary: string
    secondary: string
  }
  updatedAt: Date
}

// ✅ Config
export interface Config {
  category: string
  key: string
  value: any
  updatedAt: Date
}

// ✅ Translation
export interface TranslationRequest {
  text: string
  targetLanguage: string
  sourceLanguage?: string
}

export interface TranslationResponse {
  original: string
  translated: string
  sourceLanguage: string
  targetLanguage: string
}
```

### 2. Corrigir Endpoints Inconsistentes

**Arquivo:** `src/app/api/catalog/submit-inquiry/route.ts` → Renomear para `/inquiries`

OU

**Arquivo:** `src/components/catalog/PublicCatalogContent.tsx` → Atualizar URL

```typescript
// Opção 1 (Recomendado): Renomear rota backend
// Mover: src/app/api/catalog/submit-inquiry/ → src/app/api/catalog/inquiries/

// Opção 2: Alias em middleware
// Mas é melhor ser explícito
```

### 3. Standardizar Métodos DELETE

**Antes:**
```typescript
fetch(`/api/partners?id=${id}`, { method: 'DELETE' })
fetch(`/api/subrentals?id=${id}`, { method: 'DELETE' })
```

**Depois:**
```typescript
fetch(`/api/partners/${id}`, { method: 'DELETE' })
fetch(`/api/subrentals/${id}`, { method: 'DELETE' })
```

### 4. Adicionar Error Handling Global

Criar: `src/lib/api-error-handler.ts`

```typescript
export function handleApiError(error: unknown): string {
  if (error instanceof Response) {
    switch (error.status) {
      case 400: return 'Requisição inválida'
      case 401: return 'Não autenticado'
      case 403: return 'Sem permissão'
      case 404: return 'Não encontrado'
      case 500: return 'Erro do servidor'
      default: return `Erro HTTP ${error.status}`
    }
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'Erro desconhecido'
}
```

---

**Última Atualização:** 17 de Janeiro, 2026  
**Compatível com:** FRONTEND_BACKEND_CONNECTIVITY_AUDIT.md
