/**
 * Seeding Orchestrator
 * Main coordinator for all seeding operations
 */

import { PrismaClient } from '@prisma/client'
import { Logger } from '../utils'
import { DatabaseCleaner } from './database-cleaner'
import { SeedingConfig } from './config'
import {
  UserLoader,
  CategoryLoader,
  ClientLoader,
  ProductLoader,
  CustomizationLoader
} from '../data-loaders'

export class SeedingOrchestrator {
  private prisma: PrismaClient
  private config: SeedingConfig
  private cleaner: DatabaseCleaner
  private adminUserId?: string

  constructor(config: SeedingConfig) {
    this.prisma = new PrismaClient()
    this.config = config
    this.cleaner = new DatabaseCleaner(this.prisma)
  }

  /**
   * Execute the full seeding process
   */
  async execute(): Promise<void> {
    const startTime = Date.now()

    try {
      await this.prisma.$connect()
      Logger.section('🌱 STARTING DATABASE SEEDING')
      this.printConfig()

      if (this.config.dryRun) {
        Logger.warning('DRY RUN MODE - No changes will be made')
      }

      // Step 1: Clean database if requested
      if (this.config.cleanDatabase && !this.config.dryRun) {
        await this.cleaner.cleanDatabase()
      }

      // Step 2: Seed users (required for other operations)
      if (this.config.seedUsers) {
        await this.seedUsers()
      }

      // Step 3: Seed categories
      if (this.config.seedCategories) {
        await this.seedCategories()
      }

      // Step 4: Seed clients
      if (this.config.seedClients) {
        await this.seedClients()
      }

      // Step 5: Seed products
      if (this.config.seedProducts) {
        await this.seedProducts()
      }

      // Step 6: Seed customization
      if (this.config.seedCustomization) {
        await this.seedCustomization()
      }

      // Report final statistics
      await this.reportStatistics()

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      Logger.section(`✨ SEEDING COMPLETED IN ${duration}s`)
    } catch (error) {
      Logger.error('Seeding failed', error as Error)
      throw error
    } finally {
      await this.prisma.$disconnect()
    }
  }

  /**
   * Seed users
   */
  private async seedUsers(): Promise<void> {
    const loader = new UserLoader(this.prisma)

    if (this.config.useDefaultData) {
      const users = UserLoader.getDefaultUsers()
      const result = await loader.seedUsers(users)
      
      // Store admin user ID for later use
      if (result.length > 0) {
        this.adminUserId = result[0].id
      }
    } else {
      // Always create default admin
      const defaultUsers = UserLoader.getDefaultUsers()
      const result = await loader.seedUsers(defaultUsers)
      
      if (result.length > 0) {
        this.adminUserId = result[0].id
      }
    }
  }

  /**
   * Seed categories
   */
  private async seedCategories(): Promise<void> {
    const loader = new CategoryLoader(this.prisma)

    if (this.config.useJSONData) {
      await loader.seedFromJSON()
    } else {
      const categories = CategoryLoader.getDefaultCategories()
      await loader.seedCategories(categories)
    }
  }

  /**
   * Seed clients
   */
  private async seedClients(): Promise<void> {
    const loader = new ClientLoader(this.prisma)

    if (this.config.useJSONData) {
      await loader.seedFromJSON()
    }
  }

  /**
   * Seed products
   */
  private async seedProducts(): Promise<void> {
    const loader = new ProductLoader(this.prisma)

    if (this.config.useJSONData) {
      await loader.seedFromJSON()
    }
  }

  /**
   * Seed customization settings
   */
  private async seedCustomization(): Promise<void> {
    if (!this.adminUserId) {
      Logger.warning('No admin user found, skipping customization')
      return
    }

    const loader = new CustomizationLoader(this.prisma)

    if (this.config.useJSONData) {
      await loader.seedFromJSON(this.adminUserId)
    } else {
      const defaults = CustomizationLoader.getDefaultCustomization()
      await loader.seedCustomization(defaults, this.adminUserId)
    }
  }

  /**
   * Print current configuration
   */
  private printConfig(): void {
    Logger.subsection('Configuration')
    Logger.increaseIndent()
    Logger.info(`Clean Database: ${this.config.cleanDatabase}`)
    Logger.info(`Verbose Mode: ${this.config.verbose}`)
    Logger.info(`Dry Run: ${this.config.dryRun}`)
    Logger.info(`Use JSON Data: ${this.config.useJSONData}`)
    Logger.info(`Use Default Data: ${this.config.useDefaultData}`)
    Logger.decreaseIndent()
  }

  /**
   * Report final statistics
   */
  private async reportStatistics(): Promise<void> {
    Logger.section('📊 FINAL STATISTICS')

    try {
      const counts = await this.cleaner.getTableCounts()

      Logger.increaseIndent()
      Logger.info(`Users: ${counts.users || 0}`)
      Logger.info(`Clients: ${counts.clients || 0}`)
      Logger.info(`Categories: ${counts.categories || 0}`)
      Logger.info(`Products: ${counts.products || 0}`)
      Logger.info(`Rentals: ${counts.rentals || 0}`)
      Logger.decreaseIndent()
    } catch (error) {
      Logger.warning('Could not generate statistics')
    }
  }
}

export default SeedingOrchestrator
