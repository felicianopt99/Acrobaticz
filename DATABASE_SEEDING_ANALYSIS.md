# Database Seeding Scripts Analysis

## Overview
The AV-Rentals application uses multiple seeding and database initialization approaches across development and production environments. The seeding strategy uses a combination of Prisma migrations, shell scripts, and Node.js seed files.

---

## 1. Main Seed Script: `seed.js`

### Location
[scripts/seed.js](scripts/seed.js)

### Purpose
Comprehensive data seeding for development environment that populates the database with realistic sample data.

### Key Functions

#### User Creation
```javascript
- Creates 3 default users:
  1. Admin User (username: 'admin', password: 'Admin!234', role: 'Admin')
  2. Operations Manager (username: 'manager', password: 'Manager!234', role: 'Manager')
  3. Staff User (username: 'staff', password: 'Staff!234', role: 'Employee')
```

#### Data Models Seeded
1. **Categories** (4 total):
   - Lighting (with icon: Sun)
   - Audio (with icon: Volume2)
   - Video (with icon: Camera)
   - Staging (with icon: Box)

2. **Subcategories** (12 total):
   - Lighting: Moving Heads, LED Pars, Control
   - Audio: Mixers, Speakers, Microphones
   - Video: Projectors, LED Screens, Cameras
   - Staging: Platforms, Truss, Rigging

3. **Equipment Items** (6 items):
   - LED Par 64 (Lighting/LED Pars) - 24 units, €15/day
   - Moving Head Spot 350W (Lighting/Moving Heads) - 12 units, €65/day
   - Digital Mixer 32ch (Audio/Mixers) - 3 units, €120/day
   - Powered Speaker 15" (Audio/Speakers) - 16 units, €30/day
   - Projector 10k ANSI (Video/Projectors) - 2 units, €180/day
   - Stage Platform 2x1m (Staging/Platforms) - 20 units, €20/day

4. **Clients** (2 clients):
   - Acme Corp (Contact: Jane Doe, email: events@acme.test)
   - BlueWave Productions (Contact: John Smith, email: bookings@bluewave.test)

5. **Services** (3 services):
   - Lighting Technician (€150/day)
   - Audio Engineer (€200/day)
   - Delivery Service (€80/trip)

6. **Fees** (2 fees):
   - Damage Waiver (5% percentage fee)
   - Setup Fee (€50 fixed fee)

7. **Events** (1 event):
   - "Acme Annual Meeting" (scheduled 7 days from current date, 9:00-18:00)

8. **Rentals**:
   - Creates sample rental entries for the event with first 4 equipment items

9. **System Settings**:
   - Company Name: "Acrobaticz AV Rentals"
   - System Name: "AV Rentals"
   - Language: Portuguese (pt)

### Key Methods
- **upsertUser()**: Creates or updates users with bcrypt password hashing
- **findOrCreateCategory()**: Manages category creation/updates
- **findOrCreateSubcategory()**: Manages subcategory creation/updates
- **findOrCreateClient()**: Manages client creation/updates
- **findOrCreateService()**: Manages service creation/updates
- **findOrCreateFee()**: Manages fee creation/updates
- **findOrCreateEquipment()**: Manages equipment creation/updates
- **findOrCreateEvent()**: Manages event creation/updates

### Execution Flow
1. Creates admin user (used as createdBy reference for all records)
2. Creates manager and staff users
3. Iteratively creates categories and subcategories
4. Populates equipment items with proper category/subcategory associations
5. Creates client records
6. Creates service and fee records
7. Creates sample event with client association
8. Links equipment to event through rental records
9. Sets up default customization settings
10. Returns user credentials for reference

### Exit Handling
- Success: Exits with code 0 after disconnecting Prisma client
- Failure: Exits with code 1 and logs error message

---

## 2. Docker Production Initialization: `init-db.sh`

### Location
[scripts/init-db.sh](scripts/init-db.sh)

### Purpose
Minimal Docker-based database initialization for PostgreSQL container setup.

### Functionality
```bash
- Reads database credentials from Docker secrets:
  * DB_USER (from /run/secrets/db_user)
  * DB_PASSWORD (from /run/secrets/db_password)
  * DB_NAME (from /run/secrets/db_name)

- Waits for PostgreSQL to become available (with polling)

- Creates a single default admin user:
  * Username: 'admin'
  * Password: bcrypt-hashed 'password'
  * Role: 'Admin'
  * ID: 00000000-0000-0000-0000-000000000000 (UUID v4 zeros)

- Uses ON CONFLICT (username) DO NOTHING to prevent duplicate errors
```

### Features
- Non-blocking: Uses `psql` to verify PostgreSQL availability
- Idempotent: Won't fail if admin user already exists
- Secure: Reads credentials from Docker secrets (not environment variables)

---

## 3. Docker Entrypoint: `docker-entrypoint.sh`

### Location
[scripts/docker-entrypoint.sh](scripts/docker-entrypoint.sh)

### Purpose
Container startup orchestration with database migration and environment setup.

### Key Features

1. **Secret Management**:
   - Reads Docker secrets (db_user, db_password, db_name, jwt_secret, deepl_api_key)
   - Constructs DATABASE_URL if not provided
   - Handles special character encoding in passwords

2. **Prisma Migration Deployment**:
   ```bash
   - Runs: npx prisma migrate deploy
   - Retries up to 20 times with 3-second intervals
   - Activated when PRISMA_MIGRATIONS=deploy environment variable is set
   ```

3. **Cron Mode Support**:
   - Allows executing cron jobs when APP_MODE=cron
   - Bypasses normal application startup

