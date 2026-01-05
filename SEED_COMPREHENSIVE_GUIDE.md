# Comprehensive Test Data Seed Guide

## Overview

The comprehensive seed script (`scripts/seed-comprehensive.ts`) creates realistic test data across all AV Rentals app features to enable thorough end-to-end testing without manual data creation.

## What Gets Seeded

### ✅ PHASE 1: Base Infrastructure
- **5 Test Users**: Admin, Manager, Technician, 2x Employee (with different roles)
- **5 Equipment Categories**: Audio, Video, Lighting, Rigging, Staging
- **10 Subcategories**: Microphones, Speakers, Mixers, Cameras, Projectors, Screens, Spotlights, LED Panels, Podiums, Backdrops
- **5 Services**: Setup & Teardown, Technical Support, Operator, Delivery & Setup, Installation
- **5 Fees**: Delivery Fee, Insurance, Late Return Fee, Damage Waiver, Equipment Protection

### ✅ PHASE 2: Business Masters
- **5 Clients**: Marriott Hotel Porto, TVI Productions, RFM Radio, Corporate Events Portugal, Music Festival Vilamoura
- **3 Partners**: Audio Rental Pro (provider), Creative Events Agency (agency with 15% commission), Studio Equipment Rentals (both types)
- **17 Equipment Items**: Professional AV equipment in various categories with realistic pricing (daily rates from €40-€1000+)

### ✅ PHASE 3: Events & Quotes
- **5 Events**: Corporate Gala, TVI Awards, RFM Festival, Corporate Workshop, Vilamoura Music Festival
  - Linked to specific clients
  - Date ranges from current date + 5-30 days
- **3 Quotes**: With multiple line items (equipment, services, fees)
  - Equipment items, service hours, fixed fees
  - Automatic calculation: subtotal, 23% VAT, total amount
  - Status: Draft (ready to send to clients)

### ✅ PHASE 4: Rental & Subrental System
- **8 Rentals**: Equipment linked to events with quantity tracking
  - Proper FK relationships (Event → Equipment)
  - Prep status: pending (ready for check-in/out workflow testing)
- **1 Subrental**: Partner equipment for an event
  - Equipment from partner with commission tracking
  - Demonstrates subrental workflow

### ✅ PHASE 5: Cloud Storage
- **Cloud Folder Hierarchy**: 
  - Root: "My Drive"
  - 4 subfolders: Events, Equipment Docs, Quotes & Invoices, Archive
- **4 Cloud Files**: PDF, Excel, Word documents across folders
- **Storage Quota**: 10GB default for admin user
- **Demonstrates**: File organization, versioning structure, sharing ready

### ✅ PHASE 6: Supporting Data
- **3 Maintenance Logs**: Equipment maintenance history with dates and costs
  - Linked to specific equipment
  - Shows maintenance tracking workflow

## Usage

### Quick Start

```bash
# Seed test data in development environment
npm run db:seed:test

# Seed with cleanup (remove old test data first)
npm run db:seed:test:clean

# Docker dev mode with comprehensive seed
SEED_COMPREHENSIVE=true docker-compose -f docker-compose.dev.yml up
```

### Command-Line Options

```bash
# Full seed (default, idempotent - safe to run multiple times)
npm run db:seed:test

# Clean database, then seed
npm run db:seed:test:clean

# Preview what would be created (dry run, no database changes)
npx tsx scripts/seed-comprehensive.ts --full --dry-run

# Clean only (no seeding)
npx tsx scripts/seed-comprehensive.ts --clean
```

### Environment Variables

**Docker Development**:
```bash
# Enable comprehensive seeding on startup
SEED_COMPREHENSIVE=true docker-compose -f docker-compose.dev.yml up
```

**Local Terminal**:
```bash
export DATABASE_URL="postgresql://avrentals_user:avrentals_pass@localhost:5432/avrentals_db"
npm run db:seed:test
```

**Docker Entrypoint**:
The seed script automatically runs if `SEED_COMPREHENSIVE=true` environment variable is set and the database is already seeded with core users.

## Test Credentials

### Admin User
- **Username**: `feliciano`
- **Password**: `superfeliz99`
- **Role**: Admin

### Manager User
- **Username**: `lourenco`
- **Password**: `lourenco123`
- **Role**: Manager

### Technician User
- **Username**: `joao`
- **Password**: `joao123`
- **Role**: Technician

### Employee Users
- **Username**: `maria` / Password: `maria123`
- **Username**: `pedro` / Password: `pedro123`
- **Role**: Employee

## Testing Workflows

### 🎯 Rental Management Workflow
1. Navigate to Rentals
2. See 5 events with equipment assigned
3. Test rental prep status flow (pending → checked-out → checked-in)
4. Verify equipment availability checking

