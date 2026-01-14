# 🐳 Docker Deployment Guide - Acrobaticz

Complete Docker setup for production deployment.

---

## Quick Start (< 1 Minute)

```bash
# 1. Set environment variables
export DB_PASSWORD="your-secure-password"
export JWT_SECRET="your-super-secret-jwt-key"

# 2. Start services
docker-compose up -d

# 3. Access application
# App: http://localhost:3000
# Logs: docker-compose logs -f app
```

---

## Components

### Multi-Stage Dockerfile (Optimized)

**Size Optimization:**
- **Stage 1 (Dependencies):** 280MB
- **Stage 2 (Builder):** 1.2GB (discarded after build)
- **Stage 3 (Runtime):** 280-320MB final image

**Security:**
- Non-root user (`nextjs:nodejs`)
- Alpine Linux (minimal attack surface)
- Read-only filesystem support
- Health checks built-in

**Features:**
- Next.js 15 `standalone` mode (fastest)
- Prisma ORM integration
- PostgreSQL connectivity
- Docker signal handling (tini)

### Docker Compose Services

| Service | Image | Purpose | Port |
|---------|-------|---------|------|
| **postgres** | postgres:16-alpine | Database | 5432 |
| **app** | acrobaticz:latest | Web Application | 3000 |
| **nginx** | nginx:alpine | Reverse Proxy | 80/443 |

### Entrypoint Script (docker-entrypoint.sh)

Handles initialization sequence:

1. ✓ Verify environment variables
2. ✓ Wait for PostgreSQL (with retries)
3. ✓ Test database connectivity
4. ✓ Run migrations (`prisma migrate deploy`)
5. ✓ Optional database seeding
6. ✓ Start application

**Error Handling:**
- Retry logic with exponential backoff
- Colored logging for clarity
- Graceful timeout handling
- Detailed error messages

---

## Configuration

### Environment Variables

**Required:**

```bash
DB_PASSWORD=your-secure-postgres-password
JWT_SECRET=your-long-random-jwt-secret-key
```

**Optional:**

```bash
DEEPL_API_KEY=your-deepl-api-key  # For translations
DOMAIN=acrobaticz.example.com     # For Nginx
NODE_ENV=production
SEED_DATABASE=false
```

### Database

**Connection:**
```
postgresql://acrobaticz_user:PASSWORD@postgres:5432/acrobaticz
```

**Volumes:**
- `postgres_data:/var/lib/postgresql/data` - Persistent database files

### Application

**Port:** 3000  
**Health Check:** `GET /api/health`  
**Storage:** `/app/public/uploads` (persistent volume)

---

## Usage

### Start Services

```bash
# Build and start in foreground
docker-compose up

# Start in background
docker-compose up -d

# Build without starting
docker-compose build

# Rebuild without cache
docker-compose build --no-cache
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app

# PostgreSQL only
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs -n 100 app
```

### Stop Services

```bash
# Stop (containers remain)
docker-compose stop

# Stop and remove containers
docker-compose down

# Down with volume removal (⚠️ deletes data!)
docker-compose down -v
```

### Execute Commands

```bash
# Bash in app container
docker-compose exec app sh

# Run migration
docker-compose exec app npx prisma migrate deploy

# Run database seed
docker-compose exec app npm run db:seed

# Run tests
docker-compose exec app npm run test:run

# Database psql
docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz
```

---

## Monitoring & Health

### Health Checks

All services have built-in health checks:

```bash
# Check service status
docker-compose ps

# Expected output:
# NAME                    STATUS
# acrobaticz-postgres     Up (healthy)
# acrobaticz-app          Up (healthy)
# acrobaticz-nginx        Up
```

### View Metrics

```bash
# CPU & Memory usage
docker stats

# Service details
docker-compose inspect app
```

### Logs

```bash
# Real-time logs
docker-compose logs -f

# Follow specific container
docker-compose logs -f app --tail=50

# Timestamps included
docker-compose logs --timestamps app
```

---

## Database Management

### Backup

```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump \
  -U acrobaticz_user acrobaticz > backup.sql

# Backup with compression
docker-compose exec postgres pg_dump \
  -U acrobaticz_user -F c acrobaticz > backup.dump
```

### Restore

```bash
# From SQL dump
docker-compose exec -T postgres psql \
  -U acrobaticz_user acrobaticz < backup.sql

# From compressed dump
docker-compose exec postgres pg_restore \
  -U acrobaticz_user -d acrobaticz backup.dump
```

### Migrations

