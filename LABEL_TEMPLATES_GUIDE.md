# 📋 Equipment Label Templates - Guia de Uso

## Overview

O componente `EquipmentLabel` foi refatorado para suportar **4 variantes otimizadas para cenários reais de armazém**, com suporte automático a branding do Admin e **Print-Safe Mode**.

---

## 1️⃣ Templates Disponíveis

### Cable Tag (80×60mm)
**Uso:** Cabos, conectores, componentes pequenos
```
┌──────────────────────────┐
│      COMPANY             │
│      CABLE XLR           │ 
│    ┌──────────────┐      │
│    │   QR Code    │      │
│    │  (100px)     │      │
│    └──────────────┘      │
└──────────────────────────┘
```
**Características:**
- Tamanho mínimo (80×60mm)
- Fonte ultra-pequena (7-8px)
- QR Code em tamanho reduzido (100px)
- Foco: Nome do item + QR

**Quando usar:**
- ✅ Cabos XLR, de áudio, HDMI
- ✅ Conectores, adaptadores
- ✅ Componentes onde espaço é crítico

---

### Small Case (100×80mm)
**Uso:** Malas pequenas, cases compactos
```
┌──────────────────────────┐
│    ┌─────────────┐       │
│    │ Logo Admin  │       │
│    │  (40px h)   │       │
│    └─────────────┘       │
│                          │
│    SMALL FLIGHTCASE      │
│                          │
│   ┌──────────────┐       │
│   │  QR Code     │       │
│   │  (120px)     │       │
│   └──────────────┘       │
└──────────────────────────┘
```
**Características:**
- Logo pequeno do Admin (40px altura)
- Fonte pequena (12px para item)
- QR Code médio (120px)
- Proporção 100×80mm

**Quando usar:**
- ✅ Malas compactas
- ✅ Headphones, microfones
- ✅ Cases de equipamento pequeno

---

### Flightcase (120×100mm) ⭐ DEFAULT
**Uso:** Standard para a maioria dos equipamentos
```
┌──────────────────────────┐
│   ┌─────────────────┐    │
│   │  Logo Admin     │    │
│   │  (48px height)  │    │
│   └─────────────────┘    │
│                          │
│    AV RENTALS            │
│                          │
│    PROJECTOR 4K          │
│                          │
│   ┌──────────────┐       │
│   │  QR Code     │       │
│   │  (150px)     │       │
│   └──────────────┘       │
└──────────────────────────┘
```
**Características:**
- Logo prominent (48px altura)
- Nome empresa visível
- Nome item em destaque
- QR Code grande (150px)
- Proporção 120×100mm

**Quando usar:**
- ✅ Projetores, amplificadores
- ✅ Equipamento AV standard
- ✅ Caixas de som, equipamento médio
- ✅ **Padrão recomendado**

---

### Shipping Label A6 (210×150mm)
**Uso:** Etiquetas de envio, paletes, transporte
```
┌─────────────────────────────┐
│  ┌────────────────────────┐ │
│  │   Logo Admin (Large)   │ │
│  │    (64px height)       │ │
│  └────────────────────────┘ │
│                             │
│        AV RENTALS           │
│                             │
│     EQUIPMENT NAME          │
│     SKU: ABC-123456         │
│                             │
│    ┌───────────────────┐    │
│    │   QR Code (200px) │    │
│    │   (High Quality)  │    │
│    └───────────────────┘    │
└─────────────────────────────┘
```
**Características:**
- Logo grande e prominent (64px altura)
- SKU visível (se disponível)
- QR Code em alta qualidade (200px)
- Proporção A6 (210×150mm)
- Espaçamento generoso

**Quando usar:**
- ✅ Paletes, envios
- ✅ Documentação de transporte
- ✅ Etiquetas externas grandes
- ✅ Áreas com bastante espaço

---

## 2️⃣ Print-Safe Mode (Automático)

Todos os templates têm **Print-Safe Mode ativado automaticamente** através de CSS `@media print`:

### Características:
```css
@media print {
  .equipment-label {
    background-color: #FFFFFF !important;    /* Fundo branco puro */
    color: #000000 !important;                /* Texto preto puro */
    border-color: #000000 !important;         /* Borda preta */
  }
}
```

### Garantias:
- ✅ Logo fica visível em preto e branco
- ✅ QR Code legível em impressoras térmicas
- ✅ Contraste máximo (WCAG AAA)
- ✅ Sem efeitos de sombra ou gradientes
- ✅ Compatível com impressoras de térmicas (Zebra, etc.)

### Modo Escuro (Dark Mode):
Mesmo em dark mode, a impressão sai sempre em **preto e branco puro** graças ao `@media print`.

---

## 3️⃣ Integração com Branding do Admin

### Logo do Admin
Obtém automaticamente a partir de `/api/customization`:
```typescript
const brandingConfig = useBrandingConfig();
// pdfLogoUrl, pdfCompanyName, etc.
```

### Sincronização em Tempo Real
- ✅ Polling automático a cada 30 segundos
- ✅ Evento `brandingUpdated` para updates instantâneos
- ✅ Logo atualiza nas labels sem refresh manual

### Configuração do Logo
Admin > PDF Branding > Upload Logo
- O logo aparece automaticamente em todos os templates
- Dimensões responsivas por template
- Fallback para texto se sem logo

