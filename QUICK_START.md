# 🚀 Acrobaticz - Quick Start Guide (End-User Edition)

## ⚡ 5-Minute Setup

### Step 1: Prerequisites (One-Time)

**For Linux (Ubuntu/Debian):**
```bash
# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

**For macOS:**
```bash
# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop

# Verify installation
docker --version
docker-compose --version
```

**For Windows (WSL2):**
```bash
# Install Docker Desktop with WSL2
# Follow: https://docs.docker.com/desktop/install/windows-install/

# In WSL2 terminal:
docker --version
docker-compose --version
```

---

### Step 2: Clone & Configure (5 minutes)

```bash
# Navigate to project
cd /path/to/Acrobaticz

# Copy production configuration
cp .env.prod .env

# Edit configuration (optional, has working defaults)
nano .env

# Key things to change:
# - DB_PASSWORD: Change to something strong
# - JWT_SECRET: Generate with: openssl rand -base64 32
# - DOMAIN: Change from localhost to your domain
```

---

### Step 3: Deploy (2 minutes)

```bash
# Start all services (creates directories automatically)
docker-compose up -d

# Watch the startup process
docker-compose logs -f app

# Wait ~60 seconds for full startup
```

---

### Step 4: Seed the Database (1 minute - OPTIONAL)

```bash
# Option A: Automatic seeding (on first run)
# Set SEED_ON_START=true in .env, then restart:
docker-compose restart app

# Option B: Manual seeding via API
curl -X POST http://localhost:3000/api/setup/seed-catalog \
  -H "Content-Type: application/json" \
  -d '{"force": false}'

# Option C: CLI seeding
docker-compose exec app npm run seed
```

---

### Step 5: Access Application

```
🌐 Web App:       http://localhost:3000
🪣 MinIO Console: http://localhost:9001 (minioadmin / miniopass123)
🐘 Database:      localhost:5432
```

**Default Admin Credentials** (if seeded):
- Email: `admin@acrobaticz.com`
- Password: Check logs or `.env` file

---

## ✅ Verify Everything Works

```bash
# Check all services are running
docker-compose ps

# Should show all containers as "Up"
# If any show "Exit", check logs:
docker-compose logs app
docker-compose logs postgres
docker-compose logs minio
```

---

## 🛠️ Common Tasks

### View Application Logs

```bash
# Last 50 lines
docker-compose logs app --tail=50

# Follow in real-time
docker-compose logs -f app

# All services
docker-compose logs -f
```

### Stop Services

```bash
# Stop (data persists)
docker-compose down

# Stop & delete all data (clean slate)
docker-compose down -v
```

### Restart Services

```bash
docker-compose restart

# Or specific service
docker-compose restart app
```

### Access Database Shell

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz

# Useful commands:
# \dt - list tables
# SELECT * FROM users; - query users
# \q - quit
```

### Access MinIO Console

```
URL: http://localhost:9001
User: minioadmin
Password: miniopass123

# Or use MinIO CLI
docker-compose exec minio mc ls minio/acrobaticz
```

---

## 🌍 Deploy to Production Server

### On AWS EC2 / DigitalOcean / Linode

```bash
# SSH into server
ssh ubuntu@your-server.com

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Clone repository
git clone https://github.com/yourusername/acrobaticz.git
cd acrobaticz

# Copy production config
cp .env.prod .env
nano .env  # Update with your settings

# Deploy
docker-compose up -d

# Setup SSL/HTTPS (optional but recommended)
# Follow: https://certbot.eff.org/instructions
```

### On Raspberry Pi 4+ (ARM64)

```bash
# Same steps as Linux above
# Build automatically detects ARM64 and optimizes

# May take longer (20-30 minutes for build)
# But will work perfectly
```

---

## 📊 Database Seeding Options

### Auto-Seed on First Run (Recommended)

**In `.env`:**
```env
SEED_ON_START=true    # Auto-seed on first startup
FORCE_SEED=false      # Don't delete existing data
SEED_CLEAN=false      # Don't clean before seeding
SEED_VERBOSE=false    # Quiet output
```

**Then restart:**
```bash
docker-compose restart app
```

### Manual Seed via API

```bash
# Seed with default data
curl -X POST http://localhost:3000/api/setup/seed-catalog

# Force reseed (deletes existing data)
curl -X POST http://localhost:3000/api/setup/seed-catalog \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```

### Reset Database Completely

```bash
# Delete all data and restart
docker-compose down -v
docker-compose up -d

# Re-seed if needed
docker-compose exec app npm run seed
```

---

## 🔐 Security Tips

1. **Change all passwords in `.env`:**
   ```bash
   openssl rand -base64 32  # Generate strong secret
   ```

2. **Use HTTPS in production:**
   - Update `DOMAIN` to your actual domain
   - Set `ENABLE_HTTPS=true`
   - Generate SSL certificate with Let's Encrypt

3. **Backup regularly:**
   ```bash
   # Backup database
   docker-compose exec postgres pg_dump -U acrobaticz_user acrobaticz > backup.sql
   
   # Backup MinIO storage
   docker-compose exec minio mc cp --recursive minio/acrobaticz ./backups/
   ```

---

## ❌ Troubleshooting

### Application won't start

```bash
# Check logs
docker-compose logs app

# Common issues:
# 1. Database not ready - wait 30 seconds
# 2. Port 3000 in use - change PORT in .env
# 3. Out of memory - check available RAM
```

### Database connection error

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Reset database
docker-compose down
docker-compose up -d postgres
```

### MinIO storage issues

```bash
# Check MinIO logs
docker-compose logs minio

# Create missing bucket
docker-compose exec minio mc mb minio/acrobaticz
```

### Port conflicts

```bash
# Check what's using ports
lsof -i :3000
lsof -i :5432
lsof -i :9000
lsof -i :9001

# Or change ports in .env
PORT=3001  # Use different port
```

---

## 📞 Getting Help

**Check logs first:**
```bash
docker-compose logs -f app
```

**Common log errors & solutions:**

| Error | Solution |
|-------|----------|
| `connect ECONNREFUSED 127.0.0.1:5432` | PostgreSQL not ready - wait 30 seconds |
| `Cannot write to /app/tmp` | Permission issue - restart Docker |
| `port already in use` | Change PORT in .env |
| `OutOfMemory` | Increase Docker memory limit |

---

## 🎓 Next Steps

1. **First startup**: Application should be ready in 1-2 minutes
2. **Seed data**: Use one of the seeding options above
3. **Access**: Open http://localhost:3000
4. **Customize**: Update `.env` for your needs
5. **Backup**: Set up automated backups

---

## 📋 Checklist

- [ ] Docker installed and running
- [ ] `.env` configured
- [ ] Services started with `docker-compose up -d`
- [ ] All containers show "Up" in `docker-compose ps`
- [ ] Application accessible at http://localhost:3000
- [ ] Database seeded (if needed)
- [ ] Backups configured

---

**Version:** 1.0  
**Last Updated:** 2026-01-18  
**Support:** Check DOCKER_PORTABILITY_GUIDE.md for advanced topics
