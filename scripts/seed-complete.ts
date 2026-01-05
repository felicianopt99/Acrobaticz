import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

function log(message: string, emoji = '📝') {
  console.log(`${emoji} ${message}`)
}

async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

// ==============================================================================
// USERS SEEDING
// ==============================================================================

async function seedUsers() {
  log('\n👥 SEEDING USERS...', '🔐')

  const users = [
    {
      name: 'Feliciano Admin',
      username: 'feliciano',
      password: 'superfeliz99',
      role: 'Admin',
      contactEmail: 'feliciano@acrobaticz.pt',
      contactPhone: '+351 900 000 001'
    },
    {
      name: 'Lourenço Manager',
      username: 'lourenco',
      password: 'lourenco123',
      role: 'Manager',
      contactEmail: 'lourenco@acrobaticz.pt',
      contactPhone: '+351 900 000 002'
    },
    {
      name: 'João Technician',
      username: 'joao',
      password: 'joao123',
      role: 'Technician',
      contactEmail: 'joao@acrobaticz.pt',
      contactPhone: '+351 900 000 003'
    },
    {
      name: 'Maria Silva',
      username: 'maria',
      password: 'maria123',
      role: 'Employee',
      contactEmail: 'maria@acrobaticz.pt',
      contactPhone: '+351 900 000 004'
    },
    {
      name: 'Pedro Santos',
      username: 'pedro',
      password: 'pedro123',
      role: 'Employee',
      contactEmail: 'pedro@acrobaticz.pt',
      contactPhone: '+351 900 000 005'
    },
    {
      name: 'Rosa Costa',
      username: 'rosa',
      password: 'rosa123',
      role: 'Employee',
      contactEmail: 'rosa@acrobaticz.pt',
      contactPhone: '+351 900 000 006'
    }
  ]

  const createdUsers = []
  for (const user of users) {
    const existing = await prisma.user.findUnique({ where: { username: user.username } })
    if (!existing) {
      const hashedPassword = await hashPassword(user.password)
      const created = await prisma.user.create({
        data: {
          ...user,
          password: hashedPassword
        }
      })
      createdUsers.push(created)
      log(`✅ Created user: ${user.username} (${user.role})`)
    } else {
      createdUsers.push(existing)
      log(`ℹ️  User already exists: ${user.username}`)
    }
  }

  return createdUsers
}

// ==============================================================================
// CLIENTS SEEDING
// ==============================================================================

async function seedClients() {
  log('\n🏢 SEEDING CLIENTS...', '👥')

  const clients = [
    {
      name: 'Tech Conference 2026',
      contactPerson: 'João Silva',
      email: 'joao@techconf.pt',
      phone: '+351 910 123 456',
      address: 'Av. da República, 1000, Lisboa',
      notes: 'Annual technology conference'
    },
    {
      name: 'Wedding Planners LDA',
      contactPerson: 'Sandra Costa',
      email: 'sandra@weddingplanners.pt',
      phone: '+351 920 234 567',
      address: 'Rua da Paz, 500, Porto',
      notes: 'Event planning agency for weddings'
    },
    {
      name: 'Sports Events International',
      contactPerson: 'Carlos Mendes',
      email: 'carlos@sportsevents.pt',
      phone: '+351 930 345 678',
      address: 'Praça do Comércio, 1, Lisboa',
      notes: 'Sports event organizer'
    },
    {
      name: 'Cultural Institute Portugal',
      contactPerson: 'Ana Ferreira',
      email: 'ana@culturalpt.pt',
      phone: '+351 940 456 789',
      address: 'Rua da Cultura, 200, Covilhã',
      notes: 'Cultural events and exhibitions'
    },
    {
      name: 'Corporate Events Management',
      contactPerson: 'Miguel Oliveira',
      email: 'miguel@corporateevents.pt',
      phone: '+351 950 567 890',
      address: 'Av. Paulista, 800, São Paulo',
      notes: 'Corporate team building and conferences'
    },
    {
      name: 'Music Festival Productions',
      contactPerson: 'Catarina Alves',
      email: 'catarina@musicfest.pt',
      phone: '+351 960 678 901',
      address: 'Estrada da Costa, 3000, Cascais',
      notes: 'Music festival and concert organizer'
    },
    {
      name: 'Theater Academy Lisbon',
      contactPerson: 'Ricardo Gomes',
      email: 'ricardo@theateracademy.pt',
      phone: '+351 970 789 012',
      address: 'Rua do Teatro, 100, Lisboa',
      notes: 'Theater productions and shows'
    },
    {
      name: 'Broadcast Media Group',
      contactPerson: 'Filipa Sousa',
      email: 'filipa@broadcastmedia.pt',
      phone: '+351 980 890 123',
      address: 'Estúdios Televisa, Caparica',
      notes: 'TV and broadcast production'
    }
  ]

  const createdClients = []
  for (const client of clients) {
    const existing = await prisma.client.findFirst({ where: { email: client.email } })
    if (!existing) {
      const created = await prisma.client.create({ data: client })
      createdClients.push(created)
      log(`✅ Created client: ${client.name}`)
    } else {
      createdClients.push(existing)
      log(`ℹ️  Client already exists: ${client.name}`)
    }
  }

  return createdClients
}

