/**
 * Database Cleaner
 * Handles database cleanup operations for seeding
 */

import { PrismaClient } from '@prisma/client'
import { Logger } from '../utils'

export class DatabaseCleaner {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Clean all tables in the correct order (respecting foreign keys)
   */
  async cleanDatabase(): Promise<void> {
    Logger.section('🧹 CLEANING DATABASE')
    Logger.warning('This will delete all data from the database!')

    try {
      // Delete in reverse dependency order
      const tables = [
        'RentalItem',
        'Rental',
        'Product',
        'Subcategory',
        'Category',
        'CatalogInquiry',
        'CatalogShare',
        'CloudFile',
        'CloudFolder',
        'CloudStorage',
        'Partner',
        'Client',
        'NotificationPreference',
        'Notification',
        'CustomizationSettings',
        'TranslationCache',
        'User'
      ]

      Logger.info(`Deleting data from ${tables.length} tables...`)
      Logger.increaseIndent()

      for (const table of tables) {
        try {
          const result = await this.deleteFromTable(table)
          if (result.count > 0) {
            Logger.success(`Deleted ${result.count} records from ${table}`)
          } else {
            Logger.debug(`No records in ${table}`)
          }
        } catch (error: any) {
          // Ignore errors for tables that might not exist
          if (error.code !== 'P2021') { // P2021 = table does not exist
            Logger.warning(`Could not clean ${table}: ${error.message}`)
          }
        }
      }

      Logger.decreaseIndent()
      Logger.success('Database cleaned successfully')
    } catch (error) {
      Logger.error('Failed to clean database', error as Error)
      throw error
    }
  }

  /**
   * Delete all records from a specific table
   */
  private async deleteFromTable(tableName: string): Promise<{ count: number }> {
    // Use Prisma's deleteMany
    const model = (this.prisma as any)[this.toCamelCase(tableName)]
    
    if (!model || !model.deleteMany) {
      Logger.debug(`Skipping ${tableName} (not found in Prisma client)`)
      return { count: 0 }
    }

    return model.deleteMany({})
  }

  /**
   * Convert table name to camelCase for Prisma models
   */
  private toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1)
  }

  /**
   * Clean specific tables only
   */
  async cleanTables(tables: string[]): Promise<void> {
    Logger.subsection(`Cleaning ${tables.length} tables`)

    for (const table of tables) {
      try {
        const result = await this.deleteFromTable(table)
        Logger.success(`Cleaned ${table}: ${result.count} records deleted`)
      } catch (error) {
        Logger.error(`Failed to clean ${table}`, error as Error)
      }
    }
  }

  /**
   * Get record counts for all tables
   */
  async getTableCounts(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {}

    try {
      counts.users = await this.prisma.user.count()
      counts.clients = await this.prisma.client.count()
      counts.categories = await this.prisma.category.count()
      counts.equipment = await this.prisma.equipmentItem.count()
      counts.rentals = await this.prisma.rental.count()
      
      Logger.debug('Table counts:', counts)
    } catch (error) {
      Logger.error('Failed to get table counts', error as Error)
    }

    return counts
  }
}

export default DatabaseCleaner
