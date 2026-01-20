# 🐳 Docker Setup Guide - Acrobaticz Elite

Complete guide to running Acrobaticz with Docker Compose in development and production environments.

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Docker Desktop (or Docker Engine + Docker Compose)
- Minimum 2GB RAM, 5GB disk space

### Installation

```bash
# 1. Clone and navigate
git clone https://github.com/yourusername/acrobaticz.git
cd acrobaticz

# 2. Create environment file
cp .env.example .env

# 3. Update critical variables (required)
# Edit .env and set:
# - DB_PASSWORD=your-strong-password
# - JWT_SECRET=your-jwt-secret
# - S3_SECRET_KEY=your-s3-secret

# 4. Start containers
docker-compose up -d

# 5. Wait 30 seconds for PostgreSQL to initialize, then:
docker-compose logs -f app

# 6. Access application
# Frontend: http://localhost:3000
# MinIO Console: http://localhost:9001 (dev only)
```

**That's it!** Application is ready with:
- ✅ PostgreSQL database initialized
- ✅ Prisma migrations applied
- ✅ Sample data seeded (65 products)
- ✅ MinIO S3 storage ready
- ✅ Next.js application running

---

## 📋 Docker Compose Services

### 1. PostgreSQL (Database)

```yaml
postgres:
  image: postgres:16-alpine
  container_name: acrobaticz-postgres
  environment:
    POSTGRES_DB: acrobaticz
    POSTGRES_USER: acrobaticz_user
    POSTGRES_PASSWORD: ${DB_PASSWORD}
  volumes:
    - postgres_data:/var/lib/postgresql/data
  ports:
    - "5432:5432"
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
    interval: 10s
    timeout: 5s
    retries: 5
```

**Purpose**: Persistent data storage for all application entities
**Access**: `postgresql://acrobaticz_user:password@postgres:5432/acrobaticz`
**Data**: Stored in `postgres_data` volume (survives container restart)

### 2. MinIO (Object Storage)

```yaml
minio:
  image: minio/minio
  container_name: acrobaticz-minio
  environment:
    MINIO_ROOT_USER: ${S3_ACCESS_KEY}
    MINIO_ROOT_PASSWORD: ${S3_SECRET_KEY}
  volumes:
    - ${STORAGE_PATH}:/data
  ports:
    - "9000:9000"
    - "9001:9001"
  command: >
    server /data
    --console-address ":9001"
```

**Purpose**: S3-compatible file storage for quotes, images, documents
**Access**: 
- API: `http://localhost:9000`
- Console: `http://localhost:9001`
**Data**: Stored in `./storage/minio` (configurable via `STORAGE_PATH`)
**Console Credentials**: Use `S3_ACCESS_KEY` and `S3_SECRET_KEY`

### 3. Next.js Application

```yaml
app:
  build:
    context: .
    dockerfile: Dockerfile
  container_name: acrobaticz-app
  environment:
    NODE_ENV: production
    DATABASE_URL: ${DATABASE_URL}
    JWT_SECRET: ${JWT_SECRET}
    # ... all other env vars
  depends_on:
    postgres:
      condition: service_healthy
    minio:
      condition: service_started
  ports:
    - "3000:3000"
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

**Purpose**: Main application frontend + API backend
**Access**: `http://localhost:3000`
**Depends On**: PostgreSQL (healthy), MinIO (started)
**Auto-runs**: Database migrations, seeding (if `SEED_ON_START=true`)

### 4. Nginx (Reverse Proxy) - Optional

```yaml
nginx:
  image: nginx:alpine
  container_name: acrobaticz-nginx
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/ssl:/etc/nginx/ssl:ro
  ports:
    - "80:80"
    - "443:443"
  depends_on:
    - app
```

**Purpose**: Reverse proxy, HTTPS termination, load balancing (production)
**Access**: `http://localhost` or `https://localhost` (if SSL configured)
**Configuration**: `./nginx/nginx.conf`

---

## 🔧 Common Docker Commands

```bash
# Start containers
docker-compose up -d

# View logs
docker-compose logs -f app         # Follow app logs
docker-compose logs -f postgres    # Database logs
docker-compose logs -f minio       # Storage logs

# Check container status
docker-compose ps

# Stop containers (preserves data)
docker-compose down

# Remove containers AND volumes (WARNING: deletes data!)
docker-compose down -v

# Rebuild containers (after Dockerfile changes)
docker-compose build

# Execute command in running container
docker-compose exec app npm run db:seed

# Restart specific service
docker-compose restart app

# View service details
docker-compose inspect app
```

---

## 📊 Health Checks

### PostgreSQL Health

```bash
# Check if PostgreSQL is healthy
docker-compose ps postgres

# Connect to database directly
docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz -c "SELECT 1"

# View database size
docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz -c "\l+"
```

### Application Health

```bash
# Check app health endpoint
curl http://localhost:3000/api/health

# View application logs
docker-compose logs app | tail -50
```

### MinIO Health

```bash
# Check MinIO console (browser)
open http://localhost:9001

# List buckets via MinIO CLI
docker-compose exec minio mc ls local/
```

---

## 💾 Data Management

### Database Backup

```bash
# Backup PostgreSQL database
docker-compose exec postgres pg_dump -U acrobaticz_user acrobaticz > backup.sql

# Restore from backup
cat backup.sql | docker-compose exec -T postgres psql -U acrobaticz_user -d acrobaticz

# Backup with compression
docker-compose exec postgres pg_dump -U acrobaticz_user -F c acrobaticz > backup.dump
```

### Database Seeding

