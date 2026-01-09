import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting database seed from JSON files...');

    const dataDir = path.join(process.cwd(), 'seeding/data');
    const imagesDir = path.join(process.cwd(), 'seeding/images');
    const publicImagesDir = path.join(process.cwd(), 'public/images');

    // Ensure public images directory exists
    if (!fs.existsSync(publicImagesDir)) {
      fs.mkdirSync(publicImagesDir, { recursive: true });
    }

    // Copy images from seeding to public
    console.log('📸 Copying images to public folder...');
    if (fs.existsSync(imagesDir)) {
      const images = fs.readdirSync(imagesDir);
      for (const img of images) {
        const src = path.join(imagesDir, img);
        const dest = path.join(publicImagesDir, img);
        if (!fs.existsSync(dest)) {
          fs.copyFileSync(src, dest);
        }
      }
      console.log(`  ✅ Copied ${images.length} images`);
    }

    // Read JSON files
    const categories = JSON.parse(fs.readFileSync(path.join(dataDir, 'categories.json'), 'utf-8'));
    const subcategories = JSON.parse(fs.readFileSync(path.join(dataDir, 'subcategories.json'), 'utf-8'));
    const partners = JSON.parse(fs.readFileSync(path.join(dataDir, 'partners.json'), 'utf-8'));
    const clients = JSON.parse(fs.readFileSync(path.join(dataDir, 'clients.json'), 'utf-8'));
    const products = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf-8'));
    const customization = JSON.parse(fs.readFileSync(path.join(dataDir, 'customization.json'), 'utf-8'));

    // Seed Categories
    console.log('📦 Seeding categories...');
    for (const cat of categories) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: { name: cat.name },
        create: { id: cat.id, name: cat.name }
      });
    }
    console.log(`  ✅ Created ${categories.length} categories`);

    // Seed Subcategories
    console.log('📦 Seeding subcategories...');
    for (const subcat of subcategories) {
      await prisma.subcategory.upsert({
        where: { id: subcat.id },
        update: { name: subcat.name, parentId: subcat.parentId },
        create: { id: subcat.id, name: subcat.name, parentId: subcat.parentId }
      });
    }
    console.log(`  ✅ Created ${subcategories.length} subcategories`);

    // Seed Partners
    console.log('📦 Seeding partners...');
    for (const partner of partners) {
      await prisma.partner.upsert({
        where: { id: partner.id },
        update: {
          name: partner.name,
          companyName: partner.companyName,
          email: partner.email,
          phone: partner.phone,
          website: partner.website,
          partnerType: partner.partnerType,
          isActive: partner.isActive
        },
        create: {
          id: partner.id,
          name: partner.name,
          companyName: partner.companyName,
          email: partner.email,
          phone: partner.phone,
          website: partner.website,
          partnerType: partner.partnerType,
          isActive: partner.isActive
        }
      });
    }
    console.log(`  ✅ Created ${partners.length} partners`);

    // Seed Clients
    console.log('📦 Seeding clients...');
    for (const client of clients) {
      await prisma.client.upsert({
        where: { id: client.id },
        update: {
          name: client.name,
          email: client.email,
          phone: client.phone,
          contactPerson: client.contactPerson
        },
        create: {
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          contactPerson: client.contactPerson,
          partnerId: client.partnerId
        }
      });
    }
    console.log(`  ✅ Created ${clients.length} clients`);

    // Seed Equipment
    console.log('📦 Seeding equipment...');
    for (const product of products) {
      await prisma.equipmentItem.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          description: product.description,
          descriptionPt: product.descriptionPt,
          quantity: product.quantity,
          status: product.status,
          location: product.location,
          imageUrl: product.imageUrl,
          dailyRate: product.dailyRate
        },
        create: {
          id: product.id,
          name: product.name,
          description: product.description,
          descriptionPt: product.descriptionPt,
          categoryId: product.categoryId,
          subcategoryId: product.subcategoryId,
          quantity: product.quantity,
          status: product.status,
          location: product.location,
          imageUrl: product.imageUrl,
          dailyRate: product.dailyRate,
          type: product.type || 'equipment'
        }
      });
    }
    console.log(`  ✅ Created ${products.length} equipment items`);

    // Seed Customization Settings
    console.log('📦 Seeding customization settings...');
    const customConfig = customization[0];
    
    // Only include fields that exist in the database
    const customizationData: any = {
      id: customConfig.id,
      companyName: customConfig.companyName || 'Acrobaticz',
      systemName: customConfig.systemName || 'AV Rentals',
      language: customConfig.language || 'pt'
    };

    await prisma.customizationSettings.upsert({
      where: { id: customConfig.id },
      update: customizationData,
      create: customizationData
    });
    console.log('  ✅ Created customization settings');

    console.log('\n✨ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