// ==============================================================================
// CATEGORIES & SUBCATEGORIES SEEDING
// ==============================================================================

async function seedCategoriesAndSubcategories() {
  log('\n📂 SEEDING CATEGORIES & SUBCATEGORIES...', '🎯')

  const categories = [
    { name: 'Audio', icon: '🔊' },
    { name: 'Video', icon: '📹' },
    { name: 'Lighting', icon: '💡' },
    { name: 'Rigging & Structures', icon: '🏗️' },
    { name: 'Staging & Decor', icon: '🎭' },
    { name: 'Cable & Connectors', icon: '🔌' }
  ]

  const categoryMap: Record<string, string> = {}

  for (const cat of categories) {
    const existing = await prisma.category.findFirst({ where: { name: cat.name } })
    let category
    if (!existing) {
      category = await prisma.category.create({ data: cat })
      log(`✅ Created category: ${cat.name}`)
    } else {
      category = existing
      log(`ℹ️  Category already exists: ${cat.name}`)
    }
    categoryMap[cat.name] = category.id
  }

  // Subcategories
  const subcategories = [
    { name: 'Microphones', parentName: 'Audio' },
    { name: 'Speakers', parentName: 'Audio' },
    { name: 'Mixers & Consoles', parentName: 'Audio' },
    { name: 'Amplifiers', parentName: 'Audio' },
    { name: 'Cameras', parentName: 'Video' },
    { name: 'Projectors', parentName: 'Video' },
    { name: 'Screens & Monitors', parentName: 'Video' },
    { name: 'Video Switchers', parentName: 'Video' },
    { name: 'Spotlights', parentName: 'Lighting' },
    { name: 'Stage Lighting', parentName: 'Lighting' },
    { name: 'LED Systems', parentName: 'Lighting' },
    { name: 'Control Systems', parentName: 'Lighting' },
    { name: 'Trusses', parentName: 'Rigging & Structures' },
    { name: 'Rigging Hardware', parentName: 'Rigging & Structures' },
    { name: 'Stages & Platforms', parentName: 'Staging & Decor' },
    { name: 'Drapes & Curtains', parentName: 'Staging & Decor' }
  ]

  const subcategoryMap: Record<string, string> = {}

  for (const subcat of subcategories) {
    const parentId = categoryMap[subcat.parentName]
    const existing = await prisma.subcategory.findFirst({ where: { name: subcat.name, parentId } })
    let created
    if (!existing) {
      created = await prisma.subcategory.create({
        data: {
          name: subcat.name,
          parentId
        }
      })
      log(`✅ Created subcategory: ${subcat.name}`)
    } else {
      created = existing
      log(`ℹ️  Subcategory already exists: ${subcat.name}`)
    }
    subcategoryMap[subcat.name] = created.id
  }

  return { categoryMap, subcategoryMap }
}

