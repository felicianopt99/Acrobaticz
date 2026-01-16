# 📋 DADOS DE SEEDING - AV-RENTALS

**Última Atualização:** 2026-01-15  
**Propósito:** Verificação rápida dos dados que vão para a base de dados  
**Status:** ✅ PRONTO PARA PRODUÇÃO

---

## 🚀 COMO EXECUTAR O SEEDING

### Via Terminal (CLI)
```bash
# Seed básico (modo upsert - não apaga dados existentes)
npm run db:seed

# Limpar BD primeiro, depois seed
npm run db:seed -- --clean

# Ver o que seria inserido (sem alterações)
npm run db:seed -- --dry-run

# Output detalhado
npm run db:seed -- --verbose
```

### Via Setup Wizard
1. Aceder a `/install`
2. Completar os passos de configuração
3. No passo "Import Catalog", marcar "Sim, importar catálogo"
4. O seeding corre automaticamente

---

## � ESTRUTURA DE FICHEIROS

```
CATALOG_65_PRODUTOS/
├── CATALOGO_65_PRODUTOS.md      # 65 produtos com descrições PT/EN
├── SUPPLEMENTARY_DATA.json      # 6 categorias + 21 subcategorias  
├── USERS_CLIENTS_PARTNERS.json  # 3 users + 1 cliente + 1 parceiro
├── SEED_DATA_OVERVIEW.md        # Este ficheiro
├── images/                      # 76 imagens de produtos
│   └── equipment-*.jpg/png/webp
└── logos/
    ├── platform/               # Logos da plataforma
    │   ├── favicon.ico
    │   ├── icon-192.png
    │   └── icon-512.png
    └── partners/               # (vazio - pendente)
```

### Scripts Relacionados
- `scripts/seed.ts` - Script CLI principal
- `src/scripts/catalog-seed-complete.ts` - Serviço usado pelo wizard

---

## �👤 UTILIZADORES (3)

| Nome | Username | Role | Email | Status |
|------|----------|------|-------|--------|
| Feliciano | feliciano | admin | feliciano@acrobaticz.pt | ✅ active |
| João | joao | technician | joao@acrobaticz.pt | ✅ active |
| Lourenço | lourenco | manager | lourenco@acrobaticz.pt | ✅ active |

### Permissões por Role:
- **Admin:** manage_users, full_inventory_access, create_categories, generate_reports, system_configuration, manage_backups, manage_partners
- **Manager:** manage_inventory, process_requests, generate_proposals, communicate_with_clients, track_deliveries, generate_basic_reports
- **Technician:** view_catalog, manage_equipment_status, register_maintenance, report_damage, communicate_with_clients

---

## 🏢 CLIENTES (1)

| Nome | Empresa | Email | Telefone | Website | Localização |
|------|---------|-------|----------|---------|-------------|
| Rey Davis | VRD Production | hello@vrd.productions | +351 969 774 999 | https://vrd.productions | Lisboa, Portugal |

**Tipo:** agency  
**Acesso a Produtos:** 65 (100%)  
**Especialidades:** eventos corporativos, produções audiovisuais, festivais, conferências, casamentos e eventos sociais

---

## 🤝 PARCEIROS (1)

| Nome | Tipo | Contacto | Status |
|------|------|----------|--------|
| VRD Production | event_agency | hello@vrd.productions | ✅ active |

---

## 📁 CATEGORIAS (6)

| # | Categoria | ID |
|---|-----------|-----|
| 1 | **Audio and Sound** | cmk1e0n260004tb4g37154d95 |
| 2 | **Lighting** | cmk1e0n230003tb4gtbayc9jd |
| 3 | **Power** | cmk2xt5s50023cw5g2242d74c |
| 4 | **Staging and Structures** | cmk2yg76g002xcw5gs5phwj4g |
| 5 | **Video** | cmk2u2ind000ccw5gwp8sjln3 |
| 6 | **Others** | cmk2yahn1002mcw5gvbcgkszj |

---

## 📂 SUBCATEGORIAS (21)

### Audio and Sound (10)
| Subcategoria | ID |
|--------------|-----|
| Audio Recorder and Player | cmk2zsbnb004rcw5gpo2fybt8 |
| Battery Speakers | cmk1e0n5m001etb4gstw7s39f |
| DJ Equipment | cmk2yn0840039cw5gavgf2wsn |
| Microphones | cmk1e0n5v001itb4g5o2ie47u |
| Mixing Consoles | cmk2wxsub001fcw5gcpkpmxpz |
| Speakers | cmk1e0n4j000ytb4gz5y21ntw |
| Stage & Touring Gear | cmk2ubkmf000pcw5g90hz31lj |

