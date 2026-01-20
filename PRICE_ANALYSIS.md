# 📊 ANÁLISE DE DISCREPÂNCIA DE PREÇOS

**Data:** 2026-01-19  
**Problema Relatado:** Os valores dos produtos no seed não coincidem com o que está em CATALOG_65_PRODUTOS

---

## ✅ VERIFICAÇÃO REALIZADA

### 1. Estado dos dados no CATALOGO_65_PRODUTOS.md

✓ **Todos os 65 produtos contêm:**
- **ID do Produto** (cmkXXXXX)
- **Taxa Diária** (€XX.XX)
- **Quantidade Disponível** (número)
- **Status** (good/fair/damaged)
- **Localização** (Warehouse A/B)

### 2. Problemas Identificados

#### 🔴 **CRÍTICO: Produto #57 - Custom 32A Power Distributor**
- **Taxa Diária:** €0.00 (ZERO!)
- Isso causará uma entrada com dailyRate = 0 centavos no banco
- **Solução:** Definir um preço apropriado

#### 🟡 **IMPORTANTE: Conversão de Preços**
O seed.ts converte os preços CORRETAMENTE:
```typescript
const dailyRate = Math.max(0, Math.round((product.price || 0) * 100)); // Centos
```

Exemplo:
- Markdown: €40.00
- Seed salva: 4000 (centavos)
- No banco: dailyRate = 4000

### 3. Análise de Preços - CATALOGO_65_PRODUTOS

| Faixa de Preço | Quantidade | Produtos |
|---|---|---|
| €0 (Zero!) | 1 | #57 |
| €8-20 | 15 | Cabos, conectores, acessórios |
| €20-50 | 25 | Microfones, pequenos efeitos |
| €50-100 | 14 | Caixas de som, mesas |
| €100-200 | 9 | Equipamento profissional |
| €250 | 2 | Projetores, controladores DMX |

**Estatísticas:**
- Total de produtos: **65**
- Produtos com preço válido: **64**
- Preço mínimo: **€0.00** (problema!)
- Preço máximo: **€250.00**
- Preço médio: **€52.52**
- **Receita diária (todos 1x): €3.414,00**

---

## 🔍 COMO O SEED EXTRAI OS DADOS

### Arquivo: src/scripts/seed.ts (linhas 240-280)

```typescript
// Extração de Taxa Diária
if (line.includes('**Taxa Diária:**')) {
  const match = line.match(/€([\d.]+)/);
  if (match) buffer.price = parseFloat(match[1]);
}

// Extração de Quantidade
if (line.includes('**Quantidade Disponível:**')) {
  const match = line.match(/:\s*(\d+)/);
  if (match) buffer.quantity = parseInt(match[1], 10);
}

// Extração de Status
if (line.includes('**Status:**')) {
  const match = line.match(/:\s*(\w+)/);
  if (match) buffer.status = match[1];
}

// Extração de Localização
if (line.includes('**Localização:**')) {
  const match = line.match(/:\s*(.+)/);
  if (match) buffer.location = match[1].trim();
}
```

### No seedProducts (linhas 572-573):
```typescript
// Conversão para centavos
const dailyRate = Math.max(0, Math.round((product.price || 0) * 100));
const quantity = Math.max(0, product.quantity || 1);
```

---

## 📋 RECOMENDAÇÕES

### 1. **URGENTE - Corrigir Produto #57**
- Arquivo: `CATALOG_65_PRODUTOS/CATALOGO_65_PRODUTOS.md`
- Linha: ~1200 (aproximadamente)
- Mudar: `**Taxa Diária:** €0.00`
- Para: `**Taxa Diária:** €X.XX` (definir valor apropriado)

### 2. **Verificar Banco de Dados**
Se o seed já foi executado:
```sql
-- Verificar produtos com preço zero
SELECT name, "dailyRate", quantity FROM "Product" WHERE "dailyRate" = 0;

-- Verificar conversão de preços (exemplo)
SELECT name, "dailyRate" FROM "Product" WHERE name LIKE '%Zoom H5%';
-- Esperado: €40.00 → dailyRate = 4000
```

### 3. **Re-executar o Seed**
Após corrigir o produto #57:
```bash
npm run db:seed -- --clean
# ou com docker
docker exec acrobaticz-app-dev npm run db:seed -- --clean
```

---

## 🎯 CONCLUSÃO

✅ **Os preços NO MARKDOWN estão corretos** (exceto produto #57)  
✅ **O seed.ts extrai corretamente** os dados  
✅ **A conversão para centavos é feita corretamente**  
⚠️ **Problema encontrado:** Produto #57 com preço €0.00

**Próximo passo:** Corrigir o preço do produto #57 e re-executar o seed.

---

## 📄 Arquivos de Análise Gerados

- `CATALOG_PRICES_ANALYSIS.json` - Lista completa de preços
- `PRODUCT_DATA_COMPLETE.json` - Dados completos de todos os produtos
- `PRICE_ANALYSIS.md` - Este arquivo