---

## 4️⃣ Como Usar

### No InventoryLabelGenerator:

```tsx
// 1. Selecionar template
<Select value={labelTemplate} onValueChange={setLabelTemplate}>
  <SelectItem value="cable">Cable Tag (80×60mm)</SelectItem>
  <SelectItem value="small-case">Small Case (100×80mm)</SelectItem>
  <SelectItem value="flightcase">Flightcase (120×100mm)</SelectItem>
  <SelectItem value="shipping">Shipping Label A6 (210×150mm)</SelectItem>
</Select>

// 2. Renderizar label com template
<EquipmentLabel 
  item={item}
  companyName={companyName}
  template={labelTemplate}  // ← Template selecionado
  ref={labelRef}
/>

// 3. Download (automaticamente respeita dimensões do template)
const dataUrl = await htmlToImage.toJpeg(itemRef, { quality: 0.95 });
```

### Componente Direto:

```tsx
import { EquipmentLabel, type LabelTemplate } from '@/components/inventory/EquipmentLabel';

<EquipmentLabel 
  item={equipmentItem}
  companyName="AV Rentals"
  template="flightcase"
  ref={labelRef}
/>
```

---

## 5️⃣ Referência de Dimensões

| Template | Largura | Altura | DPI | Uso |
|----------|---------|--------|-----|-----|
| Cable | 80mm | 60mm | 96 | Cabos, conectores |
| Small Case | 100mm | 80mm | 96 | Cases pequenos |
| Flightcase | 120mm | 100mm | 96 | Standard (padrão) |
| Shipping | 210mm | 150mm | 96 | Envios, paletes |

### Conversão para Pixels (@ 96 DPI):
- 1mm = 3.78 pixels
- Cable: 302×227px
- Small Case: 378×302px
- Flightcase: 454×378px
- Shipping: 794×567px

---

## 6️⃣ Cenários de Uso Real

### Cenário 1: Impressão de Cabos XLR (50 unidades)
```
1. Abrir Label Generator
2. Filtrar: "XLR"
3. Selecionar: "Cable XLR (Qty: 50)"
4. Template: Selecionar "Cable Tag (80×60mm)"
5. Clicar: "Download 1"
6. Resultado: 1 etiqueta JPG 80×60mm otimizada para cabo
7. Imprimir: Usa template pequeno, economiza papel
```

### Cenário 2: Envio de Flightcases (5 caixas)
```
1. Abrir Label Generator
2. Selecionar: 5 flightcases (PRJ-4K, AMP-500W, etc.)
3. Template: Selecionar "Shipping Label A6 (210×150mm)"
4. Clicar: "Download 5"
5. Resultado: 5 etiquetas JPG em A6 com logo prominent
6. Imprimir: Grande, clara, com todas as informações
```

### Cenário 3: Equipamento Standard (20 itens)
```
1. Abrir Label Generator
2. Selecionar: 20 itens variados
3. Template: "Flightcase (120×100mm)" ← padrão
4. Clicar: "Download 20"
5. Resultado: 20 etiquetas balanced (não muito grandes, não muito pequenas)
6. Imprimir: Qualidade profissional, legível em todos os modos
```

---

## 7️⃣ Troubleshooting

### Logo não aparece na impressão
- ✅ Verificar em Admin > PDF Branding > Logo Upload
- ✅ Confirmar URL do logo é válida
- ✅ Aguardar 30 segundos (polling)

### QR Code fica distorcido
- ✅ Selecionar template maior (ex: Small Case em vez de Cable)
- ✅ Usar Shipping Label para máxima qualidade

### Impressora térmica não reconhece
- ✅ Usar Print-Safe Mode (automático)
- ✅ Ajustar DPI da impressora para 203 (Zebra)
- ✅ Verificar que fundo é branco puro

### Cores erradas na dark mode
- ✅ Impressão sempre força preto+branco (Print-Safe)
- ✅ Preview em browser pode estar em dark mode, mas print é correto

---

## 📊 Comparativo de Templates

```
┌─────────────────┬─────────┬──────────┬─────────────┬────────────┐
│ Template        │ Tamanho │ Logo     │ Caso de Uso │ Economia  │
├─────────────────┼─────────┼──────────┼─────────────┼────────────┤
│ Cable Tag       │ 80×60   │ Nenhum   │ Cabos       │ ⭐⭐⭐⭐⭐ │
│ Small Case      │ 100×80  │ Pequeno  │ Cases peq.  │ ⭐⭐⭐⭐  │
│ Flightcase      │ 120×100 │ Médio    │ Standard    │ ⭐⭐⭐    │
│ Shipping Label  │ 210×150 │ Grande   │ Envios      │ ⭐⭐     │
└─────────────────┴─────────┴──────────┴─────────────┴────────────┘
```

---

## 🚀 Funcionalidades Futuras

- [ ] Suporte para Code128/39 (além de QR Code)
- [ ] Rotação 90° para etiquetas verticais
- [ ] Múltiplos idiomas (i18n)
- [ ] Custom templates via Admin
- [ ] ZPL export para impressoras Zebra
- [ ] Batch PDF com múltiplas etiquetas por página

---

**Última atualização:** 16 Janeiro 2026  
**Versão:** 1.0  
**Status:** ✅ Production Ready
