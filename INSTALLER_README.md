# 🚀 Instalador Automático AV Rentals - README

> **Instalador Profissional "Topo da Linha" para Acrobaticz AV Rental Platform**  
> Versão 2.0.0 | Pronto para Produção | Premium Quality

---

## 🎯 O Que É?

Um **instalador automático premium de classe Envato** que configura completamente a aplicação AV Rentals com:

- ✅ **12 etapas automatizadas** (OS detection até verificação final)
- ✅ **Validação robusta** de pré-requisitos
- ✅ **3 modos de instalação** (produção, desenvolvimento, custom)
- ✅ **UI/UX profissional** com cores, progresso e formatação
- ✅ **Logging detalhado** e backup automático
- ✅ **Tratamento avançado de erros** com recovery
- ✅ **Suporte multiplataforma** (Linux, macOS, WSL2)
- ✅ **Documentação completa** (3 guias)

---

## ⚡ Quick Start

### Opção 1: Interativo (Recomendado)
```bash
bash install.sh
# Menu guia você passo a passo
# ~5 minutos, zero configuração manual
```

### Opção 2: Produção (Rápido)
```bash
bash install.sh -m production -y
# Instalação completa automatizada
# ~8 minutos, pronto para usar
```

### Opção 3: Desenvolvimento
```bash
bash install.sh -m development
# Setup dev com hot reload
# ~5 minutos, modo debug ativado
```

---

## 📋 Pré-requisitos

Seu sistema precisa ter:

| Requisito | Versão Mínima | Verificação |
|-----------|--------------|------------|
| **Node.js** | 18.0+ | `node --version` |
| **npm** | 9.0+ | `npm --version` |
| **Git** | 2.25+ | `git --version` |
| **Docker** | 20.0+ | `docker --version` |
| **docker-compose** | 2.0+ | `docker-compose --version` |
| **Espaço Disco** | 5GB | `df -h` |
| **OS** | Linux/macOS | `uname -s` |

**Não tem?** O instalador te fala exatamente o que instalar! 👍

---

## 🚀 Opções Disponíveis

### Modos de Instalação

#### 🏭 Production
```bash
bash install.sh -m production
```
Ideal para deployment real:
- Docker ✓ (obrigatório)
- PostgreSQL ✓ (configurado)
- SSL/HTTPS ✓ (Certbot ready)
- Backups ✓ (automáticos)
- Monitoring ✓ (enabled)

#### 💻 Development  
```bash
bash install.sh -m development
```
Ideal para coding local:
- Hot reload ✓ (Next.js turbo)
- Debug tools ✓ (Chrome DevTools)
- Demo data ✓ (seed automático)
- Docker ? (você escolhe)

#### 🎨 Custom
```bash
bash install.sh -m custom
```
Escolha cada componente:
- Docker? [s/n]
- Database? [s/n]
- Build? [s/n]

### Flags Avançadas

```bash
# Sem Docker
bash install.sh --skip-docker

# Sem Database setup
bash install.sh --skip-database

# Modo verbose (mais detalhes)
bash install.sh -v

# Teste seco (nada é alterado)
bash install.sh --dry-run

# Sem perguntas (batch/CI/CD)
bash install.sh -y

# Combinar
bash install.sh -m production -y -v --skip-docker
```

---

## 📊 O Que Acontece Durante a Instalação?

```
[1/12] Detectando Sistema Operacional
       └─ Linux/macOS, arquitetura, versão

[2/12] Verificando Dependências
       ├─ git, node, npm, docker, docker-compose
       └─ Espaço em disco (5GB+)

[3/12] Configuração Interativa
       ├─ Seleção de modo (prod/dev/custom)
       ├─ Opções específicas
       └─ Confirmações de segurança

[4/12] Setup de Ambiente
       ├─ Geração de .env.local
       ├─ Secret keys
       └─ Variáveis de sistema

[5/12] Instalação de Dependências
       └─ npm install (com --legacy-peer-deps)

[6/12] Configuração Prisma ORM
       └─ Prisma client generation

[7/12] Setup de Database
       ├─ Prisma migrations
       ├─ Seed de dados (opcional)
       └─ Verificação de conexão

[8/12] Setup Docker
       ├─ Build de imagem
       ├─ docker-compose up (se production)
       └─ Health checks

[9/12] Compilação da Aplicação
       └─ next build (otimizado)

[10/12] Testes
        ├─ Type checking
        └─ Unit tests

[11/12] Verificação Final
        ├─ Artifacts presentes
        ├─ Configurações OK
        └─ Erros/Warnings

[12/12] Relatório Final
        ├─ Resumo da instalação
        ├─ Próximos passos
        └─ Localização de logs
```

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

