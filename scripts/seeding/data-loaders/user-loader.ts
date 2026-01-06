/**
 * User Data Loader
 * Handles seeding of user accounts
 */

import { PrismaClient } from '@prisma/client'
import { Logger, Validator, PasswordUtils } from '../utils'

interface UserData {
  name: string
  username: string
  password: string
  role: string
  contactEmail?: string
  contactPhone?: string
  isActive?: boolean
}

export class UserLoader {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Validate user data
   */
  private validateUser(user: UserData): boolean {
    const result = Validator.validateRequiredFields(
      user,
      ['name', 'username', 'password', 'role'],
      'User'
    )

    if (!result.isValid) {
      Validator.logValidationErrors(result.errors, user.username)
      return false
    }

    // Validate role
    const allowedRoles = ['Admin', 'Manager', 'Technician', 'Employee']
    const roleResult = Validator.validateEnum(user.role, allowedRoles, 'role')
    if (!roleResult.isValid) {
      Validator.logValidationErrors(roleResult.errors, user.username)
      return false
    }

    // Validate email if provided
    if (user.contactEmail && !Validator.validateEmail(user.contactEmail)) {
      Logger.error(`Invalid email for user ${user.username}: ${user.contactEmail}`)
      return false
    }

    // Validate phone if provided
    if (user.contactPhone && !Validator.validatePhone(user.contactPhone)) {
      Logger.error(`Invalid phone for user ${user.username}: ${user.contactPhone}`)
      return false
    }

    return true
  }

  /**
   * Seed a single user
   */
  async seedUser(userData: UserData): Promise<any | null> {
    if (!this.validateUser(userData)) {
      return null
    }

    try {
      // Check if user already exists
      const existing = await this.prisma.user.findUnique({
        where: { username: userData.username }
      })

      if (existing) {
        Logger.info(`User '${userData.username}' already exists`)
        return existing
      }

      // Hash password
      const hashedPassword = await PasswordUtils.hash(userData.password)

      // Create user
      const user = await this.prisma.user.create({
        data: {
          name: userData.name,
          username: userData.username,
          password: hashedPassword,
          role: userData.role,
          contactEmail: userData.contactEmail || '',
          contactPhone: userData.contactPhone || '',
          isActive: userData.isActive !== undefined ? userData.isActive : true
        }
      })

      Logger.success(`Created user: ${userData.username} (${userData.role})`)
      return user
    } catch (error) {
      Logger.error(`Failed to create user ${userData.username}`, error as Error)
      return null
    }
  }

  /**
   * Seed multiple users
   */
  async seedUsers(users: UserData[]): Promise<any[]> {
    Logger.subsection('Seeding Users')
    Logger.info(`Processing ${users.length} users...`)
    
    const createdUsers: any[] = []
    
    for (let i = 0; i < users.length; i++) {
      const user = await this.seedUser(users[i])
      if (user) {
        createdUsers.push(user)
      }
      Logger.progress(i + 1, users.length, users[i].username)
    }
    
    Logger.success(`Successfully seeded ${createdUsers.length}/${users.length} users`)
    return createdUsers
  }

  /**
   * Get default admin and manager users
   */
  static getDefaultUsers(): UserData[] {
    return [
      {
        name: 'Feliciano Admin',
        username: 'feliciano',
        password: 'superfeliz99',
        role: 'Admin',
        contactEmail: 'feliciano@acrobaticz.pt',
        contactPhone: '+351 900 000 001',
        isActive: true
      },
      {
        name: 'Lourenço Manager',
        username: 'lourenco',
        password: 'lourenco123',
        role: 'Manager',
        contactEmail: 'lourenco@acrobaticz.pt',
        contactPhone: '+351 900 000 002',
        isActive: true
      }
    ]
  }
}

export default UserLoader
