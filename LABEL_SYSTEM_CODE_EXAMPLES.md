# 💻 CÓDIGO-FONTE: Exemplos de Problemas e Soluções

## Referência Rápida: Onde Estão os Problemas

---

## PROBLEMA 1: Sem Suporte a Quantidades

### ❌ Código Atual (Não Funciona)

**Ficheiro:** `src/components/inventory/InventoryLabelGenerator.tsx` (linhas 30-40)

```typescript
// PROBLEMA: Só armazena IDs, não quantidades
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [searchTerm, setSearchTerm] = useState('');
const [companyName, setCompanyName] = useState(APP_NAME);

// Resultado: 1 item = 1 etiqueta (sempre)
```

### ❌ No handleDownload (linhas 60-81)

```typescript
const handleDownload = useCallback(async () => {
  setIsDownloading(true);
  
  // 🔴 PROBLEMA: Loop sobre IDs apenas
  for (const id of Array.from(selectedIds)) {
    const itemRef = labelRefs.current[id]?.current;
    const item = equipment.find(e => e.id === id);

    if (!itemRef || !item) continue;

    try {
      // Gera SEMPRE 1 etiqueta por ID
      const dataUrl = await htmlToImage.toJpeg(itemRef, { quality: 0.95 });
      
      // Download SEMPRE de 1 ficheiro
      const link = document.createElement('a');
      link.download = `${item.name.replace(/ /g, '_')}_label.jpg`;
      link.href = dataUrl;
      link.click();
      
      // ❌ PROBLEMA: Se precisas de 47 etiquetas de um item,
      //    Tem de executar isto 47 vezes manualmente
      
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error('oops, something went wrong!', error);
      toast({ variant: "destructive", title: `Failed to generate label for ${item.name}` });
    }
  }
  
  setIsDownloading(false);
  toast({ title: "{toastDownloadCompletTitleText}" });
}, [selectedIds, equipment, toast]);
```

### ✅ Solução (Próximas 2-3 horas)

```typescript
// STEP 1: Alterar estrutura de dados
interface SelectedItemWithQty {
  itemId: string;
  quantity: number;  // 🟢 NOVO!
}

const [selectedItems, setSelectedItems] = useState<SelectedItemWithQty[]>([]);

// STEP 2: Alterar UI para mostrar input de quantidade
// Na lista de items:
{filteredEquipment.map(item => (
  <div key={item.id} className="flex items-center space-x-3">
    <Checkbox
      checked={selectedItems.some(s => s.itemId === item.id)}
      onCheckedChange={(checked) => {
        setSelectedItems(prev => {
          if (checked) {
            return [...prev, { itemId: item.id, quantity: 1 }];  // 🟢 Default 1
          } else {
            return prev.filter(s => s.itemId !== item.id);
          }
        });
      }}
    />
    <Label>{item.name}</Label>
    
    {/* 🟢 NOVO: Quantity Input */}
    <Input
      type="number"
      min="1"
      max="1000"
      value={selectedItems.find(s => s.itemId === item.id)?.quantity || 1}
      onChange={(e) => {
        setSelectedItems(prev =>
          prev.map(s =>
            s.itemId === item.id
              ? { ...s, quantity: parseInt(e.target.value) || 1 }
              : s
          )
        );
      }}
      className="w-20"
    />
  </div>
))}

// STEP 3: Refatorar handleDownload
const handleDownload = useCallback(async () => {
  setIsDownloading(true);
  
  // 🟢 NOVO: Loop sobre items COM quantidade
  for (const selected of selectedItems) {
    const item = equipment.find(e => e.id === selected.itemId);
    if (!item) continue;
    
    // 🟢 NOVO: Loop interno para quantidade
    for (let i = 0; i < selected.quantity; i++) {  // ← Gera N etiquetas!
      const itemRef = labelRefs.current[selected.itemId]?.current;
      
      try {
        const dataUrl = await htmlToImage.toJpeg(itemRef, { quality: 0.95 });
        const link = document.createElement('a');
        
        // 🟢 NOVO: Sufixo para evitar overwrite
        link.download = `${item.name.replace(/ /g, '_')}_label_${i + 1}.jpg`;
        link.href = dataUrl;
        link.click();
        
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error('oops, something went wrong!', error);
        toast({ variant: "destructive", title: `Failed: ${item.name} (#${i + 1})` });
      }
    }
  }
  
  setIsDownloading(false);
  toast({ title: "Download Complete", description: `Generated ${selectedItems.reduce((acc, s) => acc + s.quantity, 0)} labels` });
}, [selectedItems, equipment, toast]);
```

---

## PROBLEMA 2: UI Bloqueada em Downloads Múltiplos

### ❌ Código Atual (Bloqueia 20+ segundos)

**Ficheiro:** `src/components/inventory/InventoryLabelGenerator.tsx` (linhas 60-81)

```typescript
// 🔴 PROBLEMA: for...await sequencial com delay
for (const id of Array.from(selectedIds)) {
  // ... renderizar
  
  const dataUrl = await htmlToImage.toJpeg(itemRef, { quality: 0.95 });  // 0.5s
  link.click();
  
  await new Promise(resolve => setTimeout(resolve, 200));  // 0.2s delay
  
  // Total: 0.7s × 100 items = 70 segundos UI bloqueado!
}
```

### ✅ Solução (1 hora)

```typescript
// STEP 1: Instalar p-limit
// npm install p-limit

