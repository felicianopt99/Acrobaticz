# 🚀 Acrobaticz Docker Portability Guide

## Ultra-Portable Cross-Platform Deployment

This guide provides comprehensive instructions for deploying Acrobaticz on **any server or computer**, including ARM64 systems, cloud providers, and local machines.

---

## 🎯 Quick Start (All Platforms)

### 1. **Initialize Environment**

```bash
# Clone/navigate to project
cd /path/to/Acrobaticz

# Create data directories (auto-created by Docker volumes, but helpful)
mkdir -p data/{postgres,minio,app_storage,app_cache,app_tmp}

# Create production environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

### 2. **Build Multi-Platform Images**

```bash
# Install buildx (one-time setup)
docker buildx create --name acrobaticz-builder
docker buildx use acrobaticz-builder

# Build for both amd64 and arm64
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag acrobaticz:latest \
  --tag acrobaticz:$(date +%Y%m%d) \
  --push \
  .

# Or build locally (single platform)
docker build -t acrobaticz:latest .
```

### 3. **Deploy on Any Platform**

```bash
# Production deployment
docker-compose up -d

# Development with hot-reload
docker-compose -f docker-compose.dev.yml up

# Testing
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Check status
docker-compose ps
docker-compose logs -f app
```

---

## 🌍 Platform-Specific Deployment

### **Linux (x86-64) - AWS EC2, DigitalOcean, Linode**

```bash
# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Deploy
cd /home/ubuntu/acrobaticz
cp .env.example .env
nano .env
docker-compose up -d

# Verify
docker-compose ps
curl http://localhost:3000/api/health
```

### **ARM64 - AWS Graviton, Apple Silicon Docker, Raspberry Pi 4+**

```bash
# Raspberry Pi 4+ setup (Ubuntu 22.04 LTS ARM64)
sudo apt update && sudo apt install -y docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Deploy (auto-detects ARM64)
docker-compose up -d

# Monitor (ARM systems may need more startup time)
docker-compose ps
docker-compose logs -f app  # Watch for startup
```

**Note:** The Dockerfile automatically optimizes for ARM64:
- Extended build timeouts (20 minutes for ARM)
- Optimized Node.js memory settings
- Tuned health checks for slower systems

### **macOS (Intel & Apple Silicon)**

```bash
# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop

# Clone repository
git clone https://github.com/yourusername/acrobaticz.git
cd acrobaticz

# Deploy
cp .env.example .env
nano .env
docker-compose up -d

# Access
open http://localhost:3000

# Development with file watching
docker-compose -f docker-compose.dev.yml up
```

### **Windows (WSL2)**

```powershell
# Install WSL2 & Docker Desktop
# Guide: https://docs.docker.com/desktop/install/windows-install/

# In WSL2 terminal
wsl
cd /mnt/c/path/to/acrobaticz

# Deploy
cp .env.example .env
nano .env  # Edit with your settings
docker-compose up -d

# Access
# Browser: http://localhost:3000
```

---

## 🔧 Environment Configuration

### **Required `.env` Variables**

```env
# ============================================================
# Core Configuration (REQUIRED - CHANGE THESE!)
# ============================================================

# Database
DB_NAME=acrobaticz
DB_USER=acrobaticz_user
DB_PASSWORD=your_secure_random_password_here_123
DATABASE_URL=postgresql://acrobaticz_user:password@postgres:5432/acrobaticz?schema=public

# Security Secrets (Generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_here_change_this_in_production
ENCRYPTION_KEY=your_encryption_key_here_change_this_in_production
NEXTAUTH_SECRET=same_as_jwt_secret

# MinIO S3 Storage
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=your_minio_password_here_123
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=your_minio_password_here_123
S3_BUCKET=acrobaticz
S3_REGION=us-east-1

# Domain/URL
DOMAIN=yourdomain.com
NEXTAUTH_URL=https://yourdomain.com

# ============================================================
# Optional Configuration
# ============================================================

