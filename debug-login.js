#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function debug() {
  try {
    console.log('\n=== Checking Database Users ===\n')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true
      }
    })
    
    console.log(`Found ${users.length} user(s):`)
    users.forEach(u => {
      console.log(`  - ${u.username} (${u.name}) - Role: ${u.role} - Active: ${u.isActive}`)
    })
    
    console.log('\n=== Testing Password ===\n')
    
    // Test with the correct password
    const testPassword = 'superfeliz99'
    const hash = await bcrypt.hash(testPassword, 12)
    console.log(`Example hash for "superfeliz99": ${hash.substring(0, 30)}...`)
    
    console.log('\n=== Login Issue ===\n')
    console.log('You attempted: username="feliciano", password="superfelicio99"')
    console.log('Correct should be: username="Feliciano", password="superfeliz99"')
    console.log('\nNote: Usernames are case-sensitive in this system')
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

debug()
