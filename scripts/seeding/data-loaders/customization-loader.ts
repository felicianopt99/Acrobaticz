/**
 * Customization Settings Data Loader
 * Handles seeding of system customization settings
 */

import { PrismaClient } from '@prisma/client'
import { Logger, FileLoader } from '../utils'

interface CustomizationData {
  companyName?: string
  systemName?: string
  language?: string
  currency?: string
  timezone?: string
  useTextLogo?: boolean
  pdfUseTextLogo?: boolean
  logoUrl?: string
  pdfLogoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
}

export class CustomizationLoader {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Seed customization settings
   */
  async seedCustomization(data: CustomizationData, updatedBy: string): Promise<any> {
    Logger.subsection('Seeding Customization Settings')

    try {
      const settings = await this.prisma.customizationSettings.upsert({
        where: { id: 'default-settings' },
        update: {
          ...data,
          updatedBy
        },
        create: {
          id: 'default-settings',
          companyName: data.companyName || 'AV Rentals',
          systemName: data.systemName || 'AV Rental System',
          language: data.language || 'pt',
          currency: data.currency || 'EUR',
          timezone: data.timezone || 'Europe/Lisbon',
          useTextLogo: data.useTextLogo !== undefined ? data.useTextLogo : true,
          pdfUseTextLogo: data.pdfUseTextLogo !== undefined ? data.pdfUseTextLogo : true,
          logoUrl: data.logoUrl || '',
          pdfLogoUrl: data.pdfLogoUrl || '',
          primaryColor: data.primaryColor || '#3B82F6',
          secondaryColor: data.secondaryColor || '#8B5CF6',
          accentColor: data.accentColor || '#10B981',
          updatedBy
        }
      })

      Logger.success('Customization settings configured')
      return settings
    } catch (error) {
      Logger.error('Failed to seed customization settings', error as Error)
      return null
    }
  }

  /**
   * Seed from JSON file
   */
  async seedFromJSON(updatedBy: string): Promise<any> {
    const data = FileLoader.loadJSON<CustomizationData>('customization.json')
    
    if (!data) {
      Logger.warning('No customization data found, using defaults')
      return this.seedCustomization({}, updatedBy)
    }

    return this.seedCustomization(data, updatedBy)
  }

  /**
   * Get default customization
   */
  static getDefaultCustomization(): CustomizationData {
    return {
      companyName: 'Acrobaticz AV Rentals',
      systemName: 'AV Rentals Pro',
      language: 'pt',
      currency: 'EUR',
      timezone: 'Europe/Lisbon',
      useTextLogo: true,
      pdfUseTextLogo: true,
      primaryColor: '#3B82F6',
      secondaryColor: '#8B5CF6',
      accentColor: '#10B981'
    }
  }
}

export default CustomizationLoader
