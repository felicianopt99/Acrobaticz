import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export async function POST(request: NextRequest) {
  try {
    console.log('🖼️  Starting image migration to database...\n');

    const PUBLIC_IMAGES_DIR = path.join(process.cwd(), 'public', 'images');

    // Get all equipment items
    const allEquipment = await prisma.equipmentItem.findMany({
      orderBy: { createdAt: 'desc' },
    });
    console.log(`Found ${allEquipment.length} equipment items\n`);

    // Get list of image files
    let publicImages: string[] = [];
    if (fs.existsSync(PUBLIC_IMAGES_DIR)) {
      publicImages = fs
        .readdirSync(PUBLIC_IMAGES_DIR)
        .filter(file => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file))
        .filter(file => file.startsWith('equipment-'));
    }

    console.log(`Found ${publicImages.length} equipment images\n`);

    let migrated = 0;
    let skipped = 0;
    let failed = 0;
    const results: any[] = [];

    // Process each equipment item with matching images
    for (let i = 0; i < publicImages.length && i < allEquipment.length; i++) {
      const fileName = publicImages[i];
      const filePath = path.join(PUBLIC_IMAGES_DIR, fileName);
      const equipment = allEquipment[i];

      try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          console.log(`⊘ ${fileName} - File not found`);
          skipped++;
          continue;
        }

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
        const sizeKB = (imageBuffer.length / 1024).toFixed(1);
        const msg = `✓ ${equipment.name} <- ${fileName} (${sizeKB}KB)`;
        console.log(msg);
        results.push({ status: 'success', equipment: equipment.name, file: fileName, size: sizeKB });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`✗ ${fileName} - Error: ${errorMsg}`);
        failed++;
        results.push({ status: 'error', file: fileName, error: errorMsg });
      }
    }

    // Get stats
    const equipmentWithImages = await prisma.equipmentItem.count({
      where: {
        imageData: {
          not: null,
        },
      },
    });

    const summary = {
      migrated,
      skipped,
      failed,
      total: publicImages.length,
      equipmentWithImagesInDB: equipmentWithImages,
      allEquipmentCount: allEquipment.length,
    };

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✓ Migrated: ${migrated}`);
    console.log(`   ⊘ Skipped: ${skipped}`);
    console.log(`   ✗ Failed: ${failed}`);
    console.log(`\n📈 Database Status:`);
    console.log(`   Equipment with image data in DB: ${equipmentWithImages}/${allEquipment.length}`);

    return NextResponse.json({
      success: true,
      message: 'Image migration completed',
      summary,
      results: results.slice(0, 50), // Return first 50 results
    });
  } catch (error) {
    console.error('Error during migration:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
