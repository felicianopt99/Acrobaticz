import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface DatabaseBackup {
  exportDate: string
  users: any[]
  clients: any[]
  partners: any[]
  categories: any[]
  subcategories: any[]
  equipmentItems: any[]
  services: any[]
  fees: any[]
  events: any[]
  quotes: any[]
  quoteItems: any[]
  rentals: any[]
  subrentals: any[]
  maintenanceLogs: any[]
}

async function exportDatabase(): Promise<DatabaseBackup> {
  console.log('📊 Exporting database backup...\n')

  try {
    // Export all data
    const [
      users,
      clients,
      partners,
      categories,
      subcategories,
      equipmentItems,
      services,
      fees,
      events,
      quotes,
      quoteItems,
      rentals,
      subrentals,
      maintenanceLogs
    ] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          password: true,
          role: true,
          isActive: true,
          contactEmail: true,
          contactPhone: true
        }
      }),
      prisma.client.findMany({
        include: {
          _count: { select: { events: true, quotes: true } }
        }
      }),
      prisma.partner.findMany({
        include: {
          client: true,
          _count: { select: { subrentals: true } }
        }
      }),
      prisma.category.findMany(),
      prisma.subcategory.findMany(),
      prisma.equipmentItem.findMany({
        include: {
          category: true,
          subcategory: true,
          maintenanceLogs: true
        }
      }),
      prisma.service.findMany(),
      prisma.fee.findMany(),
      prisma.event.findMany({
        include: {
          client: true,
          rentals: true,
          _count: { select: { rentals: true } }
        }
      }),
      prisma.quote.findMany({
        include: {
          client: true,
          items: true,
          _count: { select: { items: true } }
        }
      }),
      prisma.quoteItem.findMany({
        include: {
          equipment: true,
          quote: true
        }
      }),
      prisma.rental.findMany({
        include: {
          event: true,
          equipment: true
        }
      }),
      prisma.subrental.findMany({
        include: {
          partner: true,
          event: true
        }
      }),
      prisma.maintenanceLog.findMany({
        include: {
          equipment: true
        }
      })
    ])

    const backup: DatabaseBackup = {
      exportDate: new Date().toISOString(),
      users,
      clients,
      partners,
      categories,
      subcategories,
      equipmentItems,
      services,
      fees,
      events,
      quotes,
      quoteItems,
      rentals,
      subrentals,
      maintenanceLogs
    }

    // Log statistics
    console.log('✅ Database Export Statistics:')
    console.log(`   • Users: ${users.length}`)
    console.log(`   • Clients: ${clients.length}`)
    console.log(`   • Partners: ${partners.length}`)
    console.log(`   • Categories: ${categories.length}`)
    console.log(`   • Subcategories: ${subcategories.length}`)
    console.log(`   • Equipment Items: ${equipmentItems.length}`)
    console.log(`   • Services: ${services.length}`)
    console.log(`   • Fees: ${fees.length}`)
    console.log(`   • Events: ${events.length}`)
    console.log(`   • Quotes: ${quotes.length}`)
    console.log(`   • Quote Items: ${quoteItems.length}`)
    console.log(`   • Rentals: ${rentals.length}`)
    console.log(`   • Subrentals: ${subrentals.length}`)
    console.log(`   • Maintenance Logs: ${maintenanceLogs.length}`)

    return backup
  } catch (error) {
    console.error('❌ Error exporting database:', error)
    throw error
  }
}

async function saveBackupFile(backup: DatabaseBackup, filename: string = 'database-backup.json') {
  const backupDir = path.join(process.cwd(), 'scripts', 'backups')
  
  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const filepath = path.join(backupDir, filename)
  
  fs.writeFileSync(
    filepath,
    JSON.stringify(backup, null, 2),
    'utf-8'
  )

  console.log(`\n📁 Backup saved to: ${filepath}`)
  return filepath
}

async function main() {
  try {
    console.log('🌱 DATABASE BACKUP EXPORT TOOL')
    console.log('='.repeat(50))
    console.log()

    // Export data
    const backup = await exportDatabase()

    // Save to file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const filename = `database-backup-${timestamp}.json`
    const filepath = await saveBackupFile(backup, filename)

    // Also save as latest
    await saveBackupFile(backup, 'database-backup-latest.json')

    console.log(`\n✨ Export completed successfully!`)
    console.log(`Total backup size: ${(JSON.stringify(backup).length / 1024 / 1024).toFixed(2)} MB`)

  } catch (error) {
    console.error('❌ Export failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
