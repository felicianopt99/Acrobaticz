import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

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

function log(message: string, emoji = '📝') {
  console.log(`${emoji} ${message}`)
}

async function loadBackupFile(filename: string = 'database-backup-latest.json'): Promise<DatabaseBackup> {
  const backupPath = path.join(process.cwd(), 'scripts', 'backups', filename)

  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`)
  }

  const content = fs.readFileSync(backupPath, 'utf-8')
  return JSON.parse(content)
}

async function restoreDatabase(backup: DatabaseBackup, shouldClean: boolean = true) {
  log('Starting database restore...', '🔄')

  try {
    if (shouldClean) {
      log('Cleaning existing data...', '🧹')
      // Delete in reverse dependency order
      await prisma.fileActivity.deleteMany({})
      await prisma.fileTag.deleteMany({})
      await prisma.folderTag.deleteMany({})
      await prisma.fileVersion.deleteMany({})
      await prisma.fileShare.deleteMany({})
      await prisma.folderShare.deleteMany({})
      await prisma.catalogShareInquiry.deleteMany({})
      await prisma.catalogShare.deleteMany({})
      await prisma.cloudFile.deleteMany({})
      await prisma.cloudFolder.deleteMany({})
      await prisma.maintenanceLog.deleteMany({})
      await prisma.quoteItem.deleteMany({})
      await prisma.quote.deleteMany({})
      await prisma.rental.deleteMany({})
      await prisma.subrental.deleteMany({})
      await prisma.jobReference.deleteMany({})
      await prisma.eventSubClient.deleteMany({})
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
      await prisma.user.deleteMany({})
      log('Database cleaned', '✅')
    }

    // Restore Users (with password hashing)
    log(`Restoring ${backup.users.length} users...`, '👥')
    const userMap: Record<string, string> = {}
    for (const userData of backup.users) {
      const hashedPassword = await bcrypt.hash(userData.password.substring(0, 20), 12)
      const user = await prisma.user.create({
        data: {
          id: userData.id,
          name: userData.name,
          username: userData.username,
          password: hashedPassword,
          role: userData.role,
          isActive: userData.isActive,
          contactEmail: userData.contactEmail,
          contactPhone: userData.contactPhone
        }
      })
      userMap[userData.id] = user.id
      log(`Created user: ${userData.username}`, '✅')
    }

    // Restore Categories
    log(`Restoring ${backup.categories.length} categories...`, '📂')
    const categoryMap: Record<string, string> = {}
    for (const catData of backup.categories) {
      const cat = await prisma.category.create({
        data: {
          id: catData.id,
          name: catData.name,
          icon: catData.icon
        }
      })
      categoryMap[catData.id] = cat.id
      log(`Created category: ${catData.name}`, '✅')
    }

    // Restore Subcategories
    log(`Restoring ${backup.subcategories.length} subcategories...`, '📁')
    const subcategoryMap: Record<string, string> = {}
    for (const subcatData of backup.subcategories) {
      const subcat = await prisma.subcategory.create({
        data: {
          id: subcatData.id,
          name: subcatData.name,
          parentId: categoryMap[subcatData.parentId] || subcatData.parentId
        }
      })
      subcategoryMap[subcatData.id] = subcat.id
      log(`Created subcategory: ${subcatData.name}`, '✅')
    }

    // Restore Equipment Items
    log(`Restoring ${backup.equipmentItems.length} equipment items...`, '🛠️')
    const equipmentMap: Record<string, string> = {}
    for (const eqData of backup.equipmentItems) {
      const eq = await prisma.equipmentItem.create({
        data: {
          id: eqData.id,
          name: eqData.name,
          description: eqData.description,
          descriptionPt: eqData.descriptionPt,
          categoryId: categoryMap[eqData.categoryId] || eqData.categoryId,
          subcategoryId: eqData.subcategoryId ? subcategoryMap[eqData.subcategoryId] : undefined,
          quantity: eqData.quantity,
          status: eqData.status,
          location: eqData.location,
          imageUrl: eqData.imageUrl,
          dailyRate: eqData.dailyRate,
          type: eqData.type
        }
      })
      equipmentMap[eqData.id] = eq.id
      log(`Created equipment: ${eqData.name}`, '✅')
    }

    // Restore Services
    log(`Restoring ${backup.services.length} services...`, '⚙️')
    const serviceMap: Record<string, string> = {}
    for (const svcData of backup.services) {
      const svc = await prisma.service.create({
        data: {
          id: svcData.id,
          name: svcData.name,
          description: svcData.description,
          unitPrice: svcData.unitPrice,
          unit: svcData.unit,
          category: svcData.category,
          isActive: svcData.isActive
        }
      })
      serviceMap[svcData.id] = svc.id
      log(`Created service: ${svcData.name}`, '✅')
    }

    // Restore Fees
    log(`Restoring ${backup.fees.length} fees...`, '💰')
    const feeMap: Record<string, string> = {}
    for (const feeData of backup.fees) {
      const fee = await prisma.fee.create({
        data: {
          id: feeData.id,
          name: feeData.name,
          description: feeData.description,
          amount: feeData.amount,
          type: feeData.type,
          category: feeData.category,
          isActive: feeData.isActive
        }
      })
      feeMap[feeData.id] = fee.id
      log(`Created fee: ${feeData.name}`, '✅')
    }

    // Restore Clients
    log(`Restoring ${backup.clients.length} clients...`, '🏢')
    const clientMap: Record<string, string> = {}
    for (const clientData of backup.clients) {
      const client = await prisma.client.create({
        data: {
          id: clientData.id,
          name: clientData.name,
          contactPerson: clientData.contactPerson,
          email: clientData.email,
          phone: clientData.phone,
          address: clientData.address,
          notes: clientData.notes,
          partnerId: clientData.partnerId
        }
      })
      clientMap[clientData.id] = client.id
      log(`Created client: ${clientData.name}`, '✅')
    }

    // Restore Partners
    log(`Restoring ${backup.partners.length} partners...`, '🤝')
    const partnerMap: Record<string, string> = {}
    for (const partnerData of backup.partners) {
      const partner = await prisma.partner.create({
        data: {
          id: partnerData.id,
          name: partnerData.name,
          companyName: partnerData.companyName,
          contactPerson: partnerData.contactPerson,
          email: partnerData.email,
          phone: partnerData.phone,
          address: partnerData.address,
          website: partnerData.website,
          notes: partnerData.notes,
          clientId: partnerData.clientId ? clientMap[partnerData.clientId] : undefined,
          partnerType: partnerData.partnerType,
          commission: partnerData.commission,
          isActive: partnerData.isActive,
          logoUrl: partnerData.logoUrl
        }
      })
      partnerMap[partnerData.id] = partner.id
      log(`Created partner: ${partnerData.name}`, '✅')
    }

    // Restore Events
    log(`Restoring ${backup.events.length} events...`, '📅')
    const eventMap: Record<string, string> = {}
    for (const eventData of backup.events) {
      const event = await prisma.event.create({
        data: {
          id: eventData.id,
          name: eventData.name,
          clientId: clientMap[eventData.clientId] || eventData.clientId,
          location: eventData.location,
          startDate: new Date(eventData.startDate),
          endDate: new Date(eventData.endDate),
          agencyId: eventData.agencyId ? partnerMap[eventData.agencyId] : undefined,
          assignedTo: eventData.assignedTo
        }
      })
      eventMap[eventData.id] = event.id
      log(`Created event: ${eventData.name}`, '✅')
    }

    // Restore Rentals
    log(`Restoring ${backup.rentals.length} rentals...`, '🚚')
    for (const rentalData of backup.rentals) {
      await prisma.rental.create({
        data: {
          id: rentalData.id,
          eventId: eventMap[rentalData.eventId] || rentalData.eventId,
          equipmentId: equipmentMap[rentalData.equipmentId] || rentalData.equipmentId,
          quantityRented: rentalData.quantityRented,
          prepStatus: rentalData.prepStatus
        }
      })
      log(`Created rental for equipment`, '✅')
    }

    // Restore Subrentals
    log(`Restoring ${backup.subrentals.length} subrentals...`, '🔄')
    for (const subrental of backup.subrentals) {
      await prisma.subrental.create({
        data: {
          id: subrental.id,
          partnerId: partnerMap[subrental.partnerId] || subrental.partnerId,
          eventId: subrental.eventId ? eventMap[subrental.eventId] : undefined,
          equipmentName: subrental.equipmentName,
          equipmentDesc: subrental.equipmentDesc,
          quantity: subrental.quantity,
          dailyRate: subrental.dailyRate,
          totalCost: subrental.totalCost,
          startDate: new Date(subrental.startDate),
          endDate: new Date(subrental.endDate),
          status: subrental.status,
          invoiceNumber: subrental.invoiceNumber,
          notes: subrental.notes
        }
      })
      log(`Created subrental: ${subrental.equipmentName}`, '✅')
    }

    // Restore Quotes
    log(`Restoring ${backup.quotes.length} quotes...`, '📄')
    const quoteMap: Record<string, string> = {}
    for (const quoteData of backup.quotes) {
      const quote = await prisma.quote.create({
        data: {
          id: quoteData.id,
          quoteNumber: quoteData.quoteNumber,
          name: quoteData.name,
          location: quoteData.location,
          clientId: quoteData.clientId ? clientMap[quoteData.clientId] : undefined,
          clientName: quoteData.clientName,
          clientEmail: quoteData.clientEmail,
          clientPhone: quoteData.clientPhone,
          clientAddress: quoteData.clientAddress,
          startDate: new Date(quoteData.startDate),
          endDate: new Date(quoteData.endDate),
          subTotal: quoteData.subTotal,
          discountAmount: quoteData.discountAmount,
          discountType: quoteData.discountType,
          taxRate: quoteData.taxRate,
          taxAmount: quoteData.taxAmount,
          totalAmount: quoteData.totalAmount,
          status: quoteData.status,
          notes: quoteData.notes,
          terms: quoteData.terms
        }
      })
      quoteMap[quoteData.id] = quote.id
      log(`Created quote: ${quoteData.quoteNumber}`, '✅')
    }

    // Restore Quote Items
    log(`Restoring ${backup.quoteItems.length} quote items...`, '📋')
    for (const itemData of backup.quoteItems) {
      await prisma.quoteItem.create({
        data: {
          id: itemData.id,
          quoteId: quoteMap[itemData.quoteId] || itemData.quoteId,
          type: itemData.type,
          equipmentId: itemData.equipmentId ? equipmentMap[itemData.equipmentId] : undefined,
          equipmentName: itemData.equipmentName,
          serviceId: itemData.serviceId ? serviceMap[itemData.serviceId] : undefined,
          serviceName: itemData.serviceName,
          feeId: itemData.feeId ? feeMap[itemData.feeId] : undefined,
          feeName: itemData.feeName,
          amount: itemData.amount,
          feeType: itemData.feeType,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          days: itemData.days,
          lineTotal: itemData.lineTotal
        }
      })
      log(`Created quote item`, '✅')
    }

    // Restore Maintenance Logs
    log(`Restoring ${backup.maintenanceLogs.length} maintenance logs...`, '🔧')
    for (const logData of backup.maintenanceLogs) {
      await prisma.maintenanceLog.create({
        data: {
          id: logData.id,
          equipmentId: equipmentMap[logData.equipmentId] || logData.equipmentId,
          date: new Date(logData.date),
          description: logData.description,
          cost: logData.cost
        }
      })
      log(`Created maintenance log`, '✅')
    }

    log('Database restore completed successfully!', '✨')

  } catch (error) {
    console.error('❌ Error during restore:', error)
    throw error
  }
}

async function main() {
  const args = process.argv.slice(2)
  const backupFile = args[0] || 'database-backup-latest.json'
  const shouldClean = !args.includes('--no-clean')

  try {
    console.log('\n' + '='.repeat(60))
    console.log('🔄 DATABASE RESTORE FROM BACKUP')
    console.log('='.repeat(60))
    console.log()

    log(`Loading backup file: ${backupFile}`, '📂')
    const backup = await loadBackupFile(backupFile)
    
    log(`Backup exported at: ${backup.exportDate}`, 'ℹ️')
    console.log()

    await restoreDatabase(backup, shouldClean)

    console.log('\n' + '='.repeat(60))
    log('✨ Restore completed successfully!', '🎉')
    console.log('='.repeat(60) + '\n')

  } catch (error) {
    console.error('❌ Restore failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
