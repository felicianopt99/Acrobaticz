# ✅ Acrobaticz Deployment Checklist

Use this checklist to ensure successful deployment with seeding.

---

## 📋 Pre-Deployment (Before Starting)

### Prerequisites
- [ ] Docker installed (`docker --version`)
- [ ] Docker Compose installed (`docker-compose --version`)
- [ ] Docker daemon running (`docker ps` works)
- [ ] At least 2GB RAM available
- [ ] At least 5GB disk space available
- [ ] Ports 3000, 5432, 9000, 9001 available

**Troubleshooting:**
- Docker not installed? → https://docs.docker.com/get-docker/
- Ports in use? → Check [QUICK_START.md](./QUICK_START.md#troubleshooting)

---

## 🚀 Deployment (Getting Started)

### Step 1: Prepare Environment (5 minutes)

- [ ] Navigate to project directory: `cd /path/to/Acrobaticz`
- [ ] Verify Docker is running: `docker ps`
- [ ] Check available space: `df -h`

### Step 2: Configure (3 minutes)

**Option A: Easy (Recommended)**
```bash
cp .env.prod .env
# Uses production defaults
```

**Option B: Custom**
```bash
cp .env.prod .env
nano .env  # Edit your values
```

Verify:
- [ ] `.env` file created
- [ ] `DATABASE_URL` looks valid
- [ ] `SEED_ON_START=true` (for automatic seeding)
- [ ] Domain matches your setup

### Step 3: Deploy (2 minutes - Choose One)

**Option A: One-Click (Easiest)**
```bash
bash deploy-easy.sh
```
- [ ] Script executed
- [ ] All services started
- [ ] Database seeded

**Option B: Manual**
```bash
docker-compose up -d
```
- [ ] Command executed
- [ ] Wait 60 seconds
- [ ] Check: `docker-compose ps` (all showing "Up")

---

## ✓ Post-Deployment Verification

### Step 1: Check Services (1 minute)

```bash
docker-compose ps
```

Verify all show "Up":
- [ ] acrobaticz-postgres
- [ ] acrobaticz-minio
- [ ] acrobaticz-app

If any show "Exited":
```bash
docker-compose logs [service_name]  # Check error
docker-compose up -d                # Restart
```

### Step 2: Check Seeding (2 minutes)

```bash
docker-compose logs app | grep -i seed
```

Look for:
- [ ] "Seeding database..."
- [ ] "✅ Seeding successful"
- [ ] Or: "Database already seeded"

Or check manually:
```bash
docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz \
  -c "SELECT COUNT(*) FROM users"
```

Should show:
- [ ] At least 3 (the demo users)

### Step 3: Run Verification Script

```bash
bash verify-deployment.sh
```

Should show:
- [ ] ✅ Docker Installed
- [ ] ✅ Docker Compose Installed
- [ ] ✅ Docker Daemon Running
- [ ] ✅ All containers Up
- [ ] ✅ All health checks Pass
- [ ] ✅ Database Seeded
- [ ] ✅ Application Ready

---

## 🌐 Access & Test

### Step 1: Access Application

- [ ] Open browser to: http://localhost:3000
- [ ] Application loads (don't worry if takes 5 seconds)
- [ ] Login page displays

### Step 2: Test Login

Use any seeded user:
- [ ] Email: `admin@acrobaticz.com`
- [ ] Password: `admin123`
- [ ] OR try other demo users (check logs)

After login:
- [ ] Dashboard displays
- [ ] Navigation works
- [ ] Can access products/equipment

### Step 3: Access MinIO Storage Console

- [ ] Open: http://localhost:9001
- [ ] Login with: `minioadmin` / `miniopass123`
- [ ] Can see bucket: `acrobaticz`
- [ ] Upload test works

### Step 4: Database Access (Optional)

```bash
docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz
```

In psql:
- [ ] `SELECT COUNT(*) FROM users;` shows ≥3
- [ ] `SELECT COUNT(*) FROM products;` shows ≥65
- [ ] `\dt` shows all tables
- [ ] `\q` to quit

---

## 📊 Seeding Status

### Check Seeded Data

```bash
# Count everything
docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz << EOF
SELECT 'Users' as type, COUNT(*) FROM users
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Categories', COUNT(*) FROM product_categories
UNION ALL
SELECT 'Clients', COUNT(*) FROM clients
UNION ALL
SELECT 'Partners', COUNT(*) FROM partners;
EOF
```

Expected results:
- [ ] Users: 3
- [ ] Products: 65+
- [ ] Categories: 6+
- [ ] Clients: 1+
- [ ] Partners: 1+

### Seeding Options

If you want to **re-seed** data:

**Option 1: API Seed**
```bash
curl -X POST http://localhost:3000/api/setup/seed-catalog \
  -H "Content-Type: application/json" \
  -d '{"force": false}'
```
- [ ] Command executed
- [ ] Check: http://localhost:3000 for updates

**Option 2: Force Complete Reseed**
```bash
# Warning: Deletes all data!
docker-compose down -v
docker-compose up -d
# Wait ~120 seconds
```
- [ ] All containers restarted
- [ ] Database recreated
- [ ] New seeding completed
- [ ] Application accessible

---

## 🔧 Common Post-Deployment Tasks

### Change Passwords

Edit `.env` and update:
```env
DB_PASSWORD=your_new_password
MINIO_ROOT_PASSWORD=your_new_password
JWT_SECRET=your_new_secret
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

- [ ] Passwords updated
- [ ] Services restarted
- [ ] Application works with new passwords

### Enable HTTPS (Production)

```env
ENABLE_HTTPS=true
CERTBOT_EMAIL=your-email@example.com
DOMAIN=yourdomain.com
```

Restart:
```bash
docker-compose down
docker-compose up -d
```

- [ ] HTTPS enabled
- [ ] Certificate generated
- [ ] Access via https://yourdomain.com

### Setup Backups

Ensure external paths exist:
```bash
mkdir -p /mnt/backup_drive/av-rentals/{cloud-storage,backups,app-data}
```

- [ ] Backup directories created
- [ ] Sufficient disk space (≥100GB)
- [ ] Proper permissions set

### Monitor Logs (Ongoing)

```bash
# Watch all services
docker-compose logs -f

# Watch specific service
docker-compose logs -f app

# View historical logs
docker-compose logs --tail=100 app
```

- [ ] Logs are readable
- [ ] No error messages
- [ ] Application running smoothly

---

## ❌ Troubleshooting Checklist

### Services Not Starting

```bash
# Check what went wrong
docker-compose logs app
```

Common issues:
- [ ] Port already in use? → Change `PORT=` in `.env`
- [ ] Database not ready? → Wait 30 seconds
- [ ] Out of memory? → Check `docker stats`

**Fix:**
```bash
docker-compose restart
```

### Database Issues

```bash
docker-compose logs postgres
docker-compose exec postgres pg_isready
```

If not responding:
- [ ] Check disk space: `df -h`
- [ ] Check memory: `docker stats`
- [ ] Try restart: `docker-compose restart postgres`

### Application Won't Connect to Database

```bash
# Check if database is ready
docker-compose exec postgres pg_isready -U acrobaticz_user -d acrobaticz

# Reset everything
docker-compose down -v
docker-compose up -d
```

- [ ] Database health check passes
- [ ] Application retries connection
- [ ] Application starts successfully

### MinIO Issues

```bash
docker-compose logs minio

# Check bucket exists
docker-compose exec minio mc ls minio/
```

Create bucket if missing:
```bash
docker-compose exec minio mc mb minio/acrobaticz
```

- [ ] MinIO console accessible
- [ ] Bucket exists
- [ ] Upload test works

---

## 📝 Documentation

Make sure you have:
- [ ] Read [QUICK_START.md](./QUICK_START.md)
- [ ] Bookmarked [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)
- [ ] Saved [DOCKER_PORTABILITY_GUIDE.md](./DOCKER_PORTABILITY_GUIDE.md)
- [ ] Referenced [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)

---

## 🎉 Success Indicators

Your deployment is successful when:

### Basic Success
- ✅ All containers showing "Up" in `docker-compose ps`
- ✅ Can access http://localhost:3000
- ✅ Can login with `admin@acrobaticz.com` / `admin123`
- ✅ Application dashboard displays

### Full Success (with Seeding)
- ✅ All of above, PLUS:
- ✅ Database has seeded data (65+ products)
- ✅ Can view products/equipment in application
- ✅ MinIO console accessible and working
- ✅ Verification script passes all checks
- ✅ Can perform basic operations (create quotes, etc.)

---

## 📋 Final Checklist

- [ ] Pre-deployment requirements met
- [ ] Deployment executed successfully
- [ ] All services healthy and running
- [ ] Seeding verified
- [ ] Application accessible
- [ ] Can login
- [ ] Database populated with data
- [ ] Passwords changed (production)
- [ ] Backups configured
- [ ] Documentation reviewed

---

## 🚀 You're Ready!

If all checkmarks are checked above, your Acrobaticz deployment is **complete and ready to use**!

### Next Steps

1. **Explore:** Spend time in the application
2. **Customize:** Update settings and data
3. **Train:** Get your team using it
4. **Backup:** Set up automated backups
5. **Extend:** Add custom features as needed

### Support Resources

- 📖 [QUICK_START.md](./QUICK_START.md)
- 🌍 [DOCKER_PORTABILITY_GUIDE.md](./DOCKER_PORTABILITY_GUIDE.md)
- 📊 [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)
- 📚 [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)
- 🔧 Logs: `docker-compose logs -f`

---

**Date Completed:** ___________  
**Deployed By:** ___________  
**Environment:** ☐ Development ☐ Production ☐ Testing  

**Notes:**
```
_____________________________________________
_____________________________________________
_____________________________________________
```

---

**Version:** 1.0  
**Last Updated:** January 18, 2026
