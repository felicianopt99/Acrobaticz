import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

function log(message: string, emoji = '📝') {
  console.log(`${emoji} ${message}`)
}

function copyImagesToSeeding() {
  log('\n📸 Copying product images...', '📤')
  const publicImagesDir = path.join(process.cwd(), 'public', 'images')
  const seedingImagesDir = path.join(process.cwd(), 'seeding', 'images')
  
  if (!fs.existsSync(seedingImagesDir)) {
    fs.mkdirSync(seedingImagesDir, { recursive: true })
  }
  
  try {
    execSync(`cp "${publicImagesDir}"/equipment-*.jpg "${seedingImagesDir}/" 2>/dev/null || true`)
    execSync(`cp "${publicImagesDir}"/equipment-*.webp "${seedingImagesDir}/" 2>/dev/null || true`)
    execSync(`cp "${publicImagesDir}"/equipment-*.png "${seedingImagesDir}/" 2>/dev/null || true`)
    
    const imageCount = fs.readdirSync(seedingImagesDir).length
    log(`✅ Copied ${imageCount} images to seeding/images/`)
  } catch (error) {
    log(`⚠️  Image copy had issues (non-critical): ${error}`)
  }
}

async function ensureDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    log(`📁 Created directory: ${dirPath}`)
  }
}

function saveToJSON(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  log(`✅ Saved: ${path.basename(filePath)} (${data.length || Object.keys(data).length} items)`)
}

// ==============================================================================
// EXTRACTION FUNCTIONS
// ==============================================================================

async function extractCategories() {
  log('\n🏷️  Extracting Categories...', '📤')
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  })
  
  return categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon
  }))
}

async function extractSubcategories() {
  log('\n📋 Extracting Subcategories...', '📤')
  const subcategories = await prisma.subcategory.findMany({
    orderBy: { name: 'asc' }
  })
  
  return subcategories.map(sub => ({
    id: sub.id,
    name: sub.name,
    parentId: sub.parentId
  }))
}

async function extractProducts() {
  log('\n🎬 Extracting Products (Equipment)...', '📤')
  const equipment = await prisma.equipmentItem.findMany({
    include: {
      category: true,
      subcategory: true
    },
    orderBy: { name: 'asc' }
  })
  
  return equipment.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    descriptionPt: item.descriptionPt,
    categoryId: item.categoryId,
    categoryName: item.category?.name,
    subcategoryId: item.subcategoryId,
    subcategoryName: item.subcategory?.name,
    quantity: item.quantity,
    status: item.status,
    location: item.location,
    imageUrl: item.imageUrl ? path.basename(item.imageUrl) : null,
    dailyRate: item.dailyRate,
    type: item.type
  }))
}

async function extractClients() {
  log('\n🏢 Extracting Clients...', '📤')
  const clients = await prisma.client.findMany({
    orderBy: { name: 'asc' }
  })
  
  return clients.map(client => ({
    id: client.id,
    name: client.name,
    contactPerson: client.contactPerson,
    email: client.email,
    phone: client.phone,
    address: client.address,
    notes: client.notes,
    partnerId: client.partnerId
  }))
}

async function extractPartners() {
  log('\n🤝 Extracting Partners...', '📤')
  const partners = await prisma.partner.findMany({
    orderBy: { name: 'asc' }
  })
  
  return partners.map(partner => ({
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
  }))
}

