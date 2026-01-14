# 🚀 Production Deployment Guide

Complete guide for deploying Acrobaticz to production servers.

---

## Pre-Deployment Checklist

### Security

- [ ] Change all default passwords
- [ ] Set strong `DB_PASSWORD` (20+ characters, mixed case, numbers, symbols)
- [ ] Generate random `JWT_SECRET` (min 32 characters)
- [ ] Configure HTTPS/SSL certificates
- [ ] Enable firewall rules
- [ ] Set up backup procedures
- [ ] Review and test database backups
- [ ] Configure email for notifications

### Performance

- [ ] Allocate at least 1GB RAM to app service
- [ ] Allocate at least 512MB RAM to database
- [ ] Configure database connection pooling
- [ ] Set up monitoring & logging
- [ ] Test under expected load
- [ ] Configure CDN for static assets

### Infrastructure

- [ ] Reserve fixed static IP address
- [ ] Configure DNS records
- [ ] Set up domain SSL certificate
- [ ] Configure load balancer (if multi-server)
- [ ] Plan storage capacity
- [ ] Set up monitoring/alerting

---

## Deployment Options

### Option 1: Linux Server (VPS/Dedicated)

**Best for:** Self-hosted, full control

**Requirements:**
- Ubuntu 20.04+ or similar
- 2GB+ RAM, 20GB+ storage
- Docker & Docker Compose installed
- Public IP or domain

**Steps:**

```bash
# 1. SSH into server
ssh user@your-server-ip

# 2. Clone repository
git clone https://github.com/yourrepo/acrobaticz.git
cd acrobaticz

# 3. Create .env file with strong passwords
nano .env
# DB_PASSWORD=very-secure-password
# JWT_SECRET=32-character-random-string

# 4. Configure firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 5. Start services
docker-compose up -d

# 6. Verify services running
docker-compose ps
docker-compose logs -f app

# 7. Access application
# Open http://your-server-ip in browser
```

### Option 2: Docker Swarm

**Best for:** Clustered deployment, high availability

```bash
# Initialize Swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml acrobaticz

# View services
docker service ls

# Scale app replicas
docker service scale acrobaticz_app=3
```

### Option 3: Kubernetes

**Best for:** Large scale, cloud deployment

Create `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: acrobaticz-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: acrobaticz
  template:
    metadata:
      labels:
        app: acrobaticz
    spec:
      containers:
      - name: acrobaticz
        image: acrobaticz:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: acrobaticz-secrets
              key: database-url
---
apiVersion: v1
kind: Service
metadata:
  name: acrobaticz-service
spec:
  selector:
    app: acrobaticz
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

Deploy:
```bash
kubectl apply -f k8s-deployment.yaml
kubectl get services
```

### Option 4: Cloud Platforms

#### AWS ECS

```bash
# Create cluster
aws ecs create-cluster --cluster-name acrobaticz

# Create task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service --cluster acrobaticz --service-name app --task-definition acrobaticz --desired-count 2
```

#### Google Cloud Run

```bash
# Build and push image
docker build -t gcr.io/PROJECT_ID/acrobaticz .
docker push gcr.io/PROJECT_ID/acrobaticz

# Deploy
gcloud run deploy acrobaticz \
  --image gcr.io/PROJECT_ID/acrobaticz:latest \
  --platform managed \
  --region us-central1 \
  --memory 1Gi \
  --set-env-vars DATABASE_URL=...
```

#### Heroku

```bash
# Add remote
heroku create acrobaticz

# Set environment variables
heroku config:set DB_PASSWORD=... JWT_SECRET=...

# Deploy
git push heroku main
```

---

## Configuration for Production

### Environment Variables

**`.env` file (never commit to Git!):**

```bash
# Application
NODE_ENV=production
PORT=3000

# Database
DB_PASSWORD=your-super-secure-password-here-min-20-chars

# Security
JWT_SECRET=your-random-secret-key-here-min-32-characters

# Certificates & Domain
DOMAIN=acrobaticz.example.com
CERTBOT_EMAIL=admin@acrobaticz.example.com

# Optional: API Keys
DEEPL_API_KEY=your-deepl-api-key
GOOGLE_CLOUD_API_KEY=your-google-key

# Performance
DATABASE_POOL_SIZE=20
CACHE_TTL=300
```

### Database Optimization

**Update `docker-compose.yml`:**

```yaml
postgres:
  image: postgres:16-alpine
  environment:
    POSTGRES_PASSWORD: ${DB_PASSWORD}
  command:
    - "postgres"
    - "-c"
    - "shared_buffers=256MB"
    - "-c"
    - "effective_cache_size=1GB"
    - "-c"
    - "work_mem=64MB"
    - "-c"
    - "maintenance_work_mem=64MB"
  deploy:
    resources:
      limits:
        memory: 1G
```

### Nginx SSL Configuration

**`nginx/default.conf`:**

```nginx
upstream app {
    server app:3000;
}

server {
    listen 80;
    server_name acrobaticz.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name acrobaticz.example.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection upgrade;
        proxy_set_header Upgrade $http_upgrade;
    }

    location /api {
        proxy_pass http://app/api;
        proxy_set_header Host $host;
        client_max_body_size 100M;
    }
}
```

---

## Backup & Recovery

### Automated Daily Backups

**Create `backup.sh`:**

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/acrobaticz"
mkdir -p $BACKUP_DIR

# Database backup
docker-compose exec postgres pg_dump \
  -U acrobaticz_user acrobaticz | gzip > \
  $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_backup_$TIMESTAMP.sql.gz"
```

