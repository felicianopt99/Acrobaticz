import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'

// Load secrets from Docker secrets if available
function getSecret(name) {
  try {
    return fs.readFileSync(`/run/secrets/${name}`, 'utf8').trim()
  } catch {
    return process.env[name.toUpperCase()] || ''
  }
}

// Construct DATABASE_URL if not already set
if (!process.env.DATABASE_URL) {
  const dbUser = getSecret('db_user')
  const dbPassword = getSecret('db_password')
  const dbName = getSecret('db_name')
  const dbHost = process.env.DB_HOST || 'postgres'
  
  if (dbUser && dbPassword && dbName) {
    process.env.DATABASE_URL = `postgresql://${dbUser}:${dbPassword}@${dbHost}:5432/${dbName}`
  }
}

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    const username = 'Feliciano'
    const password = 'superfeliz99'
    const role = 'admin'

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      console.log(`User "${username}" already exists. Updating password and role...`)
      const hash = await bcrypt.hash(password, 12)
      const updated = await prisma.user.update({
        where: { username },
        data: { password: hash, role, isActive: true }
      })
      console.log(`✓ User "${username}" updated with admin role`)
      console.log(`User ID: ${updated.id}`)
      return
    }

    // Create new user
    const hash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        name: 'Feliciano',
        username,
        password: hash,
        role,
        isActive: true
      }
    })

    console.log(`✓ Admin user created successfully!`)
    console.log(`Username: ${user.username}`)
    console.log(`Role: ${user.role}`)
    console.log(`User ID: ${user.id}`)
    console.log(`Created at: ${user.createdAt}`)

  } catch (error) {
    console.error('Error creating admin user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