### 🎯 Quoting Workflow
1. Navigate to Quotes
2. See 3 draft quotes with multiple line items
3. Test quote modification (add/remove items)
4. Test quote status transitions (Draft → Sent → Accepted)
5. Verify price calculations (subtotal, tax, discounts)

### 🎯 Equipment Management
1. Navigate to Equipment
2. See 17 items in 5 categories with subcategories
3. Test filter by category/subcategory
4. View equipment availability across rentals
5. See maintenance logs (3 records)

### 🎯 Client Management
1. Navigate to Clients
2. See 5 clients with contact info
3. View associated events and quotes for each client
4. Test client-event relationships

### 🎯 Cloud Drive / File Management
1. Navigate to Cloud Drive
2. See folder hierarchy (My Drive → subfolders)
3. See 4 sample files
4. Test file operations (rename, move, share)
5. Test storage quota display

### 🎯 Partner Management
1. Navigate to Partners
2. See 3 partners with different types
3. View agency commission tracking
4. See associated subrentals
5. Test partner-to-subrental linking

### 🎯 Calendar View
1. Navigate to Calendar
2. See all 5 events displayed
3. See associated rentals per event
4. Test event drag-and-drop (if enabled)
5. View event details with equipment list

## Data Relationships

The seed data maintains **realistic relationships** across the entire system:

```
Client → Event → Rental → Equipment
         ├─→ Quote → QuoteItem → {Equipment, Service, Fee}
         └─→ JobReference (if from agency)

Partner → Subrental → Event
        → JobReference → Quote

User → CloudFolder → CloudFile → FileVersion
     → StorageQuota
```

## Idempotency

The seed script is **idempotent** - safe to run multiple times:
- Checks for existing entities before creating
- Skips creation if entity already exists
- Logs "already exists" messages for duplicates
- No duplicate data created

## Database Integrity

All relationships respect **Prisma schema constraints**:
- ✅ Foreign key relationships properly established
- ✅ Cascade delete rules followed (e.g., Quote → QuoteItem)
- ✅ Required fields always populated
- ✅ Unique constraints respected (e.g., quoteNumber)
- ✅ BigInt support for file sizes and quotas

## Performance

- **Seed Time**: ~2-5 seconds for full seed on clean database
- **Re-run Time**: <1 second (checks for existing data, minimal DB hits)
- **Data Volume**: 
  - ~45+ records created on first run
  - Organized into 6 phases for logical grouping

## Troubleshooting

### "Database not found" error
```bash
# Ensure Docker containers are running
docker-compose -f docker-compose.dev.yml ps

# If not, start them
docker-compose -f docker-compose.dev.yml up -d
```

### "Unknown column" errors
```bash
# Regenerate Prisma client
npm run db:generate
```

### "Foreign key constraint" errors
- Seed data creation order is carefully structured to avoid FK violations
- All dependencies are resolved in PHASE 1→6 sequence
- Report any errors with seed script version number

### Want to reset and reseed completely
```bash
# Clean database
npm run db:seed:test:clean

# Or with Docker
SEED_COMPREHENSIVE=true docker-compose -f docker-compose.dev.yml down
SEED_COMPREHENSIVE=true docker-compose -f docker-compose.dev.yml up
```

## Feature Coverage

The seed data enables testing of:

| Feature | Entities | Coverage |
|---------|----------|----------|
| Rental Management | Events, Equipment, Rentals | 5 events, 17 equipment, 8 rentals |
| Quoting System | Quotes, QuoteItems, Services, Fees | 3 quotes with 11 line items |
| Client Management | Clients, Events, Quotes | 5 clients, 5 events, 3 quotes |
| Equipment Tracking | Categories, Equipment, MaintenanceLogs | 5 categories, 17 items, 3 logs |
| Partner Management | Partners, Subrentals, JobReferences | 3 partners, 1 subrental |
| Cloud Storage | Folders, Files, FileVersions | 5 folders, 4 files |
| User Management | Users (5 roles), StorageQuota | 5 users with different roles |
| Calendar View | Events with dates | 5 events across date range |

## Future Enhancements

Potential additions to seed data:
- [ ] Multiple quotes per client
- [ ] Equipment with maintenance needed status
- [ ] Quotes with discounts applied
- [ ] Multiple users assigned to events
- [ ] Cloud file sharing scenarios
- [ ] Batch operations on cloud files
- [ ] Translation strings for multilingual testing

---

**Last Updated**: January 4, 2026  
**Script Location**: `scripts/seed-comprehensive.ts`  
**NPM Scripts**: `db:seed:test`, `db:seed:test:clean`
