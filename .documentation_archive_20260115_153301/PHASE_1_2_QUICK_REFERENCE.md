# 📋 QUICK REFERENCE - FASE 1 & 2 IMPLEMENTAÇÃO

## 🚀 TESTE RÁPIDO (5 minutos)

```bash
# 1. Setup
cp .env.example .env
# Editar: DB_PASSWORD, JWT_SECRET, S3_SECRET_KEY

# 2. Iniciar
docker-compose up -d

# 3. Monitorar
docker-compose logs -f app

# 4. Verificar (quando "STEP 11" aparecer)
docker-compose ps                    # Todos Up (healthy)
curl http://localhost:3000/api/health # 200 OK
```

---

## 📁 FICHEIROS PRINCIPAIS

| Ficheiro | Tipo | Tamanho | Descrição |
|----------|------|---------|-----------|
| `docker-compose.yml` | Modif | 8.6K | 4 serviços (PostgreSQL, MinIO, App, Nginx) |
| `docker-entrypoint.sh` | Modif | 13K | 11 passos startup (DB, MinIO, Migrations) |
| `.env.example` | Novo | 5.7K | Template com todas as variáveis |
| `PHASE_1_2_IMPLEMENTATION_NOTES.md` | Novo | 8.5K | Guia técnico detalhado |
| `PHASE_1_2_SUMMARY.sh` | Novo | 14K | Resumo visual (executável) |
| `PHASE_1_2_TESTING_GUIDE.md` | Novo | - | Guia de testes |

---

## 🔧 SERVIÇOS DOCKER

```
PostgreSQL 16 Alpine
  Port: 5432
  Health: pg_isready
  Volume: postgres_data

MinIO (Novo!)
  Port: 9000 (API)
  Port: 9001 (Console - opcional)
  Volume: ${STORAGE_PATH}
  Health: /minio/health/live

Next.js 15
  Port: 3000
  Health: /api/health
  Depends: postgres + minio (healthy)

Nginx
  Port: 80, 443
  Health: wget http://localhost:80
```

---

## ⚙️ VARIÁVEIS CRÍTICAS

```bash
# Database
DB_NAME=acrobaticz
DB_USER=acrobaticz_user
DB_PASSWORD=change_me_strong_password_123  # ← MUDAR!

# JWT
JWT_SECRET=please_change_this_secret...    # ← MUDAR!

# MinIO
MINIO_ROOT_PASSWORD=minioadmin_change_me_123  # ← MUDAR!
STORAGE_PATH=./storage/minio                  # ← Customizável

# S3
S3_BUCKET=acrobaticz
S3_ENDPOINT=http://minio:9000
```

---

## 🛡️ 11 PASSOS ENTRYPOINT

```
STEP 1:  Verify environment variables
STEP 2:  Validate storage path permissions
STEP 3:  Wait for PostgreSQL (30x retry)
STEP 4:  Verify database connectivity
STEP 5:  Wait for MinIO (20x retry, non-blocking)
STEP 6:  Create MinIO bucket
STEP 7:  Apply Prisma migrations
STEP 8:  Verify database schema
STEP 9:  Generate Prisma client
STEP 10: Calculate startup time
STEP 11: Start Next.js application
```

**Log Location:** `/tmp/acrobaticz-startup.log`

---

## 📊 DISCO EXTERNO

### Exemplos STORAGE_PATH

```bash
# Local (padrão)
STORAGE_PATH=./storage/minio

# USB externo
STORAGE_PATH=/mnt/external-usb/acrobaticz

# NAS
STORAGE_PATH=/media/nas/backup/acrobaticz

# VPS
STORAGE_PATH=/var/lib/acrobaticz/storage
```

### Setup Permissions

```bash
mkdir -p $STORAGE_PATH
chmod 755 $STORAGE_PATH
# Docker container acessa como root
```

---

## ✅ VALIDAÇÃO PÓS-STARTUP

```bash
# 1. Status
docker-compose ps
# Esperado: Todos "Up (healthy)"

# 2. Logs
docker-compose logs app | grep STEP
# Esperado: STEP 11 visível

# 3. Health API
curl -s http://localhost:3000/api/health | jq .
# Esperado: 200 OK

# 4. Database
docker exec acrobaticz-postgres psql -U acrobaticz_user -d acrobaticz -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
# Esperado: count > 0

# 5. MinIO (se AWS CLI)
aws s3 ls --endpoint-url=http://localhost:9000 --access-key=minioadmin --secret-key=$MINIO_ROOT_PASSWORD
# Esperado: acrobaticz bucket listado
```

---

## 🔴 PROBLEMAS COMUNS

### App não inicia
```bash
docker-compose logs app | tail -50
# Verificar: DB_PASSWORD, DATABASE_URL
```

### MinIO erro
```bash
docker-compose logs minio
# Verificar: STORAGE_PATH permissions, espaço em disco
```

### Porta 3000 em uso
```bash
# Mudar em .env:
PORT=3001
docker-compose down && docker-compose up -d
```

### Migration locked
```bash
docker-compose restart postgres
docker-compose restart app
```

---

## 📈 MÉTRICAS ESPERADAS

| Métrica | Esperado |
|---------|----------|
| Tempo startup | 15-35s |
| PostgreSQL wait | 0-5s |
| MinIO wait | 0-5s |
| Migrations | 5-15s |
| App launch | 5-10s |

---

## 🎯 PRÓXIMAS FASES

- **Fase 3**: Consolidar 29 migrations → 1 (2-3h) - 33x mais rápido
- **Fase 4**: StepStorage.tsx novo step wizard (2-3h)
- **Fase 5**: Middleware auto-redirect /setup (1-2h)

---

## 📖 LEITURA RECOMENDADA

1. **PHASE_1_2_IMPLEMENTATION_NOTES.md** - Técnico detalhado
2. **PHASE_1_2_TESTING_GUIDE.md** - Testes locais
3. **ELITE_SETUP_IMPLEMENTATION_PLAN.md** - Visão geral completa

---

**Status:** ✅ Fase 1 & 2 Prontas  
**Generated:** 14 January 2026  
**Acrobaticz Elite Setup v1.0**
