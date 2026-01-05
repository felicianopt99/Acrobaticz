# Cloud Drive Translation Quick Reference

## Summary

**Total Components**: 25  
**Pages**: 9  
**Translatable Strings**: 300+  
**Dynamic Variables**: 15+  

---

## Key File Locations

### Pages to Translate
```
src/app/cloud/page.tsx
src/app/cloud/trash/page.tsx
src/app/cloud/starred/page.tsx
src/app/cloud/shared/page.tsx
src/app/cloud/storage-dashboard/page.tsx
src/app/(cloud)/layout.tsx
src/app/(cloud)/drive/page.tsx
src/app/(cloud)/drive/recent/page.tsx
src/app/(cloud)/drive/shared/page.tsx
src/app/(cloud)/drive/starred/page.tsx
src/app/(cloud)/drive/trash/page.tsx
src/app/(cloud)/drive/folder/[id]/page.tsx
```

### Priority Components (Most User-Facing)
1. **CloudSidebar.tsx** - Main navigation (5 nav items)
2. **CloudHeader.tsx** - Search, view toggle, user menu
3. **DriveContent.tsx** - File grid/list, actions (110+ strings)
4. **ShareDialog.tsx** - File sharing
5. **TrashContent.tsx** - Restore/delete actions
6. **StarredContent.tsx** - Star management
7. **RecentContent.tsx** - Recent files
8. **StorageQuotaDisplay.tsx** - Storage indicator

### Secondary Components
9. **FileList.tsx** - Table headers, sorting
10. **ActivityLog.tsx** - Activity tracking (6 action types)
11. **BatchActionsToolbar.tsx** - Multi-select operations
12. **FilePreviewModal.tsx** - Preview dialog
13. **TagManager.tsx** - File tagging system
14. **StorageDashboardContent.tsx** - Admin quota management

---

## Common Translation Patterns

### Button/Action Labels (Present Tense, Imperative)
```
Upload      → Enviar
Download    → Baixar
Share       → Compartilhar
Delete      → Excluir
Rename      → Renomear
Create      → Criar
Move        → Mover
Preview     → Visualizar
Restore     → Restaurar
```

### Navigation Labels
```
My Drive       → Meu Drive
Starred        → Marcados
Shared with me → Compartilhado comigo
Recent         → Recentes
Trash          → Lixo
Settings       → Configurações
Help           → Ajuda
```

### Storage Terms
```
Storage        → Armazenamento
Quota          → Cota
Cloud          → Nuvem
File           → Arquivo
Folder         → Pasta
```

### Dialog Titles
```
Share "fileName"          → Compartilhar "nomeDoArquivo"
Create Folder             → Criar Pasta
Manage Tags              → Gerenciar Etiquetas
Move Items               → Mover Itens
Delete Items             → Excluir Itens
Keyboard Shortcuts       → Atalhos de Teclado
Storage Dashboard        → Painel de Armazenamento
```

### Success Messages
```
File renamed successfully        → Arquivo renomeado com sucesso
Folder created successfully     → Pasta criada com sucesso
Moved {count} items             → {count} itens movidos
Shared {count} items            → {count} itens compartilhados
```

### Error Messages
```
Failed to upload file          → Falha ao enviar arquivo
Failed to create folder        → Falha ao criar pasta
Please try again               → Tente novamente
Upload failed                  → Falha no envio
Storage full                   → Armazenamento cheio
```

---

## Dynamic Variables

These variables must be preserved in translations:

```javascript
// File/Item counts
{selectedCount}  // Number of selected items
{count}          // Generic count
{files.length}   // Array length

// File/Folder names
{fileName}       // Individual file name
{name}           // User/folder name
{newName}        // New name after rename

// Storage quantities
{formatBytes()}  // Formatted byte amount
{percent}        // Percentage value
{used}           // Used space
{total}          // Total space

// User info
{userName}       // User's name
{action}         // Activity action type
{permission}     // Permission level (View/Edit/Admin)
{status}         // Item status
```

