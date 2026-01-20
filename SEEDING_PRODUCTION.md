# 🌱 SEEDING PARA PRODUÇÃO - Acrobaticz

**Data:** 2026-01-19  
**Ambiente:** Production vs Development

---

## 📋 RESUMO EXECUTIVO

O sistema de seeding do Acrobaticz é **idêntico** entre desenvolvimento e produção, com a diferença principal na **ativação automática**:

| Configuração | Dev | Prod | Observação |
|---|---|---|---|
| Arquivo seed | `src/scripts/seed.ts` | `src/scripts/seed.ts` | ✅ Mesmo arquivo |
| Função | Seed CATALOG_65_PRODUTOS | Seed CATALOG_65_PRODUTOS | ✅ Mesma lógica |
| Ativação | `SEED_ON_START=true` (default) | ❌ NÃO ativado | Seed manual em produção |

---

## 🔍 CONFIGURAÇÃO ATUAL

### **DEVELOPMENT (docker-compose.dev.yml)**

```yaml
environment:
  SEED_ON_START: ${SEED_ON_START:-true}      # ✅ Ativado por padrão
  FORCE_SEED: ${FORCE_SEED:-false}           # Força seed mesmo se DB tiver dados
  SEED_CLEAN: ${SEED_CLEAN:-false}           # Limpa DB antes do seed
  SEED_VERBOSE: ${SEED_VERBOSE:-true}        # Saída detalhada
```

### **PRODUCTION (docker-compose.yml)**

```yaml
# ❌ SEED_ON_START NÃO está configurado
# Isso significa: SEED_ON_START = false (padrão)
```

---

## 🚀 COMO FAZER SEED EM PRODUÇÃO

### **Opção 1: Seed via CLI (Recomendado)**

```bash
# Dentro do container de produção
docker exec acrobaticz-app npm run db:seed

# Ou com opções
docker exec acrobaticz-app npm run db:seed -- --verbose
docker exec acrobaticz-app npm run db:seed -- --clean    # Limpa antes
docker exec acrobaticz-app npm run db:seed -- --dry-run  # Simula sem aplicar
```

### **Opção 2: Habilitar Auto-Seed no docker-compose.yml**

Editar `docker-compose.yml` para adicionar SEED_ON_START:

```yaml
app:
  environment:
    # ... outras variáveis ...
    SEED_ON_START: "true"          # ✅ Ativa seeding automático
    SEED_CLEAN: "false"            # Não limpa dados existentes
    SEED_VERBOSE: "true"           # Mostra progresso
```

Depois:
```bash
docker-compose up --build
```

### **Opção 3: Via Setup Wizard

Se a aplicação estiver rodando:
```
Acesse: https://acrobaticz.duckdns.org/install
→ Passo 4: "Import Catalog"
→ Marcar "Sim, importar catálogo"
```

---

## 📊 COMPARAÇÃO: DEV vs PROD

| Aspecto | Development | Production |
|---|---|---|
| **Arquivo** | `docker-compose.dev.yml` | `docker-compose.yml` |
| **SEED_ON_START** | `true` (padrão) | ❌ Não configurado |
| **Auto-seed startup** | ✅ Sim | ❌ Não |
| **Seed manual** | `npm run db:seed` | `docker exec acrobaticz-app npm run db:seed` |
| **Dados** | CATALOG_65_PRODUTOS | CATALOG_65_PRODUTOS |
| **Arquivo dados** | `src/scripts/seed.ts` | `src/scripts/seed.ts` |

---

## 🔧 DADOS QUE SÃO SEEDADOS

Arquivo: `src/scripts/seed.ts`  
Fonte: `CATALOG_65_PRODUTOS/`

### **Estrutura de Dados:**

```
✅ 3 Users (Admin, Manager, Technician)
✅ 1 Client (VRD Production)
✅ 1 Partner (VRD Production)
✅ 6 Categories (Lighting, Audio, Power, Video, Staging, Others)
✅ 21 Subcategories
✅ 65 Products com preços em EUR (€)
✅ 77 Product Images → public/images/
✅ Platform Logos → public/logos/
```