# External storage paths (set for AWS EBS, external drives)
STORAGE_PATH=./storage/minio          # Local: ./storage/minio
DATA_PATH=./data/postgres             # Local: ./data/postgres

# Optional: Translation API
DEEPL_API_KEY=your_deepl_key_if_needed

# Debugging
DEBUG=false
LOG_LEVEL=info
NODE_ENV=production
```

### **Generate Secure Secrets**

```bash
# JWT Secret (32 bytes = 44 chars in base64)
openssl rand -base64 32

# Encryption Key
openssl rand -base64 32

# PostgreSQL Password (strong)
openssl rand -base64 32

# Example .env values
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)
```

---

## 💾 Volume & Storage Management

### **Data Persistence Across Platforms**

All volumes use **named volumes with bind mounts** for maximum portability:

```yaml
volumes:
  postgres_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ${PWD}/data/postgres     # Auto-resolves on all platforms
```

### **External Storage Options**

#### **Option 1: External USB Drive (Linux/macOS)**

```bash
# Mount USB drive
sudo mount /dev/sda1 /mnt/external

# Set in .env
export DATA_PATH=/mnt/external/acrobaticz-data
export STORAGE_PATH=/mnt/external/acrobaticz-storage

# Deploy
docker-compose up -d
```

#### **Option 2: NAS/Network Storage**

```bash
# Mount NFS (Linux)
sudo mount -t nfs nas.local:/exports/acrobaticz /mnt/nas

# Set in .env
export DATA_PATH=/mnt/nas/postgres
export STORAGE_PATH=/mnt/nas/minio

docker-compose up -d
```

#### **Option 3: AWS EBS / Cloud Storage**

```bash
# Attach EBS volume and mount
sudo mount /dev/nvme1n1 /mnt/ebs

# Set in .env
export DATA_PATH=/mnt/ebs/postgres
export STORAGE_PATH=/mnt/ebs/minio

docker-compose up -d
```

#### **Option 4: Docker Named Volumes (Portable)**

```bash
# Create managed volumes
docker volume create postgres_data
docker volume create minio_storage

# Use in docker-compose.yml
volumes:
  postgres_data:
  minio_storage:

# Docker manages paths automatically (most portable)
docker-compose up -d
```

---

## 🏗️ Architecture & Multi-Platform Support

### **Supported Architectures**

| Architecture | Status | Best For | Notes |
|---|---|---|---|
| `linux/amd64` | ✅ Fully Supported | AWS EC2, DigitalOcean, Linode | Native x86-64, fastest |
| `linux/arm64/v8` | ✅ Fully Supported | AWS Graviton, Apple Silicon | Emerging, cost-effective |
| `linux/arm/v7` | ✅ Fully Supported | Raspberry Pi 3-4 | Slower, older boards |
| `darwin/amd64` | ✅ Docker Desktop | macOS Intel | Via Docker Desktop |
| `darwin/arm64` | ✅ Docker Desktop | macOS Apple Silicon | Native M1/M2/M3 |
| `windows/amd64` | ✅ WSL2 | Windows 10/11 | Via WSL2 container |

### **Image Size (All Platforms)**

- **Builder stage**: ~2.5GB (deleted after build)
- **Final runtime**: ~350MB (Alpine-based)
- **Multi-platform push**: ~1GB total (all architectures)

---

## 🚨 Troubleshooting

### **Connection Refused / Timeout**

```bash
# Check service health
docker-compose ps
docker-compose logs app

# Common fixes:
# 1. Wait for services to be ready
docker-compose exec app curl -sf http://localhost:3000/api/health

# 2. Increase start_period in docker-compose.yml (slow systems)
# Change start_period from 90s to 120s+ for ARM64/old hardware

# 3. Check disk space
df -h
docker system df
```

### **Out of Memory**

```bash
# Check memory usage
docker stats

# Reduce memory limits in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 512M  # Reduce from 1.5G

# Restart services
docker-compose restart
```

### **Database Migration Fails**

```bash
# Check database logs
docker-compose logs postgres

# Manual migration
docker-compose exec app npx prisma migrate deploy