### Lighting (8)
| Subcategoria | ID |
|--------------|-----|
| Battery | cmk1e0n3f000mtb4g4wo3p1kw |
| Decorative Lighting | cmk1e0n44000stb4gyw8a3jx9 |
| Effects | cmk1ra3xh000qtjeh69nb1iod |
| Follow Spots | cmk2xpun6001ycw5gbbd6i2bz |
| LED Par | cmk1e0n2w000etb4gowy0l9bi |
| Lighting Control | cmk2zfbje0047cw5gihy6kc4h |
| Moving Head | cmk1e0n2a0006tb4gfvum37v3 |
| Stage Platforms & Risers | cmk2yguod002zcw5gazl94gfi |

### Power (2)
| Subcategoria | ID |
|--------------|-----|
| Cabling & Distribution | cmk2xxaci0025cw5gl37pa6cl |
| Power Distribution | cmk3062bl005fcw5g359snsxf |

### Staging and Structures (2)
| Subcategoria | ID |
|--------------|-----|
| Cable Management & Safety | cmk2zm9g4004hcw5g0hmjrt3d |
| Trussing and Support | cmk2zuebl004xcw5gs501q7p4 |

### Video (1)
| Subcategoria | ID |
|--------------|-----|
| Projector | cmk2u2qjj000ecw5gonqu3cu9 |

### Others (1)
| Subcategoria | ID |
|--------------|-----|
| Fans and ventilation | cmk2yav4d002ocw5g7jyebitz |

---

## 📦 PRODUTOS (65)

### Resumo por Categoria

| Categoria | Qtd Produtos |
|-----------|--------------|
| Audio and Sound | 30 |
| Lighting | 23 |
| Power | 4 |
| Staging and Structures | 6 |
| Video | 1 |
| Others | 1 |
| **TOTAL** | **65** |

---

### 🔊 Audio and Sound (30 produtos)

| # | Produto | €/dia | Qtd | Status |
|---|---------|-------|-----|--------|
| 1 | Zoom H5 Handy Recorder | €40 | 1 | good |
| 2 | Electro-Voice EVERSE 8 (White) | €100 | 2 | good |
| 3 | Allen & Heath Xone:92 Limited Edition | €120 | 1 | good |
| 4 | Allen and Heath Xone:23 | €50 | 1 | good |
| 5 | Pioneer DJ CDJ-3000 | €100 | 4 | good |
| 6 | Pioneer DJ DJM-V10-LF | €150 | 1 | good |
| 7 | Pioneer DJ XDJ-RX3 | €100 | 1 | good |
| 8 | Technics SL-1200 MK2 | €60 | 2 | good |
| 9 | Traktor Kontrol Z1 | €35 | 1 | good |
| 10 | Sennheiser EW-D Pro Digital Wireless | €60 | 2 | good |
| 11 | Sennheiser HT 747 Headset Mic | €25 | 2 | good |
| 12 | Sennheiser XSW 2-835 | €40 | 2 | good |
| 13 | Sennheiser e 604 (3-Pack) | €20 | 3 | good |
| 14 | Shure Beta 52A | €20 | 1 | good |
| 15 | Shure SM57 LC | €8 | 2 | good |
| 16 | Shure SM58 | €8 | 3 | good |
| 17 | sE Electronics sE8 Stereo Set | €30 | 1 | good |
| 18 | Allen & Heath CQ-18T | €85 | 0 | good |
| 19 | Yamaha MG16XU | €40 | 1 | good |
| 20 | ADAM Audio A7X | €50 | 2 | good |
| 21 | HK Audio Linear 5 MKII 112 XA | €70 | 2 | good |
| 22 | HK Audio Linear 5 MKII 118 Sub | €150 | 6 | good |
| 23 | HK Audio Linear 5 MKII 308 LTA | €100 | 4 | good |
| 24 | Mackie Thump 118S | €100 | 2 | good |
| 25 | Mackie Thump 212 | €60 | 4 | good |
| 26 | Mackie Thump 215 | €75 | 2 | good |
| 27 | dB Technologies ES 802 | €150 | 3 | good |
| 28 | Albrecht Tectalk Worker 3 (4-Way) | €25 | 1 | good |
| 29 | BSS Audio AR133 | €15 | 9 | good |
| 30 | Sennheiser ew IEM G4 Twin | €75 | 2 | good |

---

### 💡 Lighting (23 produtos)