import pLimit from 'p-limit';

const handleDownload = useCallback(async () => {
  setIsDownloading(true);
  const [downloadProgress, setDownloadProgress] = useState(0);  // 🟢 NOVO
  
  // 🟢 NOVO: Limit concorrentes a 6 (máximo que browsers suportam)
  const limit = pLimit(6);
  
  // 🟢 NOVO: Array de promises em paralelo
  const promises = Array.from(selectedIds).map((id, index) =>
    limit(async () => {
      try {
        const itemRef = labelRefs.current[id]?.current;
        const item = equipment.find(e => e.id === id);
        
        if (!itemRef || !item) return;
        
        const dataUrl = await htmlToImage.toJpeg(itemRef, { quality: 0.95 });
        const link = document.createElement('a');
        link.download = `${item.name.replace(/ /g, '_')}_label.jpg`;
        link.href = dataUrl;
        link.click();
        
        // 🟢 NOVO: Update progress
        setDownloadProgress(prev => prev + 1);
        
      } catch (error) {
        console.error('oops, something went wrong!', error);
        toast({ variant: "destructive", title: `Failed to generate label` });
      }
    })
  );
  
  // 🟢 NOVO: Esperar TODAS em paralelo (muito mais rápido!)
  await Promise.all(promises);
  
  setIsDownloading(false);
  toast({ title: "Download Complete" });
}, [selectedIds, equipment, toast]);

// 🟢 NOVO: Progress bar na UI
<div className="mt-4">
  <p>Progress: {downloadProgress}/{selectedIds.size}</p>
  <progress value={downloadProgress} max={selectedIds.size} />
</div>
```

**Impacto:**
```
Antes:  100 items × 0.7s = 70 segundos (UI bloqueada)
Depois: 100 items ÷ 6 concurrent = ~12 segundos (UI responsiva)

Melhoria: 5.8× mais rápido + UI não bloqueia
```

---

## PROBLEMA 3: Sem Suporte PDF

### ❌ Código Atual (Não Existe)

**Ficheiro:** `src/components/inventory/InventoryLabelGenerator.tsx`

```typescript
// 🔴 jspdf está em package.json (linha 94) MAS:
// - Nenhuma importação
// - Nenhuma utilização
// - Nenhuma função de PDF

