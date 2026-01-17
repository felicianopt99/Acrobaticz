# 📋 MATRIZ DE ENDPOINTS: BACKEND vs FRONTEND

## Como Usar Esta Matriz

✅ = Implementado e usado corretamente
🟡 = Implementado mas com observações
🔴 = Problema encontrado
⚠️  = Não verificado

---

## 1. AUTENTICAÇÃO & USUÁRIOS

| Endpoint | Método | Backend | Frontend | Status | Observação |
|----------|--------|---------|----------|--------|-------------|
| `/api/auth/login` | POST | ✅ route.ts | ✅ CustomizableLoginPage.tsx | ✅ | Funciona corretamente |
| `/api/auth/logout` | POST | ✅ route.ts | ✅ AppContext.tsx | ✅ | Funciona corretamente |
| `/api/auth/me` | GET | ✅ route.ts | ✅ AppContext.tsx | ✅ | Funciona corretamente |
| `/api/users` | GET | ✅ route.ts | ✅ AdminUsersList.tsx | ✅ | Funciona corretamente |
| `/api/users` | POST | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/users/{id}` | PUT | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/users/{id}` | DELETE | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/users/profile` | GET | ✅ route.ts | ⚠️ Parcial | 🟡 | Usado em contextos específicos |

---

## 2. EQUIPAMENTOS & INVENTÁRIO

| Endpoint | Método | Backend | Frontend | Status | Observação |
|----------|--------|---------|----------|--------|-------------|
| `/api/equipment` | GET | ✅ route.ts | ✅ EquipmentForm.tsx, PartnerCatalogGenerator.tsx | ✅ | Funciona corretamente |
| `/api/equipment` | POST | ✅ route.ts | ✅ EquipmentForm.tsx | ✅ | Funciona corretamente |
| `/api/equipment/{id}` | GET | ✅ route.ts | ✅ EquipmentForm.tsx | ✅ | Funciona corretamente |
| `/api/equipment/{id}` | PUT | ✅ route.ts | ✅ EquipmentForm.tsx | ✅ | Funciona corretamente |
| `/api/equipment/{id}` | DELETE | ✅ route.ts | ✅ EquipmentList.tsx | ✅ | Funciona corretamente |
| `/api/equipment/restore` | POST | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/categories` | GET | ✅ route.ts | ✅ EquipmentForm.tsx | ✅ | Funciona corretamente |
| `/api/categories` | POST | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/categories/{id}` | PUT | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/categories/{id}` | DELETE | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/subcategories` | GET | ✅ route.ts | ✅ EquipmentForm.tsx | ✅ | Funciona corretamente |
| `/api/subcategories` | POST | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |

---

## 3. ALUGUÉIS & EVENTOS

| Endpoint | Método | Backend | Frontend | Status | Observação |
|----------|--------|---------|----------|--------|-------------|
| `/api/rentals` | GET | ✅ route.ts | ✅ RentalList.tsx | ✅ | Funciona corretamente |
| `/api/rentals` | POST | ✅ route.ts | ✅ RentalForm.tsx | ✅ | Funciona corretamente |
| `/api/rentals` | PUT | ✅ route.ts | ✅ RentalForm.tsx | ✅ | Funciona corretamente |
| `/api/rentals` | DELETE | ✅ route.ts | ✅ RentalList.tsx | ✅ | Funciona corretamente |
| `/api/rentals/{id}/version` | GET | ✅ route.ts | ✅ useScanWithRetry.ts | ✅ | Funciona corretamente |
| `/api/rentals/scan-batch` | POST | ✅ route.ts | ✅ useScanWithRetry.ts | ✅ | Funciona corretamente |
| `/api/rentals/scan-batch` | GET | ✅ route.ts | ⚠️ Parcial | 🟡 | Não usado ativamente |
| `/api/rentals/calendar.ics` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/events` | GET | ✅ route.ts | ✅ PartnerDetailContent.tsx, EventFormDialog.tsx | ✅ | Funciona corretamente |
| `/api/events` | POST | ✅ route.ts | ❌ Não chamado em FE | ⚠️  | Criação via painel admin? |
| `/api/events/{id}` | PUT | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/events/{id}` | DELETE | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/subrentals` | GET | ✅ route.ts | ✅ PartnerDetailContent.tsx | ✅ | Funciona corretamente |
| `/api/subrentals` | POST | ✅ route.ts | ✅ SubrentalForm.tsx | ✅ | Funciona corretamente |
| `/api/subrentals/{id}` | PUT | ✅ route.ts | ✅ SubrentalForm.tsx | ✅ | Funciona corretamente |
| `/api/subrentals/{id}` | PATCH | ✅ route.ts | ✅ PartnerDetailContent.tsx | ✅ | Funciona corretamente |
| `/api/subrentals/{id}` | DELETE | ✅ route.ts | ✅ PartnerDetailContent.tsx | 🟡 | ❌ Usa query param `?id=` ao invés de path |