```
✨ install.sh                      (28 KB)  - Instalador principal
✨ uninstall.sh                    (5.4 KB) - Desinstalador
✨ INSTALL_GUIDE.md                (8 KB)   - Guia rápido
✨ INSTALLER_ADVANCED.md           (12 KB)  - Troubleshooting avançado
✨ INSTALLER_COMPARISON.md         (8 KB)   - Antes vs Depois
```

### Diretórios Criados

```
📁 .installation-logs/     - Logs detalhados de cada instalação
📁 .installation-backups/  - Backups automáticos (segurança)
```

### Modificados (Com Backup)

```
📝 .env.local              - Variáveis de ambiente (novo)
```

---

## 🎯 Exemplos de Uso

### 1️⃣ Novo Dev (Zero Experiência)
```bash
$ bash install.sh
# Menu interativo guia tudo
# Pergunta: modo? → produção [1]
# Pergunta: Docker? → sim [s]
# ...
# ✓ Sucesso em 10 minutos
```

### 2️⃣ Dev Experiente (CI/CD)
```bash
$ bash install.sh -m production -y -v
# Instalação automatizada
# Logs salvos em .installation-logs/
# Exit code 0 = sucesso
# ✓ Pronto em 8 minutos
```

### 3️⃣ Debug/Troubleshooting
```bash
$ bash install.sh -v
# [1/12] Detectando OS
#   • System: Linux
#   • Architecture: x86_64
# [2/12] Verificando Dependências
#   • git: 2.42.0 ✓
#   • node: 20.10.0 ✓
# ...
# Mostra cada passo em detalhes
```

### 4️⃣ Teste Seco (Validação)
```bash
$ bash install.sh --dry-run
# Mostra:
# - Que seria feito
# - Sem fazer nada real
# - Útil para validar ambiente
```

### 5️⃣ Só o Essencial (Dev Local)
```bash
$ bash install.sh -m development --skip-docker
# Setup apenas código local
# Database: você fornece via DATABASE_URL
# Docker: não instalado
# ✓ Rápido, flexível
```

---

## 📖 Documentação

### Para Iniciantes
👉 Leia **[INSTALL_GUIDE.md](INSTALL_GUIDE.md)** primeiro!
- Setup rápido em 3 passos
- Comandos principais
- Troubleshooting básico

### Para Avançados  
👉 Veja **[INSTALLER_ADVANCED.md](INSTALLER_ADVANCED.md)**
- Arquitetura do instalador
- Opções avançadas
- Troubleshooting detalhado
- Personalização

### Para Comparação
👉 Confira **[INSTALLER_COMPARISON.md](INSTALLER_COMPARISON.md)**
- Antes vs Depois
- Melhorias implementadas
- Estatísticas

### Help Inline
```bash
bash install.sh --help
```

---

## 🐛 Troubleshooting Rápido

### "Dependência faltando: docker"
```bash
# macOS
brew install docker

# Linux
sudo apt-get install docker.io
```

### "Port 3000 already in use"
```bash
PORT=3001 npm run dev
```

### "Database connection refused"
```bash
docker-compose restart postgres
sleep 5
npm run db:migrate
```

### "npm install falha"
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

👉 Mais problemas? Veja **[INSTALLER_ADVANCED.md](INSTALLER_ADVANCED.md)** seção Troubleshooting

---

## 📊 Performance

Tempos típicos de instalação:

| Modo | Docker | Com Seed | Tempo |
|------|--------|----------|-------|
| **Development** | Não | Não | ~3 min |
| **Development** | Não | Sim | ~4 min |
| **Development** | Sim | Não | ~5 min |
| **Production** | Sim | Não | ~8 min |
| **Production** | Sim | Sim | ~10 min |

Varia conforme: velocidade internet, disco, CPU

---

## ✅ Checklist Pós-Instalação

Após instalação, verifique:

```bash
# ✓ Variáveis de ambiente
cat .env.local | head -10

# ✓ Dependências instaladas
ls -la node_modules | head -10

# ✓ Build criado (production)
ls -la .next 2>/dev/null && echo "✓" || echo "❌"

# ✓ Containers rodando (production)
docker-compose ps 2>/dev/null | grep Up && echo "✓" || echo "❌"

# ✓ Aplicação respondendo
curl -s http://localhost:3000 | head -c 50 && echo "✓" || echo "❌"

# ✓ Logs de instalação
cat .installation-logs/install-*.log | tail -20
```

