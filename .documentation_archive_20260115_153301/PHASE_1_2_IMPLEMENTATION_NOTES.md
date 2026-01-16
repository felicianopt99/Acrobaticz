# 📦 FASE 1 & 2 IMPLEMENTAÇÃO CONCLUÍDA
# Docker Compose + Entrypoint Aprimorado

**Data:** 14 de Janeiro de 2026  
**Status:** ✅ Fase 1 & 2 Completas

---

## 🎯 O QUE FOI IMPLEMENTADO

### Fase 1: Docker Compose com MinIO

#### Ficheiro: `docker-compose.yml` (Atualizado)

**Serviços Adicionados/Modificados:**

1. **PostgreSQL** (melhorado)
   - ✅ Variáveis .env parametrizadas (DB_NAME, DB_USER, DB_PASSWORD)
   - ✅ Healthcheck robusto (15s start_period)
   - ✅ Resource limits (2CPU/512MB limite, 1CPU/256MB reserva)
   - ✅ Logging JSON com rotação (10m max size)

2. **MinIO** (novo serviço)
   ```yaml
   - Imagem: minio/minio:latest
   - Porta API: 9000 (S3 compatível)
   - Porta Console: 9001 (web, comentado para produção)
   - Volume: ${STORAGE_PATH} (mapeável para disco externo)
   - Healthcheck: curl /minio/health/live
   - Credentials: MINIO_ROOT_USER/PASSWORD (do .env)
   ```

3. **Next.js App** (melhorado)
   - ✅ Novo: Variáveis S3 no environment
   - ✅ Novo: `depends_on` com `service_healthy` para postgres E minio
   - ✅ Port: dinâmica via ${PORT}
   - ✅ Healthcheck: 45s start_period (mais robusto)
   - ✅ Resource limits (2CPU/1GB)

4. **Nginx** (melhorado)
   - ✅ Healthcheck mais robusto (wget em vez de curl)
   - ✅ Resource limits adequados (128M)

#### Variáveis de Ambiente (docker-compose)

```yaml
environment:
  # Database (novo parametrizado)
  POSTGRES_DB: ${DB_NAME:-acrobaticz}
  POSTGRES_USER: ${DB_USER:-acrobaticz_user}
  POSTGRES_PASSWORD: ${DB_PASSWORD:-change_me...}
  
  # MinIO (novo)
  MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
  MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-...}
  
  # S3 Client (novo)
  S3_ENDPOINT: ${S3_ENDPOINT:-http://minio:9000}
  S3_ACCESS_KEY: ${S3_ACCESS_KEY:-minioadmin}
  S3_SECRET_KEY: ${S3_SECRET_KEY:-...}
  S3_BUCKET: ${S3_BUCKET:-acrobaticz}
  S3_REGION: ${S3_REGION:-us-east-1}
```

#### Volumes

```yaml
volumes:
  postgres_data:    # BD persistente
  app_storage:      # Uploads locais
  nginx_certs:      # SSL certificates
  ${STORAGE_PATH}   # MinIO storage (externo)
```

---

### Fase 2: Entrypoint.sh Robusto

#### Ficheiro: `docker-entrypoint.sh` (Completamente reescrito)

**11 Passos Estruturados:**

```
STEP 1: Verificar Variáveis de Ambiente (required_vars check)
STEP 2: Validar Permissões de Storage (STORAGE_PATH)
STEP 3: Aguardar PostgreSQL (polling com retry logic)
STEP 4: Verificar Conectividade BD (psql test)
STEP 5: Aguardar MinIO (polling com curl healthcheck)
STEP 6: Criar Bucket MinIO (se disponível)
STEP 7: Aplicar Migrações Prisma (prisma migrate deploy)
STEP 8: Verificar Schema BD (count tables)
STEP 9: Gerar Prisma Client
STEP 10: Calcular Tempo de Startup
STEP 11: Iniciar Aplicação
```

**Funcionalidades Robustas:**

1. **Logging Detalhado**
   - Cores CLI (BLUE, GREEN, YELLOW, RED, MAGENTA, CYAN)
   - Ficheiro log: `/tmp/acrobaticz-startup.log`
   - Timestamps e duração de startup

2. **Healthchecks PostgreSQL**
   - 30 tentativas (DB_MAX_ATTEMPTS)
   - 2s intervalo entre tentativas
   - Parse automático de DATABASE_URL
   - Extração segura de: host, port, user, database
   - Timeout 10s por tentativa

3. **Healthchecks MinIO**
   - 20 tentativas (MINIO_MAX_ATTEMPTS)
   - Curl em `http://minio:9000/minio/health/live`
   - Non-blocking: continua se MinIO falhar
   - Aviso, não erro fatal

4. **Validação Storage Path**
   - Verifica se existe: `test -d "$STORAGE_PATH"`
   - Tenta criar se não existe: `mkdir -p`
   - Fallback para `/tmp/minio-data` se criar falhar
   - Calcula espaço disponível: `df` command
   - Avisa se < 1GB

5. **Bucket MinIO**
   - Verifica se AWS CLI existe
   - Cria bucket automaticamente: `aws s3api create-bucket`
   - Garante idempotência (ignora se já existe)
   - Define variáveis: S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET

