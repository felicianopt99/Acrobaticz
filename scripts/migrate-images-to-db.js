import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

const BACKUP_MEDIA_DIR = './FINAL/av-rentals-backup-complete-20260109_152432/media';
const PUBLIC_IMAGES_DIR = './public/images';

// MIME type detection
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return mimeTypes[ext] || 'image/jpeg';
}

async function migrateImagesToDatabase() {
  console.log('🖼️  Starting image migration to database...\n');

  try {
    // Get all equipment items
    const allEquipment = await prisma.equipmentItem.findMany();
    console.log(`Found ${allEquipment.length} equipment items\n`);

    // Get list of image files from public folder
    const publicImages = fs.readdirSync(PUBLIC_IMAGES_DIR)
      .filter(file => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file))
      .filter(file => file.startsWith('equipment-'));

    console.log(`Found ${publicImages.length} equipment images\n`);

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    // Process each image
    for (let i = 0; i < publicImages.length && i < allEquipment.length; i++) {
      const fileName = publicImages[i];
      const filePath = path.join(PUBLIC_IMAGES_DIR, fileName);
      const equipment = allEquipment[i];

      try {
        const imageBuffer = fs.readFileSync(filePath);
        const base64Data = imageBuffer.toString('base64');
        const mimeType = getMimeType(filePath);

        // Update equipment with image data
        await prisma.equipmentItem.update({
          where: { id: equipment.id },
          data: {
            imageData: base64Data,
            imageContentType: mimeType,
            imageUrl: `/api/equipment/${equipment.id}/image`,
          },
        });

        migrated++;
        console.log(`✓ ${equipment.name} <- ${fileName} (${(imageBuffer.length / 1024).toFixed(1)}KB)`);
      } catch (error) {
        console.error(`✗ ${fileName} - Error: ${error.message}`);
        failed++;
      }
    }

    // Summary
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✓ Migrated: ${migrated}`);
    console.log(`   ⊘ Skipped: ${skipped}`);
    console.log(`   ✗ Failed: ${failed}`);
    console.log(`   Total processed: ${publicImages.length}`);

    // Get stats
    const equipmentWithImages = await prisma.equipmentItem.count({
      where: {
        imageData: {
          not: null,
        },
      },
    });

    console.log(`\n📈 Database Status:`);
    console.log(`   Equipment with image data in DB: ${equipmentWithImages}`);

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
