# 🚀 INSTRUÇÕES FINAIS DE DEPLOY - Acrobaticz

**Status:** ✅ Projeto pronto para deploy  
**Data:** 20 de Janeiro de 2026  
**Destino:** Servidor SSH Local 192.168.1.119 (feliciano)  
**Domain:** acrobaticz.duckdns.org  

---

## 📋 CHECKLIST PRÉ-DEPLOY (✅ Completado)

```
✅ Credenciais rotacionadas em .env
   - DB_PASSWORD: 3YJvxjGdGXHbDPopGXgTyPRkp8A7TkANpEFPxGi+QE4=
   - MINIO_ROOT_PASSWORD: biqRGsQJHb10Jwo2HyHwOIV8saAp1xA2I6Mn7xcskVQ=
   - JWT_SECRET: ua1ReIfOZnPhpWtOek3QLlHRU8aUO9/MlUFP3zSgVng=
   - S3_SECRET_KEY: yqj2wpugBvTavePLStY6LM5idXogmtyk

✅ HTTPS ativado
   - ENABLE_HTTPS=true
   - Certbot will auto-generate certificates on first run

✅ TypeScript validado (npm run typecheck)
✅ Testes configurados (npm run test:failover)
✅ Docker otimizado (45-50s build com cache)
✅ DuckDNS configurado (acrobaticz.duckdns.org)
```

---

## 🎯 PLANO DE DEPLOY EM 4 FASES

### FASE 1: Preparar Servidor SSH (30 mins)

1. **Conectar ao servidor:**
   ```bash
   ssh feliciano@192.168.1.119
   # Ou usar SSH config:
   ssh acro-deploy
   ```

2. **Executar script de setup** (disponível em `SERVIDOR_SSH_SETUP.md`):
   ```bash
   # Opção A: Executar comandos conforme guia
   # Opção B: Fazer setup completo (recomendado):
   
   # Colar os comandos em ordem:
   sudo apt-get update && sudo apt-get upgrade -y
   # ... (ver SERVIDOR_SSH_SETUP.md para resto)
   ```

3. **Criar estrutura de diretórios:**
   ```bash
   mkdir -p ~/acrobaticz
   mkdir -p ~/backup_drive/av-rentals/{backups,cloud-storage,app-data}
   cat > ~/acrobaticz/.env << 'EOF'
   [copiar conteúdo de DEPLOY_ENV_TEMPLATE abaixo]
   EOF
   ```

---

### FASE 2: Deploy da Aplicação (15-20 mins)

**NO SEU LAPTOP/LOCAL:**

1. **Compilar projeto localmente:**
   ```bash
   cd ~/sua-pasta/Acrobaticz
   npm run build
   docker build -f Dockerfile.optimized -t acrobaticz:prod .
   ```

2. **Fazer deploy via SSH:**
   ```bash
   # Opção A: Usar script automático
   bash deploy-ssh-fast.sh feliciano@192.168.1.119:~/acrobaticz
   
   # Opção B: Deploy manual com docker-compose
   scp docker-compose.yml feliciano@192.168.1.119:~/acrobaticz/
   scp .env feliciano@192.168.1.119:~/acrobaticz/
   ssh feliciano@192.168.1.119 "cd ~/acrobaticz && docker-compose up -d"
   ```

---

### FASE 3: Verificação Pós-Deploy (5-10 mins)

**NO SERVIDOR:**

```bash
ssh feliciano@192.168.1.119

# ✅ Verificar containers rodando
docker-compose ps

# ✅ Verificar logs da app
docker-compose logs app --tail=50

# ✅ Verificar PostgreSQL
docker-compose logs db --tail=20

# ✅ Verificar MinIO
docker-compose logs minio --tail=20

# ✅ Health check
curl http://localhost:3000/api/health

# ✅ Verificar seeding
docker-compose logs app | grep -i seed
```

---

### FASE 4: Acessar Aplicação (1 min)

**Em seu browser:**

1. **App Principal:**
   ```
   https://acrobaticz.duckdns.org
   ```

2. **Logar com usuário seeded:**
   ```
   Email: admin@acrobaticz.com
   Senha: admin123
   ```

