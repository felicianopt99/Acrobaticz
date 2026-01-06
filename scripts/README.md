# Scripts Directory

Complete guide to scripts in this repository.

## Directory Structure

```
scripts/
├── README.md                    (this file)
├── seed.ts                      (main database seeding)
├── seed.js                      (seed.ts JavaScript version)
├── seed-complete.ts             (full dataset seed)
├── seed-comprehensive.ts        (all features test seed)
├── seed-from-json.ts            (load data from JSON)
├── extract-seed-data.ts         (extract data for backup)
├── seeding/                     (seeding core logic)
│   ├── core/                    (orchestration & database helpers)
│   ├── data-loaders/            (data loading by type)
│   └── utils/                   (utilities: logger, validator, etc)
├── deployment/                  (production deployment scripts)
│   ├── docker-entrypoint.sh     (production container startup)
│   ├── dev-entrypoint.sh        (development container startup)
│   └── docker-redeploy.sh       (safe redeployment with migration handling)
├── database/                    (database utilities)
│   ├── run-seed.sh              (shell wrapper for seeding)
│   ├── run_overnight.sh         (automated overnight seeding)
│   └── setup_translation.sh     (translation system setup)
├── maintenance/                 (maintenance scripts)
│   ├── backup-daily.sh          (daily backup automation)
│   ├── build-with-cache.sh      (optimized Docker builds)
│   └── cleanup-backups.sh       (backup retention cleanup)
└── archived/                    (old/deprecated scripts)
    └── (various old scripts)
```

## Seeding Scripts

### Main Seeding
```bash
npm run db:seed              # Run default seed
npm run db:seed:clean       # Clean database and reseed
npm run db:seed:verbose     # Verbose output
npm run db:seed:defaults    # Seed defaults only
npm run db:seed:users       # Seed users only
npm run db:seed:dry-run     # Preview without committing
```

### Seed Options
```bash
cd scripts && npx tsx seed.ts [OPTIONS]

OPTIONS:
  --clean               Clear database before seeding
  --verbose            Show detailed output
  --defaults           Only seed defaults
  --users-only         Only seed users
  --dry-run            Preview changes without applying
  --skip-backups       Don't backup before seeding
```

## Deployment Scripts

### Production Container Startup
**Location:** `scripts/deployment/docker-entrypoint.sh`

Used by Docker to start the production container:
- Reads secrets from `/run/secrets/`
- Constructs DATABASE_URL from secret components
- Waits for database with exponential backoff (max 20 attempts)
- Runs Prisma migrations
- Seeds database if empty
- Starts Next.js application

**Triggered automatically** - no manual invocation needed

### Safe Redeployment
**Location:** `scripts/deployment/docker-redeploy.sh`

Safely redeploy with migration handling:

```bash
# Basic redeploy
bash scripts/deployment/docker-redeploy.sh

# With baseline migration (for Prisma P3005 errors)
bash scripts/deployment/docker-redeploy.sh --baseline <migration_name>
```

**Features:**
- Validates Docker is running
- Validates secrets and env files
- Pulls latest base images
- Builds app image with cache
- Handles Prisma migration conflicts
- Automatic rollback on failure

### Development Container Startup
**Location:** `scripts/deployment/dev-entrypoint.sh`

Used by docker-compose.dev.yml:
- Simpler than production (no secrets)
- Direct environment variables
- Hot reload support with nodemon

## Database Scripts

### Run Seed
**Location:** `scripts/database/run-seed.sh`

Wrapper script for running seeding:
```bash
bash scripts/database/run-seed.sh
```

### Overnight Seeding
**Location:** `scripts/database/run_overnight.sh`

Automated seeding for cron jobs:
```bash
# Add to crontab for nightly runs
0 2 * * * /path/to/scripts/database/run_overnight.sh
```

### Translation Setup
**Location:** `scripts/database/setup_translation.sh`

Initialize translation system:
```bash
bash scripts/database/setup_translation.sh
```

## Maintenance Scripts

### Daily Backup
**Location:** `scripts/maintenance/backup-daily.sh`

Automated daily backups:
```bash
bash scripts/maintenance/backup-daily.sh
```

### Build with Cache
**Location:** `scripts/maintenance/build-with-cache.sh`

Optimized Docker build with caching:
```bash
bash scripts/maintenance/build-with-cache.sh
```

### Cleanup Backups
**Location:** `scripts/maintenance/cleanup-backups.sh`

Remove old backups per retention policy:
```bash
bash scripts/maintenance/cleanup-backups.sh
```

## Data Scripts

### Extract Seed Data
**Location:** `scripts/extract-seed-data.ts`

Export current database as seed data:
```bash
npm run extract:seed
```

Output: `seeding/data/` with JSON files for reimport

### Seed from JSON
**Location:** `scripts/seed-from-json.ts`

Load data from JSON files:
```bash
npx tsx scripts/seed-from-json.ts
```

## Common Tasks

### Backup and Restore
```bash
# Backup before major changes
npm run db:seed:clean --skip-backups=false

# Extract current data
npm run extract:seed

# Restore from backup
npx prisma migrate reset
npm run db:seed
```

### Development Workflow
```bash
# Start dev environment
npm run dev

# Run seeding
npm run db:seed

# Extract data for testing
npm run extract:seed
```

### Production Deployment
```bash
# The deployment scripts are run automatically in Docker
# via docker-entrypoint.sh

# Manual redeployment if needed
bash scripts/deployment/docker-redeploy.sh
```

## Script Dependencies

Most scripts require:
- Node.js 20+
- npm (for TypeScript scripts)
- Bash 4+ (for shell scripts)
- Docker (for deployment scripts)
- PostgreSQL client tools (for some maintenance scripts)

Install TypeScript globally if running .ts scripts directly:
```bash
npm install -g ts-node tsx
```

## Archived Scripts

Old scripts are in `scripts/archived/`:
- `create-admin-user.js` - Old user creation (use seeding instead)
- `fix-login.js` - Old login fix (refer to authentication code)
- `generate-icons.js` - Icon generation (deprecated)
- And others...

These are kept for reference but shouldn't be used. The seeding system replaces most functionality.

## Adding New Scripts

Guidelines for new scripts:

1. **Seeding**: Add to `scripts/seeding/data-loaders/`
2. **Deployment**: Add to `scripts/deployment/`
3. **Database**: Add to `scripts/database/`
4. **Maintenance**: Add to `scripts/maintenance/`
5. **Data**: Add to root `scripts/` with data prefix

Add npm scripts to `package.json` for convenience:
```json
{
  "scripts": {
    "my:script": "tsx scripts/my-script.ts"
  }
}
```

## Troubleshooting

### Script Permissions
```bash
# Make scripts executable
chmod +x scripts/**/*.sh
```

### TypeScript Script Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Try again
npm run db:seed
```

### Migration Issues
```bash
# Check Prisma status
npx prisma migrate status

# Resolve stuck migrations
bash scripts/deployment/docker-redeploy.sh --baseline <migration>
```

## See Also

- [docs/deployment/DOCKER_SETUP.md](../deployment/DOCKER_SETUP.md) - Docker configuration
- [docs/deployment/PRODUCTION_READINESS_REPORT.md](../deployment/PRODUCTION_READINESS_REPORT.md) - Production checklist
- [DEVELOPMENT-GUIDE.md](../../DEVELOPMENT-GUIDE.md) - Development workflow
