# 🔧 Environment Configuration Guide - Acrobaticz Elite

Complete reference for all environment variables used in Acrobaticz.

---

## 📋 Quick Reference Table

| Variable | Type | Required | Default | Category |
|----------|------|----------|---------|----------|
| `NODE_ENV` | enum | ✅ | production | Application |
| `PORT` | number | ✅ | 3000 | Application |
| `DATABASE_URL` | string | ✅ | - | Database |
| `JWT_SECRET` | string | ✅ | - | Authentication |
| `S3_ENDPOINT` | string | ✅ | http://minio:9000 | Storage |
| `S3_ACCESS_KEY` | string | ✅ | minioadmin | Storage |
| `S3_SECRET_KEY` | string | ✅ | - | Storage |
| `S3_BUCKET` | string | ✅ | acrobaticz | Storage |
| `DEEPL_API_KEY` | string | 🟡 | - | Translation |
| `GEMINI_API_KEY` | string | 🟡 | - | AI |
| `DEBUG` | boolean | 🟢 | false | Logging |
| `LOG_LEVEL` | enum | 🟢 | info | Logging |

**Legend:**
- ✅ **Required** - Application will not start without this
- 🟡 **Recommended** - Features will be limited without this
- 🟢 **Optional** - Application works fine without this

---

## 🔴 REQUIRED Variables (Must Have)

### Application Environment

#### `NODE_ENV`
- **Type**: `development` | `production` | `staging`
- **Required**: ✅ Yes
- **Default**: `production`
- **Description**: Node.js environment mode
- **Example**: `NODE_ENV=production`
- **Notes**:
  - `production`: Console logs removed, optimizations enabled, strict mode
  - `development`: Full logging, hot reload, source maps
  - `staging`: Production-like but with debugging

#### `PORT`
- **Type**: Number (1-65535)
- **Required**: ✅ Yes
- **Default**: `3000`
- **Description**: Port where Next.js application listens
- **Example**: `PORT=3000`
- **Notes**:
  - Docker internal port (external port configured in docker-compose.yml)
  - Must be > 1024 for non-root users

#### `HOSTNAME`
- **Type**: String (IP address or hostname)
- **Required**: ✅ Yes (Docker)
- **Default**: `0.0.0.0`
- **Description**: Hostname for application binding
- **Example**: `HOSTNAME=0.0.0.0` (listen on all interfaces)

---

### Database Configuration

#### `DATABASE_URL`
- **Type**: PostgreSQL connection string
- **Required**: ✅ Yes
- **Default**: None (must be set)
- **Description**: Full PostgreSQL connection string
- **Example**: `postgresql://user:password@localhost:5432/acrobaticz?schema=public`
- **Format**: `postgresql://[user]:[password]@[host]:[port]/[database]?schema=public`
- **Notes**:
  - Docker: Use `postgres` as hostname (internal DNS)
  - Local: Use `localhost` or `127.0.0.1`
  - Must include `?schema=public` for Prisma
  - URL-encode special characters in password: `@` → `%40`, `#` → `%23`

#### `DB_NAME`
- **Type**: String
- **Required**: ✅ Yes (if using docker-entrypoint.sh)
- **Default**: `acrobaticz`
- **Description**: PostgreSQL database name
- **Example**: `DB_NAME=acrobaticz`

#### `DB_USER`
- **Type**: String
- **Required**: ✅ Yes (if using docker-entrypoint.sh)
- **Default**: `acrobaticz_user`
- **Description**: PostgreSQL username
- **Example**: `DB_USER=acrobaticz_user`

#### `DB_PASSWORD`
- **Type**: String (strong password recommended)
- **Required**: ✅ Yes
- **Default**: None (must be set)
- **Description**: PostgreSQL user password
- **Example**: `DB_PASSWORD=MyStr0ng!Pass123`
- **⚠️ Important**:
  - Use strong passwords in production (20+ characters, mix of upper/lower/numbers/symbols)
  - Do NOT use simple passwords like `password123`
  - Store securely in secrets manager (AWS Secrets, HashiCorp Vault, Docker Secrets)
  - Rotate regularly (at least quarterly)

---

### Authentication

#### `JWT_SECRET`
- **Type**: String (base64-encoded random key)
- **Required**: ✅ Yes
- **Default**: None (must be set)
- **Description**: Secret key for JWT token signing and verification
- **Example**: `JWT_SECRET=abcdefgh1234567890abcdefgh1234567890abcdefgh==`
- **⚠️ Important**:
  - Generate with: `openssl rand -base64 32`
  - Do NOT hardcode in repository
  - Change immediately after deployment
  - Store in secure vault
  - Same key must be used across all instances (for horizontal scaling)
  - Rotate keys carefully (invalidates all existing tokens)

