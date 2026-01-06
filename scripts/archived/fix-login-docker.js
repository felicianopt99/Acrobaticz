#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

// Read secrets and construct DATABASE_URL (same as docker-entrypoint.sh)
function urlencode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
}

const secretsPath = '/run/secrets'
const dbUser = fs.readFileSync(path.join(secretsPath, 'db_user'), 'utf8').trim()
const dbPassword = fs.readFileSync(path.join(secretsPath, 'db_password'), 'utf8').trim()
const dbName = fs.readFileSync(path.join(secretsPath, 'db_name'), 'utf8').trim()

const encodedPassword = urlencode(dbPassword)
process.env.DATABASE_URL = `postgresql://${dbUser}:${encodedPassword}@postgres:5432/${dbName}?schema=public`

console.log('DATABASE_URL set for connection to postgres database')

const prisma = new PrismaClient()

async function fixUserLogin() {
  try {
    console.log('\n=== Fixing User Credentials ===\n')
    
    const username = 'feliciano'
    const password = 'superfelicio99'
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { username }
    })
    
    if (user) {
      console.log(`User "${username}" already exists. Updating password...`)
      const hash = await bcrypt.hash(password, 12)
      user = await prisma.user.update({
        where: { username },
        data: { 
          password: hash,
          isActive: true,
          role: 'Admin'
        }
      })
      console.log(`✓ User "${username}" password updated!`)
    } else {
      console.log(`Creating user "${username}"...`)
      const hash = await bcrypt.hash(password, 12)
      user = await prisma.user.create({
        data: {
          name: 'Feliciano',
          username,
          password: hash,
          role: 'Admin',
          isActive: true
        }
      })
      console.log(`✓ User "${username}" created!`)
    }
    
    console.log(`\nUser Details:`)
    console.log(`  Username: ${user.username}`)
    console.log(`  Password: ${password}`)
    console.log(`  Role: ${user.role}`)
    console.log(`  Active: ${user.isActive}`)
    console.log(`\nYou can now login with these credentials.`)
    
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixUserLogin()
