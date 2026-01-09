import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

const BACKUP_MEDIA_DIR = path.join(__dirname, '..', 'av-rentals-backup-complete-20260109_152432', 'media');

async function seedEquipmentWithImages() {
  console.log('🖼️  Seeding equipment with images from backup...\n');

  try {
    // Get or create a default category
    let category = await prisma.category.findFirst();
    
    if (!category) {
      console.log('Creating default category...');
      category = await prisma.category.create({
        data: {
          name: 'Audio/Visual Equipment',
          description: 'General AV equipment',
          icon: 'box',
        },
      });
      console.log('✓ Category created:', category.name);
    } else {
      console.log('✓ Using existing category:', category.name);
    }

    // Read all image files from backup
    if (!fs.existsSync(BACKUP_MEDIA_DIR)) {
      console.error('❌ Backup media directory not found:', BACKUP_MEDIA_DIR);
      return;
    }

    const imageFiles = fs
      .readdirSync(BACKUP_MEDIA_DIR)
      .filter(file => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file))
      .filter(file => file.startsWith('equipment-'))
      .sort();

    console.log(`Found ${imageFiles.length} equipment images\n`);

    const equipmentTypes = ['Projector', 'Sound System', 'LED Lights', 'Tripod', 'Microphone', 'Camera', 'Mixer', 'Cable'];
    const locations = ['Storage A', 'Storage B', 'Storage C', 'Warehouse', 'Office'];
    
    let created = 0;
    let failed = 0;

    for (let i = 0; i < imageFiles.length; i++) {
      const fileName = imageFiles[i];
      const imagePath = path.join(BACKUP_MEDIA_DIR, fileName);

      try {
        const fileSize = fs.statSync(imagePath).size;
        const equipmentType = equipmentTypes[i % equipmentTypes.length];
        const location = locations[i % locations.length];
        const quantity = Math.floor(Math.random() * 5) + 1;

        const equipment = await prisma.equipmentItem.create({
          data: {
            name: `${equipmentType} ${Math.floor(i / equipmentTypes.length) + 1}`,
            description: `Professional ${equipmentType.toLowerCase()} - ${fileSize} bytes`,
            categoryId: category.id,
            quantity,
            status: 'available',
            quantityByStatus: {
              good: Math.floor(quantity * 0.8),
              damaged: Math.floor(quantity * 0.1),
              maintenance: Math.floor(quantity * 0.1),
            },
            location,
            imageUrl: `/images/${fileName}`,
            dailyRate: 25 + Math.random() * 100,
            type: equipmentType,
          },
        });

        created++;
        console.log(`✓ ${equipment.name} (${(fileSize / 1024).toFixed(1)}KB) -> ${equipment.imageUrl}`);
      } catch (error) {
        failed++;
        console.error(`✗ ${fileName} - Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    console.log(`\n📊 Seeding Summary:`);
    console.log(`   ✓ Created: ${created} equipment items`);
    console.log(`   ✗ Failed: ${failed}`);
    console.log(`   Total images: ${imageFiles.length}`);

    // Get final stats
    const totalEquipment = await prisma.equipmentItem.count();
    const equipmentWithImages = await prisma.equipmentItem.count({
      where: {
        imageUrl: {
          not: null,
        },
      },
    });

    console.log(`\n📈 Database Status:`);
    console.log(`   Total equipment: ${totalEquipment}`);
    console.log(`   Equipment with images: ${equipmentWithImages}`);

  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
seedEquipmentWithImages()
  .then(() => {
    console.log('\n✅ Equipment seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });
