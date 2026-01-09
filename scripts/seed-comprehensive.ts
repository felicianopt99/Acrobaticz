import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ==============================================================================
// COMMAND LINE ARGUMENTS
// ==============================================================================
const args = process.argv.slice(2)
const shouldClean = args.includes('--clean')
const dryRun = args.includes('--dry-run')
const fullSeed = args.includes('--full') || args.length === 0
const featureFilter = args.find(arg => arg.startsWith('--feature='))?.split('=')[1]

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

function log(message: string, emoji = '📝') {
  console.log(`${emoji} ${message}`)
}

async function upsertUser({ name, username, password, role, isActive = true, contactEmail = '', contactPhone = '' }: { name: string; username: string; password: string; role: string; isActive?: boolean; contactEmail?: string; contactPhone?: string }) {
  const hash = await bcrypt.hash(password, 12)
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    log(`User '${username}' already exists, skipping`, 'ℹ️')
    return existing
  }
  const user = await prisma.user.create({
    data: { name, username, password: hash, role, isActive, contactEmail, contactPhone }
  })
  log(`Created user: ${username} (${role})`, '✅')
  return user
}

// ==============================================================================
// PHASE 1: BASE INFRASTRUCTURE
// ==============================================================================

async function seedUsers() {
  log('\n🔐 PHASE 1: Creating Users...', '📦')

  const admin = await upsertUser({
    name: 'Feliciano Admin',
    username: 'feliciano',
    password: 'superfeliz99',
    role: 'Admin',
    contactEmail: 'feliciano@acrobaticz.pt',
    contactPhone: '+351 900 000 001'
  })

  const manager = await upsertUser({
    name: 'Lourenço Manager',
    username: 'lourenco',
    password: 'lourenco123',
    role: 'Manager',
    contactEmail: 'lourenco@acrobaticz.pt',
    contactPhone: '+351 900 000 002'
  })

  const technician = await upsertUser({
    name: 'João Technician',
    username: 'joao',
    password: 'joao123',
    role: 'Technician',
    contactEmail: 'joao@acrobaticz.pt',
    contactPhone: '+351 900 000 003'
  })

  const employee1 = await upsertUser({
    name: 'Maria Employee',
    username: 'maria',
    password: 'maria123',
    role: 'Employee',
    contactEmail: 'maria@acrobaticz.pt',
    contactPhone: '+351 900 000 004'
  })

  const employee2 = await upsertUser({
    name: 'Pedro Employee',
    username: 'pedro',
    password: 'pedro123',
    role: 'Employee',
    contactEmail: 'pedro@acrobaticz.pt',
    contactPhone: '+351 900 000 005'
  })

  return { admin, manager, technician, employee1, employee2 }
}

async function seedCategories() {
  log('\n📂 Creating Equipment Categories...', '📦')

  const categories = [
    { name: 'Audio', icon: '🔊' },
    { name: 'Video', icon: '📹' },
    { name: 'Lighting', icon: '💡' },
    { name: 'Rigging', icon: '🪝' },
    { name: 'Staging', icon: '🎭' }
  ]

  const created = []
  for (const cat of categories) {
    const existing = await prisma.category.findFirst({ where: { name: cat.name } })
    if (existing) {
      log(`Category '${cat.name}' already exists`, 'ℹ️')
      created.push(existing)
      continue
    }
    const category = await prisma.category.create({ data: cat })
    log(`Created category: ${cat.name}`, '✅')
    created.push(category)
  }

  return created
}

async function seedSubcategories(categories: any[]) {
  log('\n📂 Creating Subcategories...', '📦')

  const subcatData = [
    { parentName: 'Audio', name: 'Microphones' },
    { parentName: 'Audio', name: 'Speakers' },
    { parentName: 'Audio', name: 'Mixers' },
    { parentName: 'Video', name: 'Cameras' },
    { parentName: 'Video', name: 'Projectors' },
    { parentName: 'Video', name: 'Screens' },
    { parentName: 'Lighting', name: 'Spotlights' },
    { parentName: 'Lighting', name: 'LED Panels' },
    { parentName: 'Staging', name: 'Podiums' },
    { parentName: 'Staging', name: 'Backdrops' }
  ]

  const created = []
  for (const data of subcatData) {
    const parent = categories.find(c => c.name === data.parentName)
    if (!parent) continue

    const existing = await prisma.subcategory.findFirst({ where: { name: data.name, parentId: parent.id } })
    if (existing) {
      log(`Subcategory '${data.name}' already exists`, 'ℹ️')
      created.push(existing)
      continue
    }

    const subcat = await prisma.subcategory.create({
      data: { name: data.name, parentId: parent.id }
    })
    log(`Created subcategory: ${data.name}`, '✅')
    created.push(subcat)
  }

  return created
}

