import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function upsertUser({ name, username, password, role, isActive = true }) {
  const hash = await bcrypt.hash(password, 12)
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    console.log(`  ℹ️  User '${username}' already exists, skipping...`)
    return existing
  }
  const user = await prisma.user.create({ data: { name, username, password: hash, role, isActive } })
  console.log(`  ✅ Created user: ${username} (${role})`)
  return user
}

async function main() {
  console.log('🌱 Starting database seed...')
  
  try {
    // Create admin user
    const admin = await upsertUser({ 
      name: 'Feliciano', 
      username: 'feliciano', 
      password: 'superfeliz99', 
      role: 'Admin' 
    })

    // Create manager user
    const manager = await upsertUser({ 
      name: 'Lourenço', 
      username: 'lourenco', 
      password: 'lourenco123', 
      role: 'Manager' 
    })

    // Create default customization settings (idempotent with upsert)
    const settings = await prisma.customizationSettings.upsert({
      where: { id: 'default-settings' },
      update: { updatedBy: admin.id },
      create: {
        id: 'default-settings',
        companyName: 'Acrobaticz AV Rentals',
        systemName: 'AV Rentals',
        language: 'pt',
        updatedBy: admin.id,
      },
    })
    console.log('  ✅ Customization settings upserted')

    console.log('\n✨ Seed complete!')
    return { admin: { username: admin.username }, manager: { username: manager.username } }
  } catch (error) {
    console.error('❌ Seed error:', error)
    throw error
  }
}

main()
  .then(async (result) => {
    console.log('✅ Seed successful:', result)
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