```bash
# Auto-seed on startup (via SEED_ON_START=true)
docker-compose up -d

# Manual seed after startup
docker-compose exec app npm run db:seed

# Seed with verbose output
docker-compose exec app npm run db:seed:verbose

# Clean seed (delete all data first)
docker-compose exec app npm run db:seed:clean

# Dry-run (preview changes without applying)
docker-compose exec app npm run db:seed:dry-run
```

### Storage Backup (MinIO)

```bash
# Backup all files from MinIO bucket
docker-compose exec minio mc cp --recursive local/acrobaticz ~/backup-bucket/

# List bucket contents
docker-compose exec minio mc find local/acrobaticz/

# Delete file from bucket
docker-compose exec minio mc rm local/acrobaticz/path/to/file.pdf
```

---

## 🌍 Environment Variables (Docker-Specific)

### Required for Docker

```bash
# Database
DB_NAME=acrobaticz
DB_USER=acrobaticz_user
DB_PASSWORD=change_me_strong_password_123
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}?schema=public

# Application
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Storage (MinIO)
STORAGE_PATH=./storage/minio
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin_change_me_123

# Authentication
JWT_SECRET=your-jwt-secret-here

# Translation (optional)
DEEPL_API_KEY=your-deepl-api-key-here
```

### Important Notes

- **Docker hostnames**: Use service names (postgres, minio) instead of localhost
- **DATABASE_URL**: Must include `?schema=public` for Prisma
- **STORAGE_PATH**: Path inside container (typically `./storage/minio` for local)
- **Volumes**: Persist data even after container restart

---

## ⚠️ Troubleshooting

### "Connection refused" to PostgreSQL

```bash
# Check if postgres container is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Verify connection string
echo $DATABASE_URL

# Test manually
docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz -c "SELECT 1"
```

### "Failed to connect to MinIO"

```bash
# Check MinIO container is running
docker-compose ps minio

# Test MinIO connectivity
curl http://localhost:9000/minio/health/live

# Access MinIO console (verify credentials)
open http://localhost:9001
```

### "Application won't start"

```bash
# View detailed error logs
docker-compose logs app

# Check container status
docker-compose ps app

# Rebuild containers
docker-compose down
docker-compose build
docker-compose up -d

# Restart with fresh start
docker-compose down -v
docker-compose up -d
```

### "Migrations not applied"

```bash
# Run migrations manually
docker-compose exec app npm run db:migrate

# Check migration status
docker-compose exec app npx prisma migrate status

# View Prisma schema
docker-compose exec app cat prisma/schema.prisma
```

### "Out of disk space"

```bash
# Check Docker disk usage
docker system df

# Clean up unused images/volumes
docker system prune -a

# Check PostgreSQL size
docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz -c "SELECT pg_size_pretty(pg_database_size('acrobaticz'))"

# Check MinIO storage
du -sh ./storage/minio/
```

---

## 🔒 Security Best Practices (Docker)

### Development Environment

```bash
# Expose only needed ports
# Do NOT expose 5432 (PostgreSQL) externally
ports:
  - "3000:3000"    # App only
  - "9001:9001"    # MinIO console (dev only)

# Use secure passwords in .env
DB_PASSWORD=GenerateWith:_openssl_rand_-base64_32
JWT_SECRET=GenerateWith:_openssl_rand_-base64_32
```

### Production Environment

```bash
# Hide database completely
ports: []  # No external port for postgres

# Nginx handles HTTPS
# MinIO console disabled or require VPN

# Use Docker secrets instead of .env
# Store in: /run/secrets/db_password

# Use read-only volumes where possible
volumes:
  - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
```

### Secrets Management

```bash
# Using Docker Secrets (production)
docker secret create db_password /path/to/password.txt
docker secret create jwt_secret /path/to/jwt.txt

# Reference in docker-compose.yml
secrets:
  db_password:
    external: true
  jwt_secret:
    external: true

environment:
  DB_PASSWORD_FILE: /run/secrets/db_password
  JWT_SECRET_FILE: /run/secrets/jwt_secret
```

---

## 📈 Performance Tuning

### PostgreSQL Optimization

```yaml
postgres:
  environment:
    # Increase shared buffers (if plenty of RAM)
    POSTGRES_INITDB_ARGS: "-c shared_buffers=256MB -c max_connections=200"
  
  # Add more resources if needed
  deploy:
    resources:
      limits:
        memory: 2G
```

### Application Resource Limits

```yaml
app:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 1G
      reservations:
        cpus: '0.5'
        memory: 512M
```

### MinIO Optimization

```yaml
minio:
  environment:
    # For high-performance storage
    MINIO_ARGS: "server /data --address :9000 --console-address :9001"
  
  deploy:
    resources:
      limits:
        memory: 512M
```

---

## 🔄 Docker Compose Override

For local development, create `docker-compose.override.yml`:

```yaml
version: '3.9'

services:
  app:
    environment:
      NODE_ENV: development
      DEBUG: 'true'
      LOG_LEVEL: debug
    ports:
      - "3000:3000"
    volumes:
      - ./src:/app/src  # Hot reload code changes

  postgres:
    ports:
      - "5432:5432"  # Expose for local tools

  minio:
    ports:
      - "9000:9000"
      - "9001:9001"
```

Use: `docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d`

---

## 📚 Related Documentation

- [ENVIRONMENT.md](../ENVIRONMENT.md) - All environment variables
- [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) - Local setup without Docker
- [PRODUCTION_DEPLOYMENT.md](../DEPLOYMENT/PRODUCTION_DEPLOYMENT.md) - Production on VPS/Cloud

---

**Last Updated**: January 18, 2026 | **Status**: Production Ready ✅
