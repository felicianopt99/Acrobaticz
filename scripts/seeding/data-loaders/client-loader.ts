/**
 * Client Data Loader
 * Handles seeding of client records
 */

import { PrismaClient } from '@prisma/client'
import { Logger, Validator, FileLoader } from '../utils'

interface ClientData {
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  taxId?: string
}

export class ClientLoader {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Validate client data
   */
  private validateClient(client: ClientData): boolean {
    const result = Validator.validateRequiredFields(
      client,
      ['name'],
      'Client'
    )

    if (!result.isValid) {
      Validator.logValidationErrors(result.errors, client.name)
      return false
    }

    // Validate email if provided
    if (client.email && !Validator.validateEmail(client.email)) {
      Logger.error(`Invalid email for client ${client.name}: ${client.email}`)
      return false
    }

    // Validate phone if provided
    if (client.phone && !Validator.validatePhone(client.phone)) {
      Logger.warning(`Questionable phone format for client ${client.name}: ${client.phone}`)
      // Don't fail on phone validation, just warn
    }

    return true
  }

  /**
   * Seed a single client
   */
  async seedClient(clientData: ClientData): Promise<any | null> {
    if (!this.validateClient(clientData)) {
      return null
    }

    try {
      // Check if client already exists
      const existing = await this.prisma.client.findFirst({
        where: { name: clientData.name }
      })

      if (existing) {
        Logger.info(`Client '${clientData.name}' already exists`)
        return existing
      }

      // Create client
      const client = await this.prisma.client.create({
        data: {
          name: clientData.name,
          contactPerson: clientData.contactPerson || '',
          email: clientData.email || '',
          phone: clientData.phone || '',
          address: clientData.address || '',
          notes: clientData.notes || '',
          taxId: clientData.taxId || ''
        }
      })

      Logger.success(`Created client: ${clientData.name}`)
      return client
    } catch (error) {
      Logger.error(`Failed to create client ${clientData.name}`, error as Error)
      return null
    }
  }

  /**
   * Seed multiple clients
   */
  async seedClients(clients: ClientData[]): Promise<any[]> {
    Logger.subsection('Seeding Clients')
    Logger.info(`Processing ${clients.length} clients...`)
    
    const createdClients: any[] = []
    
    for (let i = 0; i < clients.length; i++) {
      const client = await this.seedClient(clients[i])
      if (client) {
        createdClients.push(client)
      }
      Logger.progress(i + 1, clients.length, clients[i].name)
    }
    
    Logger.success(`Successfully seeded ${createdClients.length}/${clients.length} clients`)
    return createdClients
  }

  /**
   * Seed clients from JSON file
   */
  async seedFromJSON(): Promise<any[]> {
    const data = FileLoader.loadJSON<ClientData[]>('clients.json')
    
    if (!data || data.length === 0) {
      Logger.warning('No client data found in JSON file')
      return []
    }

    return this.seedClients(data)
  }
}

export default ClientLoader