3. **MinIO Console (Armazenamento):**
   ```
   http://192.168.1.119:9001
   
   User: minioadmin
   Pass: biqRGsQJHb10Jwo2HyHwOIV8saAp1xA2I6Mn7xcskVQ=
   ```

4. **PgAdmin (Database) - Opcional:**
   ```
   # Se configurar pgAdmin no docker-compose
   http://192.168.1.119:5050
   ```

---

## 📝 DEPLOY_ENV_TEMPLATE

**Use este template para criar `.env` no servidor:**

```dotenv
# ==============================================
# ACROBATICZ - Production Deployment
# ==============================================

NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_TELEMETRY_DISABLED=1

# Database PostgreSQL
DB_NAME=acrobaticz
DB_USER=acrobaticz_user
DB_PASSWORD=3YJvxjGdGXHbDPopGXgTyPRkp8A7TkANpEFPxGi+QE4=
DB_POOL_SIZE=20
DB_TIMEOUT=30000

# JWT & Security
JWT_SECRET=ua1ReIfOZnPhpWtOek3QLlHRU8aUO9/MlUFP3zSgVng=
JWT_EXPIRATION=7d
ENCRYPTION_KEY=cNXCU6OBKrgYrYAwuqmHf59HfZ+auUUU/oOGfbtdvho=
NEXTAUTH_SECRET=ua1ReIfOZnPhpWtOek3QLlHRU8aUO9/MlUFP3zSgVng=
NEXTAUTH_URL=https://acrobaticz.duckdns.org
SESSION_SECRET=7w2sM5nO3pQ6rT9uV1xY4zA8bC0dE3fG5hI7jK9l=

# MinIO S3 Compatible Storage
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=biqRGsQJHb10Jwo2HyHwOIV8saAp1xA2I6Mn7xcskVQ=
STORAGE_PATH=./storage/minio
MINIO_ENDPOINT=http://minio:9000
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=yqj2wpugBvTavePLStY6LM5idXogmtyk
S3_BUCKET=acrobaticz
S3_REGION=us-east-1
S3_USE_PATH_STYLE=true

# Domain & DNS Configuration
DOMAIN=acrobaticz.duckdns.org
DUCKDNS_DOMAIN=acrobaticz
DUCKDNS_TOKEN=f0027691-1f98-4a3e-9f26-94020479451e
TZ=UTC

# SSL/TLS Configuration (Certbot/Let's Encrypt)
CERTBOT_EMAIL=felizartpt@gmail.com
ENABLE_HTTPS=true

# API Keys (AI & Translation)
GEMINI_API_KEY=AIzaSyDmiWTyY0G0EMSnU9muUAxJNSEtfPpWNGY
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyDmiWTyY0G0EMSnU9muUAxJNSEtfPpWNGY
DEEPL_API_KEY=3ca0c43d-7f6b-0a9d-eb49-45132322a270:fx

# Cloud Storage & Backup Paths
EXTERNAL_STORAGE_PATH=/home/feliciano/backup_drive/av-rentals/cloud-storage
EXTERNAL_STORAGE_TEMP=/home/feliciano/backup_drive/av-rentals/cloud-storage/temp
STORAGE_CHECK_INTERVAL=300000
DEFAULT_STORAGE_QUOTA=53687091200
ENABLE_STORAGE_DISK_CHECK=true
APP_DATA_PATH=/home/feliciano/backup_drive/av-rentals/app-data
BACKUP_PATH=/home/feliciano/backup_drive/av-rentals/backups

# Database Seeding
SEED_ON_START=true
FORCE_SEED=false
SEED_CLEAN=false
SEED_VERBOSE=false

# Logging
LOG_FILE=true
LOG_LEVEL=info
```

---

## 🐳 DOCKER-COMPOSE COMMAND

**Deploy completo em 1 comando:**

```bash
# 1. SSH para servidor
ssh feliciano@192.168.1.119

# 2. Navegar para diretório
cd ~/acrobaticz

# 3. Subir todos os serviços
docker-compose up -d

# 4. Aguardar inicialização (30-60 segundos)
docker-compose logs -f app

# 5. Quando seeding terminar, pressionar Ctrl+C e sair
```