async function seedServices() {
  log('\n🔧 Creating Services...', '📦')

  const services = [
    { name: 'Setup & Teardown', unitPrice: 250, unit: 'event' },
    { name: 'Technical Support', unitPrice: 75, unit: 'hour' },
    { name: 'Operator', unitPrice: 150, unit: 'day' },
    { name: 'Delivery & Setup', unitPrice: 500, unit: 'event' },
    { name: 'Installation', unitPrice: 300, unit: 'event' }
  ]

  const created = []
  for (const svc of services) {
    const existing = await prisma.service.findFirst({ where: { name: svc.name } })
    if (existing) {
      log(`Service '${svc.name}' already exists`, 'ℹ️')
      created.push(existing)
      continue
    }
    const service = await prisma.service.create({ data: svc })
    log(`Created service: ${svc.name}`, '✅')
    created.push(service)
  }

  return created
}

async function seedFees() {
  log('\n💰 Creating Fees...', '📦')

  const fees = [
    { name: 'Delivery Fee', amount: 100, type: 'fixed' },
    { name: 'Insurance', amount: 5, type: 'percentage' },
    { name: 'Late Return Fee', amount: 50, type: 'fixed' },
    { name: 'Damage Waiver', amount: 150, type: 'fixed' },
    { name: 'Equipment Protection', amount: 10, type: 'percentage' }
  ]

  const created = []
  for (const fee of fees) {
    const existing = await prisma.fee.findFirst({ where: { name: fee.name } })
    if (existing) {
      log(`Fee '${fee.name}' already exists`, 'ℹ️')
      created.push(existing)
      continue
    }
    const feeRecord = await prisma.fee.create({ data: fee })
    log(`Created fee: ${fee.name}`, '✅')
    created.push(feeRecord)
  }

  return created
}

async function seedCustomization(adminId: string) {
  log('\n🎨 Creating Customization Settings...', '📦')

  const settings = await prisma.customizationSettings.upsert({
    where: { id: 'default-settings' },
    update: { 
      updatedBy: adminId,
      updatedAt: new Date()
    },
    create: {
      id: 'default-settings',
      companyName: 'Acrobaticz AV Rentals',
      companyTagline: 'Professional Audio Visual Equipment Rental',
      contactEmail: 'info@acrobaticz.pt',
      contactPhone: '+351 910 000 000',
      // PDF Branding
      pdfCompanyName: 'Acrobaticz AV Rentals',
      pdfCompanyTagline: 'Professional Audio Visual Equipment Rental',
      pdfContactEmail: 'info@acrobaticz.pt',
      pdfContactPhone: '+351 910 000 000',
      pdfFooterMessage: 'Thank you for your business',
      pdfFooterContactText: 'For questions, contact us at info@acrobaticz.pt',
      pdfShowFooterContact: true,
      // Branding
      useTextLogo: true,
      pdfUseTextLogo: true,
      themePreset: 'default',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      accentColor: '#10b981',
      darkMode: false,
      // Login Customization
      loginBackgroundType: 'gradient',
      loginBackgroundColor1: '#3b82f6',
      loginBackgroundColor2: '#8b5cf6',
      loginCardOpacity: 0.95,
      loginCardBlur: true,
      loginCardPosition: 'center',
      loginCardWidth: 400,
      loginCardBorderRadius: 8,
      loginCardShadow: 'large',
      loginLogoSize: 80,
      loginWelcomeMessage: 'Welcome Back',
      loginWelcomeSubtitle: 'Sign in to manage your equipment rentals',
      loginShowCompanyName: true,
      loginFormSpacing: 16,
      loginButtonStyle: 'default',
      loginInputStyle: 'default',
      loginAnimations: true,
      loginLightRaysFollowMouse: true,
      // System
      systemName: 'AV Rentals',
      timezone: 'Europe/Lisbon',
      dateFormat: 'DD/MM/YYYY',
      currency: 'EUR',
      language: 'pt',
      sessionTimeout: 30,
      // Security
      requireStrongPasswords: true,
      enableTwoFactor: false,
      maxLoginAttempts: 5,
      // Email
      emailEnabled: false,
      // Backup
      autoBackup: true,
      backupFrequency: 'daily',
      backupRetention: 7,
      updatedBy: adminId,
    },
  })
  log('Customization settings created/updated', '✅')
  return settings
}