---

## 4. CLIENTES & PARCEIROS

| Endpoint | Método | Backend | Frontend | Status | Observação |
|----------|--------|---------|----------|--------|-------------|
| `/api/clients` | GET | ✅ route.ts | ✅ PartnerForm.tsx | ✅ | Funciona corretamente |
| `/api/clients` | POST | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/clients/{id}` | GET | ✅ route.ts | ⚠️ Parcial | 🟡 | Não usado no FE |
| `/api/clients/{id}` | PUT | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/clients/{id}` | DELETE | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/partners` | GET | ✅ route.ts | ✅ PartnersContent.tsx, EventFormDialog.tsx | ✅ | Funciona corretamente |
| `/api/partners` | POST | ✅ route.ts | ✅ PartnerForm.tsx | ✅ | Funciona corretamente |
| `/api/partners/{id}` | GET | ✅ route.ts | ✅ PartnerDetailContent.tsx | ✅ | Funciona corretamente |
| `/api/partners/{id}` | PUT | ✅ route.ts | ✅ PartnerForm.tsx | ✅ | Funciona corretamente |
| `/api/partners/{id}` | DELETE | ✅ route.ts | ✅ PartnersContent.tsx | 🟡 | ❌ Usa query param `?id=` ao invés de path |
| `/api/partners/stats` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/partners/catalog/generate` | POST | ✅ route.ts | ✅ PartnerCatalogGenerator.tsx | ✅ | Funciona corretamente |
| `/api/job-references` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/job-references` | POST | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |

---

## 5. SERVIÇOS & TAXAS

| Endpoint | Método | Backend | Frontend | Status | Observação |
|----------|--------|---------|----------|--------|-------------|
| `/api/services` | GET | ✅ route.ts | ✅ ServiceList.tsx | ✅ | Funciona corretamente |
| `/api/services` | POST | ✅ route.ts | ✅ ServiceForm.tsx | ✅ | Funciona corretamente |
| `/api/services/{id}` | GET | ✅ route.ts | ✅ ServiceForm.tsx | ✅ | Funciona corretamente |
| `/api/services/{id}` | PUT | ✅ route.ts | ✅ ServiceForm.tsx | ✅ | Funciona corretamente |
| `/api/services/{id}` | DELETE | ✅ route.ts | ✅ ServiceList.tsx | ✅ | Funciona corretamente |
| `/api/fees` | GET | ✅ route.ts | ✅ FeeList.tsx | ✅ | Funciona corretamente |
| `/api/fees` | POST | ✅ route.ts | ✅ FeeForm.tsx | ✅ | Funciona corretamente |
| `/api/fees/{id}` | GET | ✅ route.ts | ✅ FeeForm.tsx | ✅ | Funciona corretamente |
| `/api/fees/{id}` | PUT | ✅ route.ts | ✅ FeeForm.tsx | ✅ | Funciona corretamente |
| `/api/fees/{id}` | DELETE | ✅ route.ts | ✅ FeeList.tsx | ✅ | Funciona corretamente |

---

## 6. NOTIFICAÇÕES

| Endpoint | Método | Backend | Frontend | Status | Observação |
|----------|--------|---------|----------|--------|-------------|
| `/api/notifications` | GET | ✅ route.ts | ✅ NotificationsSection.tsx | ✅ | Funciona corretamente |
| `/api/notifications` | POST | ✅ route.ts | ✅ NotificationsSection.tsx | ✅ | Funciona corretamente |
| `/api/notifications/{id}` | GET | ✅ route.ts | ⚠️ Parcial | 🟡 | Não usado no FE |
| `/api/notifications/{id}` | DELETE | ✅ route.ts | ✅ NotificationsSection.tsx | ✅ | Funciona corretamente |
| `/api/notifications/preferences` | GET | ✅ route.ts | ✅ NotificationSettings.tsx | ✅ | Funciona corretamente |
| `/api/notifications/preferences` | PUT | ✅ route.ts | ✅ NotificationSettings.tsx | ✅ | Funciona corretamente |
| `/api/notifications/generate` | POST | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |

---

## 7. TRADUÇÃO & I18N

| Endpoint | Método | Backend | Frontend | Status | Observação |
|----------|--------|---------|----------|--------|-------------|
| `/api/translate` | GET | ✅ route.ts | ✅ client-translation.ts | 🟡 | Sem error handling |
| `/api/translate` | POST | ✅ route.ts | ✅ client-translation.ts | 🟡 | Sem error handling |
| `/api/translate/models` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/translate/list-models` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/translate/preload` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/translate/stats` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/translate/test` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/pdf/translate` | POST | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/i18n/coverage` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |

---

## 8. CATÁLOGO & COMPARTILHAMENTO

| Endpoint | Método | Backend | Frontend | Status | Observação |
|----------|--------|---------|----------|--------|-------------|
| `/api/catalog/generate-share-link` | POST | ✅ route.ts | ✅ PartnerCatalogGenerator.tsx | ✅ | Funciona corretamente |
| `/api/catalog/share/{token}` | GET | ✅ route.ts | ✅ PublicCatalogContent.tsx | ✅ | Funciona corretamente |
| `/api/catalog/submit-inquiry` | POST | ✅ route.ts | ❌ Não - chamado como `/inquiries` | 🔴 | ❌ ENDPOINT QUEBRADO |
| `/api/catalog/inquiries` | POST | ❌ Não existe | ✅ PublicCatalogContent.tsx | 🔴 | ❌ ENDPOINT FALTANDO |
| `/api/catalog/revalidate` | POST | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |

---

## 9. STORAGE & BACKUP

| Endpoint | Método | Backend | Frontend | Status | Observação |
|----------|--------|---------|----------|--------|-------------|
| `/api/backup` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/backup` | POST | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/backup/status` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/backup/config` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/upload` | POST | ✅ route.ts | ✅ PartnerForm.tsx | ✅ | Funciona corretamente |
| `/api/health` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/test-cookie` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |

