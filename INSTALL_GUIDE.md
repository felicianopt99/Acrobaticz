# 🚀 Guia Rápido de Instalação - AV Rentals

## ⚡ Instalação em 3 Passos

### 1️⃣ **Instale as Dependências**

```bash
# macOS
brew install git node docker docker-compose

# Linux (Ubuntu/Debian)
sudo apt-get install -y git nodejs npm docker.io docker-compose

# Ou use os instaladores oficiais:
# - Node.js: https://nodejs.org/
# - Docker Desktop: https://www.docker.com/products/docker-desktop
```

### 2️⃣ **Execute o Instalador Automático**

```bash
# Modo interativo (recomendado)
bash install.sh

# Ou modo direto
bash install.sh -m production -y

# Com mais detalhes
bash install.sh -m production -y -v
```

### 3️⃣ **Acesse a Aplicação**

```bash
# Desenvolvimento
npm run dev
# → http://localhost:3000

# Produção (com Docker)
docker-compose up -d
# → https://seu-dominio.com
```

---

## 📋 Opções de Instalação

### Produção (Recomendado)
```bash
bash install.sh -m production
```
- ✅ Docker habilitado
- ✅ PostgreSQL configurado
- ✅ SSL/HTTPS pronto
- ✅ Otimizado para performance

### Desenvolvimento
```bash
bash install.sh -m development
```
- ✨ Hot reload automático
- 🔧 Debug habilitado
- 📚 Seed de dados demo
- 🐳 Docker opcional

### Customizado
```bash
bash install.sh -m custom
```
- 🎯 Escolha cada componente
- 🔌 Selecione opcionais
- 💾 Configure conforme necessário

---

## 🛠️ Variáveis de Ambiente

Após instalação, configure em `.env.local`:

```bash
# Críticas (altere)
DATABASE_URL="postgresql://user:pass@host/db"
JWT_SECRET="seu-secret-aqui"
DOMAIN="seu-dominio.com"

# APIs (opcional)
GOOGLE_GENERATIVE_AI_API_KEY="..."
DEEPL_API_KEY="..."

# Storage (ajuste caminhos)
EXTERNAL_STORAGE_PATH="/mnt/storage/av-rentals"
```

Veja `env.production` para todas as opções.

---

## 📦 Comandos Principais

### Desenvolvimento
```bash
npm run dev              # Iniciar dev server com hot reload
npm run build           # Compilar para produção
npm run type check      # Verificar tipos TypeScript
npm run lint            # Verificar estilo de código
npm run test            # Executar testes
```

### Database
```bash
npm run db:migrate      # Executar migrações
npm run db:seed         # Fazer seed de dados
npm run db:seed:clean   # Limpar e fazer seed
```

### Docker
```bash
docker-compose up -d     # Iniciar containers
docker-compose down      # Parar containers
docker-compose logs -f   # Ver logs em tempo real
docker-compose restart   # Reiniciar serviços
```

### Maintenance
```bash
bash uninstall.sh       # Desinstalador (com opções)
npm run db:generate     # Regenerar Prisma client
bash cleanup.sh         # Limpeza de arquivos temporários
```

---

## ✅ Verificação de Saúde

```bash
# Checklist pós-instalação
curl http://localhost:3000                    # ✓ App rodando
curl http://localhost:3000/api/health         # ✓ API respondendo
docker-compose ps                              # ✓ Containers ativos
docker-compose logs postgres | tail -20        # ✓ DB conectado
```

---

## 🐛 Troubleshooting

### "Docker daemon not running"
```bash
# macOS
open /Applications/Docker.app

# Linux
sudo systemctl start docker
```

### "Port 3000 already in use"
```bash
# Encontre o processo
lsof -i :3000

# Mate-o (substitua PID)
kill -9 <PID>

# Ou use porta diferente
PORT=3001 npm run dev
```

### "Database connection refused"
```bash
# Verifique DATABASE_URL em .env.local
cat .env.local | grep DATABASE_URL

# Reinicie o container
docker-compose restart postgres

# Verifique logs
docker-compose logs postgres
```

### "npm: command not found"
```bash
# Node.js não instalado ou não em PATH
node --version    # Deve mostrar versão
npm --version

# Reinstale: https://nodejs.org/
```

---

## 📊 Performance

Após instalação, você tem:
- ⚡ Next.js com Turbo (hot reload instant)
- 🗄️ PostgreSQL otimizado
- 🐳 Docker multi-stage (imagens pequenas)
- 🔍 Prisma com índices de performance
- 📱 Responsive design com Tailwind CSS

---

## 📚 Próximos Passos

1. **Customize `env.local`** com seus dados
2. **Seed de dados** para começar a testar
3. **Leia a documentação** em `docs/`
4. **Configure seu domínio** para produção
5. **Setup SSL** com Let's Encrypt (automático)
6. **Backup inicial** dos dados importantes

---

## 🆘 Precisa de Ajuda?

```bash
# Ver opções do instalador
bash install.sh --help

# Ver logs de instalação
cat .installation-logs/install-*.log

# Modo verbose (mais detalhes)
bash install.sh -v

# Teste seco (nada é alterado)
bash install.sh --dry-run
```

---

## 📝 Arquivos Importantes

```
.
├── install.sh              ← Instalador automático
├── uninstall.sh            ← Desinstalador
├── .env.local              ← Suas configurações (gitignored)
├── env                     ← Template de variáveis
├── env.production          ← Template para produção
├── package.json            ← Dependências
├── docker-compose.yml      ← Orquestração de containers
├── prisma/schema.prisma    ← Schema do banco
└── .installation-logs/     ← Logs da instalação
```

---

## 🎯 Checklist Pós-Instalação

- [ ] `.env.local` configurado
- [ ] `npm run dev` roda sem erros
- [ ] `http://localhost:3000` acessível
- [ ] Database conectado (`npm run db:migrate`)
- [ ] Dados seed inseridos (`npm run db:seed`)
- [ ] Docker containers ativos (`docker-compose ps`)
- [ ] Testes passam (`npm run test:run`)
- [ ] Build produção funciona (`npm run build`)

---

**🎉 Pronto! Sua aplicação está instalada e pronta para desenvolvimento/produção.**

Para mais informações, veja `docs/ARCHITECTURE.md` e `docs/DEPLOYMENT.md`.
