# 🔧 Documentação Avançada do Instalador - AV Rentals

## 📋 Índice

1. [Arquitetura do Instalador](#arquitetura)
2. [Opções Avançadas](#opções-avançadas)
3. [Troubleshooting Detalhado](#troubleshooting)
4. [Personalização](#personalização)
5. [Scripts Auxiliares](#scripts-auxiliares)
6. [FAQ](#faq)

---

## 🏗️ Arquitetura {#arquitetura}

### Estrutura de Instalação

```
install.sh (28KB, ~1000 linhas)
├── Setup Inicial
│   ├── Logging automático
│   ├── Parse de argumentos
│   └── Validações preliminares
├── Verificações de Pré-requisitos
│   ├── OS detection (Linux/macOS)
│   ├── Dependências (git, node, npm, docker)
│   ├── Espaço em disco (5GB+)
│   └── Permissões de arquivo
├── Configuração Interativa
│   ├── Seleção de modo (prod/dev/custom)
│   ├── Opções por modo
│   └── Confirmações de segurança
├── Instalação do Sistema
│   ├── npm install (dependencies)
│   ├── Prisma setup (ORM)
│   ├── Database migrations
│   ├── Docker build & run
│   ├── Application build
│   └── Testes & validação
└── Finalização
    ├── Resumo detalhado
    ├── Próximos passos
    └── Logs & backup
```

### Fluxo de Execução

```
┌─────────────────────────────────────────────────┐
│ 1. ENVIRONMENT                                  │
│    • bash version check                         │
│    • Script dir detection                       │
│    • Logging setup                              │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ 2. PRECONDITIONS                                │
│    • OS type (Linux/macOS)                      │
│    • Disk space (5GB min)                       │
│    • File permissions                           │
│    • Required binaries                          │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ 3. INTERACTIVE SETUP                            │
│    • Mode selection (if not --skip-interactive) │
│    • Docker opt-in (for dev)                    │
│    • Database opt-in                            │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ 4. ENVIRONMENT SETUP                            │
│    • .env.local generation                      │
│    • Secret key generation                      │
│    • Variable export                            │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ 5. INSTALLATION                                 │
│    • npm dependencies                           │
│    • Prisma client                              │
│    • Database migrations                        │
│    • Docker image & containers                  │
│    • Next.js build                              │
│    • Type checking & tests                      │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ 6. VERIFICATION                                 │
│    • Check artifacts created                    │
│    • Validate configuration                     │
│    • Count errors & warnings                    │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ 7. FINALIZATION                                 │
│    • Summary report                             │
│    • Next steps guide                           │
│    • Log file location                          │
│    • Exit code (0 = success)                    │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Opções Avançadas {#opções-avançadas}

### Modo Batch (CI/CD)

```bash
# Instalação totalmente automatizada (sem perguntas)
bash install.sh \
  -m production \
  --skip-docker \
  -y \
  -v

# Exit codes:
# 0 = Sucesso
# 1 = Erro fatal
```

### Teste Seco (Dry-Run)

```bash
# Mostra o que seria feito, sem fazer nada
bash install.sh --dry-run

# Útil para:
# • Verificar se ambiente atende requisitos
# • Validar ordem de execução
# • Auditar comandos que serão executados
```

### Modo Verbose

```bash
# Mostra cada passo detalhadamente
bash install.sh -v

# Saída:
# [1/12] Detecting Operating System
#   • System: Linux
#   • Architecture: x86_64
# [2/12] Checking Dependencies
# ...etc
```

### Modos Personalizados

#### Production
```bash
bash install.sh -m production
```
Características:
- Node modules com otimizações
- Docker + docker-compose obrigatórios
- PostgreSQL setup completo
- SSL/HTTPS configuration
- Database backups automáticos
- Monitoring enabled

#### Development
```bash
bash install.sh -m development
```
Características:
- npm install completo
- Docker opcional (pergunte)
- Database setup recomendado
- Hot reload automático
- Debug tools ativados
- Seed data automático

#### Custom
```bash
bash install.sh -m custom
```
Permite escolher:
- Usar Docker? [s/n]
- Configurar Database? [s/n]
- Seed dados? [s/n]
- Build depois? [s/n]

---

## 🐛 Troubleshooting Detalhado {#troubleshooting}

### Categoria 1: Pré-requisitos

#### ❌ "Dependência faltando: docker"

**Causa:** Docker não instalado ou não em PATH

**Solução:**
```bash
# Verificar se está instalado
which docker
docker --version

# Se não encontrar, instalar
# macOS
brew install docker

# Linux
sudo apt-get install docker.io docker-compose
sudo usermod -aG docker $USER

# Reiniciar o terminal após adicionar ao grupo
newgrp docker
```

#### ❌ "Espaço em disco insuficiente"

**Causa:** Menos de 5GB disponível

**Solução:**
```bash
# Verificar espaço disponível
df -h /

# Liberar espaço
# Remover arquivos cache/temp
rm -rf ~/.npm ~/.cache
sudo apt-get clean
docker system prune -a

# Ou adicione mais espaço virtual
```

#### ❌ "Sem permissão de escrita"

**Causa:** Diretório de instalação é read-only

**Solução:**
```bash
# Verificar permissões
ls -ld /media/feli/38826d41-4b6a-4f13-9e48-d9628771bfe5/AC/Acrobaticz

# Conceder permissões
chmod u+w /media/feli/38826d41-4b6a-4f13-9e48-d9628771bfe5/AC/Acrobaticz

# Ou reinstalar em diretório com permissões
```

### Categoria 2: Instalação

#### ❌ "npm install falha com peer dependency errors"

**Causa:** Versões incompatíveis de pacotes

**Solução:**
```bash
# Usar --legacy-peer-deps (já incluso no script)
npm install --legacy-peer-deps

# Ou limpar cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### ❌ "Prisma generate falha"

**Causa:** Schema.prisma inválido ou database inacessível

**Solução:**
```bash
# Verificar schema
cat prisma/schema.prisma

# Verificar database URL
echo $DATABASE_URL

# Gerar manualmente
npx prisma generate --verbose

# Ver erros detalhados
npx prisma introspect
```

#### ❌ "Docker build falha"

**Causa:** Dockerfile com problemas ou imagens base unavailable

**Solução:**
```bash
# Limpar imagens
docker system prune -a

# Build com output detalhado
docker build -t av-rentals:latest . --progress=plain

# Se erro persista, verificar Dockerfile
cat Dockerfile | head -20

# Tente build base primeiro
docker pull node:20-alpine
```

### Categoria 3: Database

#### ❌ "Database connection refused"

**Causa:** PostgreSQL não respondendo ou URL inválida

**Solução:**
```bash
# Verificar DATABASE_URL
grep DATABASE_URL .env.local

# Verificar container rodando
docker-compose ps postgres

# Reiniciar
docker-compose restart postgres
sleep 5

# Testar conexão
psql $DATABASE_URL -c "SELECT 1;"

# Ou com docker
docker-compose exec postgres psql -U avrentals_user -d avrentals_db -c "SELECT 1;"
```

#### ❌ "Migrations failing"

**Causa:** Schema mismatch ou migrations anteriores inconsistentes

**Solução:**
```bash
# Ver status das migrations
npx prisma migrate status

# Reset database (cuidado!)
npx prisma migrate reset

# Ou migrate manualmente
npx prisma migrate deploy

# Verificar status
npx prisma db push --skip-generate
```

### Categoria 4: Build/Runtime

#### ❌ "npm run build falha"

**Causa:** Erros TypeScript ou faltas de variáveis

**Solução:**
```bash
# Verificar erros de tipo
npm run typecheck

# Build com output verbose
npm run build -- --verbose

# Limpar build anterior
rm -rf .next
npm run build

# Checar size de build
du -sh .next
```

#### ❌ "Port 3000 already in use"

**Causa:** Outro processo usando a porta

**Solução:**
```bash
# Encontrar processo
lsof -i :3000
netstat -tlnp | grep 3000

# Matar processo (substitua PID)
kill -9 <PID>

# Ou usar porta diferente
PORT=3001 npm run dev

# Para produção, trocar docker port
# Edit docker-compose.yml: ports: ["3001:3000"]
```

---

## 🎨 Personalização {#personalização}

### Modificar Variáveis de Ambiente

```bash
# Editar .env.local diretamente
vim .env.local

# Ou usar sed para batch updates
sed -i 's/DATABASE_URL=.*/DATABASE_URL="postgresql:\/\/..."/' .env.local

# Reload sem reiniciar
export $(grep -v '^#' .env.local | xargs)
```

### Adicionar Pré-requisitos Customizados

Editar `install.sh` e adicionar em `check_dependencies()`:

```bash
# Adicione sua verificação
if ! command -v meu-comando &> /dev/null; then
    print_warning "Faltando: meu-comando"
    missing_deps+=("meu-comando")
fi
```

### Modificar Seed de Dados

```bash
# Editar script de seed
vim scripts/seed.ts

# Ou seed customizado
cat > scripts/my-seed.ts << 'EOF'
// seu código de seed
EOF

# Rodar
npx tsx scripts/my-seed.ts
```

---

## 🔌 Scripts Auxiliares {#scripts-auxiliares}

### uninstall.sh

```bash
# Opções de remoção
bash uninstall.sh
# Menu interativo com 4 opções:
# 1) Só node_modules
# 2) node_modules + build
# 3) Tudo menos database
# 4) COMPLETO (com database)
```

### cleanup.sh (existente)

```bash
# Limpeza segura de artifacts
bash cleanup.sh

# Teste seco
bash cleanup.sh --dry-run
```

### Health Check

```bash
# Criar script de healthcheck
cat > healthcheck.sh << 'EOF'
#!/bin/bash
echo "🏥 AV Rentals Health Check"
echo "──────────────────────────"

# Check database
echo -n "Database: "
curl -s http://localhost:3000/api/health | jq -r '.database' || echo "✗"

# Check app
echo -n "App: "
curl -s http://localhost:3000 > /dev/null && echo "✓" || echo "✗"

# Check docker
echo -n "Docker: "
docker-compose ps | grep "Up" | wc -l

# Check disk
echo "Disk: $(df -h / | tail -1 | awk '{print $5 " utilizado"}')"
EOF

chmod +x healthcheck.sh
./healthcheck.sh
```

---

## ❓ FAQ {#faq}

### P: Quanto tempo leva a instalação?
**R:** Normalmente 3-10 minutos dependendo:
- Velocidade da conexão (npm download)
- Velocidade do disco
- Se Docker já está instalado
- Se é primeira instalação

Modo verbose mostra progresso: `bash install.sh -v`

### P: Posso rodar sem Docker?
**R:** Sim! Para desenvolvimento:
```bash
bash install.sh -m development --skip-docker
npm run dev
# Mas database precisa estar rodando em outro lugar
```

### P: Posso instalar em Windows?
**R:** O script é Bash, ideal para:
- Linux nativo ✓
- macOS ✓
- Windows WSL2 ✓
- Windows Git Bash (parcial)

Para Windows puro, use WSL2:
```bash
wsl --install
# Depois use o bash normal
```

### P: Como faço backup antes de instalar?
**R:** O script faz backup automático:
```bash
# Backups estão em
ls -la .installation-backups/

# Backup manual também
cp -r . ../backup-$(date +%Y%m%d-%H%M%S)
```

### P: Posso usar variáveis de ambiente do sistema?
**R:** Sim! Exporte antes:
```bash
export DATABASE_URL="postgresql://..."
export JWT_SECRET="seu-secret"
bash install.sh
# As variáveis serão usadas
```

### P: Como ver logs de instalação?
**R:** 
```bash
# Último log
cat .installation-logs/install-*.log

# Em tempo real durante instalação
tail -f .installation-logs/install-*.log &
bash install.sh

# Com timestamp
cat .installation-logs/install-*.log | grep "ERROR\|WARNING"
```

### P: Posso interromper e retomar?
**R:** Não é recomendado, mas:
```bash
# O instalador é idempotente para a maioria das etapas
# npm install é seguro para rodar múltiplas vezes
# Migrations é seguro (não reexecuta)

# Retome depois
bash install.sh -m production -y  # Continuará de onde parou
```

### P: Como customizar o instalador?
**R:** Edite `install.sh` ou crie `install-custom.sh`:
```bash
# Clone e customize
cp install.sh install-custom.sh
# Edit install-custom.sh conforme necessário
bash install-custom.sh
```

---

## 📞 Suporte

Para problemas não listados acima:

1. **Ver logs completos:**
   ```bash
   cat .installation-logs/install-*.log | tail -100
   ```

2. **Modo verbose:**
   ```bash
   bash install.sh -v 2>&1 | tee debug.log
   ```

3. **Tente o modo dry-run:**
   ```bash
   bash install.sh --dry-run
   ```

4. **Veja documentação original:**
   - `docs/DEPLOYMENT.md`
   - `docs/ARCHITECTURE.md`
   - `README.md`

---

**Última atualização:** 2026-01-14 v2.0.0