# Reset database (careful!)
docker-compose exec app npx prisma migrate reset
```

### **MinIO Storage Issues**

```bash
# Check MinIO console
open http://localhost:9001
# Default: minioadmin / password from .env

# Create bucket if missing
docker-compose exec minio mc mb minio/acrobaticz

# Check storage path
docker-compose exec minio mc du minio/acrobaticz
```

---

## 🔐 Production Deployment Checklist

### **Pre-Deployment**

- [ ] Change all default passwords in `.env`
- [ ] Generate strong JWT_SECRET and ENCRYPTION_KEY
- [ ] Set correct DOMAIN and NEXTAUTH_URL
- [ ] Configure HTTPS/SSL certificates
- [ ] Set NODE_ENV=production
- [ ] Disable MinIO console (remove port 9001)
- [ ] Enable database backups
- [ ] Set resource limits appropriately for server size
- [ ] Configure log rotation (max-size, max-file)

### **Networking**

- [ ] Setup reverse proxy (Nginx) for SSL/TLS
- [ ] Configure firewall rules (only expose 80, 443)
- [ ] Enable HTTPS only (redirect 80→443)
- [ ] Setup domain DNS records
- [ ] Configure rate limiting
- [ ] Setup fail2ban for brute-force protection

### **Monitoring**

- [ ] Setup health check alerts
- [ ] Configure log aggregation (ELK, Datadog)
- [ ] Setup CPU/Memory monitoring
- [ ] Configure disk space alerts
- [ ] Enable database monitoring

### **Backup & Recovery**

- [ ] Daily database backups to S3
- [ ] Weekly full system backups
- [ ] Test restore procedure
- [ ] Document recovery steps
- [ ] Setup automated backup rotation

---

## 📊 Performance Tuning

### **Database Optimization**

```env
# Connection pooling
DB_POOL_SIZE=20              # Increase for high traffic
DB_TIMEOUT=30000             # Connection timeout

# PostgreSQL settings
POSTGRES_INITDB_ARGS="-c shared_buffers=512MB -c max_connections=200"
```

### **Application Memory**

```env
# For small servers (512MB RAM)
NODE_OPTIONS="--max_old_space_size=256"

# For medium servers (2GB RAM)
NODE_OPTIONS="--max_old_space_size=1024"

# For large servers (4GB+ RAM)
NODE_OPTIONS="--max_old_space_size=2048"
```

### **Resource Limits**

```yaml
deploy:
  resources:
    limits:
      cpus: '4'         # Max CPU cores to use
      memory: 2G        # Max memory
    reservations:
      cpus: '2'         # Guaranteed CPU
      memory: 1G        # Guaranteed memory
```

---

## 🎓 Advanced Topics

### **Blue-Green Deployment**

```bash
# Run new version alongside old
docker-compose -f docker-compose.prod.yml -p acrobaticz-blue up -d

# Test new version
curl http://localhost:3001/api/health

# Switch traffic (via Nginx config)
# Then stop old version
docker-compose -p acrobaticz-green down
```

### **Horizontal Scaling**

```bash
# Run multiple app instances
docker-compose -f docker-compose.prod.yml -p acrobaticz-1 up -d
docker-compose -f docker-compose.prod.yml -p acrobaticz-2 up -d

# Use Nginx as load balancer to distribute traffic
```

### **Kubernetes Deployment**

```bash
# Convert to Kubernetes manifests
kompose convert -f docker-compose.yml -o k8s/

# Deploy to Kubernetes
kubectl apply -f k8s/

# Scale
kubectl scale deployment app --replicas=3
```

---

## 📞 Support

For issues or questions:

1. Check logs: `docker-compose logs -f app`
2. Verify configuration: `docker-compose config`
3. Check Docker resources: `docker stats`
4. Review documentation: [Docker Compose Reference](https://docs.docker.com/compose/reference/)

---

**Last Updated**: 2026-01-18  
**Maintainer**: Acrobaticz DevOps Team  
**Version**: 1.0 - Ultra-Portable Edition
