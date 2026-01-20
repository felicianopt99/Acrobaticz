# 📖 Acrobaticz - Documentation Index

**Welcome!** This file helps you find the right documentation for your needs.

---

## 🚀 **I Want to Start Right Now** (5 minutes)

👉 **[QUICK_START.md](./QUICK_START.md)** ← Start here!

What you'll do:
1. Copy `.env.prod` to `.env`
2. Run `docker-compose up -d`
3. Wait ~60 seconds
4. Access http://localhost:3000 ✅

**Includes:** Database seeding with 65 products, 3 demo users, sample data

---

## 🎯 **I Want a One-Command Deploy**

👉 **[deploy-easy.sh](./deploy-easy.sh)** ← Run this!

```bash
bash deploy-easy.sh
```

What it does:
- ✅ Checks Docker installation
- ✅ Creates directories
- ✅ Sets up `.env` file
- ✅ Builds Docker image
- ✅ Starts all services
- ✅ Seeds database
- ✅ Verifies everything works

---

## 🌍 **I Want to Deploy to Multiple Platforms**

👉 **[DOCKER_PORTABILITY_GUIDE.md](./DOCKER_PORTABILITY_GUIDE.md)**

Covers:
- Linux (AWS, DigitalOcean, Linode)
- macOS (Intel & Apple Silicon)
- Windows (WSL2)
- Raspberry Pi (ARM64)
- Azure, GCP, etc.

---

## 📊 **I Want to Know What's Set Up**

👉 **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)**

Shows:
- ✅ Everything configured
- ✅ Current .env values
- ✅ Seeded data details
- ✅ Security settings
- ✅ Quick commands
- ✅ Verification checklist

---

## 🏗️ **I Want to Understand the Architecture**

👉 **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)**

Includes:
- System design
- Technology stack
- Database schema
- API structure
- Real-time updates

---

## 🔧 **I'm a Developer - Local Setup**

👉 **[docs/SETUP/LOCAL_DEVELOPMENT.md](./docs/SETUP/LOCAL_DEVELOPMENT.md)**

For:
- Node.js + npm local development
- Hot reload with file watching
- Database queries
- Debugging

---

## 📋 **I Need API Documentation**

👉 **[docs/API/](./docs/API/)**

Available:
- `ENDPOINTS.md` - All REST endpoints
- `AUTHENTICATION.md` - Auth flows
- `WEBSOCKET.md` - Real-time updates

---

## 🚀 **I Need Production Deployment**

👉 **[docs/DEPLOYMENT/](./docs/DEPLOYMENT/)**

Contains:
- `PRODUCTION_DEPLOYMENT.md` - Cloud setup
- `SCALING.md` - Load balancing
- `MONITORING.md` - Health checks & alerts
- `BACKUP_RECOVERY.md` - Data protection

---

## 📚 **I Want Full Documentation**

👉 **[README.md](./README.md)**

Complete guide including:
- Features overview
- Technology stack
- Setup options
- Role-based guides
- Troubleshooting

---

## ❓ **I Have Questions / Need Help**

### Quick Answers

| Question | Answer |
|----------|--------|
| How do I start? | See [QUICK_START.md](./QUICK_START.md) |
| Will it automatically seed data? | Yes! `SEED_ON_START=true` by default |
| Can I deploy to AWS? | Yes! See [DOCKER_PORTABILITY_GUIDE.md](./DOCKER_PORTABILITY_GUIDE.md) |
| How do I reset the database? | `docker-compose down -v && docker-compose up -d` |
| What's the admin password? | Set in seeding or `.env` file |
| How do I access MinIO? | http://localhost:9001 (minioadmin/miniopass123) |
| Where are backups stored? | `/mnt/backup_drive/av-rentals/backups` |
| Can I change the port? | Yes, update `PORT=` in `.env` |

### Debugging

1. **Check logs:** `docker-compose logs -f app`
2. **Verify setup:** `bash verify-deployment.sh`
3. **Check status:** `docker-compose ps`
4. **Restart:** `docker-compose restart`

---

## 🎓 **Learning Path by Role**

### 👨‍💼 Business User (Non-Technical)

1. Read: [QUICK_START.md](./QUICK_START.md) (5 min)
2. Run: `bash deploy-easy.sh` (5 min)
3. Access: http://localhost:3000
4. Done! ✅

Next:
- Explore the interface
- Check [docs/FEATURES/](./docs/FEATURES/) for how to use features

### 👨‍💻 Developer