#### `JWT_EXPIRATION`
- **Type**: String (time format)
- **Required**: 🟡 Recommended
- **Default**: `7d`
- **Description**: How long JWT tokens remain valid
- **Examples**:
  - `JWT_EXPIRATION=7d` (7 days)
  - `JWT_EXPIRATION=24h` (24 hours)
  - `JWT_EXPIRATION=30m` (30 minutes)
- **Notes**: Shorter expiration = more secure but worse UX (more re-logins)

#### `SESSION_SECRET`
- **Type**: String (secure random)
- **Required**: 🟡 Recommended
- **Default**: None
- **Description**: Secret for session encryption
- **Example**: `SESSION_SECRET=your_session_secret_here_change_in_prod`

---

### Cloud Storage (MinIO / S3)

#### `S3_ENDPOINT`
- **Type**: URL
- **Required**: ✅ Yes
- **Default**: `http://minio:9000`
- **Description**: S3-compatible storage endpoint
- **Examples**:
  - Docker: `http://minio:9000` (internal Docker DNS)
  - Local: `http://localhost:9000`
  - AWS S3: `https://s3.amazonaws.com`
  - DigitalOcean: `https://nyc3.digitaloceanspaces.com`
- **Notes**:
  - MinIO is S3-compatible alternative to AWS S3
  - Docker: Use service name `minio` instead of `localhost`
  - Must use HTTPS in production

#### `S3_ACCESS_KEY`
- **Type**: String
- **Required**: ✅ Yes
- **Default**: `minioadmin`
- **Description**: S3 API access key
- **Example**: `S3_ACCESS_KEY=minioadmin`
- **Notes**:
  - For MinIO: Use any username
  - For AWS S3: Use AWS IAM access key
  - Store in secrets manager

#### `S3_SECRET_KEY`
- **Type**: String (sensitive)
- **Required**: ✅ Yes
- **Default**: None (must be set)
- **Description**: S3 API secret key
- **Example**: `S3_SECRET_KEY=MySecureSecretKey123`
- **⚠️ Important**:
  - Equivalent to password - keep secure
  - Store in secrets manager
  - Rotate regularly
  - Never commit to repository

#### `S3_BUCKET`
- **Type**: String (bucket name)
- **Required**: ✅ Yes
- **Default**: `acrobaticz`
- **Description**: S3 bucket name where files are stored
- **Example**: `S3_BUCKET=acrobaticz`
- **Notes**:
  - Bucket must already exist
  - Naming rules: lowercase, numbers, hyphens only, 3-63 characters
  - Must be unique globally (for AWS S3)

#### `S3_REGION`
- **Type**: String (AWS region)
- **Required**: 🟡 (for AWS S3)
- **Default**: `us-east-1`
- **Description**: AWS S3 region
- **Examples**:
  - `S3_REGION=us-east-1`
  - `S3_REGION=eu-west-1`
  - `S3_REGION=ap-southeast-1`

#### `STORAGE_PATH`
- **Type**: String (file path)
- **Required**: 🟡 (MinIO only)
- **Default**: `./storage/minio`
- **Description**: Local path where MinIO stores data
- **Examples**:
  - Relative: `./storage/minio`
  - Absolute: `/var/lib/acrobaticz/storage`
  - External disk: `/mnt/backup_drive/acrobaticz-storage`
- **Notes**:
  - Docker: Path in container volume mount
  - Must have sufficient disk space (50GB+ recommended)

---

## 🟡 RECOMMENDED Variables

### Translation API (DeepL)

#### `DEEPL_API_KEY`
- **Type**: String (API key)
- **Required**: 🟡 Recommended (if using translations)
- **Default**: None
- **Description**: DeepL API key for automatic translations
- **Where to get**: https://www.deepl.com/pro-api
- **Example**: `DEEPL_API_KEY=abcd1234:fx`
- **Notes**:
  - Free tier: 500,000 characters/month
  - Pro tier: Usage-based pricing
  - Without key: Translations disabled (English only)
  - Required for multi-language quotes and documents

