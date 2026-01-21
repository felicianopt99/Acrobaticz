# Acrobaticz - Deployment Flow

## 📋 Overview

Build local → GitHub → Server deployment simplificado com todos os serviços pré-configurados:
- ✅ PostgreSQL
- ✅ MinIO (S3-compatible storage)
- ✅ DuckDNS (Dynamic DNS)
- ✅ Nginx (Reverse proxy)
- ✅ Certbot/Let's Encrypt (HTTPS via nginx)

---

## 🏗️ **Fase 1: Build Local** (seu computador)

```bash
# 1. Instalar dependências e fazer build
./build.sh

# 2. Verificar que tudo compilou
ls -la .next/standalone/

# 3. Commit do build
git add .
git commit -m "chore: update build artifacts"
git push origin main
```

**O que é commitado:**
- ✅ `.next/` (pré-compilado)
- ✅ `Dockerfile` (copia .next/ pre-built)
- ✅ `docker-compose.yml` (todos os serviços)
- ✅ `build.sh`, `deploy.sh`, `setup-server.sh`
- ❌ `node_modules/` (ignorado)
- ❌ `.env` (arquivo de configuração)

---

## 🚀 **Fase 2: Server Setup** (apenas primeira vez)

```bash
# 1. Clone do repositório
git clone https://github.com/seu-usuario/acrobaticz.git
cd acrobaticz

# 2. Verificar que Docker está instalado
./setup-server.sh

# 3. Copiar e editar arquivo .env
cp .env.example .env

# Editar com suas credenciais:
# nano .env
# ou vim .env

# Variáveis obrigatórias:
# DB_PASSWORD=senhaforte123
# JWT_SECRET=$(openssl rand -base64 32)
# MINIO_ROOT_PASSWORD=minioadmin123
# DUCKDNS_DOMAIN=seu_dominio (de www.duckdns.org)
# DUCKDNS_TOKEN=seu_token
# DOMAIN=seu_dominio.duckdns.org
```

---

## 🐳 **Fase 3: Deploy no Servidor**

```bash
# Deploy com um comando
./deploy.sh

# Aguarda ~30s até os serviços ficarem healthy
```

**O que acontece automaticamente:**
1. ✅ Cria diretórios necessários (`data/`, `certs/`, `nginx/`)
2. ✅ Para containers antigos
3. ✅ Inicia todos os serviços com `docker compose up -d`
4. ✅ PostgreSQL, MinIO, App, DuckDNS, Nginx... tudo junto

**Na primeira execução do container, automaticamente:**
- ✅ Aguarda PostgreSQL estar saudável
- ✅ Aguarda MinIO estar pronto
- ✅ Cria bucket MinIO
- ✅ **Executa migrações** (`prisma migrate deploy`)
- ✅ **Executa seed** (`npm run db:seed`) - popula dados iniciais
- ✅ Gera Prisma client
- ✅ Inicia aplicação Next.js

---

## 📊 Serviços em Execução

| Serviço | URL | Porta | Descrição |
|---------|-----|-------|-----------|
| App | http://localhost:3000 | 3000 | Next.js application |
| MinIO Console | http://localhost:9001 | 9001 | S3 storage dashboard |
| PostgreSQL | localhost:5432 | 5432 | Database (interal) |
| Nginx | http://localhost (80), https (443) | 80/443 | Reverse proxy |
| DuckDNS | Automático | - | Dynamic DNS updates |

---

## 🔄 **Atualizações Futuras** (após primeira deploy)

```bash
# No seu computador:
# 1. Fazer mudanças no código
# 2. Build local
./build.sh

# 3. Commit
git add .
git commit -m "feat: sua mudança"
git push origin main

# No servidor:
# 1. Pull latest
git pull origin main

# 2. Restart services (copia .next/ pré-compilado)
docker compose down
docker compose up -d

# ✅ Pronto! Nenhum build no servidor
```

---

## 🛠️ Troubleshooting

### App não inicia
```bash
docker compose logs -f app
```

### Checar saúde dos serviços
```bash
docker compose ps
```

### Parar tudo
```bash
docker compose down
```

### Ver variáveis de ambiente
```bash
cat .env
```

### Resetar banco de dados
```bash
docker compose down -v  # Remove volumes
docker compose up -d    # Recria tudo do zero
```

---

## 🔐 Let's Encrypt / HTTPS via Nginx

O Nginx está configurado para servir em portas 80 (HTTP) e 443 (HTTPS).

Para usar Let's Encrypt com Certbot automático, edite `nginx/default.conf` ou use um script específico de SSL.

---

## ✨ Benefícios deste Fluxo

✅ **Sem build no servidor** - Deploy 5x mais rápido  
✅ **Todos os serviços inclusos** - PostgreSQL, MinIO, DuckDNS, Nginx, Certbot  
✅ **Migrações automáticas** - `prisma migrate deploy` executado no startup  
✅ **Seed automático** - `npm run db:seed` popula banco na primeira execução  
✅ **Uma linha de deploy** - `./deploy.sh`  
✅ **Portável** - Funciona em qualquer servidor com Docker  
✅ **Simples** - Sem scripts complexos, sem manual steps