Add to crontab:

```bash
crontab -e
# Add this line (daily at 2 AM):
0 2 * * * /home/user/acrobaticz/backup.sh
```

### Recovery Procedure

```bash
# Restore from backup
zcat /backups/acrobaticz/db_backup_20260114_020000.sql.gz | \
  docker-compose exec -T postgres psql -U acrobaticz_user acrobaticz

# Verify restoration
docker-compose exec app npm run db:migrate status
```

---

## Monitoring & Logging

### Application Monitoring

```bash
# Real-time logs
docker-compose logs -f app

# Error logs only
docker-compose logs app | grep ERROR

# Last 100 lines
docker-compose logs --tail=100 app

# With timestamps
docker-compose logs -f --timestamps app
```

### Prometheus Monitoring

**`prometheus.yml`:**

```yaml
global:
  scrape_interval: 15s
  scrape_timeout: 10s

scrape_configs:
  - job_name: 'acrobaticz'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'
```

### ELK Stack (Elasticsearch, Logstash, Kibana)

Deploy via:
```bash
docker-compose -f docker-compose.elk.yml up -d
```

---

## Scaling & Load Balancing

### Horizontal Scaling

```bash
# Run 3 instances of app
docker-compose up -d --scale app=3

# Load balancer automatically distributes traffic
# (Configure Nginx upstream block with all 3 instances)
```

### Vertical Scaling

Increase resources in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 2G  # Increase from 1G
      cpus: '2.0' # Add CPU limit
```

---

## Health Checks & Auto-Recovery

### Health Endpoint

Application provides `/api/health`:

```bash
curl http://localhost:3000/api/health
# Response: { "status": "ok", "timestamp": "2026-01-14T..." }
```

### Auto-restart on Failure

```yaml
restart_policy:
  condition: on-failure
  delay: 5s
  max_attempts: 3
  window: 120s
```

---

## CI/CD Integration

### GitHub Actions Example

**.github/workflows/deploy.yml:**

```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Docker image
        run: docker build -t acrobaticz:${{ github.sha }} .
      
      - name: Push to registry
        run: docker push $REGISTRY/acrobaticz:${{ github.sha }}
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_IP }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /app/acrobaticz
            git pull
            docker-compose up -d --build
            docker-compose logs -f app
```

---

## Security Hardening

### Firewall Rules

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow from 10.0.0.0/8 to any port 5432  # Database (internal only)
sudo ufw enable
```

### SSL/TLS Certificates

```bash
# Let's Encrypt automatic renewal
certbot renew --noninteractive --quiet

# Add to crontab (daily check):
0 12 * * * certbot renew --quiet
```

### Database Security

```bash
# Create restricted user
docker-compose exec postgres psql -U postgres <<EOF
CREATE USER app_user WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE acrobaticz TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
EOF
```

---

## Maintenance & Updates

### Regular Maintenance

```bash
# Weekly: Check logs for errors
docker-compose logs app | grep ERROR | tail -20

# Monthly: Update base images
docker-compose pull
docker-compose up -d

# After updates: Verify health
docker-compose ps
curl http://localhost:3000/api/health

# Quarterly: Full security audit
docker image inspect acrobaticz:latest
docker container ls -a | grep acrobaticz
```

### Update Procedure

```bash
# 1. Backup database
docker-compose exec postgres pg_dump -U acrobaticz_user acrobaticz > backup_pre_update.sql

# 2. Pull latest code
git pull origin main

# 3. Rebuild and restart
docker-compose up -d --build

# 4. Verify
docker-compose ps
docker-compose logs -f app

# 5. If issues, rollback
git revert HEAD
docker-compose up -d --build
```

---

## Performance Tuning

### Database Connection Pooling

Add to `DATABASE_URL`:
```
?poolingMode=transaction&max_pool_size=20
```

### Caching Strategy

```bash
# Redis for caching
docker run -d --name redis redis:alpine
```

Add to env:
```
REDIS_URL=redis://redis:6379
```

### CDN for Static Assets

```nginx
# nginx.conf
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
    proxy_pass http://app;
}
```

---

## Troubleshooting Production

### Out of Memory

```bash
# Check memory usage
docker stats

# Increase limits
# Edit docker-compose.yml and increase memory: 2G
docker-compose restart
```

### Database Performance Issues

```bash
# Check connections
docker-compose exec postgres psql -U acrobaticz_user acrobaticz <<EOF
SELECT count(*) FROM pg_stat_activity;
EOF

# Kill idle connections
docker-compose exec postgres psql -U acrobaticz_user acrobaticz <<EOF
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE idle_in_transaction;
EOF
```

### High CPU Usage

```bash
# Profile running processes
docker stats --no-stream

# Restart service
docker-compose restart app
```

---

## Success Metrics

Monitor these KPIs:

- **Uptime:** Aim for 99.9%+ (9 hours downtime/year max)
- **Response Time:** < 500ms for 95th percentile
- **Error Rate:** < 0.1% of requests
- **Database Connection Pool:** < 90% utilization
- **Disk Space:** Maintain 20% free space minimum

---

## References

- [Docker Production Checklist](https://docs.docker.com/config/containers/resource_constraints/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Nginx Best Practices](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Monitoring Best Practices](https://www.datadoghq.com/blog/monitoring-best-practices/)

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-14  
**Status:** ✅ Production Ready