async function extractCustomization() {
  log('\n🎨 Extracting Customization Settings...', '📤')
  const settings = await prisma.customizationSettings.findMany()
  
  return settings.map(setting => ({
    id: setting.id,
    companyName: setting.companyName,
    companyTagline: setting.companyTagline,
    contactEmail: setting.contactEmail,
    contactPhone: setting.contactPhone,
    // PDF Branding
    pdfCompanyName: setting.pdfCompanyName,
    pdfCompanyTagline: setting.pdfCompanyTagline,
    pdfContactEmail: setting.pdfContactEmail,
    pdfContactPhone: setting.pdfContactPhone,
    pdfFooterMessage: setting.pdfFooterMessage,
    pdfFooterContactText: setting.pdfFooterContactText,
    pdfShowFooterContact: setting.pdfShowFooterContact,
    // Branding
    useTextLogo: setting.useTextLogo,
    themePreset: setting.themePreset,
    primaryColor: setting.primaryColor,
    secondaryColor: setting.secondaryColor,
    accentColor: setting.accentColor,
    darkMode: setting.darkMode,
    logoUrl: setting.logoUrl ? path.basename(setting.logoUrl) : null,
    faviconUrl: setting.faviconUrl ? path.basename(setting.faviconUrl) : null,
    pdfLogoUrl: setting.pdfLogoUrl ? path.basename(setting.pdfLogoUrl) : null,
    pdfUseTextLogo: setting.pdfUseTextLogo,
    // Login Customization
    loginBackgroundType: setting.loginBackgroundType,
    loginBackgroundColor1: setting.loginBackgroundColor1,
    loginBackgroundColor2: setting.loginBackgroundColor2,
    loginBackgroundImage: setting.loginBackgroundImage ? path.basename(setting.loginBackgroundImage) : null,
    loginCardOpacity: setting.loginCardOpacity,
    loginCardBlur: setting.loginCardBlur,
    loginCardPosition: setting.loginCardPosition,
    loginCardWidth: setting.loginCardWidth,
    loginCardBorderRadius: setting.loginCardBorderRadius,
    loginCardShadow: setting.loginCardShadow,
    loginLogoUrl: setting.loginLogoUrl ? path.basename(setting.loginLogoUrl) : null,
    loginLogoSize: setting.loginLogoSize,
    loginWelcomeMessage: setting.loginWelcomeMessage,
    loginWelcomeSubtitle: setting.loginWelcomeSubtitle,
    loginFooterText: setting.loginFooterText,
    loginShowCompanyName: setting.loginShowCompanyName,
    loginFormSpacing: setting.loginFormSpacing,
    loginButtonStyle: setting.loginButtonStyle,
    loginInputStyle: setting.loginInputStyle,
    loginAnimations: setting.loginAnimations,
    loginLightRaysOrigin: setting.loginLightRaysOrigin,
    loginLightRaysColor: setting.loginLightRaysColor,
    loginLightRaysSpeed: setting.loginLightRaysSpeed,
    loginLightRaysSpread: setting.loginLightRaysSpread,
    loginLightRaysLength: setting.loginLightRaysLength,
    loginLightRaysPulsating: setting.loginLightRaysPulsating,
    loginLightRaysFadeDistance: setting.loginLightRaysFadeDistance,
    loginLightRaysSaturation: setting.loginLightRaysSaturation,
    loginLightRaysFollowMouse: setting.loginLightRaysFollowMouse,
    loginLightRaysMouseInfluence: setting.loginLightRaysMouseInfluence,
    loginLightRaysNoiseAmount: setting.loginLightRaysNoiseAmount,
    loginLightRaysDistortion: setting.loginLightRaysDistortion,
    // Catalog
    catalogTermsAndConditions: setting.catalogTermsAndConditions,
    customCSS: setting.customCSS,
    footerText: setting.footerText,
    // System
    systemName: setting.systemName,
    timezone: setting.timezone,
    dateFormat: setting.dateFormat,
    currency: setting.currency,
    language: setting.language,
    sessionTimeout: setting.sessionTimeout,
    // Security
    requireStrongPasswords: setting.requireStrongPasswords,
    enableTwoFactor: setting.enableTwoFactor,
    maxLoginAttempts: setting.maxLoginAttempts,
    // Email
    emailEnabled: setting.emailEnabled,
    smtpServer: setting.smtpServer,
    smtpPort: setting.smtpPort,
    smtpUsername: setting.smtpUsername,
    fromEmail: setting.fromEmail,
    // Backup
    autoBackup: setting.autoBackup,
    backupFrequency: setting.backupFrequency,
    backupRetention: setting.backupRetention
  }))
}

function copyLogosToSeeding() {
  log('\n🎨 Copying logo files...', '📤')
  const publicImagesDir = path.join(process.cwd(), 'public', 'images')
  const seedingLogosDir = path.join(process.cwd(), 'seeding', 'logos')
  
  if (!fs.existsSync(seedingLogosDir)) {
    fs.mkdirSync(seedingLogosDir, { recursive: true })
  }
  
  try {
    // Copy logo files (various formats)
    execSync(`cp "${publicImagesDir}"/logo*.* "${seedingLogosDir}/" 2>/dev/null || true`)
    execSync(`cp "${publicImagesDir}"/favicon*.* "${seedingLogosDir}/" 2>/dev/null || true`)
    execSync(`cp "${publicImagesDir}"/pdf-logo*.* "${seedingLogosDir}/" 2>/dev/null || true`)
    execSync(`cp "${publicImagesDir}"/login-*.* "${seedingLogosDir}/" 2>/dev/null || true`)
    
    const logoCount = fs.readdirSync(seedingLogosDir).length
    log(`✅ Copied ${logoCount} logo files to seeding/logos/`)
  } catch (error) {
    log(`⚠️  Logo copy had issues (non-critical): ${error}`)
  }
}

// ==============================================================================
// MAIN EXTRACTION
// ==============================================================================

async function main() {
  try {
    log('\n🚀 STARTING DATA EXTRACTION...', '🔄')
    
    // Ensure seeding/data directory exists
    const seedingDataDir = path.join(process.cwd(), 'seeding', 'data')
    await ensureDirectory(seedingDataDir)
    
    // Copy images and logos first
    copyImagesToSeeding()
    copyLogosToSeeding()
    
    // Extract all data
    const categories = await extractCategories()
    const subcategories = await extractSubcategories()
    const products = await extractProducts()
    const clients = await extractClients()
    const partners = await extractPartners()
    const customization = await extractCustomization()
    
    // Save to JSON files
    log('\n💾 SAVING DATA TO JSON FILES...', '📁')
    saveToJSON(path.join(seedingDataDir, 'categories.json'), categories)
    saveToJSON(path.join(seedingDataDir, 'subcategories.json'), subcategories)
    saveToJSON(path.join(seedingDataDir, 'products.json'), products)
    saveToJSON(path.join(seedingDataDir, 'clients.json'), clients)
    saveToJSON(path.join(seedingDataDir, 'partners.json'), partners)
    saveToJSON(path.join(seedingDataDir, 'customization.json'), customization)
    
    // Summary
    log('\n✨ EXTRACTION COMPLETE!', '✅')
    log(`\n📊 Summary:`, '📈')
    log(`   Categories: ${categories.length}`)
    log(`   Subcategories: ${subcategories.length}`)
    log(`   Products: ${products.length}`)
    log(`   Clients: ${clients.length}`)
    log(`   Partners: ${partners.length}`)
    log(`   Customization Settings: ${customization.length}`)
    log(`\n📁 Files saved to: ${seedingDataDir}`, '✅')
    log(`📁 Logos saved to: seeding/logos/`, '✅')
    
    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    log(`❌ Extraction failed: ${error}`, '💥')
    await prisma.$disconnect()
    process.exit(1)
  }
}

main()