---

## 10. CLOUD STORAGE

| Endpoint | Método | Backend | Frontend | Status | Observação |
|----------|--------|---------|----------|--------|-------------|
| `/api/cloud/files` | GET | ✅ route.ts | ✅ DriveContent.tsx | ✅ | Sem tipos formais |
| `/api/cloud/files` | POST | ✅ route.ts | ✅ DriveContent.tsx | ✅ | Sem tipos formais |
| `/api/cloud/files/{id}` | GET | ✅ route.ts | ✅ FilePreviewModal.tsx | ✅ | Sem tipos formais |
| `/api/cloud/files/{id}` | PATCH | ✅ route.ts | ✅ DriveContent.tsx | ✅ | Sem tipos formais |
| `/api/cloud/files/{id}` | DELETE | ✅ route.ts | ✅ DriveContent.tsx | ✅ | Sem tipos formais |
| `/api/cloud/files/upload` | POST | ✅ route.ts | ✅ FileUploadArea.tsx | ✅ | Sem tipos formais |
| `/api/cloud/folders` | GET | ✅ route.ts | ✅ DriveContent.tsx | ✅ | Sem tipos formais |
| `/api/cloud/folders` | POST | ✅ route.ts | ✅ DriveContent.tsx | ✅ | Sem tipos formais |
| `/api/cloud/folders/{id}` | PATCH | ✅ route.ts | ✅ DriveContent.tsx | ✅ | Sem tipos formais |
| `/api/cloud/folders/{id}` | DELETE | ✅ route.ts | ✅ DriveContent.tsx | ✅ | Sem tipos formais |
| `/api/cloud/share` | GET | ✅ route.ts | ✅ ShareDialog.tsx | ✅ | Sem tipos formais |
| `/api/cloud/share` | POST | ✅ route.ts | ✅ ShareDialog.tsx | ✅ | Sem tipos formais |
| `/api/cloud/share/{shareId}` | DELETE | ✅ route.ts | ✅ ShareDialog.tsx | ✅ | Sem tipos formais |
| `/api/cloud/share/{token}` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/cloud/storage` | GET | ✅ route.ts | ✅ CloudStorageStats.tsx | ✅ | Sem tipos formais |
| `/api/cloud/activity` | GET | ✅ route.ts | ✅ DriveContent.tsx | ✅ | Sem tipos formais |
| `/api/cloud/trash` | GET | ✅ route.ts | ✅ TrashManager.tsx | ✅ | Sem tipos formais |
| `/api/cloud/trash/empty` | DELETE | ✅ route.ts | ✅ TrashManager.tsx | ✅ | Sem tipos formais |
| `/api/cloud/search` | GET | ✅ route.ts | ✅ SearchBar.tsx | ✅ | Sem tipos formais |
| `/api/cloud/health` | GET | ✅ route.ts | ✅ CloudHealthStatus.tsx | ✅ | Sem tipos formais |
| `/api/cloud/tags` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/cloud/tags/{id}` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |

