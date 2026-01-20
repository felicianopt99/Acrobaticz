# 💻 Local Development Setup - Acrobaticz Elite

Guide to running Acrobaticz locally without Docker for development.

---

## 🚀 Quick Start (30 Minutes)

### Prerequisites

- **Node.js 22+**: Download from https://nodejs.org
- **PostgreSQL 16+**: https://www.postgresql.org/download
- **Git**: For cloning repository
- **npm 10+**: Usually comes with Node.js

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/acrobaticz.git
cd acrobaticz
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Setup PostgreSQL

#### Option A: Using Homebrew (macOS)

```bash
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Create database and user
createdb acrobaticz
createuser -P acrobaticz_user  # Enter password when prompted
```

#### Option B: Using System Package Manager (Linux)

```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE acrobaticz;"
sudo -u postgres psql -c "CREATE USER acrobaticz_user WITH PASSWORD 'your-password';"
sudo -u postgres psql -c "ALTER DATABASE acrobaticz OWNER TO acrobaticz_user;"
```

#### Option C: Using Docker (Just Database)

```bash
docker run -d \
  --name acrobaticz-postgres \
  -e POSTGRES_DB=acrobaticz \
  -e POSTGRES_USER=acrobaticz_user \
  -e POSTGRES_PASSWORD=changeme \
  -p 5432:5432 \
  postgres:16-alpine
```

### Step 4: Configure Environment

```bash
# Copy example file
cp .env.example .env

# Edit .env with your settings
nano .env  # or use your editor
```

**Minimum required variables**:

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://acrobaticz_user:your-password@localhost:5432/acrobaticz?schema=public
JWT_SECRET=your-dev-secret-key-here
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=acrobaticz
DEBUG=true
LOG_LEVEL=debug
```

### Step 5: Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed
```

### Step 6: Start Development Server

```bash
npm run dev
```

**Application is ready!**
- Frontend: http://localhost:3000
- API: http://localhost:3000/api

---

## 📋 Development Tools Setup

### MinIO (Local S3 Alternative)

For file storage in development:

```bash
# Using Docker
docker run -d \
  --name acrobaticz-minio \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -p 9000:9000 \
  -p 9001:9001 \
  minio/minio server /data --console-address ":9001"

# Access MinIO console
open http://localhost:9001
```

Or **install locally**:

```bash
# Using Homebrew (macOS)
brew install minio/stable/minio

# Start MinIO
minio server /tmp/minio

# Access console at http://localhost:9000
```

### Redis (Optional - for Caching)

```bash
# Using Docker
docker run -d \
  --name acrobaticz-redis \
  -p 6379:6379 \
  redis:7-alpine

# Using Homebrew (macOS)
brew install redis
redis-server
```

---

## 🔧 Available NPM Scripts

### Development

```bash
# Start dev server with Turbopack (fast!)
npm run dev

# Faster dev reload
npm run dev:fast

# Typecheck TypeScript (without building)
npm run typecheck

# Lint code
npm run lint

# Format code with Prettier
npm run format
```

### Building

```bash
# Production build
npm run build

# Start production server (after build)
npm run start
```

### Database

```bash
# Generate Prisma client
npm run db:generate

# Create/apply migrations
npm run db:migrate

# Seed database
npm run db:seed

# Seed with verbose output
npm run db:seed:verbose

# Clean seed (delete all data first)
npm run db:seed:clean

# Dry-run seed (preview without applying)
npm run db:seed:dry-run

# Check seed status
npm run db:seed:check
```

### Testing

```bash
# Run all tests
npm run test

# Run specific test file
npm run test:api
npm run test:forms

# Watch mode (re-run on file changes)
npm run test:watch

# Watch with UI
npm run test:ui

# Coverage report
npm run test:coverage

# Run tests once (CI mode)
npm run test:run
```

### Docker (Reference)

```bash
# Build Docker image
npm run docker:build

# Start containers
npm run docker:dev

# View logs
npm run docker:logs

# Stop containers
npm run docker:down
```

---

## 🐛 Development Workflow

### Hot Reload

Any changes to files in `src/` automatically trigger:
- TypeScript recompilation
- React component hot reload (via Next.js Fast Refresh)
- No need to restart server

### Debugging

#### VS Code Debugger

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/next/dist/bin/next",
      "args": ["dev"],
      "console": "integratedTerminal",
      "serverReadyAction": {
        "pattern": "ready - started server on",
        "uriFormat": "http://localhost:${port}",
        "action": "openExternally"
      }
    }
  ]
}
```

Then press `F5` to start debugging with breakpoints.

#### Browser Console Logs

```bash
# Enable debug logging in .env
DEBUG=true
LOG_LEVEL=debug
```

### Database Inspection

```bash
# Connect to PostgreSQL
psql -U acrobaticz_user -d acrobaticz

# Useful psql commands
\dt                           # List all tables
\d equipment                  # Describe table structure
SELECT * FROM users LIMIT 10; # Query data
```

### API Testing

Use `Insomnia`, `Postman`, or `curl`:

```bash
# Get equipment list
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/equipment

# Create quote
curl -X POST http://localhost:3000/api/quotes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "...",
    "items": [...],
    "language": "en"
  }'
```

---

## 🆚 Local vs Docker Development

| Aspect | Local | Docker |
|--------|-------|--------|
| **Setup Time** | 30 min | 5 min |
| **Performance** | ⚡ Faster | ~same |
| **File Changes** | Instant hot reload | Needs rebuild |
| **Database Access** | Direct `psql` command | `docker exec` |
| **Memory Usage** | Lower | Higher |
| **Environment Parity** | May differ from prod | Matches production |
| **Recommended** | Daily development | Testing before deploy |

---

## ⚠️ Troubleshooting

### "Cannot find module 'next'"

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "PORT 3000 already in use"

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### "Database connection failed"

```bash
# Check if PostgreSQL is running
pg_isready

# Test connection
psql -U acrobaticz_user -d acrobaticz -c "SELECT 1"

# Check DATABASE_URL in .env
echo $DATABASE_URL
```

### "Prisma client not generated"

```bash
# Generate Prisma client
npm run db:generate

# If still failing
rm -rf node_modules/.prisma
npm run db:generate
```

### "Migrations failed"

```bash
# Check migration status
npx prisma migrate status

# Reset database (WARNING: deletes all data!)
npx prisma migrate reset

# Manual schema push (development only)
npx prisma db push
```

### "Module not found" errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall node_modules
rm -rf node_modules
npm install

# Rebuild
npm run build
```

---

## 🔒 Security Notes (Development)

- ⚠️ Never commit `.env` to Git (use `.env.example` instead)
- ⚠️ Don't use production secrets in local development
- ⚠️ Keep `DEBUG=true` only in development (disable in production)
- ✅ Use `HTTPS_ONLY=false` in development (enable in production)

---

## 🚀 Performance Tips

1. **Use `npm run dev:fast`** for faster builds during development
2. **Enable only needed features** in `ENVIRONMENT.md` (disable optional APIs)
3. **Use `npm run typecheck`** to catch errors before runtime
4. **Run `npm run lint`** before committing code
5. **Close unnecessary applications** to free up resources

---

## 📚 Related Documentation

- [ENVIRONMENT.md](../../ENVIRONMENT.md) - All environment variables
- [DOCKER_SETUP.md](./DOCKER_SETUP.md) - Docker setup guide
- [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - System design

---

**Last Updated**: January 18, 2026 | **Status**: Production Ready ✅