// ==============================================================================
// PHASE 2: BUSINESS MASTERS
// ==============================================================================

async function seedClients() {
  log('\n👥 PHASE 2: Creating Clients...', '📦')

  const clients = [
    {
      name: 'Marriott Hotel Porto',
      email: 'events@marriott-porto.pt',
      phone: '+351 222 340 000',
      address: 'Av. Brasil, 4100-091 Porto'
    },
    {
      name: 'TVI Productions',
      email: 'production@tvi.pt',
      phone: '+351 226 120 000',
      address: 'Casal do Cambolo, 2615-011 Amadora'
    },
    {
      name: 'RFM Radio',
      email: 'events@rfm.pt',
      phone: '+351 219 261 000',
      address: 'Rua Barbosa du Bocage, 1500-007 Lisboa'
    },
    {
      name: 'Corporate Events Portugal',
      email: 'booking@corpevents.pt',
      phone: '+351 213 886 886',
      address: 'Avenida da República, 1050-190 Lisboa'
    },
    {
      name: 'Music Festival Vilamoura',
      email: 'info@fvil.pt',
      phone: '+351 289 001 000',
      address: 'Vilamoura, 8125-505 Quarteira'
    }
  ]

  const created = []
  for (const clientData of clients) {
    // Remove taxId if it doesn't exist in schema
    const { taxId, ...clientDataClean } = clientData as any
    const existing = await prisma.client.findFirst({ where: { name: clientData.name } })
    if (existing) {
      log(`Client '${clientData.name}' already exists`, 'ℹ️')
      created.push(existing)
      continue
    }
    const client = await prisma.client.create({ data: clientDataClean })
    log(`Created client: ${clientData.name}`, '✅')
    created.push(client)
  }

  return created
}

