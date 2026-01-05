import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EquipmentData {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  dailyRate: number;
  stock: number;
}

const REY_DAVIS_EQUIPMENT: EquipmentData[] = [
  // Lighting - Moving Head
  {
    name: 'FOS TITAN BEAM - 230W Moving Head Beam Light',
    description:
      'Fast and powerful 230W moving head, producing a bright, parallel beam with a 0-3.8° angle. Features 14 colors + white, 17 fixed gobos + open, an 8-facet rotating prism, frost',
    category: 'Lighting',
    subcategory: 'Moving Head',
    dailyRate: 55,
    stock: 2,
  },
  {
    name: 'FOS Q19 Ultra',
    description:
      'High power Wash / Beam moving head, 19 RGBW 40w 4in1 LEDs, linear zoom 6-60°, full pixel control, round ring with dynamic patterns, color temperature adjustment, 24,30,112 DMX channels, theater',
    category: 'Lighting',
    subcategory: 'Moving Head',
    dailyRate: 75,
    stock: 4,
  },
  {
    name: 'FOS ACL LINE 12',
    description:
      'ACL Pixel Control line bar, 12 led 30watt RGBW, 3 degrees beam angle, Linear Dimmer 0-100%, DMX modes 10/48/58 ch, 93 cm, 7.9kg',
    category: 'Lighting',
    subcategory: 'Moving Head',
    dailyRate: 45,
    stock: 6,
  },

  // Lighting - LED Par's
  {
    name: 'FOS PAR ZOOM ULTRA',
    description:
      'Professional Zoom Par, 19 leds x 15watt 4in1 RGBW color mixing, linear motorized zoom 10-60, 10 DMX Channels, 4 button led display, aluminum die cast housing, 0-100% linear dimmer, 6.5 kg',
    category: 'Lighting',
    subcategory: 'LED Par',
    dailyRate: 30,
    stock: 8,
  },
  {
    name: 'FOS Par 18x10WPRO IP65',
    description:
      'Weatherproof aluminium led par with IP connectors, Beam aperture: 30°, 18 RGBW 10w LEDs (4in1), Dimmer: 0-100% stop/strobe effect, aluminium 4kg, noiseless cooling system',
    category: 'Lighting',
    subcategory: 'LED Par',
    dailyRate: 25,
    stock: 8,
  },
  {
    name: 'FOS F-7',
    description:
      'Professional super bright outdoor IP65 Strobe/washer, 48 leds 15watt RGBW, 35° optics for each led, field angle 120°, diecast barndoor, Four section pixel control (Horizontal LED groups), true powercon',
    category: 'Lighting',
    subcategory: 'LED Par',
    dailyRate: 35,
    stock: 4,
  },

  // Lighting - Battery
  {
    name: 'FOS Luminus PRO IP',
    description:
      'High quality professional battery operated led par, 6 led HEX RGBW+A+UV 12 watt, IP Rating: IP54 top/ IP20 bottom, 100% true wireless DMX up to 400m visible control distance, Rechargeable',
    category: 'Lighting',
    subcategory: 'Battery',
    dailyRate: 15,
    stock: 8,
  },
  {
    name: 'Varytec bat.PAR V2 RGBWW',
    description:
      'Elevate your event atmosphere with the ultimate cable-free lighting solution. Compact, high-performance LED spotlight designed for quick setup and professional results',
    category: 'Lighting',
    subcategory: 'Battery',
    dailyRate: 15,
    stock: 9,
  },

  // Lighting - Decorative Lighting
  {
    name: 'Varytec Retro Blinder TRI 180',
    description:
      'Add a high-impact "eye-candy" effect to your stage or event with this unique triangular fixture combining the nostalgic look of a classic halogen blinder with modern LED technology',
    category: 'Lighting',
    subcategory: 'Decorative Lighting',
    dailyRate: 45,
    stock: 2,
  },
  {
    name: 'FOS Retro',
    description:
      'Retro background fixture, diameter 64cm, 750 watt halogen lamp driven by internal dimmer, 96pcs 3in1 RGB LEDs background lighting, 4/6/9 DMX channels, Aluminum alloy housing, LCD menu',
    category: 'Lighting',
    subcategory: 'Decorative Lighting',
    dailyRate: 40,
    stock: 20,
  },

  // Sound - Speakers
  {
    name: 'HK Audio Linear 5 MKII 118 Sub HPA – High-Power Active Subwoofer',
    description:
      'Ultimate powerhouse foundation for sound systems. 18" high-performance active subwoofer engineered to deliver extreme sound pressure levels',
    category: 'Sound',
    subcategory: 'Speakers',
    dailyRate: 75,
    stock: 4,
  },
  {
    name: 'HK Audio Linear 5 MKII 112 XA',
    description:
      'The "Swiss Army Knife" of professional audio. High-performance, active 12" loudspeaker built for versatility, serving as crystal-clear front-of-house (FOH)',
    category: 'Sound',
    subcategory: 'Speakers',
    dailyRate: 45,
    stock: 2,
  },
  {
    name: 'HK Audio Linear 5 MKII 308 LTA – Long-Throw Active PA Speaker',
    description:
      'Ultimate solution when you need to deliver high-fidelity sound over long distances. High-performance, horn-loaded active unit designed to bridge the gap between studio and venue',
    category: 'Sound',
    subcategory: 'Speakers',
    dailyRate: 75,
    stock: 6,
  },
  {
    name: 'dB Technologies ES 802 – Ultra-Portable Column PA System',
    description:
      'High-output, vertical array system built for those who refuse to compromise on acoustic pressure and sound coverage. Unlike small portable speakers, this system utilizes true column design',
    category: 'Sound',
    subcategory: 'Speakers',
    dailyRate: 55,
    stock: 3,
  },
  {
    name: 'Mackie Thump 215 – 15" High-Output Performance PA',
    description:
      'Built for power. As the largest member of the legendary Thump series, this 15-inch loudspeaker is designed for events that demand high-impact bass and massive coverage',
    category: 'Sound',
    subcategory: 'Speakers',
    dailyRate: 40,
    stock: 2,
  },
  {
    name: 'Mackie Thump 212 – 12" Professional High-Performance PA',
    description:
      'Professional-grade loudspeaker designed for those who need high-intensity sound and absolute reliability. Built to deliver "big stage" sound in versatile 12-inch format',
    category: 'Sound',
    subcategory: 'Speakers',
    dailyRate: 35,
    stock: 4,
  },
  {
    name: 'Mackie Thump 118S – 18" Professional Active Subwoofer',
    description:
      'High-performance, heavy-duty subwoofer designed for shaking the room. If your event needs that deep, physical bass that defines professional dance events',
    category: 'Sound',
    subcategory: 'Speakers',
    dailyRate: 55,
    stock: 2,
  },

  // Sound - Battery Speakers
  {
    name: 'Electro-Voice EVERSE 8 (White) – Ultra-Portable Battery Powered PA',
    description:
      'Ultimate "no-stress" speaker. Designed for total mobility, this sleek white unit is completely wireless, running on high-capacity internal battery. Perfect for rooftop events and mobile setups',
    category: 'Sound',
    subcategory: 'Battery Speakers',
    dailyRate: 45,
    stock: 2,
  },

  // Sound - Microphones
  {
    name: 'Shure SM58',
    description:
      'The legendary "King of Microphones". Known globally as the industry standard for live vocals, this heavy-duty dynamic mic is famous for its nearly indestructible build and ability to handle extreme SPL',
    category: 'Sound',
    subcategory: 'Microphones',
    dailyRate: 8,
    stock: 3,
  },
  {
    name: 'Shure SM57 LC',
    description:
      'Industry\'s most trusted professional instrument microphone. Known as the "Workhorse", it is the global standard for capturing loud, high-impact sound sources with absolute clarity',
    category: 'Sound',
    subcategory: 'Microphones',
    dailyRate: 8,
    stock: 2,
  },
];