---

## 🔧 Desinstalação

Se precisar remover tudo:

```bash
bash uninstall.sh
# Menu com 4 opções:
# 1) Só node_modules (leve)
# 2) node_modules + build (médio)
# 3) Tudo menos database (completo)
# 4) TUDO (incluindo database)

# Backups são criados automaticamente
ls -la .installation-backups/
```

---

## 🎓 Arquitetura do Instalador

```
install.sh (1000+ linhas, bem estruturado)
├── Configurações Globais
│   ├── Cores ANSI
│   ├── Variáveis de estado
│   └── Constantes
├── Funções de Output
│   ├── print_banner() - Tela inicial bonita
│   ├── print_header() - Cabeçalhos com progresso
│   ├── print_success/error/warning()
│   └── print_*_box() - Caixas de destaque
├── Funções de Validação
│   ├── check_os()
│   ├── check_dependencies()
│   ├── check_disk_space()
│   └── check_permissions()
├── Funções de Configuração
│   ├── interactive_setup()
│   ├── setup_environment()
│   └── setup_*()
├── Funções de Instalação
│   ├── install_dependencies()
│   ├── setup_prisma()
│   ├── setup_database()
│   ├── setup_docker()
│   ├── build_application()
│   └── run_tests()
├── Funções Utilitárias
│   ├── show_help()
│   └── parse_arguments()
└── Main
    └── Execução orquestrada
```

---

## 📞 Suporte

### Acessar Logs
```bash
tail -f .installation-logs/install-*.log
```

### Modo Debug
```bash
bash install.sh -v 2>&1 | tee debug.log
```

### Verificar Sistema
```bash
# Seu sistema atende requisitos?
bash install.sh --dry-run
```

### Documentação Completa
- [INSTALL_GUIDE.md](INSTALL_GUIDE.md) - Quick start
- [INSTALLER_ADVANCED.md](INSTALLER_ADVANCED.md) - Avançado
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deployment
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitetura

---

## 🌟 Diferenciais

### vs Scripts Antigos
- ❌ Antes: 0 validações → ✅ Agora: 7+ validações
- ❌ Antes: Sem logs → ✅ Agora: Logs completos em arquivo
- ❌ Antes: Sem backup → ✅ Agora: Backup automático
- ❌ Antes: Sem UX → ✅ Agora: UI profissional com cores
- ❌ Antes: 1 modo → ✅ Agora: 3 modos + customização

### vs Marketplace Competitors
- ✅ Setup automático
- ✅ UI/UX premium
- ✅ Logging detalhado
- ✅ Multiplataforma
- ✅ Documentação completa
- ✅ Open source
- ✅ Customizável

---

## 📈 Roadmap (Futuro)

- [ ] Suporte Windows nativo
- [ ] Interface GUI (Python Tkinter)
- [ ] Package installers (Snap, Homebrew)
- [ ] Auto-update checker
- [ ] Health check daemon
- [ ] Plugin system
- [ ] Telemetria opcional

---

## 📝 Notas

### Sistema de Logging

Todo arquivo de instalação é salvo em:
```
.installation-logs/
├── install-2026-01-14-225430.log
├── install-2026-01-14-230100.log
└── ...
```

Cada log contém timestamp completo e todos os eventos.

### Backups

Arquivos antigos são automaticamente backeados em:
```
.installation-backups/
├── env.backup.1705280470
├── .env.local.backup.1705280471
└── ...
```

### Idempotência

Comandos são generalmente seguros para rodar múltiplas vezes:
- `npm install` = seguro (redownload somente se necessário)
- Migrations = seguro (não reexecuta)
- Docker build = seguro (reusa layers)

Exceção: Seed de dados pode duplicar (use `--clean` se necessário)

---

## 🎯 TL;DR (Super Rápido)

```bash
# 3 comandos para estar rodando:
bash install.sh              # Instalar
npm run dev                  # Rodar
# Acessa: http://localhost:3000
```

---

**Versão:** 2.0.0  
**Data:** 2026-01-14  
**Status:** ✅ Production Ready  
**Qualidade:** Premium / Enterprise Grade

---

Aproveite! 🚀