// Resultado: Sempre JPG isolados
```

### ✅ Solução (3-4 horas)

```typescript
// STEP 1: Adicionar import (já está em package.json)
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// STEP 2: Novo função para PDF
const generatePDF = async (items: EquipmentItem[], refs: any) => {
  // Papel A4 em landscape
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Dimensões da etiqueta (em mm)
  const labelWidth = 100;
  const labelHeight = 80;
  
  // Quanto cabe em cada página
  const cols = Math.floor(pageWidth / (labelWidth + 5));  // 5mm margem
  const rows = Math.floor(pageHeight / (labelHeight + 5));
  const itemsPerPage = cols * rows;
  
  let itemIndex = 0;
  let pageIndex = 0;
  
  for (const item of items) {
    const itemRef = refs[item.id]?.current;
    if (!itemRef) continue;
    
    // Converter componente React para imagem
    const canvas = await html2canvas(itemRef, { scale: 2 });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // Calcular posição na página
    const positionInPage = itemIndex % itemsPerPage;
    const col = positionInPage % cols;
    const row = Math.floor(positionInPage / cols);
    
    const x = 5 + col * (labelWidth + 5);
    const y = 5 + row * (labelHeight + 5);
    
    // Adicionar nova página se necessário
    if (positionInPage === 0 && itemIndex > 0) {
      doc.addPage();
    }
    
    // 🟢 Adicionar imagem ao PDF
    doc.addImage(imgData, 'JPEG', x, y, labelWidth, labelHeight);
    
    itemIndex++;
  }
  
  // Download como PDF
  doc.save('equipment_labels.pdf');
};

// STEP 3: Adicionar botão para escolher formato
<div className="flex gap-2 mb-4">
  <Button
    onClick={() => {
      // Lógica para JPG (código existente)
      handleDownload();
    }}
    variant={format === 'jpg' ? 'default' : 'outline'}
  >
    Download as JPG
  </Button>
  
  <Button
    onClick={() => {
      const selectedEquipment = equipment.filter(e => selectedIds.has(e.id));
      generatePDF(selectedEquipment, labelRefs.current);
    }}
    variant={format === 'pdf' ? 'default' : 'outline'}
  >
    Download as PDF
  </Button>
</div>
```

---

## PROBLEMA 4: Tamanho Fixo 400×300px

### ❌ Código Atual (Uma Size Fits None)

**Ficheiro:** `src/components/inventory/EquipmentLabel.tsx` (linhas 17-28)

```typescript
<div 
  ref={ref} 
  className="p-4 border border-solid border-border ..."
  style={{ width: 400, height: 300 }}  // 🔴 SEMPRE 400×300
>
```

### ✅ Solução (4-5 horas)

```typescript
// STEP 1: Definir templates
const LABEL_TEMPLATES = {
  micro: { width: 50, height: 50, name: 'Micro (50mm²) - Cabos' },
  small: { width: 70, height: 70, name: 'Pequena (50×50mm) - Componentes' },
  standard: { width: 105, height: 79, name: 'Standard (100×80mm) - Equipamento' },
  large: { width: 150, height: 100, name: 'Grande (150×100mm) - Equipamento Grande' },
  a6: { width: 105, height: 148, name: 'A6 (105×148mm) - Transporte' },
} as const;

type LabelTemplate = keyof typeof LABEL_TEMPLATES;

// STEP 2: Adicionar seletor na UI
const [labelSize, setLabelSize] = useState<LabelTemplate>('standard');