### **Conversão de Preços:**

O seed.ts converte os preços para **centavos** (cents):

```typescript
const dailyRate = Math.max(0, Math.round((product.price || 0) * 100));
// Exemplo: €40.00 → 4000 centavos no banco
```

---

## 🎯 CHECKLIST PARA PRODUÇÃO

- [ ] **Verificar arquivo**: `CATALOG_65_PRODUTOS/CATALOGO_65_PRODUTOS.md`
- [ ] **Corrigir Produto #57**: Mudar `€0.00` para valor apropriado
- [ ] **Executar seed**: `docker exec acrobaticz-app npm run db:seed -- --verbose`
- [ ] **Validar dados**: Verificar preços no banco de dados
- [ ] **Testar**: Acessar `/install` e verificar produtos
- [ ] **Backup**: Fazer backup antes de `SEED_CLEAN`

---

## ⚠️ AVISOS IMPORTANTES

### **🔴 CRÍTICO: Produto #57**
- Nome: "Custom 32A Power Distributor"
- Preço atual: **€0.00** ❌
- **Ação:** Corrigir para um preço apropriado antes do seed

### **🟡 IMPORTANTE:**
- `SEED_CLEAN: true` **APAGA todos os dados existentes**
- Use com cuidado em produção!
- Sempre fazer backup antes

### **🟢 RECOMENDAÇÕES:**
- Usar `SEED_ON_START: false` em produção (mais seguro)
- Executar seed manualmente quando necessário
- Manter logs de seeding para auditoria

---

## 📝 ARQUIVO DO SEED

**Localização:** `src/scripts/seed.ts`

**Principais funções:**
- `seedUsers()` - Cria usuários padrão
- `seedClients()` - Importa clientes de USERS_CLIENTS_PARTNERS.json
- `seedPartners()` - Importa parceiros
- `seedCategories()` - Importa categorias de SUPPLEMENTARY_DATA.json
- `seedSubcategories()` - Importa subcategorias
- `seedProducts()` - **Extrai preços de CATALOGO_65_PRODUTOS.md**
- `copyAssets()` - Copia imagens e logos para `public/`

**Fonte de dados:**
```
CATALOG_65_PRODUTOS/
├── CATALOGO_65_PRODUTOS.md          ← 65 produtos com preços em €
├── SUPPLEMENTARY_DATA.json          ← Categorias e subcategorias
├── USERS_CLIENTS_PARTNERS.json      ← Usuários, clientes, parceiros
├── images/                          ← 77 imagens de equipamentos
└── logos/                           ← Logos da plataforma
```

---

## 🚨 PRÓXIMOS PASSOS

1. **Corrigir Produto #57** (Custom 32A Power Distributor)
   - Arquivo: `CATALOG_65_PRODUTOS/CATALOGO_65_PRODUTOS.md`
   - Mudar `€0.00` para `€XX.XX`

2. **Executar seed em produção:**
   ```bash
   docker exec acrobaticz-app npm run db:seed -- --verbose
   ```

3. **Validar:**
   ```sql
   SELECT name, "dailyRate", quantity FROM "Product" WHERE name LIKE '%Custom 32A%';
   ```

4. **Monitorar logs:**
   ```bash
   docker logs acrobaticz-app --tail=100 | grep -i seed
   ```

---

## 📚 Referências

- Seed Script: [src/scripts/seed.ts](src/scripts/seed.ts)
- Catálogo: [CATALOG_65_PRODUTOS/](CATALOG_65_PRODUTOS/)
- Ambiente Dev: [docker-compose.dev.yml](docker-compose.dev.yml#L188-L194)
- Ambiente Prod: [docker-compose.yml](docker-compose.yml)
- Configuração: [env.production](env.production)
