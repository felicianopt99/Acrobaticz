import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BACKUP_MEDIA_DIR = './FINAL/av-rentals-backup-complete-20260109_152432/media';
const PUBLIC_IMAGES_DIR = './public/images';

// MIME type detection
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return mimeTypes[ext] || 'image/jpeg';
}

// Get equipment ID from image path
function getEquipmentIdFromBackup(fileName: string): string | null {
  // Extract timestamp from filename like "equipment-1767653442872-f3iq0emiz.jpg"
  const match = fileName.match(/equipment-(\d+)-/);
  return match ? match[1] : null;
}

async function findEquipmentByTimestamp(timestamp: string): Promise<string | null> {
  // Find equipment by creation timestamp or by the naming pattern
  const equipment = await prisma.equipmentItem.findFirst({
    where: {
      createdAt: {
        gte: new Date(Number(timestamp) - 1000),
        lte: new Date(Number(timestamp) + 1000),
      },
    },
  });
  return equipment?.id || null;
}

async function migrateImagesToDatabase() {
  console.log('🖼️  Starting image migration to database...\n');

  try {
    // Get list of image files from backup
    const backupImages = fs.readdirSync(BACKUP_MEDIA_DIR)
      .filter(file => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file))
      .filter(file => file.startsWith('equipment-'));

    console.log(`Found ${backupImages.length} equipment images to migrate\n`);

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const fileName of backupImages) {
      const filePath = path.join(BACKUP_MEDIA_DIR, fileName);
      
      try {
        // Try to find equipment by filename pattern
        const fileStats = fs.statSync(filePath);
        const imageBuffer = fs.readFileSync(filePath);
        const base64Data = imageBuffer.toString('base64');
        const mimeType = getMimeType(filePath);

        // Extract timestamp to find matching equipment
        const timestamp = getEquipmentIdFromBackup(fileName);
        let equipmentId: string | null = null;

        if (timestamp) {
          equipmentId = await findEquipmentByTimestamp(timestamp);
        }

        // Fallback: if no match found by timestamp, try to find equipment without imageData
        if (!equipmentId) {
          const equipmentWithoutImage = await prisma.equipmentItem.findFirst({
            where: {
              imageData: null,
              imageUrl: null,
            },
            orderBy: {
              createdAt: 'desc',
            },
          });
          
          if (equipmentWithoutImage) {
            equipmentId = equipmentWithoutImage.id;
          }
        }

        if (equipmentId) {
          // Update equipment with image data
          await prisma.equipmentItem.update({
            where: { id: equipmentId },
            data: {
              imageData: base64Data,
              imageContentType: mimeType,
              imageUrl: `/api/equipment/${equipmentId}/image`, // Store the API endpoint
            },
          });

          migrated++;
          console.log(`✓ ${fileName}`);
        } else {
          console.log(`⊘ ${fileName} - No matching equipment found`);
          skipped++;
        }
      } catch (error) {
        console.error(`✗ ${fileName} - Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failed++;
      }
    }

    // Summary
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✓ Migrated: ${migrated}`);
    console.log(`   ⊘ Skipped: ${skipped}`);
    console.log(`   ✗ Failed: ${failed}`);
    console.log(`   Total: ${backupImages.length}`);

    // Get stats
    const equipmentWithImages = await prisma.equipmentItem.count({
      where: {
        imageData: {
          not: null,
        },
      },
    });

    console.log(`\n📈 Database Status:`);
    console.log(`   Equipment with images: ${equipmentWithImages}`);

  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateImagesToDatabase()
  .then(() => {
    console.log('\n✅ Image migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
