# Database Seeding Guide

This folder contains backup and seeding scripts for the AV Rentals application.

## Contents

- `av-rentals-backup-complete-20260109_152432/` - Complete backup from January 9, 2026
  - `database/` - PostgreSQL database backup
  - `media/` - Equipment images and media files
  - `config/` - Configuration files and schema
  - `metadata/` - Backup manifest and information

- `seed-equipment-with-images.js` - Node.js seeding script
- `seed-equipment-with-images.ts` - TypeScript seeding script
- `SEEDING_INSTRUCTIONS.md` - Detailed seeding instructions

## Quick Start

### Option 1: Using Node.js (Recommended)

```bash
cd /home/feliciano/projects/Acrobaticz/FINAL
DATABASE_URL="postgresql://avrentals_user:PASSWORD@localhost:5432/avrentals_db" \
node seed-equipment-with-images.js
```

### Option 2: Using Docker Container

```bash
cd /home/feliciano/projects/Acrobaticz
docker exec av-rentals node /root/FINAL/seed-equipment-with-images.js
```

### Option 3: Using npx from Project Root

```bash
cd /home/feliciano/projects/Acrobaticz
npx tsx FINAL/seed-equipment-with-images.ts
```

## What Gets Seeded

The seeding script:
1. Creates a default equipment category if none exists
2. Reads all equipment images from the backup media folder (124 images)
3. Creates equipment items with:
   - Unique names (Projector, Sound System, LED Lights, etc.)
   - Descriptions with file size information
   - Associated images from the backup
   - Random quantities (1-5 units)
   - Realistic daily rental rates ($25-$125)
   - Equipment status and quantity breakdown

## Database Requirements

- PostgreSQL database must be running
- `avrentals_db` database must exist
- `avrentals_user` must have proper permissions
- Environment variable: `DATABASE_URL` must be set

Example:
```
DATABASE_URL="postgresql://avrentals_user:password@localhost:5432/avrentals_db"
```

## Image Files

All images are stored in:
- Source: `av-rentals-backup-complete-20260109_152432/media/`
- Production: `/home/feliciano/projects/Acrobaticz/public/images/`

Images are referenced in the database as `/images/equipment-XXXXXXXXX-XXXXXXXXX.jpg`

## Troubleshooting

### "Cannot find module '@prisma/client'"
Make sure you're running from the project root with NODE_PATH set:
```bash
cd /home/feliciano/projects/Acrobaticz
NODE_PATH=node_modules npx tsx FINAL/seed-equipment-with-images.ts
```

### "DATABASE_URL not set"
Set the environment variable:
```bash
export DATABASE_URL="postgresql://avrentals_user:password@localhost:5432/avrentals_db"
```

### Images not showing
Ensure images are copied to `public/images/`:
```bash
cp FINAL/av-rentals-backup-complete-20260109_152432/media/equipment-*.{jpg,jpeg,png,webp} public/images/
```

## Result

After running the seeding script, you will have:
- ✓ 124 equipment items created
- ✓ All with associated images
- ✓ Ready-to-use test data
- ✓ Accessible at https://acrobaticz.duckdns.org

Access the application and log in with your user credentials to see the seeded data.