// ==============================================================================
// EQUIPMENT/PRODUCTS SEEDING
// ==============================================================================

async function seedEquipment(categoryMap: Record<string, string>, subcategoryMap: Record<string, string>) {
  log('\n🎛️  SEEDING EQUIPMENT/PRODUCTS...', '🛠️')

  const equipment = [
    // Audio Equipment
    {
      name: 'Shure SM7B Studio Microphone',
      description: 'Professional studio microphone with excellent sound isolation and versatile uses',
      descriptionPt: 'Microfone de estúdio profissional com excelente isolamento sonoro e usos versáteis',
      categoryId: categoryMap['Audio'],
      subcategoryId: subcategoryMap['Microphones'],
      quantity: 5,
      status: 'Available',
      location: 'Audio Storage Room A',
      imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
      dailyRate: 25,
      type: 'Microphone'
    },
    {
      name: 'Sennheiser Wireless Microphone System',
      description: 'Wireless system with 2 hand-held microphones, receiver, and accessories',
      descriptionPt: 'Sistema sem fio com 2 microfones de mão, receptor e acessórios',
      categoryId: categoryMap['Audio'],
      subcategoryId: subcategoryMap['Microphones'],
      quantity: 8,
      status: 'Available',
      location: 'Audio Storage Room A',
      imageUrl: 'https://images.unsplash.com/photo-1612225130845-f2ff0d4ecff0?w=500',
      dailyRate: 40,
      type: 'Wireless Microphone System'
    },
    {
      name: 'QSC K12.2 Speaker System',
      description: 'Compact high-performance speaker for venues up to 1000 people',
      descriptionPt: 'Altifalante compacto de alto desempenho para eventos até 1000 pessoas',
      categoryId: categoryMap['Audio'],
      subcategoryId: subcategoryMap['Speakers'],
      quantity: 12,
      status: 'Available',
      location: 'Audio Storage Room B',
      imageUrl: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=500',
      dailyRate: 50,
      type: 'Active Speaker'
    },
    {
      name: 'Yamaha MG16XU Mixer',
      description: '16-channel analog mixer with USB audio interface and effects',
      descriptionPt: 'Mesa de mistura analógica 16 canais com interface USB e efeitos',
      categoryId: categoryMap['Audio'],
      subcategoryId: subcategoryMap['Mixers & Consoles'],
      quantity: 3,
      status: 'Available',
      location: 'Audio Equipment Center',
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500',
      dailyRate: 75,
      type: 'Audio Mixer'
    },
    {
      name: 'Crown XLS1000 Power Amplifier',
      description: 'Professional power amplifier delivering 350W per channel at 4 ohms',
      descriptionPt: 'Amplificador de potência profissional entregando 350W por canal',
      categoryId: categoryMap['Audio'],
      subcategoryId: subcategoryMap['Amplifiers'],
      quantity: 4,
      status: 'Available',
      location: 'Audio Equipment Center',
      imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=500',
      dailyRate: 45,
      type: 'Power Amplifier'
    },

    // Video Equipment
    {
      name: 'Sony A6700 Mirrorless Camera',
      description: 'Professional 26MP mirrorless camera with 4K video capability',
      descriptionPt: 'Câmara mirrorless profissional 26MP com capacidade de vídeo 4K',
      categoryId: categoryMap['Video'],
      subcategoryId: subcategoryMap['Cameras'],
      quantity: 4,
      status: 'Available',
      location: 'Video Equipment Room',
      imageUrl: 'https://images.unsplash.com/photo-1606986628025-35d57e735ae0?w=500',
      dailyRate: 150,
      type: 'Mirrorless Camera'
    },
    {
      name: 'Panasonic PT-RZ970 Projector',
      description: '10,000 lumens 3-chip DLP projector for large venues',
      descriptionPt: 'Projetor DLP 3-chip com 10.000 lúmens para grandes espaços',
      categoryId: categoryMap['Video'],
      subcategoryId: subcategoryMap['Projectors'],
      quantity: 3,
      status: 'Available',
      location: 'Video Equipment Room',
      imageUrl: 'https://images.unsplash.com/photo-1553531088-c87a1b9b8c9e?w=500',
      dailyRate: 200,
      type: 'Projector'
    },
    {
      name: 'ASUS PA247CV 24" Reference Monitor',
      description: '24-inch color accurate monitor for video production and editing',
      descriptionPt: 'Monitor 24 polegadas com cores precisas para produção vídeo',
      categoryId: categoryMap['Video'],
      subcategoryId: subcategoryMap['Screens & Monitors'],
      quantity: 6,
      status: 'Available',
      location: 'Video Equipment Room',
      imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500',
      dailyRate: 35,
      type: 'Reference Monitor'
    },
    {
      name: 'ATEM Production Switcher',
      description: '1 M/E production switcher with 4 input channels and streaming capabilities',
      descriptionPt: 'Mesa de mistura de produção com 4 canais e capacidades de transmissão',
      categoryId: categoryMap['Video'],
      subcategoryId: subcategoryMap['Video Switchers'],
      quantity: 2,
      status: 'Available',
      location: 'Video Equipment Room',
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500',
      dailyRate: 120,
      type: 'Video Switcher'
    },

    // Lighting Equipment
    {
      name: 'ETC Source Four LED Spotlight',
      description: 'Compact LED spotlight with excellent color mixing and dimming',
      descriptionPt: 'Refletor LED compacto com excelente mistura de cores',
      categoryId: categoryMap['Lighting'],
      subcategoryId: subcategoryMap['Spotlights'],
      quantity: 20,
      status: 'Available',
      location: 'Lighting Storage - Section A',
      imageUrl: 'https://images.unsplash.com/photo-1516233208522-7eca07a89f53?w=500',
      dailyRate: 30,
      type: 'LED Spotlight'
    },
    {
      name: 'Martin MAC Aura LED Moving Light',
      description: 'Compact moving light with zoom lens and color mixing capabilities',
      descriptionPt: 'Movimentação LED compacta com lente zoom e mistura de cores',
      categoryId: categoryMap['Lighting'],
      subcategoryId: subcategoryMap['Stage Lighting'],
      quantity: 8,
      status: 'Available',
      location: 'Lighting Storage - Section B',
      imageUrl: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=500',
      dailyRate: 85,
      type: 'Moving Light'
    },
    {
      name: 'ChauvetProfessional EPIX Drive System',
      description: 'Pixel mapping LED system for creating dynamic visual effects',
      descriptionPt: 'Sistema LED com mapeamento de pixéis para efeitos visuais dinâmicos',
      categoryId: categoryMap['Lighting'],
      subcategoryId: subcategoryMap['LED Systems'],
      quantity: 5,
      status: 'Available',
      location: 'Lighting Storage - Section C',
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500',
      dailyRate: 120,
      type: 'LED Display'
    },
    {
      name: 'ETC Congo Jr. Control Console',
      description: 'Advanced lighting control console supporting up to 512 DMX channels',
      descriptionPt: 'Console de controlo de iluminação avançada com até 512 canais DMX',
      categoryId: categoryMap['Lighting'],
      subcategoryId: subcategoryMap['Control Systems'],
      quantity: 2,
      status: 'Available',
      location: 'Control Room',
      imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500',
      dailyRate: 95,
      type: 'Lighting Console'
    },

    // Rigging & Structures
    {
      name: 'Global Truss F34 Aluminum Truss',
      description: 'Square truss segment 1.0m length, professional stage rigging',
      descriptionPt: 'Treliça quadrada alumínio 1.0m, rigging profissional de palco',
      categoryId: categoryMap['Rigging & Structures'],
      subcategoryId: subcategoryMap['Trusses'],
      quantity: 50,
      status: 'Available',
      location: 'Rigging Equipment Warehouse',
      imageUrl: 'https://images.unsplash.com/photo-1525640520883-7f1b45001c25?w=500',
      dailyRate: 15,
      type: 'Truss Segment'
    },
    {
      name: 'Chauvet Clamp and Hardware Set',
      description: 'Complete rigging hardware kit with clamps, shackles, and safety cables',
      descriptionPt: 'Kit completo de rigging com grampos, cavilhas e cabos de segurança',
      categoryId: categoryMap['Rigging & Structures'],
      subcategoryId: subcategoryMap['Rigging Hardware'],
      quantity: 15,
      status: 'Available',
      location: 'Rigging Equipment Warehouse',
      imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500',
      dailyRate: 25,
      type: 'Hardware Kit'
    },

    // Staging & Decor
    {
      name: 'Portable Stage Platform 4x4 ft',
      description: 'Lightweight modular stage platform with professional finish',
      descriptionPt: 'Plataforma de palco modular leve com acabamento profissional',
      categoryId: categoryMap['Staging & Decor'],
      subcategoryId: subcategoryMap['Stages & Platforms'],
      quantity: 12,
      status: 'Available',
      location: 'Staging Equipment Building',
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500',
      dailyRate: 40,
      type: 'Stage Platform'
    },
    {
      name: 'Professional Velvet Drape 10x10 ft',
      description: 'High-quality black velvet drape for backdrop and room dividing',
      descriptionPt: 'Cortinado veludo preto de alta qualidade para cenários',
      categoryId: categoryMap['Staging & Decor'],
      subcategoryId: subcategoryMap['Drapes & Curtains'],
      quantity: 20,
      status: 'Available',
      location: 'Staging Equipment Building',
      imageUrl: 'https://images.unsplash.com/photo-1578462996442-48f60103fc96?w=500',
      dailyRate: 20,
      type: 'Drape'
    },

    // Cable & Connectors
    {
      name: 'XLR Microphone Cable 20ft',
      description: 'Professional balanced XLR cables for audio connections',
      descriptionPt: 'Cabos XLR balanceados profissionais para conexões de áudio',
      categoryId: categoryMap['Cable & Connectors'],
      quantity: 30,
      status: 'Available',
      location: 'Cable Storage Room',
      imageUrl: 'https://images.unsplash.com/photo-1495412863515-6023a47ea880?w=500',
      dailyRate: 5,
      type: 'Microphone Cable'
    },
    {
      name: 'HDMI Cable 15ft (4K/60Hz)',
      description: 'High-speed HDMI cables supporting 4K resolution and 60Hz refresh rate',
      descriptionPt: 'Cabos HDMI de alta velocidade suportando 4K e 60Hz',
      categoryId: categoryMap['Cable & Connectors'],
      quantity: 25,
      status: 'Available',
      location: 'Cable Storage Room',
      imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500',
      dailyRate: 3,
      type: 'HDMI Cable'
    }
  ]

  const createdEquipment = []
  for (const equip of equipment) {
    const existing = await prisma.equipmentItem.findFirst({ where: { name: equip.name } })
    if (!existing) {
      const created = await prisma.equipmentItem.create({ data: equip })
      createdEquipment.push(created)
      log(`✅ Created equipment: ${equip.name}`)
    } else {
      createdEquipment.push(existing)
      log(`ℹ️  Equipment already exists: ${equip.name}`)
    }
  }

  return createdEquipment
}

