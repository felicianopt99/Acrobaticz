# 🚀 Acrobaticz - Installation in 60 Seconds

**Welcome! Get Acrobaticz running in less than a minute.**

---

## ✅ Requirements

- Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop))
- 2GB RAM available
- Port 3000 free (or change in `.env`)

**That's it! No databases, no dependencies to install.**

---

## 🎯 3 Steps to Launch

### Step 1: Set Your Passwords (30 seconds)

```bash
cd acrobaticz
```

Create a file named `.env`:

```env
DB_PASSWORD=MySecurePassword123!
JWT_SECRET=YourLongRandomSecretKeyHere12345678
```

✨ **Make these strong!** These are your security keys.

---

### Step 2: Start Services (20 seconds)

```bash
docker-compose up -d
```

🔄 **Docker will:**
- Create PostgreSQL database
- Build the application
- Run migrations automatically
- Start everything

**Wait ~30 seconds for initialization...**

---

### Step 3: Access Your App (10 seconds)

Open browser: **http://localhost:3000**

```
✓ Application ready
✓ Database initialized
✓ Default admin created

Admin Login:
  Email: admin@example.com
  Password: admin123
```

---

## 🛑 You're Done!

Your Acrobaticz installation is **live and ready to use**.

### Next Steps

1. **Change default admin password** immediately
2. **Add your companies logo** in Settings → Branding
3. **Configure API keys** (translations, etc.) - optional
4. **Create your first equipment** and start renting!

---

## 📊 What's Running?

| Service | URL | Purpose |
|---------|-----|---------|
| **Web App** | http://localhost:3000 | Your rental management system |
| **Database** | (Internal) | PostgreSQL database |
| **API** | http://localhost:3000/api | REST endpoints |

---

## 🎨 Customization (Optional)

### Change Application Port

Edit `.env`:
```env
PORT=8000  # Change from 3000 to 8000
```

Restart:
```bash
docker-compose restart app
```

### Database Backups

```bash
# Backup your data
docker-compose exec postgres pg_dump -U acrobaticz_user acrobaticz > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U acrobaticz_user acrobaticz < backup.sql
```

### View Application Logs

```bash
docker-compose logs -f app
```

### Stop Everything

```bash
docker-compose down
```

Restart anytime with `docker-compose up -d`

---

## 🆘 Troubleshooting

### Port 3000 Already in Use?

```bash
# Find what's using port 3000
lsof -i :3000

# Use different port in .env
PORT=8080
docker-compose restart app
```

### Docker Won't Start?

```bash
# Make sure Docker Desktop is running
# Then try:
docker-compose up -d

# Check status
docker-compose ps
```

### Database Connection Error?

```bash
# Restart database
docker-compose restart postgres

# Wait 10 seconds, then restart app
sleep 10
docker-compose restart app
```

### Forgot Admin Password?

```bash
# Reset via database
docker-compose exec postgres psql -U acrobaticz_user acrobaticz <<EOF
UPDATE "User" SET password = 'bcrypt_hashed_admin123' WHERE email = 'admin@example.com';
EOF
```

---

## 📚 Need More Help?

### Full Documentation

- **Docker Setup:** [DOCKER_GUIDE.md](./docs/DEPLOYMENT/DOCKER_GUIDE.md)
- **Architecture:** [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **API Reference:** [API_MANAGEMENT_GUIDE.md](./docs/API/API_MANAGEMENT_GUIDE.md)
- **Features:** [FEATURES.md](./docs/FEATURES.md)

### Getting Started

1. Login to dashboard
2. Create equipment categories
3. Add equipment items
4. Generate quotes
5. Manage events/rentals

---

## 🔐 Security Checklist

**Before Going Live:**

- [ ] Change `DB_PASSWORD` to strong value
- [ ] Change `JWT_SECRET` to random string
- [ ] Change admin email & password
- [ ] Enable HTTPS (use Nginx)
- [ ] Configure firewalls
- [ ] Set up backups
- [ ] Review user permissions

---

## 💡 Pro Tips

### Backup Regularly
```bash
# Daily backups
docker-compose exec postgres pg_dump -U acrobaticz_user acrobaticz > backup-$(date +%Y%m%d).sql
```

### Monitor Performance
```bash
# Check resource usage
docker stats
```

### Scale Up
```bash
# Run multiple instances
docker-compose up -d --scale app=3
```

### Update Application
```bash
# Get latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build
```

---

## 📞 Support

- **Issues:** Check [DOCKER_GUIDE.md Troubleshooting](./docs/DEPLOYMENT/DOCKER_GUIDE.md#troubleshooting)
- **Database:** [DATABASE Docs](./docs/DATABASE/)
- **Configuration:** [ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

## 🎉 Success!

You now have a **complete rental management system** running locally or on your server.

**Total time invested:** Less than 1 minute ⚡

### What You Get

✅ Equipment management system  
✅ Quote generation & PDF export  
✅ Event/rental scheduling  
✅ Client management  
✅ Partner integration  
✅ Real-time inventory  
✅ Multi-language support  
✅ Cloud storage integration  
✅ API access  
✅ Reporting & analytics  

---

## 📋 File Reference

After installation, your directory contains:

```
acrobaticz/
├── docker-compose.yml      ← Start/stop services here
├── .env                    ← Your passwords (keep safe!)
├── Dockerfile              ← Application container
├── docs/                   ← Full documentation
└── [source code...]
```

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-14  
**Status:** ✅ Production Ready

**Happy Renting! 🎉**
