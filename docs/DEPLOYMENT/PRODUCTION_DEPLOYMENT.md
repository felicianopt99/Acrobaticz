# 🚀 Production Deployment Guide - Acrobaticz Elite

Complete guide to deploying Acrobaticz to production environments.

---

## 📋 Pre-Deployment Checklist

- [ ] All environment variables set (see ENVIRONMENT.md)
- [ ] Database backups configured
- [ ] SSL/TLS certificates ready
- [ ] DNS domain configured
- [ ] Static assets optimized
- [ ] API rate limiting configured
- [ ] Monitoring setup (logs, errors)
- [ ] Backup strategy tested
- [ ] Load testing completed
- [ ] Security audit passed

---

## 🏢 Recommended Production Setup

### Architecture

```
Internet
    ↓
[Nginx Reverse Proxy + SSL/TLS]
    ↓
[Load Balancer / Docker Swarm / Kubernetes]
    ↓
[Next.js App Instances × N]
    ↓
[PostgreSQL 16 (Primary + Replica)]
[MinIO S3 (Distributed)]
[Redis Cache (Optional)]
```

---

## 🐳 Production Docker Deployment

### Step 1: Build Production Image

```bash
# Build optimized Docker image
docker build \
  --build-arg NODE_ENV=production \
  -t acrobaticz:v1.0.0 \
  .

# Tag for registry
docker tag acrobaticz:v1.0.0 your-registry.com/acrobaticz:v1.0.0

# Push to registry
docker push your-registry.com/acrobaticz:v1.0.0
```

### Step 2: Production Environment File

```bash
# Create .env.prod (NEVER commit!)
cp .env.example .env.prod

# Edit with strong values
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://prod_user:STRONG_PASSWORD@db.internal:5432/acrobaticz?schema=public
JWT_SECRET=<use-openssl-rand-base64-32>
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=<production-key>
S3_SECRET_KEY=<production-secret>
S3_BUCKET=acrobaticz-prod
DEEPL_API_KEY=<production-api-key>
DOMAIN=rental.yourdomain.com
ENABLE_HTTPS=true
DEBUG=false
LOG_LEVEL=warn
SEED_ON_START=false
```

### Step 3: Deploy

```bash
# Pull latest image
docker pull your-registry.com/acrobaticz:v1.0.0

# Stop old containers
docker-compose -f docker-compose.prod.yml down

# Start new containers
docker-compose -f docker-compose.prod.yml up -d

# Verify deployment
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f app
```

---

## 🛡️ HTTPS/SSL Configuration

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone \
  -d rental.yourdomain.com \
  --email admin@yourdomain.com

# Auto-renewal (automatic)
sudo systemctl enable certbot.timer
```

---

## 💾 Database Backups

### Daily Automated Backups

```bash
# Add to crontab
0 2 * * * docker-compose exec -T postgres pg_dump -U acrobaticz_user acrobaticz | gzip > /backups/acrobaticz-$(date +\%Y\%m\%d).sql.gz

# Restore when needed
gunzip < /backups/acrobaticz-20260118.sql.gz | docker-compose exec -T postgres psql -U acrobaticz_user -d acrobaticz
```

---

## 📊 Monitoring

### Health Checks

```bash
# Application health
curl https://rental.yourdomain.com/api/health

# Database status
docker-compose exec postgres pg_isready -U acrobaticz_user

# View logs
docker-compose logs -f app
```

### Recommended Monitoring Tools

- **DataDog** - Application performance
- **Grafana** - Metrics visualization
- **Prometheus** - Metrics collection
- **ELK Stack** - Log aggregation

---

## 🔒 Security Hardening

### Firewall

```bash
ufw default deny incoming
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Disable Root SSH

```bash
# Edit /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

systemctl restart ssh
```

---

## 🚀 Scaling

### Horizontal Scaling

```
Load Balancer
├─ App Instance 1
├─ App Instance 2
└─ App Instance 3
    ↓
Shared PostgreSQL
Distributed MinIO
```

### Performance Optimization

```bash
# Enable gzip in Nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# Database connection pooling
DATABASE_POOL_SIZE=20

# Redis caching (optional)
REDIS_URL=redis://redis:6379
```

---

## ⚠️ Troubleshooting

### High CPU Usage

```bash
docker stats

# Check slow queries
docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz -c "SELECT query, calls FROM pg_stat_statements ORDER BY calls DESC LIMIT 10;"
```

### Out of Disk Space

```bash
du -sh /var/lib/docker/volumes/

# Clean old backups
find /backups -mtime +30 -delete

# Clean Docker
docker system prune -a
```

---

**Last Updated**: January 18, 2026 | **Status**: Production Ready ✅