// ==============================================================================
// PARTNERS SEEDING
// ==============================================================================

async function seedPartners() {
  log('\n🤝 SEEDING PARTNERS...', '🔗')

  const partners = [
    {
      name: 'Pro Audio Solutions',
      companyName: 'Pro Audio Solutions LDA',
      contactPerson: 'Nuno Ribeiro',
      email: 'nuno@proaudiosolutions.pt',
      phone: '+351 211 123 456',
      address: 'Rua do Comércio, 50, Lisboa',
      website: 'www.proaudiosolutions.pt',
      partnerType: 'provider',
      commission: null,
      logoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200',
      notes: 'Audio equipment provider and rental specialist'
    },
    {
      name: 'Vision Media Group',
      companyName: 'Vision Media Group SA',
      contactPerson: 'Margarida Oliveira',
      email: 'margarida@visionmedia.pt',
      phone: '+351 219 234 567',
      address: 'Estrada de Cascais, 2000, Lisboa',
      website: 'www.visionmedia.pt',
      partnerType: 'agency',
      commission: 15,
      logoUrl: 'https://images.unsplash.com/photo-1516233208522-7eca07a89f53?w=200',
      notes: 'Event production agency and partner'
    },
    {
      name: 'Lumina Stage Design',
      companyName: 'Lumina Stage Design Unipessoal',
      contactPerson: 'Tiago Gomes',
      email: 'tiago@luminastage.pt',
      phone: '+351 210 345 678',
      address: 'Av. do Parque, 1500, Oeiras',
      website: 'www.luminastage.pt',
      partnerType: 'provider',
      commission: null,
      logoUrl: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=200',
      notes: 'Stage design and rigging equipment provider'
    },
    {
      name: 'Elite Events Portugal',
      companyName: 'Elite Events Portugal SA',
      contactPerson: 'Cristina Mendes',
      email: 'cristina@eliteevents.pt',
      phone: '+351 213 456 789',
      address: 'Praça Marquês de Pombal, 30, Lisboa',
      website: 'www.eliteevents.pt',
      partnerType: 'both',
      commission: 12,
      logoUrl: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=200',
      notes: 'Full event production and agency partner'
    },
    {
      name: 'Broadcast Tech Services',
      companyName: 'Broadcast Tech Services LDA',
      contactPerson: 'João Costa',
      email: 'joao@broadcasttech.pt',
      phone: '+351 214 567 890',
      address: 'Estúdios de São Domingos, Caparica',
      website: 'www.broadcasttech.pt',
      partnerType: 'provider',
      commission: null,
      logoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200',
      notes: 'Broadcast and streaming equipment provider'
    },
    {
      name: 'Creative Events Management',
      companyName: 'Creative Events Management UNIPESSOAL',
      contactPerson: 'Rita Sousa',
      email: 'rita@creativeevents.pt',
      phone: '+351 215 678 901',
      address: 'Rua da Inovação, 100, Porto',
      website: 'www.creativeevents.pt',
      partnerType: 'agency',
      commission: 18,
      logoUrl: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=200',
      notes: 'Creative event planning and execution agency'
    }
  ]

  const createdPartners = []
  for (const partner of partners) {
    const existing = await prisma.partner.findFirst({ where: { email: partner.email } })
    if (!existing) {
      const created = await prisma.partner.create({ data: partner })
      createdPartners.push(created)
      log(`✅ Created partner: ${partner.name} (${partner.partnerType})`)
    } else {
      createdPartners.push(existing)
      log(`ℹ️  Partner already exists: ${partner.name}`)
    }
  }

  return createdPartners
}

