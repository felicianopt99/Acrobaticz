# 🚀 Acrobaticz - Passo a Passo Deploy

## **FASE 1: BUILD LOCAL** (seu computador)

### Passo 1: Preparar repositório Git
```bash
# Na pasta do projeto
cd /media/feli/38826d41-4b6a-4f13-9e48-d9628771bfe52/AC/Acrobaticz

# Verificar git
git status
```

### Passo 2: Fazer build local
```bash
./build.sh
```
**O que faz:**
- ✅ Instala dependências (npm install)
- ✅ Compila Next.js (npm run build)
- ✅ Gera pasta `.next/` com aplicação pronta
- ✅ Mostra próximos passos

### Passo 3: Commit e push para GitHub
```bash
# Ver o que mudou
git status

# Adicionar tudo
git add .

# Commit
git commit -m "chore: build atualizado para produção"

# Push para GitHub
git push origin main
```

✅ **Pronto! Fase 1 concluída.**

---

## **FASE 2: SETUP DO SERVIDOR** (apenas PRIMEIRA VEZ)

### Passo 1: SSH no servidor
```bash
ssh seu_usuario@seu_servidor.com
```

### Passo 2: Clonar repositório
```bash
# Criar pasta (opcional)
mkdir -p /apps
cd /apps

# Clonar projeto
git clone https://github.com/seu-usuario/acrobaticz.git
cd acrobaticz
```

### Passo 3: Verificar Docker
```bash
./setup-server.sh
```
**Verifica:**
- Docker instalado? ✅
- Docker Compose? ✅

Se falhar, instale Docker:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### Passo 4: Configurar `.env`
```bash
# Copiar template
cp .env.example .env

# Editar com suas credenciais
nano .env
```

**Variáveis OBRIGATÓRIAS para editar:**

```env
# Banco de dados
DB_PASSWORD=senhaforte123456

# JWT (gerar: openssl rand -base64 32)
JWT_SECRET=sua_chave_secreta_aqui

# MinIO (storage)
MINIO_ROOT_PASSWORD=minioadmin123456

# DuckDNS (dynamic DNS)
DUCKDNS_DOMAIN=seu_dominio
DUCKDNS_TOKEN=seu_token_duckdns

# Domínio final
DOMAIN=seu_dominio.duckdns.org
```

**Como obter DuckDNS:**
1. Ir para https://www.duckdns.org
2. Fazer login (GitHub/Google)
3. Copiar token
4. Criar domínio (ex: meu-app)
5. `DUCKDNS_DOMAIN=meu-app`
6. `DUCKDNS_TOKEN=cola_aqui_o_token`

### Passo 5: Salvar `.env`
```bash
# No nano:
Ctrl+O (enter) Ctrl+X

# Ou no vim:
:wq
```

✅ **Setup concluído! Faça isso apenas UMA VEZ.**

---

## **FASE 3: DEPLOY** (primeira vez)

### Passo 1: Deploy automático
```bash
./deploy.sh
```

**O que faz automaticamente:**
1. ✅ Para containers antigos
2. ✅ Cria diretórios (`data/`, `certs/`, `nginx/`)
3. ✅ Inicia todos os serviços
4. ✅ PostgreSQL inicia
5. ✅ MinIO inicia e cria bucket
6. ✅ **Executa migrações** do banco
7. ✅ **Executa seed** (popula dados iniciais)
8. ✅ App inicia na porta 3000

### Passo 2: Verificar status
```bash
docker compose ps
```

**Esperado:**
```
NAME                 STATUS      PORTS
acrobaticz-app       running     0.0.0.0:3000->3000/tcp
acrobaticz-postgres  running     5432/tcp
acrobaticz-minio     running     0.0.0.0:9001->9001/tcp, 9000/tcp
acrobaticz-duckdns   running
acrobaticz-nginx     running     0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### Passo 3: Ver logs
```bash
# Logs da aplicação
docker compose logs -f app

# Logs do PostgreSQL
docker compose logs -f postgres

# Logs de todos
docker compose logs -f
```

### Passo 4: Acessar aplicação
- **App**: http://localhost:3000
- **MinIO**: http://localhost:9001
- **Nginx**: http://seu_dominio.duckdns.org

✅ **Deploy concluído!**

---

## **FASE 4: ATUALIZAÇÕES FUTURAS**

### No seu PC:
```bash
# Fazer mudanças no código
# ... editar arquivos ...

# Build
./build.sh

# Commit
git add .
git commit -m "feat: sua mudança"
git push origin main
```

### No servidor:
```bash
# Entrar na pasta
cd /apps/acrobaticz

# Pull latest
git pull origin main

# Restart (sem rebuild - já está compilado!)
docker compose down
docker compose up -d

# Ver logs
docker compose logs -f app
```

⚡ **Muito rápido! Sem build no servidor!**

---

## 🆘 TROUBLESHOOTING

### App não está respondendo
```bash
# Ver logs
docker compose logs -f app

# Se tiver erro de BD:
docker compose logs -f postgres

# Reiniciar tudo
docker compose down
docker compose up -d
```

### Erro de permissão com docker
```bash
sudo usermod -aG docker $USER
# Fazer logout e login novamente
```

### Seed não rodou (dados vazios)
```bash
# Entrar no container
docker compose exec app bash

# Rodar seed manualmente
npm run db:seed

# Sair
exit
```

### Resetar banco de dados (CUIDADO!)
```bash
# Para tudo e apaga volumes (dados)
docker compose down -v

# Recria tudo do zero
docker compose up -d
```

---

## 📋 CHECKLIST FINAL

- [ ] Build local passou? (`./build.sh`)
- [ ] Código commitado no GitHub?
- [ ] Server SSH conectado?
- [ ] Git clonado no servidor?
- [ ] `.env` editado com credenciais?
- [ ] `./deploy.sh` executado?
- [ ] Todos os containers `running`?
- [ ] App acessível em http://localhost:3000?
- [ ] MinIO acessível em http://localhost:9001?

✅ **Pronto para produção!**
