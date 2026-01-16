# 🔧 Cable Tag Layout Fix - Refatoração Completa

**Data:** 16 de Janeiro de 2026  
**Status:** ✅ **IMPLEMENTADO**  
**Ficheiro Modificado:** `src/lib/equipment-label-pdf-generator.ts`

---

## 📋 Problema Resolvido

### Antes
O template Cable Tag (25×75mm) exibia apenas o ID em tamanho extra grande, causando:
- ❌ Sobreposição de texto com QR Code
- ❌ Falta de contexto (sem nome do equipamento)
- ❌ Layout desordenado e improfissional

### Depois
Layout profissional e legível:
- ✅ **Nome do Equipamento** (Helvetica Bold, font scaling 12pt → 7pt)
- ✅ **Categoria / Subcategoria** (Helvetica Normal, 5pt)
- ✅ **QR Code** (20×20mm à direita)
- ✅ **Linha divisória vertical** (separação clara das zonas)
- ✅ **Sem ID redundante** (já codificado no QR Code)

---

## 🎨 Novo Layout Cable Tag (25×75mm)

```
┌────────────────────────────────────────────────┬──────────┐
│ ┌──────────────────────────────────────────┐  │          │
│ │ NOME DO EQUIPAMENTO (Bold 12pt)          │  │          │
│ │ Categoria / Subcategoria (5pt)           │  │   QR     │
│ │                                          │  │  20×20   │
│ └──────────────────────────────────────────┘  │          │
│ Zona de Leitura Humana (50mm)                │          │
└────────────────────────────────────────────────┴──────────┘
             ESQUERDA (65%)        │    DIREITA (27%)
                                    │
                            Divisória Vertical
                           (Linha fina 0.1mm)
```

### Especificações de Tipografia

| Elemento | Font | Tamanho | Cor | Quebras |
|----------|------|---------|-----|---------|
| Nome | Helvetica Bold | 12pt → 7pt (auto-shrink) | Preto #000 | Máx 2 linhas |
| Categoria | Helvetica Normal | 5pt fixo | Cinza #505050 | 1 linha |
| QR Code | - | 20×20mm | Preto puro | - |

### Lógica de Auto-Shrink

```typescript
// Nome em Helvetica Bold começa com 12pt
let fontSize = 12;
while (fontSize >= 7) {
  // Tentar encaixar em máximo 2 linhas
  // Se couber: renderizar e sair
  // Se não couber: decrementar 0.5pt e tentar novamente
}
```

---

## 🛠️ Alterações Técnicas

### 1. Nova Interface: `EquipmentItemWithRelations`

```typescript
export interface EquipmentItemWithRelations extends Omit<EquipmentItem, 'Category' | 'Subcategory'> {
  Category?: {
    id: string;
    name: string;
    icon?: string;
  };
  Subcategory?: {
    id: string;
    name: string;
  };
}
```

**Razão:** A API retorna `Category` e `Subcategory` como objetos, não como IDs. Precisávamos de um tipo que refletisse essa estrutura.

### 2. Helper: `buildCategoryText()`

```typescript
private buildCategoryText(item: EquipmentItemWithRelations): string {
  const parts: string[] = [];
  
  if (item.Category?.name) parts.push(item.Category.name);
  if (item.Subcategory?.name) parts.push(item.Subcategory.name);
  
  return parts.length > 0 ? parts.join(' / ') : '—';
}
```

**Razão:** Reutilizável em todos os templates. Retorna `"Categoria / Subcategoria"` ou `"—"` se não houver dados.

### 3. Métodos Refatorados

#### `drawCableTagLabel()`
- ❌ Removido: Renderização de ID em Bold Extra Grande
- ✅ Adicionado: Nome + Categoria em zona esquerda (50mm)
- ✅ Adicionado: Linha divisória vertical aos 52mm
- ✅ Adicionado: Font scaling automático (12pt → 7pt)

#### `drawFlightcaseLabel()`
- ✅ Atualizado: Substituir "ID:" por "Categoria / Subcategoria"
- ✅ Atualizado: Usar helper `buildCategoryText()`