async function seedEquipmentItems(categories: any[], subcategories: any[]) {
  log('\n🎛️ Creating Equipment Items...', '📦')

  const equipmentData = [
    // Audio
    { name: 'Shure SM7B Microphone', categoryName: 'Audio', subcategoryName: 'Microphones', quantity: 5, dailyRate: 50, status: 'good' },
    { name: 'Neumann U87 Condenser Mic', categoryName: 'Audio', subcategoryName: 'Microphones', quantity: 2, dailyRate: 150, status: 'good' },
    { name: 'QSC KW181 Subwoofer', categoryName: 'Audio', subcategoryName: 'Speakers', quantity: 4, dailyRate: 100, status: 'good' },
    { name: 'JBL LSR308 Studio Monitor', categoryName: 'Audio', subcategoryName: 'Speakers', quantity: 6, dailyRate: 75, status: 'good' },
    { name: 'Soundcraft Si Impact Mixer', categoryName: 'Audio', subcategoryName: 'Mixers', quantity: 2, dailyRate: 200, status: 'good' },
    
    // Video
    { name: 'Sony FX30 Cinema Camera', categoryName: 'Video', subcategoryName: 'Cameras', quantity: 3, dailyRate: 500, status: 'good' },
    { name: 'Panasonic PT-RZ970 Projector', categoryName: 'Video', subcategoryName: 'Projectors', quantity: 2, dailyRate: 300, status: 'good' },
    { name: 'Christie DHD800 Projector', categoryName: 'Video', subcategoryName: 'Projectors', quantity: 1, dailyRate: 800, status: 'good' },
    { name: '7m x 4m LED Screen', categoryName: 'Video', subcategoryName: 'Screens', quantity: 1, dailyRate: 1000, status: 'good' },
    { name: '4m x 3m LED Screen', categoryName: 'Video', subcategoryName: 'Screens', quantity: 2, dailyRate: 600, status: 'good' },
    
    // Lighting
    { name: 'ETC Source Four LED Spot', categoryName: 'Lighting', subcategoryName: 'Spotlights', quantity: 8, dailyRate: 40, status: 'good' },
    { name: 'Chauvet Maverick MK3 Spot', categoryName: 'Lighting', subcategoryName: 'Spotlights', quantity: 6, dailyRate: 60, status: 'good' },
    { name: 'ARRI SkyPanel X50', categoryName: 'Lighting', subcategoryName: 'LED Panels', quantity: 4, dailyRate: 150, status: 'good' },
    { name: 'Lupo Superpanel 200', categoryName: 'Lighting', subcategoryName: 'LED Panels', quantity: 3, dailyRate: 200, status: 'good' },
    
    // Staging
    { name: 'Conference Podium', categoryName: 'Staging', subcategoryName: 'Podiums', quantity: 2, dailyRate: 75, status: 'good' },
    { name: 'DJ Booth Setup', categoryName: 'Staging', subcategoryName: 'Podiums', quantity: 1, dailyRate: 150, status: 'good' },
    { name: 'Custom Backdrop 10x8', categoryName: 'Staging', subcategoryName: 'Backdrops', quantity: 3, dailyRate: 100, status: 'good' }
  ]

  const created = []
  for (const eqData of equipmentData) {
    const category = categories.find(c => c.name === eqData.categoryName)
    const subcategory = eqData.subcategoryName ? subcategories.find(s => s.name === eqData.subcategoryName) : null

    const existing = await prisma.equipmentItem.findFirst({ where: { name: eqData.name } })
    if (existing) {
      log(`Equipment '${eqData.name}' already exists`, 'ℹ️')
      created.push(existing)
      continue
    }

    const equipment = await prisma.equipmentItem.create({
      data: {
        name: eqData.name,
        description: `Professional ${eqData.name}`,
        categoryId: category.id,
        subcategoryId: subcategory?.id,
        quantity: eqData.quantity,
        dailyRate: eqData.dailyRate,
        status: eqData.status,
        location: 'Warehouse A',
        type: 'equipment'
      }
    })
    log(`Created equipment: ${eqData.name}`, '✅')
    created.push(equipment)
  }

  return created
}

async function seedPartners() {
  log('\n🤝 Creating Partners...', '📦')

  const partners = [
    {
      name: 'Audio Rental Pro',
      companyName: 'Audio Rental Pro Lda',
      email: 'info@audiorentalpro.pt',
      phone: '+351 910 000 001',
      partnerType: 'provider'
    },
    {
      name: 'Creative Events Agency',
      companyName: 'Creative Events Agency',
      email: 'contact@creativeevents.pt',
      phone: '+351 910 000 002',
      partnerType: 'agency',
      commission: 15
    },
    {
      name: 'Studio Equipment Rentals',
      companyName: 'Studio Equipment Rentals',
      email: 'rental@studioequipment.pt',
      phone: '+351 910 000 003',
      partnerType: 'both',
      commission: 10
    }
  ]

  const created = []
  for (const partnerData of partners) {
    const existing = await prisma.partner.findFirst({ where: { name: partnerData.name } })
    if (existing) {
      log(`Partner '${partnerData.name}' already exists`, 'ℹ️')
      created.push(existing)
      continue
    }
    const partner = await prisma.partner.create({ data: partnerData })
    log(`Created partner: ${partnerData.name}`, '✅')
    created.push(partner)
  }

  return created
}

// ==============================================================================
// PHASE 3: EVENTS & QUOTES
// ==============================================================================

