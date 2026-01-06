/**
 * Category Data Loader
 * Handles seeding of equipment categories
 */

import { PrismaClient } from '@prisma/client'
import { Logger, Validator, FileLoader } from '../utils'

interface CategoryData {
  name: string
  icon?: string
  description?: string
}

export class CategoryLoader {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Validate category data
   */
  private validateCategory(category: CategoryData): boolean {
    const result = Validator.validateRequiredFields(
      category,
      ['name'],
      'Category'
    )

    if (!result.isValid) {
      Validator.logValidationErrors(result.errors, category.name)
      return false
    }

    return true
  }

  /**
   * Seed a single category
   */
  async seedCategory(categoryData: CategoryData): Promise<any | null> {
    if (!this.validateCategory(categoryData)) {
      return null
    }

    try {
      // Check if category already exists
      const existing = await this.prisma.category.findFirst({
        where: { name: categoryData.name }
      })

      if (existing) {
        Logger.info(`Category '${categoryData.name}' already exists`)
        return existing
      }

      // Create category
      const category = await this.prisma.category.create({
        data: {
          name: categoryData.name,
          icon: categoryData.icon || '📦',
          description: categoryData.description
        }
      })

      Logger.success(`Created category: ${categoryData.name}`)
      return category
    } catch (error) {
      Logger.error(`Failed to create category ${categoryData.name}`, error as Error)
      return null
    }
  }

  /**
   * Seed multiple categories
   */
  async seedCategories(categories: CategoryData[]): Promise<any[]> {
    Logger.subsection('Seeding Categories')
    Logger.info(`Processing ${categories.length} categories...`)
    
    const createdCategories: any[] = []
    
    for (let i = 0; i < categories.length; i++) {
      const category = await this.seedCategory(categories[i])
      if (category) {
        createdCategories.push(category)
      }
      Logger.progress(i + 1, categories.length, categories[i].name)
    }
    
    Logger.success(`Successfully seeded ${createdCategories.length}/${categories.length} categories`)
    return createdCategories
  }

  /**
   * Seed categories from JSON file
   */
  async seedFromJSON(): Promise<any[]> {
    const data = FileLoader.loadJSON<CategoryData[]>('categories.json')
    
    if (!data || data.length === 0) {
      Logger.warning('No category data found in JSON file')
      return this.seedCategories(CategoryLoader.getDefaultCategories())
    }

    return this.seedCategories(data)
  }

  /**
   * Get default categories
   */
  static getDefaultCategories(): CategoryData[] {
    return [
      { name: 'Audio', icon: '🔊', description: 'Audio equipment and sound systems' },
      { name: 'Video', icon: '📹', description: 'Video recording and projection equipment' },
      { name: 'Lighting', icon: '💡', description: 'Stage and event lighting systems' },
      { name: 'Rigging', icon: '🪝', description: 'Rigging and mounting equipment' },
      { name: 'Staging', icon: '🎭', description: 'Stage platforms and structures' },
      { name: 'Power', icon: '⚡', description: 'Power distribution and generators' },
      { name: 'Communication', icon: '📡', description: 'Communication systems and radios' }
    ]
  }
}

export default CategoryLoader