async function seedReyDavisCatalog() {
  try {
    console.log('🔄 Starting Rey Davis Catalog seeding...');

    // Find or create Rey Davis partner
    let partner = await prisma.partner.findFirst({
      where: { name: 'Rey Davis' },
    });

    if (!partner) {
      partner = await prisma.partner.create({
        data: {
          name: 'Rey Davis',
          companyName: 'VRD Production',
          email: 'hello@vrd.productions',
          phone: '351969774999',
          notes: 'Professional Audio Visual Equipment Rental',
          partnerType: 'provider',
          isActive: true,
          website: 'https://vrd.productions',
        },
      });
      console.log('✅ Created Rey Davis partner');
    }

    // Create linked client for Rey Davis
    let client = await prisma.client.findFirst({
      where: { name: 'Rey Davis' },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: 'Rey Davis',
          contactPerson: 'Rey Davis Team',
          email: 'hello@vrd.productions',
          phone: '351969774999',
          address: 'VRD Production',
          notes: 'Professional Audio Visual Equipment Rental Provider',
          partnerId: partner.id,
        },
      });
      console.log('✅ Created Rey Davis client (linked to partner)');
    }

    // Create categories if they don't exist
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

    // Ensure Lighting and Sound categories exist
    if (!categoryMap.has('Lighting')) {
      const lightingCat = await prisma.category.create({
        data: { name: 'Lighting' },
      });
      categoryMap.set('Lighting', lightingCat.id);
    }

    if (!categoryMap.has('Sound')) {
      const soundCat = await prisma.category.create({
        data: { name: 'Sound' },
      });
      categoryMap.set('Sound', soundCat.id);
    }

    // Create subcategories and equipment
    let equipmentCount = 0;
    for (const item of REY_DAVIS_EQUIPMENT) {
      const categoryId = categoryMap.get(item.category)!;

      // Find or create subcategory
      let subcategory = await prisma.subcategory.findFirst({
        where: { name: item.subcategory, parentId: categoryId },
      });

      if (!subcategory) {
        subcategory = await prisma.subcategory.create({
          data: {
            name: item.subcategory,
            parentId: categoryId,
          },
        });
      }

      // Determine location based on category
      const location = item.category === 'Lighting' ? 'Warehouse A' : 'Warehouse B';

      // Check if equipment already exists
      const existingEquipment = await prisma.equipmentItem.findFirst({
        where: { name: item.name },
      });

      if (!existingEquipment) {
        await prisma.equipmentItem.create({
          data: {
            name: item.name,
            description: item.description,
            categoryId,
            subcategoryId: subcategory.id,
            dailyRate: item.dailyRate,
            quantity: item.stock,
            status: item.stock > 0 ? 'available' : 'unavailable',
            location: location,
            type: 'equipment',
          },
        });
        equipmentCount++;
        console.log(`  ✓ Added: ${item.name} → ${location}`);
      }
    }

    console.log(`\n✅ Rey Davis Catalog seeding completed!`);
    console.log(`   - Partner: Rey Davis (VRD Production)`);
    console.log(`   - Client: Rey Davis (linked to partner)`);
    console.log(`   - Lighting Equipment → Warehouse A`);
    console.log(`   - Sound Equipment → Warehouse B`);
    console.log(`   - New Equipment Added: ${equipmentCount}`);
    console.log(`   - Total Equipment in Catalog: ${REY_DAVIS_EQUIPMENT.length}`);
  } catch (error) {
    console.error('❌ Error seeding Rey Davis catalog:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedReyDavisCatalog()
  .then(() => {
    console.log('\n✨ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seeding failed:', error);
    process.exit(1);
  });