// ==============================================================================
// SERVICES SEEDING
// ==============================================================================

async function seedServices() {
  log('\n🔧 SEEDING SERVICES...', '⚙️')

  const services = [
    {
      name: 'Setup & Installation',
      description: 'Professional setup and installation of equipment',
      descriptionPt: 'Instalação e configuração profissional de equipamentos',
      unitPrice: 100,
      unit: 'service',
      category: 'Installation',
      isActive: true
    },
    {
      name: 'Breakdown & Dismantling',
      description: 'Professional equipment breakdown and dismantling service',
      descriptionPt: 'Serviço profissional de desmontagem de equipamentos',
      unitPrice: 100,
      unit: 'service',
      category: 'Installation',
      isActive: true
    },
    {
      name: 'Technician Support',
      description: 'On-site technician support for equipment operation',
      descriptionPt: 'Suporte de técnico no local para operação de equipamentos',
      unitPrice: 75,
      unit: 'hour',
      category: 'Support',
      isActive: true
    },
    {
      name: 'Sound Check',
      description: 'Complete sound system check and optimization',
      descriptionPt: 'Verificação e otimização completa do sistema de som',
      unitPrice: 150,
      unit: 'service',
      category: 'Technical',
      isActive: true
    },
    {
      name: 'Lighting Design',
      description: 'Professional lighting design consultation and planning',
      descriptionPt: 'Consultoria e planeamento profissional de iluminação',
      unitPrice: 250,
      unit: 'service',
      category: 'Design',
      isActive: true
    },
    {
      name: 'Cable Management',
      description: 'Professional cable routing and management service',
      descriptionPt: 'Serviço profissional de encaminhamento de cabos',
      unitPrice: 80,
      unit: 'hour',
      category: 'Technical',
      isActive: true
    }
  ]

  const createdServices = []
  for (const service of services) {
    const existing = await prisma.service.findFirst({ where: { name: service.name } })
    if (!existing) {
      const created = await prisma.service.create({
        data: {
          name: service.name,
          description: service.description,
          unitPrice: service.unitPrice,
          unit: service.unit,
          category: service.category,
          isActive: service.isActive
        }
      })
      createdServices.push(created)
      log(`✅ Created service: ${service.name}`)
    } else {
      createdServices.push(existing)
      log(`ℹ️  Service already exists: ${service.name}`)
    }
  }

  return createdServices
}