| # | Produto | €/dia | Qtd | Status |
|---|---------|-------|-----|--------|
| 1 | Ape Labs Neon Tube | €25 | 6 | good |
| 2 | Chauvet DJ EZpin Zoom Pack | €65 | 1 | good |
| 3 | FOS Luminus PRO IP | €15 | 8 | good |
| 4 | Varytec VP-m20 Mobile Video BiLight | €15 | 2 | good |
| 5 | Varytec bat.PAR V2 RGBWW | €15 | 9 | good |
| 6 | FOS Retro | €40 | 2 | good |
| 7 | Varytec Retro Blinder TRI 180 | €45 | 2 | good |
| 8 | Deluxe Bubble Machine | €15 | 1 | good |
| 9 | Eurolite RF-300 Radial Wind Machine | €15 | 1 | good |
| 10 | Showtec 50cm Mirrorball | €25 | 1 | good |
| 11 | Stairville AFH-600 DMX Hazer | €35 | 2 | good |
| 12 | Stairville FS-x150 LED Follow Spot | €45 | 1 | good |
| 13 | FOS F-7 | €35 | 4 | good |
| 14 | FOS PAR ZOOM ULTRA | €35 | 8 | good |
| 15 | FOS Par 18x10WPRO IP65 | €25 | 8 | good |
| 16 | Stairville LED BossFX-1 Pro Bundle | €45 | 1 | good |
| 17 | ChamSys MagicDMX Full | €50 | 2 | good |
| 18 | ChamSys MagicQ Compact Connect | €250 | 1 | good |
| 19 | FOS ACL LINE 12 | €45 | 6 | good |
| 20 | FOS Q19 Ultra | €75 | 4 | good |
| 21 | FOS TITAN BEAM 230W | €55 | 2 | good |
| 22 | Mini LED Moving Head Spot 25W | €15 | 2 | good |
| 23 | Stairville Tour Stage Platform 2x1m | €25 | 12 | good |

---

### ⚡ Power (4 produtos)

| # | Produto | €/dia | Qtd | Status |
|---|---------|-------|-----|--------|
| 1 | Extension Cable CEE 32A 5-Pin 50m | €20 | 2 | good |
| 2 | Botex Power Splitter 32A | €20 | 1 | good |
| 3 | Custom 32A Power Distributor | €0 | 0 | good |
| 4 | PCE Merz M-SVE3 63/121-9 | €50 | 1 | good |

---

### 🏗️ Staging and Structures (6 produtos)

| # | Produto | €/dia | Qtd | Status |
|---|---------|-------|-----|--------|
| 1 | Stageworx Cable Bridge 1S | €8 | 12 | good |
| 2 | Stageworx Cable Bridge 2MC | €10 | 12 | good |
| 3 | Global Truss CC50403 Base Plate 600mm | €15 | 4 | good |
| 4 | Global Truss 27195 Baseplate 80x80cm | €10 | 2 | good |
| 5 | Global Truss F34200-B 2.0m Black | €25 | 6 | good |
| 6 | Global Truss F34C21-B 90° Corner | €15 | 2 | good |

---

### 📽️ Video (1 produto)

| # | Produto | €/dia | Qtd | Status |
|---|---------|-------|-----|--------|
| 1 | Epson EB-L530U 5200 Lumens Laser | €250 | 1 | good |

---

### 🔧 Others (1 produto)

| # | Produto | €/dia | Qtd | Status |
|---|---------|-------|-----|--------|
| 1 | Equation 330W Industrial Floor Fan | €20 | 1 | good |

---

## 🖼️ IMAGENS E LOGOS

### Imagens de Produtos
- **Total:** 76 ficheiros
- **Localização:** `CATALOG_65_PRODUTOS/images/`
- **Formatos:** JPG, PNG, WebP

### Logos da Plataforma
| Ficheiro | Resolução | Uso |
|----------|-----------|-----|
| favicon.ico | 16x16 | Browser tabs |
| icon-192.png | 192x192 | Mobile shortcuts |
| icon-512.png | 512x512 | Splash screen |

### Logos de Parceiros
- `rey-davis.png` - ⚠️ **A OBTER** (pasta vazia)

---

## 🎨 PALETA DE CORES

| Cor | Hex |
|-----|-----|
| Primary | #667eea |
| Secondary | #764ba2 |
| Success | #10B981 |
| Warning | #F59E0B |
| Error | #EF4444 |
| Neutral | #6B7280 |

---

## ✅ CHECKLIST DE VERIFICAÇÃO

### Dados Base
- [ ] 3 Utilizadores (admin, manager, technician)
- [ ] 1 Cliente (VRD Production)
- [ ] 1 Parceiro (VRD Production)
- [ ] 6 Categorias
- [ ] 21 Subcategorias

### Produtos por Categoria
- [ ] Audio and Sound: 30 produtos
- [ ] Lighting: 23 produtos
- [ ] Power: 4 produtos
- [ ] Staging and Structures: 6 produtos
- [ ] Video: 1 produto
- [ ] Others: 1 produto
- [ ] **TOTAL: 65 produtos**

### Assets
- [ ] 76 Imagens de produtos
- [ ] 3 Logos da plataforma
- [ ] Logo do parceiro (pendente)

---

## ⚠️ NOTAS IMPORTANTES

1. **Allen & Heath CQ-18T** tem quantidade 0 (disponibilidade)
2. **Custom 32A Power Distributor** tem preço €0 e quantidade 0
3. **Logo do parceiro VRD** está pendente de upload
4. Todas as localizações são "Warehouse A" ou "Warehouse B"
5. Todos os produtos têm status "good"

---

*Ficheiro gerado automaticamente para verificação de dados de seeding*
