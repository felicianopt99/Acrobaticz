import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'

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

function loadJSON(filename: string) {
  const filePath = path.join(process.cwd(), 'seeding', 'data', filename)
  if (!fs.existsSync(filePath)) {
    log(`⚠️  File not found: ${filename}`, '⚠️')
    return []
  }
  const data = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(data)
}

// ==============================================================================
// SEEDING FUNCTIONS FROM JSON
// ==============================================================================

async function seedUsers() {
  log('\n👥 Creating Default Users...', '🔐')

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

async function seedCustomizationFromJSON(adminId: string) {
  log('\n🎨 Importing Customization Settings from JSON...', '📥')

  const customizationData = loadJSON('customization.json')
  
  if (!customizationData || customizationData.length === 0) {
    log('⚠️  No customization data found, creating defaults', '⚠️')
    
    const settings = await prisma.customizationSettings.upsert({
      where: { id: 'default-settings' },
      update: { updatedBy: adminId },
      create: {
        id: 'default-settings',
        companyName: 'Acrobaticz AV Rentals',
        systemName: 'AV Rentals',
        language: 'pt',
        currency: 'EUR',
        timezone: 'Europe/Lisbon',
        useTextLogo: true,
        pdfUseTextLogo: true,
        updatedBy: adminId,
      },
    })
    log('✅ Created default customization settings')
    return settings
  }

  // Use the first customization record
  const data = customizationData[0]
  
  const settings = await prisma.customizationSettings.upsert({
    where: { id: data.id || 'default-settings' },
    update: {
      companyName: data.companyName,
      companyTagline: data.companyTagline,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      // PDF Branding
      pdfCompanyName: data.pdfCompanyName,
      pdfCompanyTagline: data.pdfCompanyTagline,
      pdfContactEmail: data.pdfContactEmail,
      pdfContactPhone: data.pdfContactPhone,
      pdfFooterMessage: data.pdfFooterMessage,
      pdfFooterContactText: data.pdfFooterContactText,
      pdfShowFooterContact: data.pdfShowFooterContact,
      // Branding
      useTextLogo: data.useTextLogo,
      themePreset: data.themePreset,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      accentColor: data.accentColor,
      darkMode: data.darkMode,
      logoUrl: data.logoUrl,
      faviconUrl: data.faviconUrl,
      pdfLogoUrl: data.pdfLogoUrl,
      pdfUseTextLogo: data.pdfUseTextLogo,
      // Login Customization
      loginBackgroundType: data.loginBackgroundType,
      loginBackgroundColor1: data.loginBackgroundColor1,
      loginBackgroundColor2: data.loginBackgroundColor2,
      loginBackgroundImage: data.loginBackgroundImage,
      loginCardOpacity: data.loginCardOpacity,
      loginCardBlur: data.loginCardBlur,
      loginCardPosition: data.loginCardPosition,
      loginCardWidth: data.loginCardWidth,
      loginCardBorderRadius: data.loginCardBorderRadius,
      loginCardShadow: data.loginCardShadow,
      loginLogoUrl: data.loginLogoUrl,
      loginLogoSize: data.loginLogoSize,
      loginWelcomeMessage: data.loginWelcomeMessage,
      loginWelcomeSubtitle: data.loginWelcomeSubtitle,
      loginFooterText: data.loginFooterText,
      loginShowCompanyName: data.loginShowCompanyName,
      loginFormSpacing: data.loginFormSpacing,
      loginButtonStyle: data.loginButtonStyle,
      loginInputStyle: data.loginInputStyle,
      loginAnimations: data.loginAnimations,
      loginLightRaysOrigin: data.loginLightRaysOrigin,
      loginLightRaysColor: data.loginLightRaysColor,
      loginLightRaysSpeed: data.loginLightRaysSpeed,
      loginLightRaysSpread: data.loginLightRaysSpread,
      loginLightRaysLength: data.loginLightRaysLength,
      loginLightRaysPulsating: data.loginLightRaysPulsating,
      loginLightRaysFadeDistance: data.loginLightRaysFadeDistance,
      loginLightRaysSaturation: data.loginLightRaysSaturation,
      loginLightRaysFollowMouse: data.loginLightRaysFollowMouse,
      loginLightRaysMouseInfluence: data.loginLightRaysMouseInfluence,
      loginLightRaysNoiseAmount: data.loginLightRaysNoiseAmount,
      loginLightRaysDistortion: data.loginLightRaysDistortion,
      // Catalog
      catalogTermsAndConditions: data.catalogTermsAndConditions,
      customCSS: data.customCSS,
      footerText: data.footerText,
      // System
      systemName: data.systemName,
      timezone: data.timezone,
      dateFormat: data.dateFormat,
      currency: data.currency,
      language: data.language,
      sessionTimeout: data.sessionTimeout,
      // Security
      requireStrongPasswords: data.requireStrongPasswords,
      enableTwoFactor: data.enableTwoFactor,
      maxLoginAttempts: data.maxLoginAttempts,
      // Email
      emailEnabled: data.emailEnabled,
      smtpServer: data.smtpServer,
      smtpPort: data.smtpPort,
      smtpUsername: data.smtpUsername,
      fromEmail: data.fromEmail,
      // Backup
      autoBackup: data.autoBackup,
      backupFrequency: data.backupFrequency,
      backupRetention: data.backupRetention,
      updatedBy: adminId,
    },
    create: {
      id: data.id || 'default-settings',
      companyName: data.companyName,
      companyTagline: data.companyTagline,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      // PDF Branding
      pdfCompanyName: data.pdfCompanyName,
      pdfCompanyTagline: data.pdfCompanyTagline,
      pdfContactEmail: data.pdfContactEmail,
      pdfContactPhone: data.pdfContactPhone,
      pdfFooterMessage: data.pdfFooterMessage,
      pdfFooterContactText: data.pdfFooterContactText,
      pdfShowFooterContact: data.pdfShowFooterContact,
      // Branding
      useTextLogo: data.useTextLogo ?? true,
      themePreset: data.themePreset,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      accentColor: data.accentColor,
      darkMode: data.darkMode ?? false,
      logoUrl: data.logoUrl,
      faviconUrl: data.faviconUrl,
      pdfLogoUrl: data.pdfLogoUrl,
      pdfUseTextLogo: data.pdfUseTextLogo,
      // Login Customization
      loginBackgroundType: data.loginBackgroundType || 'gradient',
      loginBackgroundColor1: data.loginBackgroundColor1,
      loginBackgroundColor2: data.loginBackgroundColor2,
      loginBackgroundImage: data.loginBackgroundImage,
      loginCardOpacity: data.loginCardOpacity ?? 0.95,
      loginCardBlur: data.loginCardBlur ?? true,
      loginCardPosition: data.loginCardPosition || 'center',
      loginCardWidth: data.loginCardWidth ?? 400,
      loginCardBorderRadius: data.loginCardBorderRadius ?? 8,
      loginCardShadow: data.loginCardShadow || 'large',
      loginLogoUrl: data.loginLogoUrl,
      loginLogoSize: data.loginLogoSize ?? 80,
      loginWelcomeMessage: data.loginWelcomeMessage,
      loginWelcomeSubtitle: data.loginWelcomeSubtitle,
      loginFooterText: data.loginFooterText,
      loginShowCompanyName: data.loginShowCompanyName ?? true,
      loginFormSpacing: data.loginFormSpacing ?? 16,
      loginButtonStyle: data.loginButtonStyle || 'default',
      loginInputStyle: data.loginInputStyle || 'default',
      loginAnimations: data.loginAnimations ?? true,
      loginLightRaysOrigin: data.loginLightRaysOrigin,
      loginLightRaysColor: data.loginLightRaysColor,
      loginLightRaysSpeed: data.loginLightRaysSpeed,
      loginLightRaysSpread: data.loginLightRaysSpread,
      loginLightRaysLength: data.loginLightRaysLength,
      loginLightRaysPulsating: data.loginLightRaysPulsating ?? false,
      loginLightRaysFadeDistance: data.loginLightRaysFadeDistance,
      loginLightRaysSaturation: data.loginLightRaysSaturation,
      loginLightRaysFollowMouse: data.loginLightRaysFollowMouse ?? true,
      loginLightRaysMouseInfluence: data.loginLightRaysMouseInfluence,
      loginLightRaysNoiseAmount: data.loginLightRaysNoiseAmount,
      loginLightRaysDistortion: data.loginLightRaysDistortion,
      // Catalog
      catalogTermsAndConditions: data.catalogTermsAndConditions,
      customCSS: data.customCSS,
      footerText: data.footerText,
      // System
      systemName: data.systemName,
      timezone: data.timezone,
      dateFormat: data.dateFormat,
      currency: data.currency,
      language: data.language,
      sessionTimeout: data.sessionTimeout,
      // Security
      requireStrongPasswords: data.requireStrongPasswords ?? true,
      enableTwoFactor: data.enableTwoFactor ?? false,
      maxLoginAttempts: data.maxLoginAttempts,
      // Email
      emailEnabled: data.emailEnabled ?? false,
      smtpServer: data.smtpServer,
      smtpPort: data.smtpPort,
      smtpUsername: data.smtpUsername,
      fromEmail: data.fromEmail,
      // Backup
      autoBackup: data.autoBackup ?? true,
      backupFrequency: data.backupFrequency,
      backupRetention: data.backupRetention,
      updatedBy: adminId,
    },
  })

  log('✅ Customization settings imported from JSON')
  return settings
}

async function seedCategoriesFromJSON() {
  log('\n📂 Importing Categories from JSON...', '📥')

  const categoriesData = loadJSON('categories.json')
  if (!categoriesData || categoriesData.length === 0) {
    log('⚠️  No categories data found', '⚠️')
    return []
  }

  const created = []
  for (const cat of categoriesData) {
    const existing = await prisma.category.findFirst({ where: { id: cat.id } })
    if (!existing) {
      const category = await prisma.category.create({
        data: {
          id: cat.id,
          name: cat.name,
          icon: cat.icon
        }
      })
      log(`✅ Created category: ${cat.name}`)
      created.push(category)
    } else {
      log(`ℹ️  Category already exists: ${cat.name}`)
      created.push(existing)
    }
  }

  return created
}

async function seedSubcategoriesFromJSON() {
  log('\n📋 Importing Subcategories from JSON...', '📥')

  const subcategoriesData = loadJSON('subcategories.json')
  if (!subcategoriesData || subcategoriesData.length === 0) {
    log('⚠️  No subcategories data found', '⚠️')
    return []
  }

  const created = []
  for (const sub of subcategoriesData) {
    const existing = await prisma.subcategory.findFirst({ where: { id: sub.id } })
    if (!existing) {
      const subcategory = await prisma.subcategory.create({
        data: {
          id: sub.id,
          name: sub.name,
          parentId: sub.parentId
        }
      })
      log(`✅ Created subcategory: ${sub.name}`)
      created.push(subcategory)
    } else {
      log(`ℹ️  Subcategory already exists: ${sub.name}`)
      created.push(existing)
    }
  }

  return created
}

async function seedProductsFromJSON() {
  log('\n🎛️ Importing Products/Equipment from JSON...', '📥')

  const productsData = loadJSON('products.json')
  if (!productsData || productsData.length === 0) {
    log('⚠️  No products data found', '⚠️')
    return []
  }

  const created = []
  let count = 0
  for (const product of productsData) {
    const existing = await prisma.equipmentItem.findFirst({ where: { id: product.id } })
    if (!existing) {
      const equipment = await prisma.equipmentItem.create({
        data: {
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
          type: product.type
        }
      })
      created.push(equipment)
      count++
      if (count % 10 === 0) {
        log(`  Imported ${count} products...`)
      }
    } else {
      created.push(existing)
    }
  }

  log(`✅ Imported ${count} products (${productsData.length - count} already existed)`)
  return created
}

async function seedClientsFromJSON() {
  log('\n🏢 Importing Clients from JSON...', '📥')

  const clientsData = loadJSON('clients.json')
  if (!clientsData || clientsData.length === 0) {
    log('⚠️  No clients data found', '⚠️')
    return []
  }

  const created = []
  for (const client of clientsData) {
    const existing = await prisma.client.findFirst({ where: { id: client.id } })
    if (!existing) {
      const newClient = await prisma.client.create({
        data: {
          id: client.id,
          name: client.name,
          contactPerson: client.contactPerson,
          email: client.email,
          phone: client.phone,
          address: client.address,
          notes: client.notes,
          partnerId: client.partnerId
        }
      })
      log(`✅ Created client: ${client.name}`)
      created.push(newClient)
    } else {
      log(`ℹ️  Client already exists: ${client.name}`)
      created.push(existing)
    }
  }

  return created
}

async function seedPartnersFromJSON() {
  log('\n🤝 Importing Partners from JSON...', '📥')

  const partnersData = loadJSON('partners.json')
  if (!partnersData || partnersData.length === 0) {
    log('⚠️  No partners data found', '⚠️')
    return []
  }

  const created = []
  for (const partner of partnersData) {
    const existing = await prisma.partner.findFirst({ where: { id: partner.id } })
    if (!existing) {
      const newPartner = await prisma.partner.create({
        data: {
          id: partner.id,
          name: partner.name,
          companyName: partner.companyName,
          contactPerson: partner.contactPerson,
          email: partner.email,
          phone: partner.phone,
          address: partner.address,
          website: partner.website,
          notes: partner.notes,
          partnerType: partner.partnerType,
          commission: partner.commission,
          isActive: partner.isActive,
          logoUrl: partner.logoUrl
        }
      })
      log(`✅ Created partner: ${partner.name}`)
      created.push(newPartner)
    } else {
      log(`ℹ️  Partner already exists: ${partner.name}`)
      created.push(existing)
    }
  }

  return created
}

// ==============================================================================
// MAIN FUNCTION
// ==============================================================================

async function main() {
  console.log('\n' + '='.repeat(80))
  console.log('🌱 IMPORTING DATABASE FROM JSON FILES')
  console.log('='.repeat(80))

  try {
    // Create users first
    const users = await seedUsers()
    const adminId = users[0]?.id || 'admin-id'

    // Import all data from JSON
    await seedCustomizationFromJSON(adminId)
    await seedCategoriesFromJSON()
    await seedSubcategoriesFromJSON()
    await seedPartnersFromJSON()
    await seedClientsFromJSON()
    await seedProductsFromJSON()

    console.log('\n' + '='.repeat(80))
    log('✨ IMPORT COMPLETE!', '🎉')
    console.log('='.repeat(80))
    log('Database populated from JSON files in seeding/data/', '📁')
    log('Remember to copy images from seeding/images/ to public/images/', '⚠️')
    log('Remember to copy logos from seeding/logos/ to public/images/', '⚠️')
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
