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

// ==============================================================================
// MAIN EXTRACTION
// ==============================================================================

async function main() {
  try {
    log('\n🚀 STARTING DATA EXTRACTION...', '🔄')
    
    // Ensure seeding/data directory exists
    const seedingDataDir = path.join(process.cwd(), 'seeding', 'data')
    await ensureDirectory(seedingDataDir)
    
    // Copy images first
    copyImagesToSeeding()
    
    // Extract all data
    const categories = await extractCategories()
    const subcategories = await extractSubcategories()
    const products = await extractProducts()
    const clients = await extractClients()
    const partners = await extractPartners()
    
    // Save to JSON files
    log('\n💾 SAVING DATA TO JSON FILES...', '📁')
    saveToJSON(path.join(seedingDataDir, 'categories.json'), categories)
    saveToJSON(path.join(seedingDataDir, 'subcategories.json'), subcategories)
    saveToJSON(path.join(seedingDataDir, 'products.json'), products)
    saveToJSON(path.join(seedingDataDir, 'clients.json'), clients)
    saveToJSON(path.join(seedingDataDir, 'partners.json'), partners)
    
    // Summary
    log('\n✨ EXTRACTION COMPLETE!', '✅')
    log(`\n📊 Summary:`, '📈')
    log(`   Categories: ${categories.length}`)
    log(`   Subcategories: ${subcategories.length}`)
    log(`   Products: ${products.length}`)
    log(`   Clients: ${clients.length}`)
    log(`   Partners: ${partners.length}`)
    log(`\n📁 Files saved to: ${seedingDataDir}`, '✅')
    
    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    log(`❌ Extraction failed: ${error}`, '💥')
    await prisma.$disconnect()
    process.exit(1)
  }
}

main()