### Example Dynamic Strings
```
English:
"Moved {count} items"
Portuguese:
"{count} itens movidos"

English:
"Share "{fileName}""
Portuguese:
"Compartilhar "{fileName}""

English:
"{formatBytes(quota.usedBytes)} of {formatBytes(quota.quotaBytes)} used"
Portuguese:
"{formatBytes(quota.usedBytes)} de {formatBytes(quota.quotaBytes)} usado"
```

---

## Permission Levels (Keep Consistent)

```
View   → Visualizar (read-only access)
Edit   → Editar (can modify)
Admin  → Admin (full control)
```

---

## Activity Types (Action Log)

```
UPLOAD   → Enviado
DOWNLOAD → Baixado
DELETE   → Excluído
RENAME   → Renomeado
SHARE    → Compartilhado
```

---

## UI States & Status Messages

### Empty States
```
No items found              → Nenhum item encontrado
No active shares            → Nenhum compartilhamento ativo
No recent activity          → Nenhuma atividade recente
Files and folders that others share with you will appear here
→ Arquivos e pastas compartilhados com você aparecerão aqui
```

### Loading States
```
Loading...                  → Carregando...
Loading storage data...     → Carregando dados de armazenamento...
Loading content...          → Carregando conteúdo...
```

### Toast Notification Context

These appear as transient notifications:
- Success (Green): User action completed
- Error (Red): Something went wrong
- Info (Blue): Informational feedback

---

## Special Considerations

### Plural Forms
Portuguese has specific rules for pluralization:

```
1 file uploaded       → 1 arquivo enviado
2+ files uploaded     → 2 arquivos enviados

1 item selected       → 1 item selecionado
2+ items selected     → 2 itens selecionados
```

### Gender Agreement
Some Portuguese nouns are gendered:
```
arquivo (m) - file
pasta (f) - folder
Ensure adjectives agree with gender
```

### Formal vs. Informal
The app should maintain professional/formal tone throughout:
- "Você" (formal you) over "Tu"
- Polite imperatives

---

## Component-by-Component Translation Map

### CloudSidebar.tsx (Priority 1)
```
Lines 40-45: navItems array (5 navigation labels)
Line 115: "New"
Line 122: "New folder"
Line 127: "File upload"
Line 135: "Folder upload"
Line 155: "Storage" (label)
```

### CloudHeader.tsx (Priority 1)
```
Line 148: "Search files..."
Line 192: "Grid view"
Line 209: "List view"
Line 222: "Refresh" (tooltip)
Line 233: "Dashboard" (tooltip)
Line 262-267: User menu items
```

### DriveContent.tsx (Priority 1)
```
~400+ strings including:
- File action menus
- Rename dialog
- Delete confirmations
- Move operations
- Star/unstar
- Share button
- Toast messages
```

### ShareDialog.tsx (Priority 2)
```
Lines ~75: "Share" button
Lines ~80-90: Permission dropdown labels
Lines ~170: "Active Shares"
Lines ~190: "No active shares"
```

---

## Translation Workflow

1. **Extract strings** using the provided JSON file
2. **Create Portuguese locale file**:
   ```json
   src/locales/pt-BR/cloud-drive.json
   ```
3. **Update components** to use i18n keys
4. **Test with Portuguese locale**
5. **Validate dynamic variables** render correctly
6. **Check UI layout** (some Portuguese text is longer)
7. **Review with native speaker**

---

## Common Mistakes to Avoid

1. ❌ Not translating aria-labels and title attributes
2. ❌ Breaking dynamic variable syntax `{variable}`
3. ❌ Inconsistent terminology across components
4. ❌ Using informal tone for professional app
5. ❌ Not testing pluralization with different counts
6. ❌ Forgetting error messages
7. ❌ Not translating tooltips and help text
8. ❌ Changing meaning of action labels

---

## Files Created

1. **CLOUD_DRIVE_TRANSLATION_STRINGS.md** - Comprehensive documentation
2. **cloud-drive-translation-keys.json** - Structured JSON with all keys
3. **This file** - Quick reference guide

---

## Next Steps

1. Use the JSON file as the authoritative source for all translation keys
2. Create Portuguese translations for each key
3. Implement i18n integration in React components
4. Test all pages in Portuguese language mode
5. Validate dynamic text rendering (plurals, variables)
6. Get native Portuguese speaker review
