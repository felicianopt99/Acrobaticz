import { prisma } from '@/lib/db-enhanced'
import { Prisma } from '@prisma/client'

export class CatalogShareRepository {
  /**
   * Buscar catálogo compartilhado por token
   * - Select otimizado
   * - Sem campos desnecessários
   * - Equipamentos em memória (rápido)
   */
  static async findByToken(token: string) {
    // Validar formato
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return null
    }

    const catalogShare = await prisma.catalogShare.findUnique({
      where: { token },
      select: {
        id: true,
        token: true,
        expiresAt: true,
        createdAt: true,
        selectedEquipmentIds: true,
        partner: {
          select: {
            id: true,
            name: true,
            companyName: true,
            logoUrl: true,
            address: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    if (!catalogShare) {
      return null
    }

    // Verificar expiração
    if (catalogShare.expiresAt && new Date() > catalogShare.expiresAt) {
      return null
    }

    return catalogShare
  }

  /**
   * Buscar equipamentos de um catálogo
   * - Ordenação em memória (rápido)
   * - Select preciso
   */
  static async getEquipment(
    token: string,
    options?: {
      includeImages?: boolean
      limit?: number
    }
  ) {
    const catalogShare = await this.findByToken(token)
    if (!catalogShare) {
      return null
    }

    // Limitar IDs
    const equipmentIds = catalogShare.selectedEquipmentIds.slice(0, options?.limit || 10000)

    const select = {
      id: true,
      name: true,
      description: true,
      dailyRate: true,
      quantity: true,
      quantityByStatus: true,
      location: true,
      type: true,
      categoryId: true,
      ...(options?.includeImages && {
        imageUrl: true,
        imageContentType: true,
        imageData: false, // Nunca enviar para cliente
      }),
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
        },
      },
      subcategory: {
        select: {
          id: true,
          name: true,
        },
      },
    } as const

    // Buscar equipamentos
    let equipment = await prisma.equipmentItem.findMany({
      where: {
        id: {
          in: equipmentIds,
        },
      },
      select,
    })

    // Ordenar em memória (rápido para < 10k items)
    equipment = equipment.sort((a, b) => {
      const catCompare = a.category.name.localeCompare(b.category.name)
      if (catCompare !== 0) return catCompare
      return a.name.localeCompare(b.name)
    })

    return {
      partner: catalogShare.partner,
      equipment,
      total: equipment.length,
      shareToken: token,
      expiresAt: catalogShare.expiresAt,
    }
  }

  /**
   * Criar catálogo compartilhado
   */
  static async create(data: {
    token: string
    partnerId: string
    selectedEquipmentIds: string[]
    expiresAt?: Date
  }) {
    return prisma.catalogShare.create({
      data,
    })
  }

  /**
   * Verificar se equipamentos estão autorizados
   */
  static async verifyEquipmentAuthorization(
    token: string,
    equipmentIds: string[]
  ): Promise<boolean> {
    const catalogShare = await prisma.catalogShare.findUnique({
      where: { token },
      select: {
        selectedEquipmentIds: true,
        expiresAt: true,
      },
    })

    if (!catalogShare) {
      return false
    }

    // Verificar expiração
    if (catalogShare.expiresAt && new Date() > catalogShare.expiresAt) {
      return false
    }

    // Verificar todos os IDs estão autorizados
    const authorizedIds = new Set(catalogShare.selectedEquipmentIds)
    return equipmentIds.every(id => authorizedIds.has(id))
  }

  /**
   * Buscar catálogos ativos por partner
   */
  static async findByPartner(
    partnerId: string,
    options?: {
      includeExpired?: boolean
    }
  ) {
    const where: Prisma.CatalogShareWhereInput = {
      partnerId,
    }

    if (!options?.includeExpired) {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ]
    }

    return prisma.catalogShare.findMany({
      where,
      select: {
        id: true,
        token: true,
        createdAt: true,
        expiresAt: true,
        selectedEquipmentIds: true,
        partner: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}