```bash
# Run migrations
docker-compose exec app npx prisma migrate deploy

# Create new migration (after schema change)
docker-compose exec app npx prisma migrate dev --name migration_name

# Check migration status
docker-compose exec app npx prisma migrate status
```

### Data Operations

```bash
# Seed database
docker-compose exec app npm run db:seed

# Seed with defaults only
docker-compose exec app npm run db:seed:defaults

# Dry run (no changes)
docker-compose exec app npm run db:seed:dry-run
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Update `DB_PASSWORD` to strong value
- [ ] Update `JWT_SECRET` to random string (32+ characters)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `DEEPL_API_KEY` if using translations
- [ ] Configure `DOMAIN` for SSL certificates
- [ ] Create `.env` file with all secrets
- [ ] Test locally with `docker-compose up`
- [ ] Review logs: `docker-compose logs`

### Environment Files

Create `.env` file (NOT in version control):

```bash
# Database
DB_PASSWORD=your-super-secure-password-here

# JWT
JWT_SECRET=your-long-random-secret-key-here-min-32-chars

# Optional: API Keys
DEEPL_API_KEY=your-deepl-key
DOMAIN=your-domain.com
```

### Security Hardening

```bash
# Set restrictive file permissions
chmod 600 .env
chmod 600 docker-compose.yml

# Verify running as non-root
docker-compose exec app id
# uid=1001(nextjs) gid=1001(nodejs)

# Enable read-only filesystem (optional)
# Add to app service in docker-compose.yml:
# read_only: true
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
docker-compose logs app

# Common issues:
# 1. DATABASE_URL not set: Add to .env
# 2. Port 3000 in use: docker-compose down
# 3. Build errors: docker-compose build --no-cache

# Reset everything
docker-compose down -v
docker system prune -a
docker-compose up --build
```

### Database Connection Failed

```bash
# Test database connectivity
docker-compose exec app npx prisma db execute --stdin
# Should succeed without error

# Check database status
docker-compose exec postgres pg_isready

# View database logs
docker-compose logs postgres
```

### Out of Memory

```bash
# Check current limits
docker-compose ps --no-trunc

# Increase in docker-compose.yml:
# deploy:
#   resources:
#     limits:
#       memory: 2G  # Increase from 1G

# Restart with new limits
docker-compose up -d
```

### Slow Build Times

```bash
# Clear build cache
docker builder prune

# Build with progress
docker-compose build --progress=plain

# Check large layers
docker history acrobaticz:latest --human --no-trunc
```

---

## Advanced Configuration

### Custom Nginx Config

Edit `nginx/default.conf`:

```nginx
upstream app {
    server app:3000;
}

server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Environment Variable Secrets

Use Docker secrets instead of .env:

```bash
# Create secrets
echo "password123" | docker secret create db_password -
echo "jwt_secret_key" | docker secret create jwt_secret -

# Reference in compose:
# secrets:
#   db_password:
#     external: true
#   jwt_secret:
#     external: true
```

### Multi-Container Setup

Run multiple instances with load balancing:

```bash
# Scale app service
docker-compose up -d --scale app=3

# Nginx will round-robin requests
```

---

## Performance Optimization

### Build Optimization

```bash
# BuildKit (faster, better caching)
export DOCKER_BUILDKIT=1
docker-compose build

# Layer caching
docker-compose build --cache-from acrobaticz:latest
```

### Runtime Optimization

```bash
# Enable memory swaps
# In docker-compose.yml:
# deploy:
#   resources:
#     limits:
#       memory: 1G
#       memswap_limit: 2G
```

### Database Optimization

```bash
# Enable connection pooling in DATABASE_URL:
# postgresql://user:pass@host/db?poolingMode=transaction&max_pool_size=20
```

---

## Maintenance

### Regular Tasks

```bash
# Weekly: Check logs for errors
docker-compose logs app | grep ERROR

# Monthly: Backup database
docker-compose exec postgres pg_dump -U acrobaticz_user acrobaticz > backup-$(date +%Y%m%d).sql

# Quarterly: Update images
docker-compose pull
docker-compose up -d

# After updates: Verify health
docker-compose ps
docker-compose logs --tail=50 app
```

### Cleanup

```bash
# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything (⚠️ DESTRUCTIVE)
docker system prune -a --volumes
```

---

## References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Next.js Docker](https://nextjs.org/docs/deployment/docker)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Prisma Migrations](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate)

---

**Last Updated:** 2026-01-14  
**Status:** ✅ Production Ready