6. **Migrações Prisma**
   - Executa: `npx prisma migrate deploy`
   - Timeout: 180s
   - Parse de erros:
     - "Already locked" → sleep 5s
     - "No migrations" → log info
     - Outros erros → exit 1
   - Tee output para log file

7. **Verificação Schema**
   - Query BD: `SELECT COUNT(*) FROM information_schema.tables`
   - Log do número de tabelas criadas
   - Aviso se nenhuma tabela

8. **Tratamento de Erros**
   - `set -e` global
   - Timeouts explícitos: `timeout $TIMEOUT command`
   - Exit codes significativos
   - Mensagens de erro claras

---

## 📋 FICHEIRO `.env.example` (Novo)

Criado template completo com:

```bash
# Application Environment
NODE_ENV=production
PORT=3000

# Database Configuration
DB_NAME=acrobaticz
DB_USER=acrobaticz_user
DB_PASSWORD=change_me_strong_password_123

# JWT Authentication
JWT_SECRET=please_change_this...
JWT_EXPIRATION=7d

# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin_change_me_123
STORAGE_PATH=./storage/minio

# S3 Client
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin_change_me_123
S3_BUCKET=acrobaticz

# Optional: DeepL, Gemini, etc.
```

---

## 🔧 COMO USAR (Quick Start)

### 1. Preparar Ambiente

```bash
# Copiar template
cp .env.example .env

# Editar variáveis críticas
# DB_PASSWORD, JWT_SECRET, S3_SECRET_KEY, etc.
nano .env
```

### 2. Estrutura de Volumes

```bash
# Criar diretórios (será criado automaticamente)
mkdir -p ./data/postgres
mkdir -p ./data/app_storage
mkdir -p ./storage/minio
mkdir -p ./certs
```

### 3. Iniciar Stack

```bash
# Levanta todos os serviços
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f app

# Verificar status
docker-compose ps

# Aceder à aplicação
# App: http://localhost:3000
# MinIO Console: http://localhost:9001
```

### 4. Verificar Startup

```bash
# Ler log de startup
docker exec acrobaticz-app cat /tmp/acrobaticz-startup.log

# Verificar se todos os serviços estão healthy
docker-compose ps  # Status: Up (healthy)
```

---

## 🗂️ VOLUME EXTERNO (Disco Mapeável)

**Exemplo: Mapear para disco externo em produção**

```bash
# .env
STORAGE_PATH=/mnt/external-disk/acrobaticz-storage

# Ou NAS
STORAGE_PATH=/media/nas/backup/acrobaticz

# Ou disco local em VPS
STORAGE_PATH=/var/lib/acrobaticz/storage
```

**Permissões (se necessário):**

```bash
# Criar path
mkdir -p /mnt/external-disk/acrobaticz-storage

# Ajustar permissões (Docker container rodará como root por default)
chmod 755 /mnt/external-disk/acrobaticz-storage

# Se usar user específico no container, ajustar ownership
# chown 1000:1000 /mnt/external-disk/acrobaticz-storage
```

---

## 🐛 Troubleshooting

### PostgreSQL não conecta

```bash
# Verificar se BD está ready
docker-compose logs postgres | grep "ready to accept connections"

# Se falhar, verificar credenciais em .env
docker-compose ps postgres  # Status deve ser Up (healthy)
```

### MinIO não inicia

```bash
# Ver logs do MinIO
docker-compose logs minio

# Verificar permissões do STORAGE_PATH
ls -la ./storage/minio

# Se problema, usar /tmp como fallback
STORAGE_PATH=/tmp/minio-data docker-compose up -d
```

### App não encontra BD

```bash
# DATABASE_URL deve estar correto
# Ver no container
docker exec acrobaticz-app echo $DATABASE_URL

# Se vazio, verificar .env
# docker-compose constrói DATABASE_URL = postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
```

### Migrações falharam

```bash
# Ver output completo
docker-compose logs app | grep -A 50 "migrations"

# Se foi "Already locked", rebootar container
docker restart acrobaticz-app

# Se erro real, verificar schema.prisma
docker exec acrobaticz-app npx prisma db push --skip-generate
```

---

## ✅ Checklist Pós-Implementação

- [x] Docker-compose.yml atualizado com MinIO
- [x] Entrypoint.sh com 11 passos robustos
- [x] .env.example com todas as variáveis
- [x] Healthchecks parametrizados
- [x] STORAGE_PATH mapeável para disco externo
- [x] Logging detalhado com timestamps
- [x] Tratamento de erros robusto
- [x] Non-blocking startup (MinIO opcional)
- [x] Documentação deste ficheiro

---

## 📊 Próximas Fases

- **Fase 3:** Consolidar 29 migrações → 1 migração `01_init`
- **Fase 4:** Criar StepStorage.tsx (validação MinIO no wizard)
- **Fase 5:** Middleware + redirect automático /setup

---

## 📝 Notas de Desenvolvimento

- Entrypoint.sh é shebang `/bin/sh` (não bash) para compatibilidade Alpine
- Todos os timeouts são configuráveis (variables no topo)
- Logging é duplo: stdout + `/tmp/acrobaticz-startup.log`
- MinIO não é fatal (app continua mesmo sem storage externo)
- DATABASE_URL é construído no docker-entrypoint (não no .env)

---

**Pronto para Fase 3: Consolidação de Migrações Prisma** 🚀