1. Read: [README.md](./README.md) (10 min)
2. Setup: [docs/SETUP/LOCAL_DEVELOPMENT.md](./docs/SETUP/LOCAL_DEVELOPMENT.md) (20 min)
3. API: [docs/API/](./docs/API/) (reference)
4. Code! ✅

Next:
- Fork & contribute
- Check [CONTRIBUTING.md](./CONTRIBUTING.md)

### 👨‍🔧 DevOps / SysAdmin

1. Read: [DOCKER_PORTABILITY_GUIDE.md](./DOCKER_PORTABILITY_GUIDE.md) (15 min)
2. Setup: [docs/DEPLOYMENT/PRODUCTION_DEPLOYMENT.md](./docs/DEPLOYMENT/PRODUCTION_DEPLOYMENT.md) (30 min)
3. Monitor: [docs/DEPLOYMENT/MONITORING.md](./docs/DEPLOYMENT/MONITORING.md) (20 min)
4. Deploy! ✅

Next:
- Configure backups
- Set up monitoring
- Enable HTTPS

---

## 📁 **File Organization**

```
Acrobaticz/
├── 📖 Getting Started
│   ├── QUICK_START.md              ← Start here!
│   ├── DEPLOYMENT_SUMMARY.md       ← What's configured
│   ├── README.md                   ← Full overview
│   └── DOCUMENTATION_INDEX.md      ← This file!
│
├── 🚀 Deployment
│   ├── deploy-easy.sh              ← One-click deploy
│   ├── deploy.sh                   ← Advanced deploy
│   ├── verify-deployment.sh        ← Verify setup
│   ├── Dockerfile                  ← Production build
│   ├── docker-compose.yml          ← Production stack
│   ├── docker-compose.dev.yml      ← Development
│   ├── docker-compose.test.yml     ← Testing
│   ├── docker-entrypoint.sh        ← Startup script
│   ├── .env                        ← Active config
│   ├── .env.prod                   ← Production template
│   └── .env.example                ← All variables
│
├── 📚 Documentation (docs/)
│   ├── ARCHITECTURE.md             ← System design
│   ├── DOCKER_PORTABILITY_GUIDE.md ← Multi-platform
│   ├── ENVIRONMENT.md              ← Configuration
│   ├── CONTRIBUTING.md             ← Development
│   ├── API/                        ← API docs
│   ├── FEATURES/                   ← Feature guides
│   ├── SETUP/                      ← Setup guides
│   └── DEPLOYMENT/                 ← Deploy guides
│
└── 🛠️ Source Code
    ├── src/                        ← Next.js application
    ├── prisma/                     ← Database schema
    ├── public/                     ← Static files
    └── package.json                ← Dependencies
```

---

## ⏱️ **Time Estimates**

| Task | Time | Guide |
|------|------|-------|
| Start the app | 5 min | [QUICK_START.md](./QUICK_START.md) |
| One-click deploy | 5 min | Run `bash deploy-easy.sh` |
| Local dev setup | 20 min | [LOCAL_DEVELOPMENT.md](./docs/SETUP/LOCAL_DEVELOPMENT.md) |
| Production deploy | 30 min | [PRODUCTION_DEPLOYMENT.md](./docs/DEPLOYMENT/PRODUCTION_DEPLOYMENT.md) |
| Full reading | 1-2 hrs | Read all documentation |

---

## ✨ **Quick Reference**

### Essential Commands

```bash
# Start
bash deploy-easy.sh

# View status
docker-compose ps

# Watch logs
docker-compose logs -f app

# Access database
docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz

# Re-seed
docker-compose exec app npm run seed

# Stop
docker-compose down

# Clean reset
docker-compose down -v
```

### Important URLs

- 🌐 **Application:** http://localhost:3000
- 🪣 **MinIO Console:** http://localhost:9001
- 🐘 **Database:** localhost:5432

### Important Credentials

- **MinIO User:** minioadmin
- **MinIO Password:** miniopass123
- **DB User:** acrobaticz_user
- **DB Password:** acrobaticz_secure_db_pass_2024

---

## 🎉 **You're Ready!**

Choose your starting point above and get going. Most users:

1. Read [QUICK_START.md](./QUICK_START.md)
2. Run `bash deploy-easy.sh`
3. Access http://localhost:3000
4. Explore the app

That's it! 🚀

---

**Last Updated:** January 18, 2026  
**Version:** 1.0  
**Questions?** Check the relevant guide above
