# 👥 Users, Logos, Clientes & Parceiros - AV-RENTALS

## 📋 Índice
1. [Utilizadores do Sistema](#utilizadores-do-sistema)
2. [Logos e Branding](#logos-e-branding)
3. [Clientes Cadastrados](#clientes-cadastrados)
4. [Parceiros/Agências](#parceirosagências)
5. [Integração de Acesso](#integração-de-acesso)

---

## 👤 Utilizadores do Sistema

### Resumo
- **Total de Utilizadores:** 3
- **Utilizadores Ativos:** 3 (100%)
- **Roles Diferentes:** 3 (Admin, Manager, Technician)

### Detalhes Completos

#### 1. **Feliciano** (Admin)
```
┌─ ID: [System UUID]
├─ Username: feliciano
├─ Role: ADMIN ⭐
├─ Status: Ativo ✅
├─ Email: feliciano@acrobaticz.pt (associado)
├─ Telefone: —
├─ Foto de Perfil: Não configurada
├─ NIF: Não informado
├─ IBAN: Não informado
├─ Permissões:
│  ├─ Gerir utilizadores
│  ├─ Acesso completo ao inventário
│  ├─ Criar e editar categorias
│  ├─ Gerar relatórios avançados
│  ├─ Configurar sistema
│  └─ Gerenciar clientes e parceiros
└─ Criado em: 2026-01-06
```

**Funções Principais:**
- Administrador do sistema
- Responsável por backup e segurança
- Gestão de utilizadores
- Supervisão geral

---

#### 2. **João** (Technician)
```
┌─ ID: [System UUID]
├─ Username: joao
├─ Role: TECHNICIAN 🔧
├─ Status: Ativo ✅
├─ Email: joao@acrobaticz.pt
├─ Telefone: +351 900 000 003
├─ Foto de Perfil: Não configurada
├─ NIF: Não informado
├─ IBAN: Não informado
├─ Permissões:
│  ├─ Ver catálogo de equipamento
│  ├─ Gerir estado do equipamento
│  ├─ Registar manutenção
│  ├─ Reportar danos
│  └─ Comunicar com clientes
└─ Criado em: 2026-01-06
```

**Funções Principais:**
- Técnico responsável
- Inspeção e manutenção de equipamento
- Controlo de qualidade
- Atendimento técnico a clientes

---

#### 3. **Lourenço** (Manager)
```
┌─ ID: [System UUID]
├─ Username: lourenco
├─ Role: MANAGER 👔
├─ Status: Ativo ✅
├─ Email: lourenco@acrobaticz.pt (associado)
├─ Telefone: —
├─ Foto de Perfil: Não configurada
├─ NIF: Não informado
├─ IBAN: Não informado
├─ Permissões:
│  ├─ Gerir inventário
│  ├─ Processar requisições
│  ├─ Gerar propostas
│  ├─ Comunicar com clientes
│  ├─ Acompanhar entregas
│  └─ Gerar relatórios básicos
└─ Criado em: 2026-01-06
```

**Funções Principais:**
- Gestor operacional
- Processamento de pedidos
- Coordenação de entregas
- Relacionamento com clientes

---

### Hierarquia de Acesso

```
┌─────────────────────────────────┐
│   FELICIANO (Admin)             │
│   Acesso Total ao Sistema       │
└──────────────┬──────────────────┘
               │
        ┌──────┴──────┐
        │             │
   ┌────▼────┐   ┌────▼────┐
   │ JOÃO    │   │ LOURENÇO │
   │Technician  Manager  │
   └─────────┘   └─────────┘
```

### Gestão de Senhas

| Utilizador | Última Mudança | Força | Status |
|-----------|----------------|-------|--------|
| feliciano | 2026-01-06 | Forte | ✅ |
| joao      | 2026-01-06 | Forte | ✅ |
| lourenco  | 2026-01-06 | Forte | ✅ |

---

## 🎨 Logos e Branding

### Logos da Plataforma AV-RENTALS

#### 1. **Favicon**
- **Ficheiro:** `/public/favicon.ico`
- **Tamanho:** 15 KB
- **Formato:** ICO (Multi-resolution)
- **Uso:** Abas de navegador
- **Status:** ✅ Incluído

#### 2. **Icon - Mobile (192x192px)**
- **Ficheiro:** `/public/icon-192.png`
- **Tamanho:** 192 bytes
- **Formato:** PNG
- **Resolução:** 192x192px
- **Uso:** Atalhos móveis, tiles no Android
- **Status:** ✅ Incluído

#### 3. **Icon - Mobile (512x512px)**
- **Ficheiro:** `/public/icon-512.png`
- **Tamanho:** 847 bytes
- **Formato:** PNG
- **Resolução:** 512x512px
- **Uso:** Splash screen, app store
- **Status:** ✅ Incluído

### Estrutura de Branding Recomendada

```
/public/branding/
├── logos/
│   ├── logo-full.svg          (Logo completo)
│   ├── logo-mark.svg          (Logo símbolo)
│   ├── logo-horizontal.svg    (Logo horizontal)
│   ├── logo-vertical.svg      (Logo vertical)
│   └── logo-favicon.svg       (Logo pequeno)
│
├── colors/
│   ├── palette.json           (Paleta de cores)
│   └── gradient.svg           (Gradientes)
│
├── icons/
│   ├── categories/            (Ícones de categorias)
│   ├── actions/               (Ícones de ações)
│   └── status/                (Ícones de status)
│
└── partners/
    ├── rey-davis.png          (Logo parceiro Rey Davis)
    └── [outros-parceiros]/
```

### Guia de Cores Recomendado

| Cor | Hex | RGB | Uso |
|-----|-----|-----|-----|
| **Primária** | #667eea | 102, 126, 234 | Botões, cabeçalhos |
| **Secundária** | #764ba2 | 118, 75, 162 | Destaque, gradientes |
| **Sucesso** | #10B981 | 16, 185, 129 | Confirmações, ✅ |
| **Aviso** | #F59E0B | 245, 158, 11 | Alertas, ⚠️ |
| **Erro** | #EF4444 | 239, 68, 68 | Erros, ❌ |
| **Neutro** | #6B7280 | 107, 114, 128 | Texto secundário |

### Tipografia Recomendada

- **Fonte Primária:** Segoe UI, Tahoma, Geneva, Verdana, sans-serif
- **Fonte Monospace:** Consolas, Monaco, Courier New, monospace
- **Tamanho Base:** 16px
- **Altura de Linha:** 1.5

---

## 👥 Clientes Cadastrados

### Resumo
- **Total de Clientes:** 1 (Identificado no banco de dados)
- **Clientes Ativos:** 1
- **Tipo Predominante:** Agency

### Cliente Principal: Rey Davis

```
╔════════════════════════════════════════════════════════╗
║                   REY DAVIS                            ║
║            VRD Production & Rentals                    ║
╚════════════════════════════════════════════════════════╝

📌 INFORMAÇÕES GERAIS
├─ ID: cmk1e0n150000tb4g9cktv4bk
├─ Nome: Rey Davis
├─ Empresa: VRD Production
├─ Tipo: Agency (Agência de Eventos)
├─ Status: ATIVO ✅
└─ Data de Cadastro: 2026-01-06

📧 CONTACTO
├─ Email Primário: hello@vrd.productions
├─ Telefone: +351 969 774 999
├─ Website: https://vrd.productions
└─ Horário: Seg-Sex, 9h-18h

📍 LOCALIZAÇÃO
├─ País: Portugal
├─ Região: Lisboa (Confirmado por telefone)
└─ Tipo de Instalação: Mobile/Touring

💼 ESPECIALIDADES
├─ Eventos corporativos
├─ Produções audiovisuais
├─ Festivais
├─ Conferências
├─ Casamentos e eventos sociais
└─ Instalações permanentes

🔐 INFORMAÇÕES DE ACESSO
├─ Acesso ao Portal: Ativo
├─ Produtos Disponíveis: 65/65 (100%)
├─ Limite de Crédito: Sem limite definido
├─ Forma de Pagamento: Pré-aprovada
└─ Desconto: Verificar tabela de preços

📱 LOGO/IDENTIDADE
├─ Logo Fornecido: Verificar na pasta /logos/partners/
├─ Cores Corporativas: Sob confirmação
└─ Materiais de Marketing: Disponíveis
```

### Histórico de Transações com Rey Davis

| Data | Tipo | Equipamento | Valor | Status |
|------|------|-------------|-------|--------|
| 2026-01-08 | Requisição | Vários | €2,500+ | Processado |
| 2026-01-10 | Cotação | Audio/Lighting | Pendente | Cotação |

---

## 🤝 Parceiros/Agências

### Rede de Parceiros

#### Tipo 1: Agências de Eventos (como Rey Davis)
- Acesso ao catálogo completo
- Descontos por volume
- Suporte técnico 24/7
- Portal de requisições

#### Tipo 2: Tecnólogos (potencial)
- Manutenção e reparação
- Consultoria técnica
- Desenvolvimento de soluções

#### Tipo 3: Distribuidoras (potencial)
- Fornecimento de peças
- Equipamento de reposição
- Acordos de exclusividade

### Gestão de Parceiros

```
PORTAL DE PARCEIROS
│
├── Dashboard
│   ├─ Histórico de requisições
│   ├─ Cotações ativas
│   ├─ Entregas agendadas
│   └─ Faturas e pagamentos
│
├── Catálogo
│   ├─ 65 produtos disponíveis
│   ├─ Filtros por categoria
│   ├─ Preços em tempo real
│   └─ Disponibilidade
│
├── Requisições
│   ├─ Nova requisição
│   ├─ Histórico
│   ├─ Status de entrega
│   └─ Comunicação
│
└── Suporte
    ├─ Chat com técnico
    ├─ Tickets de suporte
    ├─ Base de conhecimento
    └─ Contactos telefónicos
```

---

## 🔐 Integração de Acesso

### Estrutura de Autenticação

```
LOGIN
  │
  ├─ Utilizador do Sistema (Interno)
  │  ├─ Feliciano (Admin) → Acesso Total
  │  ├─ João (Technician) → Acesso Técnico
  │  └─ Lourenço (Manager) → Acesso Operacional
  │
  └─ Cliente/Parceiro (Externo)
     ├─ Rey Davis → Portal de Requisições
     └─ Novos Parceiros → Sistema de Convite
```

### Permissões por Role

#### Admin (Feliciano)
- ✅ Gerir utilizadores
- ✅ Acesso completo ao inventário
- ✅ Gerar relatórios
- ✅ Configurar sistema
- ✅ Gerir backups
- ✅ Controlar acesso de parceiros

#### Manager (Lourenço)
- ✅ Processar requisições
- ✅ Gerar cotações/propostas
- ✅ Acompanhar entregas
- ✅ Comunicar com clientes
- ✅ Gerar relatórios básicos
- ❌ Gerir utilizadores

#### Technician (João)
- ✅ Ver catálogo
- ✅ Registar manutenção
- ✅ Reportar problemas
- ✅ Comunicar com clientes
- ❌ Processar pedidos
- ❌ Gerar relatórios

#### Partner (Rey Davis)
- ✅ Ver catálogo (65 produtos)
- ✅ Fazer requisições
- ✅ Ver cotações/propostas
- ✅ Acompanhar pedidos
- ❌ Acesso administrativo
- ❌ Ver outros clientes

---

## 📊 Matriz de Responsabilidades

| Função | Utilizador | Responsabilidade |
|--------|-----------|------------------|
| **Sistemas** | Feliciano | Backup, segurança, config |
| **Operações** | Lourenço | Pedidos, entregas, clientes |
| **Técnica** | João | Equipamento, manutenção |
| **Comercial** | Rey Davis | Requisições, negociação |

---

## 🚀 Próximos Passos

### Para Completar o Setup

1. **Users**
   - [ ] Adicionar foto de perfil para cada utilizador
   - [ ] Configurar email de recuperação
   - [ ] Definir backup de segurança

2. **Logos**
   - [ ] Criar logo completo (.svg)
   - [ ] Criar variantes (horizontal, vertical, marca)
   - [ ] Definir paleta de cores oficial
   - [ ] Criar guia de branding

3. **Clientes/Parceiros**
   - [ ] Obter logo de Rey Davis
   - [ ] Configurar contrato de parceria
   - [ ] Definir tabela de descontos
   - [ ] Criar manual do parceiro

4. **Integração**
   - [ ] Implementar SSO (se aplicável)
   - [ ] Configurar 2FA para admin
   - [ ] Criar alertas de segurança
   - [ ] Testes de penetração

---

## 📞 Contactos Rápidos

### Utilizadores Internos
- **Feliciano (Admin):** feliciano@acrobaticz.pt
- **João (Technician):** joao@acrobaticz.pt
- **Lourenço (Manager):** lourenco@acrobaticz.pt

### Parceiros
- **Rey Davis:** hello@vrd.productions | +351 969 774 999

### Suporte Técnico
- **Email:** support@acrobaticz.pt
- **Telefone:** +351 XXX XXX XXX
- **Chat:** Available 9am-6pm PT

---

**Documento Gerado:** 15 de Janeiro de 2026  
**Versão:** 2.0 (Completo com Users, Logos, Clientes, Parceiros)
