#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function fixPassword() {
  try {
    console.log('🔐 Fixing feliciano password...\n')
    
    const password = 'superfeliz99'
    const hash = await bcrypt.hash(password, 12)
    
    console.log('✓ Generated hash:', hash)
    
    const user = await prisma.user.update({
      where: { username: 'feliciano' },
      data: { 
        password: hash,
        isActive: true,
        role: 'Admin'
      }
    })
    
    console.log('\n✅ User updated successfully!')
    console.log('   Username:', user.username)
    console.log('   Role:', user.role)
    console.log('   Active:', user.isActive)
    console.log('   Name:', user.name)
    
    // Verify it works
    const isValid = await bcrypt.compare(password, hash)
    console.log('\n✓ Password verification:', isValid ? '✅ PASSED' : '❌ FAILED')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    process.exit(0)
  }
}

fixPassword()