#### `TRANSLATE_TARGET_LANGUAGES`
- **Type**: CSV (comma-separated language codes)
- **Required**: 🟡 Optional
- **Default**: `en,pt,es,fr,de,it,nl`
- **Description**: Languages to automatically translate to
- **Example**: `TRANSLATE_TARGET_LANGUAGES=en,pt,es,fr`
- **Supported**: See [DeepL documentation](https://www.deepl.com/docs-api/translated-text/handle-xml/)

---

### AI Integration (Google Gemini)

#### `GEMINI_API_KEY`
- **Type**: String (API key)
- **Required**: 🟡 Optional
- **Default**: None
- **Description**: Google Gemini API key for AI features
- **Where to get**: https://ai.google.dev/
- **Example**: `GEMINI_API_KEY=AIzaSy...`
- **Notes**:
  - Free tier available
  - Used for: Quote suggestions, equipment recommendations
  - Without key: AI features disabled

---

## 🟢 OPTIONAL Variables

### Logging & Monitoring

#### `DEBUG`
- **Type**: Boolean
- **Required**: 🟢 Optional
- **Default**: `false`
- **Description**: Enable detailed debug logging
- **Example**: `DEBUG=true` or `DEBUG=false`
- **Notes**:
  - Use only in development
  - Disable in production (performance impact)
  - Outputs to stdout and `app.log`

#### `LOG_LEVEL`
- **Type**: `error` | `warn` | `info` | `debug` | `trace`
- **Required**: 🟢 Optional
- **Default**: `info`
- **Description**: Minimum log level to output
- **Examples**:
  - `LOG_LEVEL=error` (only errors)
  - `LOG_LEVEL=info` (standard)
  - `LOG_LEVEL=debug` (development)
- **Hierarchy**: error → warn → info → debug → trace

#### `LOG_FILE`
- **Type**: Boolean | String (file path)
- **Required**: 🟢 Optional
- **Default**: `false`
- **Description**: Enable file-based logging
- **Examples**:
  - `LOG_FILE=false` (disabled)
  - `LOG_FILE=/app/logs/app.log`

---

### Feature Flags

#### `ENABLE_ADVANCED_REPORTING`
- **Type**: Boolean
- **Required**: 🟢 Optional
- **Default**: `true`
- **Description**: Enable advanced reporting features
- **Example**: `ENABLE_ADVANCED_REPORTING=true`

#### `ENABLE_PAYMENT_INTEGRATION`
- **Type**: Boolean
- **Required**: 🟢 Optional
- **Default**: `false`
- **Description**: Enable payment processing
- **Example**: `ENABLE_PAYMENT_INTEGRATION=false`

#### `ENABLE_EMAIL_NOTIFICATIONS`
- **Type**: Boolean
- **Required**: 🟢 Optional
- **Default**: `true`
- **Description**: Enable email notifications
- **Example**: `ENABLE_EMAIL_NOTIFICATIONS=true`

---

### Performance & Timeouts

#### `API_TIMEOUT`
- **Type**: Number (milliseconds)
- **Required**: 🟢 Optional
- **Default**: `30000` (30 seconds)
- **Description**: API request timeout
- **Example**: `API_TIMEOUT=60000`

#### `REQUEST_TIMEOUT`
- **Type**: Number (milliseconds)
- **Required**: 🟢 Optional
- **Default**: `30000`
- **Description**: HTTP request timeout
- **Example**: `REQUEST_TIMEOUT=30000`

#### `STORAGE_CHECK_INTERVAL`
- **Type**: Number (milliseconds)
- **Required**: 🟢 Optional
- **Default**: `300000` (5 minutes)
- **Description**: How often to check storage quota
- **Example**: `STORAGE_CHECK_INTERVAL=300000`

---

### Domain & HTTPS

#### `DOMAIN`
- **Type**: String (domain or IP:port)
- **Required**: 🟡 Recommended (production)
- **Default**: `localhost:3000`
- **Description**: Public domain for application
- **Examples**:
  - Local: `DOMAIN=localhost:3000`
  - Production: `DOMAIN=rental.yourdomain.com`
  - DuckDNS: `DOMAIN=yourdomain.duckdns.org`

#### `ENABLE_HTTPS`
- **Type**: Boolean
- **Required**: 🟡 Recommended (production)
- **Default**: `false`
- **Description**: Enable HTTPS with Let's Encrypt
- **Example**: `ENABLE_HTTPS=true`
- **Requirements**: Nginx + valid domain

#### `CERT_EMAIL`
- **Type**: Email address
- **Required**: 🟡 (if ENABLE_HTTPS=true)
- **Default**: None
- **Description**: Email for Let's Encrypt certificate notifications
- **Example**: `CERT_EMAIL=admin@yourdomain.com`

---

### DuckDNS Configuration (Dynamic DNS)

#### `DUCKDNS_DOMAIN`
- **Type**: String (DuckDNS subdomain)
- **Required**: 🟢 Optional
- **Default**: None
- **Description**: DuckDNS subdomain name
- **Example**: `DUCKDNS_DOMAIN=acrobaticzrental`
- **Result URL**: `https://acrobaticzrental.duckdns.org`

#### `DUCKDNS_TOKEN`
- **Type**: String (API token)
- **Required**: 🟢 Optional
- **Default**: None
- **Description**: DuckDNS API token for dynamic IP updates
- **Where to get**: https://www.duckdns.org
- **Example**: `DUCKDNS_TOKEN=abcd1234-efgh-5678-ijkl-9012mnop`

---

### Database Seeding

#### `SEED_ON_START`
- **Type**: Boolean
- **Required**: 🟢 Optional
- **Default**: `true`
- **Description**: Auto-seed database when empty
- **Example**: `SEED_ON_START=true`
- **Includes**: 3 users, 1 client, 6 categories, 65 products

#### `FORCE_SEED`
- **Type**: Boolean
- **Required**: 🟢 Optional
- **Default**: `false`
- **Description**: Force seed even if database has data (⚠️ DELETES ALL DATA!)
- **Example**: `FORCE_SEED=false`
- **⚠️ Warning**: Use with extreme caution!

#### `SEED_CLEAN`
- **Type**: Boolean
- **Required**: 🟢 Optional
- **Default**: `false`
- **Description**: Clean database before seeding
- **Example**: `SEED_CLEAN=false`

#### `SEED_VERBOSE`
- **Type**: Boolean
- **Required**: 🟢 Optional
- **Default**: `false`
- **Description**: Show detailed seeding output
- **Example**: `SEED_VERBOSE=true`

---

## 🛠️ Setup Instructions by Deployment Type

### Development (Local Machine)

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/acrobaticz?schema=public
JWT_SECRET=dev-secret-key-not-for-production
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=acrobaticz
DEBUG=true
LOG_LEVEL=debug
```

### Docker Development

```bash
NODE_ENV=development
PORT=3000
HOSTNAME=0.0.0.0
DATABASE_URL=postgresql://acrobaticz_user:changeme@postgres:5432/acrobaticz?schema=public
DB_NAME=acrobaticz
DB_USER=acrobaticz_user
DB_PASSWORD=changeme
JWT_SECRET=dev-secret-key-not-for-production
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=acrobaticz
DEEPL_API_KEY=your-api-key-here
SEED_ON_START=true
SEED_VERBOSE=true
```

### Production (Recommended)

```bash
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
DATABASE_URL=postgresql://prod_user:VeryStrongPassword123!@postgres-db.internal:5432/acrobaticz?schema=public
JWT_SECRET=<use-openssl-rand-base64-32>
S3_ENDPOINT=https://s3.amazonaws.com  # or MinIO
S3_ACCESS_KEY=<AWS IAM access key>
S3_SECRET_KEY=<AWS IAM secret key>
S3_BUCKET=acrobaticz-prod
S3_REGION=us-east-1
DOMAIN=rental.yourdomain.com
ENABLE_HTTPS=true
CERT_EMAIL=admin@yourdomain.com
DEEPL_API_KEY=<production-deepl-key>
DEBUG=false
LOG_LEVEL=warn
SEED_ON_START=false
FORCE_SEED=false
```

---

## ⚠️ Security Best Practices

1. **Never commit secrets to Git**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.production.local
   ```

2. **Use strong passwords**
   ```bash
   # Generate password
   openssl rand -base64 32
   ```

3. **Store secrets securely**
   - Development: `.env` file (local only)
   - Production: Use Docker Secrets, AWS Secrets Manager, or HashiCorp Vault

4. **Rotate credentials regularly**
   - Database passwords: Every 90 days
   - API keys: Every 180 days
   - JWT secret: After major security incident

5. **Use environment-specific files**
   - `.env.example` - Template (commit to Git)
   - `.env` - Development (gitignore)
   - `.env.production` - Production secrets (secure vault only)

---

## 🔍 Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` format
- Verify PostgreSQL is running: `docker-compose logs postgres`
- Test connection: `psql $DATABASE_URL`

### "JWT validation failed"
- Ensure `JWT_SECRET` is set consistently across all instances
- Check JWT token format: `Authorization: Bearer <token>`

### "S3 bucket not found"
- Verify bucket exists: `aws s3 ls` or MinIO console
- Check `S3_ENDPOINT` is correct
- Verify `S3_ACCESS_KEY` and `S3_SECRET_KEY`

### "DeepL translation not working"
- Check `DEEPL_API_KEY` is valid
- Verify API quota not exceeded at https://www.deepl.com/account
- Check API endpoint: `https://api.deepl.com`

---

## 📚 Related Documentation

- [README.md](./README.md) - Project overview
- [docs/SETUP/DOCKER_SETUP.md](./docs/SETUP/DOCKER_SETUP.md) - Docker configuration
- [docs/SETUP/LOCAL_DEVELOPMENT.md](./docs/SETUP/LOCAL_DEVELOPMENT.md) - Local development
- [docs/DEPLOYMENT/PRODUCTION_DEPLOYMENT.md](./docs/DEPLOYMENT/PRODUCTION_DEPLOYMENT.md) - Production deployment

---

**Last Updated**: January 18, 2026 | **Status**: Production Ready ✅