// ==============================================================================
// FEES SEEDING
// ==============================================================================

async function seedFees() {
  log('\n💰 SEEDING FEES...', '💵')

  const fees = [
    {
      name: 'Delivery Fee',
      description: 'Local delivery within Lisbon metropolitan area',
      amount: 50,
      type: 'fixed',
      category: 'Delivery'
    },
    {
      name: 'Insurance',
      description: 'Equipment damage and liability insurance',
      amount: 5,
      type: 'percentage',
      category: 'Insurance'
    },
    {
      name: 'Setup Fee',
      description: 'One-time setup fee for equipment installation',
      amount: 150,
      type: 'fixed',
      category: 'Service'
    },
    {
      name: 'Long Distance Delivery',
      description: 'Delivery beyond standard service area',
      amount: 200,
      type: 'fixed',
      category: 'Delivery'
    },
    {
      name: 'Technical Support',
      description: '24-hour technical support surcharge',
      amount: 100,
      type: 'fixed',
      category: 'Support'
    },
    {
      name: 'Cleaning Fee',
      description: 'Post-event equipment cleaning and inspection',
      amount: 75,
      type: 'fixed',
      category: 'Service'
    }
  ]

  const createdFees = []
  for (const fee of fees) {
    const existing = await prisma.fee.findFirst({ where: { name: fee.name } })
    if (!existing) {
      const created = await prisma.fee.create({ data: fee })
      createdFees.push(created)
      log(`✅ Created fee: ${fee.name}`)
    } else {
      createdFees.push(existing)
      log(`ℹ️  Fee already exists: ${fee.name}`)
    }
  }

  return createdFees
}

// ==============================================================================
// MAIN SEEDING FUNCTION
// ==============================================================================

async function main() {
  try {
    log('\n🌱 STARTING COMPREHENSIVE DATABASE SEEDING...', '🚀')

    // Seed data
    await seedUsers()
    await seedClients()
    const { categoryMap, subcategoryMap } = await seedCategoriesAndSubcategories()
    await seedEquipment(categoryMap, subcategoryMap)
    await seedPartners()
    await seedServices()
    await seedFees()

    log('\n✅ SEEDING COMPLETED SUCCESSFULLY!', '🎉')
    log('Database is now populated with sample data:', '📊')
    log('  • 6 Users (Admin, Manager, Technician, Employees)')
    log('  • 8 Clients (Event organizers and companies)')
    log('  • 6 Categories with 16 Subcategories')
    log('  • 25 Equipment/Products with descriptions and images')
    log('  • 6 Partners (Providers and Agencies)')
    log('  • 6 Services (Setup, Support, Design, etc.)')
    log('  • 6 Fees (Delivery, Insurance, Support, etc.)')

  } catch (error) {
    console.error('❌ Error during seeding:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