async function seedEvents(clients: any[]) {
  log('\n📅 PHASE 3: Creating Events...', '📦')

  const today = new Date()
  const events = [
    {
      name: 'Corporate Gala 2025',
      clientId: clients[0].id,
      location: 'Marriott Porto Ballroom',
      startDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000)
    },
    {
      name: 'TVI Awards Show',
      clientId: clients[1].id,
      location: 'MEO Arena Lisboa',
      startDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000)
    },
    {
      name: 'RFM Summer Festival',
      clientId: clients[2].id,
      location: 'Parque da Monsanto',
      startDate: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000),
      endDate: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000)
    },
    {
      name: 'Corporate Workshop',
      clientId: clients[3].id,
      location: 'Hotel Tejo Lisboa',
      startDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000)
    },
    {
      name: 'Vilamoura Music Festival',
      clientId: clients[4].id,
      location: 'Vilamoura Amphitheatre',
      startDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000)
    }
  ]

  const created = []
  for (const eventData of events) {
    const existing = await prisma.event.findFirst({ where: { name: eventData.name } })
    if (existing) {
      log(`Event '${eventData.name}' already exists`, 'ℹ️')
      created.push(existing)
      continue
    }
    const event = await prisma.event.create({ data: eventData })
    log(`Created event: ${eventData.name}`, '✅')
    created.push(event)
  }

  return created
}

async function seedQuotes(clients: any[], equipmentItems: any[], services: any[], fees: any[]) {
  log('\n📄 Creating Quotes...', '📦')

  const today = new Date()
  const quoteData = [
    {
      quoteNumber: 'QT-2025-001',
      name: 'Marriott Gala - AV Equipment',
      location: 'Marriott Porto Ballroom',
      clientId: clients[0].id,
      clientName: clients[0].name,
      clientEmail: clients[0].email,
      clientPhone: clients[0].phone,
      startDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
      items: [
        { type: 'equipment', equipmentId: equipmentItems[11].id, quantity: 8, days: 1, unitPrice: 40 }, // Spotlights
        { type: 'equipment', equipmentId: equipmentItems[12].id, quantity: 4, days: 1, unitPrice: 150 }, // LED Panels
        { type: 'service', serviceId: services[0].id, quantity: 1, unitPrice: 250 }, // Setup
        { type: 'fee', feeId: fees[0].id, quantity: 1, unitPrice: 100 } // Delivery
      ]
    },
    {
      quoteNumber: 'QT-2025-002',
      name: 'TVI Awards - Complete AV Package',
      location: 'MEO Arena Lisboa',
      clientId: clients[1].id,
      clientName: clients[1].name,
      clientEmail: clients[1].email,
      clientPhone: clients[1].phone,
      startDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      items: [
        { type: 'equipment', equipmentId: equipmentItems[5].id, quantity: 2, days: 1, unitPrice: 500 }, // Camera
        { type: 'equipment', equipmentId: equipmentItems[6].id, quantity: 1, days: 1, unitPrice: 300 }, // Projector
        { type: 'equipment', equipmentId: equipmentItems[8].id, quantity: 1, days: 1, unitPrice: 1000 }, // LED Screen
        { type: 'service', serviceId: services[1].id, quantity: 8, unitPrice: 75 } // Tech support
      ]
    },
    {
      quoteNumber: 'QT-2025-003',
      name: 'RFM Festival - Audio & Lighting',
      location: 'Parque da Monsanto',
      clientId: clients[2].id,
      clientName: clients[2].name,
      clientEmail: clients[2].email,
      clientPhone: clients[2].phone,
      startDate: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000),
      endDate: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
      items: [
        { type: 'equipment', equipmentId: equipmentItems[0].id, quantity: 4, days: 2, unitPrice: 50 }, // Microphones
        { type: 'equipment', equipmentId: equipmentItems[3].id, quantity: 8, days: 2, unitPrice: 75 }, // Speakers
        { type: 'service', serviceId: services[2].id, quantity: 2, unitPrice: 150 } // Operator
      ]
    }
  ]

  const created = []
  for (const qData of quoteData) {
    const existing = await prisma.quote.findFirst({ where: { quoteNumber: qData.quoteNumber } })
    if (existing) {
      log(`Quote '${qData.quoteNumber}' already exists`, 'ℹ️')
      created.push(existing)
      continue
    }

    // Calculate totals
    let subTotal = 0
    const items = []
    for (const item of qData.items) {
      const lineTotal = item.quantity * (item.days || 1) * item.unitPrice
      subTotal += lineTotal
      items.push({
        type: item.type,
        equipmentId: item.equipmentId,
        quantity: item.quantity,
        days: item.days || 1,
        unitPrice: item.unitPrice,
        lineTotal
      })
    }

    const discountAmount = 0
    const taxAmount = Math.round(subTotal * 0.23 * 100) / 100 // 23% VAT
    const totalAmount = subTotal + taxAmount

    const quote = await prisma.quote.create({
      data: {
        quoteNumber: qData.quoteNumber,
        name: qData.name,
        location: qData.location,
        clientId: qData.clientId,
        clientName: qData.clientName,
        clientEmail: qData.clientEmail,
        clientPhone: qData.clientPhone,
        startDate: qData.startDate,
        endDate: qData.endDate,
        subTotal,
        discountAmount,
        taxAmount,
        totalAmount,
        status: 'Draft',
        items: {
          create: items
        }
      },
      include: { items: true }
    })
    log(`Created quote: ${qData.quoteNumber} with ${items.length} items`, '✅')
    created.push(quote)
  }

  return created
}