4. **Password URL Encoding**:
   - Encodes special characters for safe PostgreSQL connection strings
   - Handles characters: space, !, ", #, $, &, ', (, ), *, +, comma, /, :, ;, =, ?, @, [, ], {, }

---

## 4. Database Initialization Fix: `init-db-fix.sh`

### Location
[init-db-fix.sh](init-db-fix.sh)

### Purpose
Alternative database user and permission setup script for manual deployment scenarios.

### Functionality
```sql
- Creates PostgreSQL user 'avrentals_user' with strong password
- Creates database 'avrentals_db'
- Grants comprehensive permissions:
  * ALL PRIVILEGES on database
  * ALL PRIVILEGES on schema public
  * ALL PRIVILEGES on tables, sequences, functions
  * DEFAULT PRIVILEGES for future objects
```

### Usage
Generates SQL script at `/tmp/init.sql` for manual execution.

---

## 5. Prisma Migrations

### Location
[prisma/migrations/](prisma/migrations/)

### Migration Files

#### 20251110233929_init_postgres
- **Purpose**: Initial database schema creation
- **Scope**: 526 lines of SQL
- **Tables Created**: All core database tables including:
  - User
  - Category
  - Subcategory
  - EquipmentItem
  - Client
  - Event
  - Rental
  - Service
  - Fee
  - CustomizationSettings
  - TranslationCache (for i18n)
  - And more...

#### 20251111045118_add_translation_cache
- **Purpose**: Enhanced translation caching infrastructure
- **Date**: November 11, 2025

#### 20251111135023_add_enhanced_translation_fields
- **Purpose**: Extended translation metadata fields
- **Date**: November 11, 2025

#### 20251124143533_add_pdf_branding_fields
- **Purpose**: PDF export branding customization
- **Date**: November 24, 2025

---

## 6. Package.json Seed Configuration

### Location
[package.json](package.json) - Line 13

### Configuration
```json
"prisma": {
  "seed": "node -e \"console.log('Prisma automatic seed disabled in production. Use npm run db:seed:dev locally.')\""
}
```

### Purpose
- Disables Prisma's automatic seeding in production
- Provides helpful message directing users to development seeding process
- Prevents unintended data pollution in production

---

## Seeding Strategy Summary

### Development Environment
1. **Initial Setup**:
   - Prisma migrations create all tables
   - Run `npx prisma db seed` to execute seed.js
   - Populates realistic sample data for testing

2. **Data Consistency**:
   - Uses "upsert" pattern (find or create)
   - Updates existing records if names match
   - Prevents duplicate data issues

### Production Environment
1. **Database Creation**:
   - Docker secret credentials for security
   - init-db.sh creates minimal admin user
   - Prisma migrations deployed via docker-entrypoint.sh

2. **First-Run User**:
   - Default admin credentials available for initial login
   - Should be changed immediately in production

3. **No Automatic Seeding**:
   - Production seed command is disabled
   - Manual data entry required for production setup
   - Migrations handle schema changes safely

---

## Security Considerations

### ✅ Strengths
1. **Bcrypt Password Hashing**: All passwords use bcrypt with salt rounds
2. **Docker Secrets**: Production uses secrets, not environment variables
3. **Idempotent Operations**: Uses ON CONFLICT to prevent errors
4. **URL Encoding**: Properly encodes special characters in database URLs

### ⚠️ Areas to Address
1. **Hard-coded Development Passwords**: seed.js uses plain text passwords (acceptable for dev only)
2. **Default Admin User**: Production uses predictable default user
3. **Password in Script**: init-db.sh contains bcrypt hash (though acceptable for demo)

### Recommendations
1. Change default admin credentials immediately after production deployment
2. Use strong, randomly generated passwords for production secrets
3. Implement audit logging for database modifications
4. Consider using environment-specific seed scripts

---

## Execution Workflow

### Development Setup
```bash
1. npm install                           # Install dependencies
2. npx prisma migrate deploy             # Apply migrations
3. npx prisma db seed                    # Run seed.js
4. npm run dev                           # Start application
```

### Docker Production Setup
```bash
1. docker-compose up --build             # Triggers docker-entrypoint.sh
2. Automatically:
   - Reads Docker secrets
   - Runs Prisma migrations
   - Creates default admin user (via init-db.sh hook)
   - Starts application server
```

---

## Data Relationships

```
User (admin) 
├── creates Category (4 items)
│   └── creates Subcategory (3 each)
│       └── used by EquipmentItem (6 items)
│
├── creates Client (2 items)
│   └── creates Event (1 item)
│       └── creates Rental (4 items)
│           └── references EquipmentItem
│
├── creates Service (3 items)
├── creates Fee (2 items)
└── creates CustomizationSettings
```

---

## Translation System Integration

The seeding scripts don't directly handle translations, but they seed the structure for:
- TranslationCache table (added in migration 20251111045118)
- Enhanced translation fields (added in migration 20251111135023)

Separate translation scripts handle populating translation data:
- See `/scripts` for various translation-related scripts

---

## Migration Lock

### Location
[prisma/migrations/migration_lock.toml](prisma/migrations/migration_lock.toml)

**Purpose**: Ensures single provider consistency
- Locks to PostgreSQL provider
- Prevents accidental switching to other databases

---

## Key Takeaways

1. **Multi-Layered Approach**: Development seeding (seed.js) vs. production initialization (init-db.sh)
2. **Safety First**: Uses upsert patterns and idempotent operations
3. **Security**: Docker secrets for production, bcrypt for passwords
4. **Flexibility**: Prisma migrations handle schema versioning
5. **Automation**: Docker entrypoint orchestrates the entire setup
6. **Extendability**: Easy to add new seed data by extending seed.js functions