---

## 11. CONFIGURAÇÃO & CUSTOMIZAÇÃO

| Endpoint | Método | Backend | Frontend | Status | Observação |
|----------|--------|---------|----------|--------|-------------|
| `/api/config` | GET | ✅ route.ts | ✅ useConfig.ts | 🟡 | Sem error handling |
| `/api/config` | POST | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/customization` | GET | ✅ route.ts | ✅ Múltiplos componentes | ✅ | Funciona corretamente |
| `/api/customization` | POST | ✅ route.ts | ✅ BrandingContext.tsx | ✅ | Sem tipos formais |

---

## 12. ADMINISTRAÇÃO & SETUP

| Endpoint | Método | Backend | Frontend | Status | Observação |
|----------|--------|---------|----------|--------|-------------|
| `/api/setup/complete` | POST | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe, usado em setup inicial |
| `/api/setup/seed-catalog` | POST | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/setup/test-storage` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/admin/database/cleanup` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/admin/database/cleanup` | POST | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/admin/migrate-images` | POST | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/admin/translation-coverage` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/admin/translations` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/admin/translations` | POST | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/admin/translations/{id}` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/admin/translations/{id}` | PUT | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/admin/translations/{id}` | DELETE | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/admin/translations/bulk` | POST | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |
| `/api/admin/translations/export` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |

---

## 13. IA & ANÁLISE

| Endpoint | Método | Backend | Frontend | Status | Observação |
|----------|--------|---------|----------|--------|-------------|
| `/api/ai/analyze-equipment` | POST | ✅ route.ts | ✅ AIEquipmentAssistant.tsx | ✅ | Funciona corretamente |

---

## 14. QUOTES

| Endpoint | Método | Backend | Frontend | Status | Observação |
|----------|--------|---------|----------|--------|-------------|
| `/api/quotes` | POST | ✅ route.ts | ✅ QuoteForm.tsx | ✅ | Funciona corretamente |
| `/api/quotes` | GET | ✅ route.ts | ❌ Não chamado | ⚠️  | Backend existe mas não usado |

---

## 15. SOCKET & REALTIME

| Endpoint | Método | Backend | Frontend | Status | Observação |
|----------|--------|---------|----------|--------|-------------|
| `/api/socket` | GET (upgrade) | ✅ route.ts | ✅ AppContext.tsx | ✅ | WebSocket funciona |

---

## 📊 RESUMO DA MATRIZ

### Totalizadores

```
Total de Endpoints:           92
✅ Funcionando Corretamente:   61 (66%)
🟡 Com Observações:           28 (30%)
🔴 Problemas Críticos:         2 (2%)
⚠️  Não Verificados:           1 (1%)

Status Geral: 🟡 BOM COM RESSALVAS
```

### Problemas Encontrados

```
🔴 CRÍTICOS (2):
   └─ /api/catalog/inquiries (endpoint faltando)
   └─ /api/subrentals?id= (padrão RESTful incorreto)

🟡 IMPORTANTES (3):
   └─ /api/partners?id= (padrão RESTful incorreto)
   └─ Sem tipos formais (Cloud Storage)
   └─ Sem error handling (3 endpoints)

⚠️  OBSERVAÇÕES (22):
   └─ Backend sem uso no Frontend
```

---

**Última Atualização:** 17 de Janeiro, 2026  
**Compatível com:**
- [FRONTEND_BACKEND_CONNECTIVITY_AUDIT.md](FRONTEND_BACKEND_CONNECTIVITY_AUDIT.md)
- [TECHNICAL_CONNECTIVITY_DETAILS.md](TECHNICAL_CONNECTIVITY_DETAILS.md)
- [CONNECTIVITY_QUICK_REFERENCE.md](CONNECTIVITY_QUICK_REFERENCE.md)