<Select value={labelSize} onValueChange={(v) => setLabelSize(v as LabelTemplate)}>
  <SelectContent>
    {Object.entries(LABEL_TEMPLATES).map(([key, value]) => (
      <SelectItem key={key} value={key}>
        {value.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// STEP 3: Refatorar EquipmentLabel para aceitar template
interface EquipmentLabelProps {
  item: EquipmentItem;
  companyName?: string;
  size?: LabelTemplate;  // 🟢 NOVO
}

const EquipmentLabel = React.forwardRef<HTMLDivElement, EquipmentLabelProps>(
  ({ item, companyName, size = 'standard' }, ref) => {
    const template = LABEL_TEMPLATES[size];
    
    // Converter para pixels (assumindo 96 DPI)
    const widthPx = (template.width / 25.4) * 96;
    const heightPx = (template.height / 25.4) * 96;
    
    return (
      <div 
        ref={ref}
        style={{ width: widthPx, height: heightPx }}
        className="p-2 border border-solid border-border ..."
      >
        {/* Conteúdo ajustado ao tamanho */}
        {companyName && size !== 'micro' && (
          <p className="text-sm font-bold uppercase">{companyName}</p>
        )}
        <h3 className="text-lg font-bold line-clamp-2">{item.name}</h3>
        {/* QR code redimensionado baseado no tamanho */}
      </div>
    );
  }
);
```

---

## PROBLEMA 5: Sem Modo Print-Safe

### ❌ Código Atual (Dark Mode = Impressão Preta)

**Ficheiro:** Não existe `@media print` rules

```typescript
// EquipmentLabel.tsx usa classes Tailwind que respondem a tema
<div className="bg-card text-foreground ...">
  {/* Em dark mode:
      bg-card = #1a1a1a
      text-foreground = #FFFFFF
      
      Quando impresso em P&B: NADA visível!
  */}
</div>
```

### ✅ Solução (1 hora)

```css
/* STEP 1: Adicionar a src/globals.css */

@media print {
  /* Forçar cores de impressão segura */
  .equipment-label {
    background-color: #FFFFFF !important;
    color: #000000 !important;
    border-color: #000000 !important;
    box-shadow: none !important;
  }
  
  .equipment-label p,
  .equipment-label h3 {
    color: #000000 !important;
  }
  
  /* QR Code deve ser preto e branco puro */
  .equipment-label svg {
    filter: none !important;
    background: white !important;
  }
  
  /* Margens seguras para impressora */
  @page {
    margin: 5mm;
  }
  
  /* Evitar quebras de página no meio da etiqueta */
  .equipment-label {
    page-break-inside: avoid;
  }
}

/* STEP 2: Na componente, adicionar toggle */
interface EquipmentLabelProps {
  item: EquipmentItem;
  companyName?: string;
  printSafeMode?: boolean;  // 🟢 NOVO
}

export const EquipmentLabel = React.forwardRef<HTMLDivElement, EquipmentLabelProps>(
  ({ item, companyName, printSafeMode = false }, ref) => {
    return (
      <div 
        ref={ref}
        className={`
          p-4 border border-solid rounded-lg flex flex-col items-center justify-center 
          text-center
          ${printSafeMode 
            ? 'bg-white text-black border-black'  // 🟢 Modo print
            : 'bg-card text-foreground border-border'  // Normal
          }
        `}
        style={{ width: 400, height: 300 }}
      >
        {/* Conteúdo */}
      </div>
    );
  }
);

/* STEP 3: UI Toggle */
const [printSafeMode, setPrintSafeMode] = useState(false);

<div className="flex items-center space-x-2 mb-4">
  <Checkbox
    id="print-safe"
    checked={printSafeMode}
    onCheckedChange={setPrintSafeMode}
  />
  <Label htmlFor="print-safe">Print Safe Mode (B&W)</Label>
</div>

{/* Pass ao componente */}
<EquipmentLabel 
  item={item}
  printSafeMode={printSafeMode}
/>
```

---

## RESUMO: Onde Está o Código

| Problema | Ficheiro | Linhas | Tipo | Fixável |
|----------|----------|--------|------|---------|
| Sem Qty | InventoryLabelGenerator.tsx | 30-40 | State | 2-3h |
| Sem Qty Logic | InventoryLabelGenerator.tsx | 60-81 | Loop | Incluso acima |
| UI Bloqueada | InventoryLabelGenerator.tsx | 60-81 | Loop | 1h |
| Sem PDF | Não existe (jspdf não usado) | N/A | Missing | 3-4h |
| Tamanho Fixo | EquipmentLabel.tsx | 17-28 | Style | 4-5h |
| Sem Print-Safe | globals.css | N/A | Missing | 1h |

---

**Total de Código Necessário:** 11-16 horas de desenvolvimento  
**Resultado:** Sistema 100% production-ready
