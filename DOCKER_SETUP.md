# Docker Setup - Production & Development

## Files

### 1. `Dockerfile` (Production)
Super-optimized 2-stage build:
- **Builder Stage**: Compiles Next.js with Turbopack
- **Runner Stage**: Minimal runtime image (~200-250MB)

**Key Optimizations:**
- ✅ Uses Turbopack (30-50% faster builds)
- ✅ Removed deprecated `--webpack` flag
- ✅ Single-layer dependency installation
- ✅ Removed unnecessary graphics libraries (cairo, pango, etc.)
- ✅ Minimal runtime dependencies only
- ✅ Non-root user (node) for security

**Build & Run:**
```bash
# Build
docker build -t av-rentals:latest .

# Run
docker run -p 3000:3000 --env-file .env av-rentals:latest
```

---

### 2. `Dockerfile.dev` (Development)
Optimized single-stage development image:
- Hot reload with nodemon
- Next.js HMR support
- Source code mounted for live editing

**Features:**
- ✅ Small image size (~400MB)
- ✅ Fast builds with npm ci
- ✅ Nodemon watches server.js changes
- ✅ Next.js dev server with HMR

**Build & Run:**
```bash
docker build -f Dockerfile.dev -t av-rentals:dev .
docker run -p 3000:3000 -v $PWD:/app --env-file .env av-rentals:dev
```

---

### 3. `docker-compose.yml` (Development Stack)
Simplified compose file with only essential services:

**Services:**
- **postgres**: Database with health checks
- **app**: Next.js application with hot reload

**Usage:**
```bash
# Start development stack
docker-compose up

# With rebuild
docker-compose up --build

# Detached mode
docker-compose up -d

# Logs
docker-compose logs -f app

# Stop
docker-compose down
```

---

### 4. `.dockerignore`
Prevents unnecessary files from being copied into Docker images.

---

## Image Sizes

| Variant | Size | Notes |
|---------|------|-------|
| Production | ~250MB | Minimal runtime, optimized |
| Development | ~400MB | Includes dev tools |
| Database | ~80MB | postgres:16-alpine |

---

## Environment Variables

Copy `.env` to your machine or set:
```bash
# Database
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_db

# JWT & API Keys
JWT_SECRET=your_secret
DEEPL_API_KEY=your_key

# App
NODE_ENV=development
PORT=3000
HOSTNAME=0.0.0.0
```

---

## Secrets (Docker Secrets)

For production with Docker Swarm or compose:
```
secrets/
├── db_user
├── db_password
├── db_name
├── jwt_secret
└── deepl_api_key
```

---

## Quick Start

### Development
```bash
docker-compose up --build
# App runs on http://localhost:3000
```

### Production
```bash
docker build -t av-rentals:prod .
docker run -p 3000:3000 \
  --env-file env.production \
  av-rentals:prod
```

---

## Health Checks

- **Production**: HTTP endpoint `/api/health`
- **Development**: HTTP endpoint `/api/health`
- **Database**: PostgreSQL ready check

Ensure `/api/health` returns 200 status:
```typescript
// app/api/health/route.ts
export const GET = () => Response.json({ status: 'ok' });
```