// ==============================================================================
// PHASE 4: RENTALS & SUBRENTALS
// ==============================================================================

async function seedRentals(events: any[], equipmentItems: any[]) {
  log('\n🚚 PHASE 4: Creating Rentals...', '📦')

  const rentalData = [
    { eventIndex: 0, equipmentIndex: 11, quantity: 8 }, // Event 1: Spotlights
    { eventIndex: 0, equipmentIndex: 12, quantity: 4 }, // Event 1: LED Panels
    { eventIndex: 1, equipmentIndex: 5, quantity: 2 }, // Event 2: Cameras
    { eventIndex: 1, equipmentIndex: 6, quantity: 1 }, // Event 2: Projector
    { eventIndex: 2, equipmentIndex: 0, quantity: 4 }, // Event 3: Microphones
    { eventIndex: 2, equipmentIndex: 3, quantity: 8 }, // Event 3: Speakers
    { eventIndex: 3, equipmentIndex: 14, quantity: 2 }, // Event 4: Podiums
    { eventIndex: 4, equipmentIndex: 1, quantity: 2 } // Event 5: Cameras
  ]

  const created = []
  for (const rData of rentalData) {
    const event = events[rData.eventIndex]
    const equipment = equipmentItems[rData.equipmentIndex]

    const existing = await prisma.rental.findFirst({
      where: { eventId: event.id, equipmentId: equipment.id }
    })
    if (existing) {
      log(`Rental for ${equipment.name} in ${event.name} already exists`, 'ℹ️')
      created.push(existing)
      continue
    }

    const rental = await prisma.rental.create({
      data: {
        eventId: event.id,
        equipmentId: equipment.id,
        quantityRented: rData.quantity,
        prepStatus: 'pending'
      }
    })
    log(`Created rental: ${equipment.name} for ${event.name}`, '✅')
    created.push(rental)
  }

  return created
}

async function seedSubrentals(partners: any[], events: any[]) {
  log('\n🔄 Creating Subrentals...', '📦')

  const subrental = await prisma.subrental.findFirst({
    where: { partnerId: partners[0].id }
  })

  if (subrental) {
    log('Subrental already exists', 'ℹ️')
    return [subrental]
  }

  const eventDate = events[0]
  const created = await prisma.subrental.create({
    data: {
      partnerId: partners[0].id,
      eventId: eventDate.id,
      equipmentName: 'Extra Wireless Microphone Kit',
      equipmentDesc: 'Professional wireless mics for backup',
      quantity: 2,
      dailyRate: 75,
      totalCost: 150,
      startDate: eventDate.startDate,
      endDate: eventDate.endDate,
      status: 'pending'
    }
  })

  log(`Created subrental: ${created.equipmentName}`, '✅')
  return [created]
}

// ==============================================================================
// PHASE 5: CLOUD STORAGE
// ==============================================================================