---

## 🔄 ROLLBACK (Se algo der errado)

```bash
# Parar todos os containers
docker-compose down

# Remover volumes (⚠️ perdará dados!)
# docker-compose down -v

# Reiniciar do zero
docker-compose up -d

# Ver logs de erro
docker-compose logs app | tail -100
```

---

## 🆘 TROUBLESHOOTING COMUM

### ❌ "Permission denied" ao executar docker

```bash
# Solução: Adicionar user ao grupo docker
sudo usermod -aG docker feliciano
newgrp docker
```

### ❌ "Port 3000 already in use"

```bash
# Encontrar processo usando porta 3000
sudo lsof -i :3000
# Matar processo
sudo kill -9 <PID>
# Ou trocar porta em .env: PORT=3001
```

### ❌ PostgreSQL não conecta

```bash
# Verificar container
docker-compose ps db

# Ver logs
docker-compose logs db

# Restart
docker-compose restart db
```

### ❌ MinIO não inicializa

```bash
# Verificar diretório de storage
ls -la ./storage/

# Dar permissões
sudo chown -R feliciano:feliciano ./storage/
chmod -R 755 ./storage/
```

### ❌ HTTPS Certificate Error

```bash
# Se error com Certbot, desabilitar por agora:
# No .env: ENABLE_HTTPS=false
# Depois tentar: docker-compose restart app
```

---

## 📊 MONITORAMENTO PÓS-DEPLOY

```bash
# Ver status em tempo real
watch -n 2 'docker-compose ps'

# Ver uso de recursos
docker stats

# Ver disk space
df -h

# Ver memory
free -h

# Ver ports abertas
sudo netstat -tlnp | grep LISTEN
```

---

## 🔐 AÇÕES DE SEGURANÇA IMEDIATAS

**⚠️ ANTES DE DISPONIBILIZAR PARA USUÁRIOS:**

1. **Rotacionar DuckDNS Token:**
   - Ir para https://www.duckdns.org
   - Logar com felizartpt@gmail.com
   - Click em "Regenerate Token" para domínio acrobaticz
   - Atualizar `.env` com novo token

2. **Validar HTTPS:**
   ```bash
   curl -I https://acrobaticz.duckdns.org
   # Deve retornar: HTTP/2 200
   ```

3. **Trocar senhas padrão:**
   - Acessar admin em https://acrobaticz.duckdns.org
   - Ir para Settings > Users
   - Trocar senha de admin@acrobaticz.com
   - Apagar usuários demo se não precisar

4. **Configurar backups:**
   ```bash
   # Fazer backup manual do DB
   docker-compose exec db pg_dump -U acrobaticz_user acrobaticz > ~/backup_drive/av-rentals/backups/db-backup-$(date +%Y%m%d).sql
   ```

---

## 📞 SUPORTE RÁPIDO

**Se tudo der errado:**

```bash
# Terminal 1: Ver todos os logs
docker-compose logs -f

# Terminal 2: Verificar status
docker-compose ps

# Terminal 3: Conectar ao container
docker-compose exec app bash

# Dentro do container:
npm run build  # Rebuild
npm run db:seed  # Reseed database
npm run typecheck  # Type check
```

---

## ✅ CONFIRMAÇÃO DE SUCESSO

**Você saberá que o deploy funcionou quando:**

```
✅ docker-compose ps mostra todos containers em "Up"
✅ curl http://localhost:3000/api/health retorna {"status":"ok"}
✅ Conseguir acessar https://acrobaticz.duckdns.org
✅ Logar com admin@acrobaticz.com / admin123
✅ Ver 65+ produtos na página Equipment
✅ MinIO console acessível em 192.168.1.119:9001
✅ Não há erros vermelhos em docker-compose logs
```

---

## 🎉 PRÓXIMOS PASSOS

1. Seguir Fase 1-4 acima
2. Testar fluxo completo (login, criar cotação, gerar PDF)
3. Rodar testes de failover: `npm run test:failover`
4. Configurar monitoramento (alertas, backups automáticos)
5. Documentar credenciais em local seguro (1Password, Vault, etc)