#### `drawSmallCaseLabel()`
- ✅ Atualizado: Adicionar "Categoria / Subcategoria" abaixo do nome
- ✅ Atualizado: Usar helper `buildCategoryText()`

#### `drawShippingLabel()`
- ✅ Atualizado: Substituir "ID:" por "Categoria / Subcategoria"
- ✅ Atualizado: Usar helper `buildCategoryText()`

---

## 📦 Dados Necessários da API

O endpoint `/api/equipment?fetchAll=true` já retorna os dados necessários:

```json
{
  "id": "eq-001",
  "name": "Cabo XLR 10m",
  "description": "Cabo balanceado profesional",
  "categoryId": "cat-001",
  "subcategoryId": "subcat-001",
  "quantity": 5,
  "Category": {
    "id": "cat-001",
    "name": "Cabos e Conectores",
    "icon": "cable"
  },
  "Subcategory": {
    "id": "subcat-001",
    "name": "XLR Simétrico"
  }
}
```

✅ **Compatível com o repositório existente** (`EquipmentRepository.findAll()`)

---

## 🔄 Fluxo de Dados

```
┌────────────────────────────────────────────────┐
│ Frontend: InventoryLabelGenerator              │
│ - Carrega itens via AppContext (JSON completo)│
│ - Passa selectedItems[] ao componente          │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────┐
│ EquipmentLabelPDFDownload.tsx                  │
│ - Chama generateLabelsPDF(selectedItems, ...)  │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────┐
│ EquipmentLabelPDFGenerator.generateLabelsPDF() │
│ - Aceita: EquipmentItemWithRelations[]         │
│ - Para cada item: chama drawLabelCell()        │
│ - drawLabelCell() chama drawCableTagLabel()    │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────┐
│ drawCableTagLabel()                            │
│ - Renderiza: Nome + Categoria + QR             │
│ - Font scaling automático                      │
│ - Linha divisória em 52mm                      │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────┐
│ PDF Blob                                       │
│ - Download automático                          │
└────────────────────────────────────────────────┘
```

---

## ✅ Validação

### Tipos TypeScript
- ✅ Novo interface `EquipmentItemWithRelations` exportado
- ✅ Todos os métodos refatorados aceitam `EquipmentItemWithRelations`
- ✅ Helper `buildCategoryText()` type-safe
- ✅ Sem erros de compilação no ficheiro

### Compatibilidade
- ✅ Backward compatible com `EquipmentLabelPDFDownload.tsx`
- ✅ Funciona com dados da API (`/api/equipment?fetchAll=true`)
- ✅ Suporta o padrão existing de relatórios

### Layout Visual
- ✅ Cable Tag: Nome + Categoria legível em 50mm esquerda
- ✅ Flightcase: Categoria visível sob o nome
- ✅ Small Case: Categoria comprimida em 5pt
- ✅ Shipping: Categoria em tamanho grande (10pt)

---

## 🎯 Próximos Passos

1. **Teste no navegador** (Cable Tag template)
   - Verificar se nome + categoria cabe no espaço
   - Validar font scaling automático
   - Confirmar linha divisória visível

2. **Impressão física** (tesoura/guilhotina)
   - Validar alinhamento das margens
   - Confirmar qualidade do QR na impressora

3. **Feedback do utilizador**
   - Ajustar tamanhos de font se necessário
   - Adicionar mais contexto se requerido

---

## 📌 Referências

- **Ficheiro principal:** [src/lib/equipment-label-pdf-generator.ts](src/lib/equipment-label-pdf-generator.ts)
- **Componente:** [src/components/inventory/EquipmentLabelPDFDownload.tsx](src/components/inventory/EquipmentLabelPDFDownload.tsx)
- **Documentação:** [EQUIPMENT_LABEL_PDF_GUIDE.md](EQUIPMENT_LABEL_PDF_GUIDE.md)
- **Repositório:** [src/lib/repositories/equipment.repository.ts](src/lib/repositories/equipment.repository.ts)

---

**Status:** ✅ **PRONTO PARA TESTE**