async function seedCloudStorage(users: { admin: any; manager: any; technician: any; employee1: any; employee2: any }) {
  log('\n☁️ PHASE 5: Creating Cloud Storage...', '📦')

  const admin = users.admin

  // Create storage quota for admin (or reuse if exists)
  let quota = await prisma.storageQuota.findUnique({ where: { userId: admin.id } })
  if (!quota) {
    quota = await prisma.storageQuota.create({
      data: {
        userId: admin.id,
        usedBytes: BigInt(0),
        quotaBytes: BigInt(10 * 1024 * 1024 * 1024), // 10GB
        cloudEnabled: true
      }
    })
    log('Created storage quota for admin', '✅')
  } else {
    log('Storage quota already exists for admin', 'ℹ️')
  }

  // Create folder structure - get or create root folder
  let rootFolder = await prisma.cloudFolder.findFirst({
    where: { ownerId: admin.id, parentId: null, name: 'My Drive' }
  })

  if (!rootFolder) {
    rootFolder = await prisma.cloudFolder.create({
      data: { name: 'My Drive', ownerId: admin.id }
    })
    log('Created root folder: My Drive', '✅')
  } else {
    log('Root folder already exists: My Drive', 'ℹ️')
  }

  // Create subfolders
  const folderData = [
    { name: 'Events', parentId: rootFolder.id },
    { name: 'Equipment Docs', parentId: rootFolder.id },
    { name: 'Quotes & Invoices', parentId: rootFolder.id },
    { name: 'Archive', parentId: rootFolder.id }
  ]

  const createdFolders = [{ id: rootFolder.id, name: 'My Drive' }]
  for (const fData of folderData) {
    const existing = await prisma.cloudFolder.findFirst({
      where: { name: fData.name, parentId: fData.parentId, ownerId: admin.id }
    })
    if (existing) {
      log(`Folder '${fData.name}' already exists`, 'ℹ️')
      createdFolders.push(existing)
      continue
    }
    const folder = await prisma.cloudFolder.create({ data: { ...fData, ownerId: admin.id } })
    log(`Created folder: ${fData.name}`, '✅')
    createdFolders.push(folder)
  }

  // Create sample files
  const fileData = [
    { name: 'Event Checklist.pdf', folderId: createdFolders[1].id, size: BigInt(150000), mimeType: 'application/pdf' },
    { name: 'Equipment List.xlsx', folderId: createdFolders[1].id, size: BigInt(85000), mimeType: 'application/vnd.ms-excel' },
    { name: 'Quote Template.docx', folderId: createdFolders[2].id, size: BigInt(45000), mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { name: 'Event Schedule.pdf', folderId: createdFolders[0].id, size: BigInt(200000), mimeType: 'application/pdf' }
  ]

  const createdFiles = []
  for (const fData of fileData) {
    const existing = await prisma.cloudFile.findFirst({
      where: { name: fData.name, folderId: fData.folderId, ownerId: admin.id }
    })
    if (existing) {
      log(`File '${fData.name}' already exists`, 'ℹ️')
      createdFiles.push(existing)
      continue
    }
    const file = await prisma.cloudFile.create({
      data: {
        name: fData.name,
        originalName: fData.name,
        mimeType: fData.mimeType,
        size: fData.size,
        storagePath: `/storage/${Date.now()}-${fData.name}`,
        ownerId: admin.id,
        folderId: fData.folderId
      }
    })
    log(`Created file: ${fData.name}`, '✅')
    createdFiles.push(file)
  }

  return { folders: createdFolders, files: createdFiles }
}

// ==============================================================================
// PHASE 6: MAINTENANCE & SYSTEM DATA
// ==============================================================================

async function seedMaintenanceLogs(equipmentItems: any[]) {
  log('\n🔧 PHASE 6: Creating Maintenance Logs...', '📦')

  const today = new Date()
  const maintenanceData = [
    { equipmentId: equipmentItems[0].id, description: 'Regular inspection and cleaning', cost: 50 },
    { equipmentId: equipmentItems[5].id, description: 'Sensor cleaning and firmware update', cost: 200 },
    { equipmentId: equipmentItems[11].id, description: 'Lamp replacement', cost: 150 }
  ]

  const created = []
  for (const mData of maintenanceData) {
    const mainLog = await prisma.maintenanceLog.create({
      data: {
        equipmentId: mData.equipmentId,
        date: today,
        description: mData.description,
        cost: mData.cost
      }
    })
    log(`Created maintenance log for equipment`, '✅')
    created.push(mainLog)
  }

  return created
}

// ==============================================================================
// CLEANUP FUNCTION
// ==============================================================================

async function cleanDatabase() {
  log('\n🧹 Cleaning up test data...', '📦')

  try {
    // Delete in reverse dependency order
    await prisma.fileActivity.deleteMany({})
    await prisma.fileTag.deleteMany({})
    await prisma.folderTag.deleteMany({})
    await prisma.fileVersion.deleteMany({})
    await prisma.fileShare.deleteMany({})
    await prisma.folderShare.deleteMany({})
    await prisma.cloudFile.deleteMany({})
    await prisma.cloudFolder.deleteMany({ where: { name: { not: undefined } } }) // Keep some system folders
    await prisma.maintenanceLog.deleteMany({})
    await prisma.quoteItem.deleteMany({})
    await prisma.quote.deleteMany({})
    await prisma.rental.deleteMany({})
    await prisma.subrental.deleteMany({})
    await prisma.jobReference.deleteMany({})
    await prisma.event.deleteMany({})
    await prisma.equipmentItem.deleteMany({})
    await prisma.subcategory.deleteMany({})
    await prisma.category.deleteMany({})
    await prisma.partner.deleteMany({})
    await prisma.client.deleteMany({})
    await prisma.service.deleteMany({})
    await prisma.fee.deleteMany({})
    await prisma.tagDefinition.deleteMany({})
    await prisma.quotaChangeHistory.deleteMany({})
    await prisma.storageQuota.deleteMany({})

    log('Database cleaned successfully', '✅')
  } catch (error) {
    log(`Error during cleanup: ${error}`, '❌')
  }
}

// ==============================================================================
// MAIN SEED FUNCTION
// ==============================================================================

async function main() {
  console.log('\n' + '='.repeat(80))
  console.log('🌱 AV RENTALS COMPREHENSIVE DATABASE SEED')
  console.log('='.repeat(80))

  if (dryRun) {
    log('🔍 DRY RUN MODE - Changes will NOT be committed', '📋')
  }

  try {
    if (shouldClean) {
      await cleanDatabase()
    }

    // PHASE 1: Base infrastructure
    let users: any = {
      admin: null,
      manager: null,
      technician: null,
      employee1: null,
      employee2: null
    }
    users = await seedUsers()
    const customization = await seedCustomization(users.admin.id)

    const categories = await seedCategories()
    const subcategories = await seedSubcategories(categories)
    const services = await seedServices()
    const fees = await seedFees()

    // PHASE 2: Business masters
    const clients = await seedClients()
    const partners = await seedPartners()
    const equipmentItems = await seedEquipmentItems(categories, subcategories)

    // PHASE 3: Events and quotes
    const events = await seedEvents(clients)
    const quotes = await seedQuotes(clients, equipmentItems, services, fees)

    // PHASE 4: Rentals
    const rentals = await seedRentals(events, equipmentItems)
    const subrentals = await seedSubrentals(partners, events)

    // PHASE 5: Cloud storage
    const cloudStorage = await seedCloudStorage(users)

    // PHASE 6: Maintenance logs
    const maintenanceLogs = await seedMaintenanceLogs(equipmentItems)

    console.log('\n' + '='.repeat(80))
    log('✨ SEED COMPLETE!', '🎉')
    console.log('='.repeat(80))

    log(`Created customization settings`, '📊')
    log(`Created ${clients.length} clients`, '📊')
    log(`Created ${equipmentItems.length} equipment items`, '📊')
    log(`Created ${events.length} events`, '📊')
    log(`Created ${quotes.length} quotes`, '📊')
    log(`Created ${rentals.length} rentals`, '📊')
    log(`Created ${subrentals.length} subrentals`, '📊')
    log(`Created ${cloudStorage.files.length} cloud files`, '📊')
    log(`Created ${maintenanceLogs.length} maintenance logs`, '📊')

    console.log('\n' + '='.repeat(80))
    log('Test Users Created:', '👥')
    log(`  Admin: feliciano / superfeliz99`, '✅')
    log(`  Manager: lourenco / lourenco123`, '✅')
    log(`  Technician: joao / joao123`, '✅')
    log(`  Employee: maria / maria123`, '✅')
    log(`  Employee: pedro / pedro123`, '✅')
    console.log('='.repeat(80) + '\n')
  } catch (error) {
    log(`Fatal error: ${error}`, '❌')
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
