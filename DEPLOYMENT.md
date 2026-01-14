# 📦 Deployment Guide for Acrobaticz

Complete guide to deploying Acrobaticz in production environments.

---

## 🚀 Deployment Overview

### Deployment Options

| Platform | Cost | Setup Time | Scalability | Recommendation |
|----------|------|-----------|-------------|-----------------|
| **Vercel** | Free - $150+/mo | 5 min | Excellent | ⭐ Recommended |
| **Docker** | $5-50/mo | 30 min | Very Good | ✅ Good for VPS |
| **VPS** (Ubuntu) | $5-50/mo | 1-2 hours | Good | ✅ Full control |
| **AWS** | $20-200+/mo | 1-2 hours | Excellent | ✅ Enterprise |

---

## 🎯 Pre-Deployment Checklist

### Application
- [ ] All tests passing (`npm run test:run`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript compiles (`npm run build`)
- [ ] Environment variables configured
- [ ] Database migrations up-to-date
- [ ] Git changes committed

### Database
- [ ] Database backed up
- [ ] Migrations tested in staging
- [ ] Connection string configured
- [ ] Replica set enabled (if applicable)
- [ ] Monitoring configured

### Security
- [ ] JWT secret changed
- [ ] All API keys configured
- [ ] SSL/HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Security headers set

### Monitoring
- [ ] Error tracking (Sentry) configured
- [ ] Logging system active
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Alert notifications setup

---

## 🌐 Vercel Deployment (Recommended - 5 minutes)

### Prerequisites
- GitHub account with repository
- Vercel account ([vercel.com](https://vercel.com))

### Step 1: Push to GitHub
```bash
# Ensure all changes are committed
git status
git add .
git commit -m "Prepare for production deployment"

# Push to GitHub
git push origin main
```

### Step 2: Connect to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Select your GitHub repository
4. Click "Import"

### Step 3: Configure Environment Variables
In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add the following variables:

```
DATABASE_URL=postgresql://user:password@host:5432/acrobaticz
NEXTAUTH_SECRET=<generate-secure-random-string>
NEXTAUTH_URL=https://yourdomain.com
DEEPL_API_KEY=your-deepl-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-bucket
```

### Step 4: Deploy
1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Your app is live at `yourdomain.vercel.app`

### Step 5: Custom Domain
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. SSL certificate auto-generated (free)

### Auto-Deployments
```
Every git push to main → Auto-deploys
Branches → Preview deployments
Pull Requests → Preview deployments
```

---

## 🐳 Docker Deployment (Self-Hosted)

### Prerequisites
- Docker installed
- Docker Compose installed
- PostgreSQL server (or included in compose)
- Domain name (optional)

### Step 1: Build Docker Image

Create `Dockerfile` (if not exists):
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build Next.js
RUN npm run build

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
```

### Step 2: Create docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: acrobaticz
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/acrobaticz
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    restart: always

volumes:
  postgres_data:
```

### Step 3: Create .env.production

```bash
cp env .env.production
# Edit with production values
```

### Step 4: Deploy

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f app

# Run migrations
docker-compose exec app npx prisma migrate deploy

# Seed database (if needed)
docker-compose exec app npm run seed
```

### Step 5: Access Application
- Application runs at `http://localhost:3000`
- Setup reverse proxy (Nginx) for HTTPS
- Configure SSL certificate

---

## 🖥️ VPS Deployment (Ubuntu 22.04)

### Prerequisites
- Ubuntu 22.04 VPS
- SSH access
- Domain name
- SSL certificate (Let's Encrypt - free)

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 2: Database Setup

```bash
# Access PostgreSQL
sudo -i -u postgres psql

# Create database and user
CREATE DATABASE acrobaticz;
CREATE USER acrouser WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE acrobaticz TO acrouser;
\q
```

### Step 3: Deploy Application

```bash
# Create app directory
sudo mkdir -p /var/www/acrobaticz
sudo chown $USER:$USER /var/www/acrobaticz

# Clone repository
cd /var/www/acrobaticz
git clone https://github.com/yourusername/acrobaticz.git .

# Install dependencies
npm install --production

# Create .env file
cat > .env.local << EOF
DATABASE_URL="postgresql://acrouser:strong_password@localhost:5432/acrobaticz"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://yourdomain.com"
NODE_ENV="production"
EOF

# Build application
npm run build

# Run database migrations
npx prisma migrate deploy
```

### Step 4: Setup PM2 Process Manager

```bash
# Start application with PM2
pm2 start npm --name "acrobaticz" -- start

# Configure auto-restart on reboot
pm2 startup
pm2 save
```

### Step 5: Configure Nginx Reverse Proxy

Create `/etc/nginx/sites-available/acrobaticz`:
```nginx
upstream acrobaticz {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://acrobaticz;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/acrobaticz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal (runs daily)
sudo systemctl enable certbot.timer
```

### Step 7: Monitor Application

```bash
# View PM2 logs
pm2 logs acrobaticz

# Monitor in real-time
pm2 monit

# Restart application
pm2 restart acrobaticz
```

---

## 📊 Post-Deployment Steps

### 1. Setup Monitoring

```bash
# Install monitoring tools
npm install --save-dev @sentry/nextjs

# Configure Sentry for error tracking
export SENTRY_AUTH_TOKEN=your_token
```

### 2. Setup Backups

```bash
# Create backup script
cat > /usr/local/bin/backup-acrobaticz.sh << EOF
#!/bin/bash
pg_dump acrobaticz > /backups/acrobaticz-$(date +%Y%m%d).sql
EOF

# Make executable
chmod +x /usr/local/bin/backup-acrobaticz.sh

# Schedule daily backups (crontab)
0 2 * * * /usr/local/bin/backup-acrobaticz.sh
```

### 3. Setup Logging

```bash
# Log rotation
sudo tee /etc/logrotate.d/acrobaticz > /dev/null << EOF
/var/log/acrobaticz/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
}
EOF
```

### 4. Test Production

```bash
# Test application
curl -L https://yourdomain.com

# Check certificate
curl -v https://yourdomain.com 2>&1 | grep certificate

# Test API
curl -X GET https://yourdomain.com/api/health
```

---

## 🔄 Continuous Deployment (CI/CD)

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:run
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./
```

---

## 🚨 Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs acrobaticz

# Verify database connection
npm run prisma:studio

# Check Node version
node --version  # Should be 18+
```

### Database connection error
```bash
# Test connection
psql postgresql://user:password@localhost:5432/acrobaticz

# Check PostgreSQL status
sudo systemctl status postgresql

# Verify DATABASE_URL format
echo $DATABASE_URL
```

### Nginx reverse proxy issues
```bash
# Check Nginx configuration
sudo nginx -t

# View Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

---

## 📈 Performance Optimization

### Database Optimization
```bash
# Analyze tables
npx prisma db execute --stdin << EOF
ANALYZE;
REINDEX DATABASE acrobaticz;
EOF
```

### Application Optimization
```bash
# Enable compression
npm install compression

# Setup caching headers
export CACHE_CONTROL="public, max-age=3600"
```

---

## 🔐 Security Hardening

### HTTPS Only
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Security Headers
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

### Rate Limiting
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://acrobaticz;
}
```

---

## 📞 Getting Help

- 📚 Check [README.md](../README.md)
- 🔧 See [ARCHITECTURE.md](ARCHITECTURE.md)
- 🐛 Report issues on GitHub
- 💬 Check GitHub Discussions

---

**Last Updated:** January 14, 2026
**Status:** Production-Ready
**Tested On:** Ubuntu 22.04, macOS 13+, Windows WSL2
